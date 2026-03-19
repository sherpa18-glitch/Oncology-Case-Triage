import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { casesDb, eventsDb } from '../db/database.js';
import { AGENT_TOOLS } from './tools/definitions.js';
import { TOOL_EXECUTORS } from './tools/executors.js';
import { buildStrategyA, buildStrategyB } from './prompts.js';

// Lazy import to avoid circular dependency
let _emitSSE = null;
async function getEmitSSE() {
  if (!_emitSSE) {
    const mod = await import('../index.js');
    _emitSSE = mod.emitSSE;
  }
  return _emitSSE;
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STEP_LABELS = {
  classify_case:            'Case Classifier',
  retrieve_patient_context: 'Context Retriever',
  apply_routing_rules:      'Rules Engine',
  draft_response:           'Response Drafter',
  assign_to_queue:          'Case Router'
};
const STEP_ORDER = Object.keys(STEP_LABELS);

async function logEvent(caseId, eventType, payload = {}) {
  try {
    await eventsDb.insert({ _id: uuidv4(), case_id: caseId, event_type: eventType, timestamp: new Date().toISOString(), ...payload });
  } catch (e) { console.error('logEvent:', e.message); }
}

function extractConfidence(stepName, result) {
  if (!result) return null;
  const scores = {
    classify_case:            result.classification_confidence,
    retrieve_patient_context: result.found ? 0.95 : 0.40,
    apply_routing_rules:      (result.rules_failed?.length || 0) === 0 ? 0.95 : 0.75,
    draft_response:           result.clinical_accuracy_score,
    assign_to_queue:          result.routing_confidence,
  };
  return scores[stepName] ?? null;
}

function extractSummary(stepName, result) {
  if (!result || result.degraded) return 'Step failed — case escalated to human review.';
  const summaries = {
    classify_case:            result.rationale || `Classified as ${result.case_type} / ${result.urgency_tier}`,
    retrieve_patient_context: result.summary   || (result.found ? 'Patient context retrieved.' : 'No matching patient record found.'),
    apply_routing_rules:      result.summary   || `${result.rules_passed?.length || 0} rules passed.`,
    draft_response:           `${result.recipient_type ? result.recipient_type.charAt(0).toUpperCase() + result.recipient_type.slice(1) : 'Physician'} response drafted (clinical accuracy: ${Math.round((result.clinical_accuracy_score||0)*100)}%).`,
    assign_to_queue:          result.routing_rationale || `Routed to ${result.routing_queue}.`,
  };
  return summaries[stepName] || 'Step completed.';
}

export async function runPipeline(caseRecord) {
  const { case_id, case_text, case_source, patient_id, order_id, ab_variant = 'strategy_a' } = caseRecord;
  const emit        = await getEmitSSE();
  const systemPrompt = ab_variant === 'strategy_b' ? buildStrategyB() : buildStrategyA();
  const stepResults  = {};
  const stepTimings  = {};
  const MAX_LOOPS    = 12;
  let loopCount      = 0;

  const userMsg = `Please triage the following oncology support case using all 5 tools in order.

CASE SOURCE: ${case_source}
${patient_id ? `PATIENT ID: ${patient_id}` : '(no patient ID provided)'}
${order_id   ? `ORDER ID: ${order_id}`     : '(no order ID provided)'}

CASE TEXT:
${case_text}`;

  const messages = [{ role: 'user', content: userMsg }];

  emit(case_id, { type: 'pipeline_start', case_id, timestamp: new Date().toISOString() });

  try {
    while (loopCount < MAX_LOOPS) {
      loopCount++;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514', max_tokens: 4096,
        system: systemPrompt, tools: AGENT_TOOLS, messages
      });

      if (response.stop_reason === 'end_turn') break;

      const toolBlocks = response.content.filter(b => b.type === 'tool_use');
      if (toolBlocks.length === 0) break;

      const toolResults = [];

      for (const block of toolBlocks) {
        const step = block.name;
        const idx  = STEP_ORDER.indexOf(step) + 1;

        emit(case_id, { type: 'step_running', case_id, step, step_index: idx, label: STEP_LABELS[step] || step });

        const t0 = Date.now();
        let result, hasError = false;

        try {
          result = await TOOL_EXECUTORS[step](block.input, caseRecord);
        } catch (err) {
          hasError = true;
          result   = { error: err.message, degraded: true };
          await logEvent(case_id, 'step_failed', { step_name: step, error: err.message, ab_variant });
        }

        const ms   = Date.now() - t0;
        const conf = extractConfidence(step, result);
        const summ = extractSummary(step, result);

        stepResults[step] = result;
        stepTimings[step] = ms;

        if (!hasError) {
          await logEvent(case_id, 'step_complete', { step_name: step, latency_ms: ms, confidence_score: conf, summary: summ, ab_variant });
        }

        emit(case_id, {
          type: hasError ? 'step_failed' : 'step_complete',
          case_id, step, step_index: idx, label: STEP_LABELS[step] || step,
          latency_ms: ms, confidence: conf, summary: summ,
          result: hasError ? null : result
        });

        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
      }

      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user',      content: toolResults });
    }
  } catch (err) {
    console.error(`❌ Pipeline error [${case_id.slice(0,8)}]:`, err.message);
    await logEvent(case_id, 'pipeline_error', { error: err.message, ab_variant });
    emit(case_id, { type: 'pipeline_error', case_id, error: err.message });
    await casesDb.update({ case_id }, { $set: { status: 'failed', routing_queue: 'unstructured_review', resolved_at: new Date().toISOString() } });
    return;
  }

  // ── Assemble decision ──────────────────────────────────────────
  const cls  = stepResults['classify_case']            || {};
  const ctx  = stepResults['retrieve_patient_context'] || {};
  const rul  = stepResults['apply_routing_rules']      || {};
  const dft  = stepResults['draft_response']           || {};
  const rtr  = stepResults['assign_to_queue']          || {};

  let autoResolvable = rtr.auto_resolvable ?? false;
  let routingQueue   = rtr.routing_queue   || 'unstructured_review';
  let repType        = rtr.rep_type        || 'ops_specialist';

  // Hard safety: P0 never auto-resolves
  if (cls.urgency_tier === 'P0_critical') {
    autoResolvable = false;
    routingQueue   = 'critical_value_escalation';
    repType        = 'senior_escalation';
  }

  // Confidence gate
  const confs = [cls.classification_confidence, cls.urgency_confidence, dft.clinical_accuracy_score, rtr.routing_confidence].filter(x => x != null);
  const minConf = confs.length ? Math.min(...confs) : 1;
  if (minConf < 0.75) autoResolvable = false;

  const resolvedAt   = new Date().toISOString();
  const mttcaSecs    = Math.round((new Date(resolvedAt) - new Date(caseRecord.submitted_at)) / 1000);
  const totalLatency = Object.values(stepTimings).reduce((a, b) => a + b, 0);

  await casesDb.update({ case_id }, { $set: {
    status: 'complete',
    case_type:                 cls.case_type       || 'unstructured',
    urgency_tier:              cls.urgency_tier     || 'P2_standard',
    classification_confidence: cls.classification_confidence || null,
    context_retrieved:         ctx.found || false,
    context_summary:           ctx.summary || null,
    patient_context:           ctx.found ? { patient: ctx.patient, specific_order: ctx.specific_order } : null,
    rules_passed:              rul.rules_passed    || [],
    rules_failed:              rul.rules_failed    || [],
    missing_fields:            rul.missing_fields  || [],
    auto_resolvable:           autoResolvable,
    auto_resolved:             autoResolvable,
    human_review_required:     minConf < 0.75,
    draft_response:            dft.draft_text      || null,
    draft_recipient_type:      dft.recipient_type  || null,
    clinical_accuracy_score:   dft.clinical_accuracy_score || null,
    routing_queue:             routingQueue,
    rep_type:                  repType,
    routing_rationale:         rtr.routing_rationale || null,
    routing_confidence:        rtr.routing_confidence || null,
    step_latencies:            stepTimings,
    total_latency_ms:          totalLatency,
    resolved_at:               resolvedAt,
    mttca_seconds:             mttcaSecs,
  }});

  await logEvent(case_id, 'pipeline_complete', {
    routing_queue: routingQueue, auto_resolved: autoResolvable,
    urgency_tier: cls.urgency_tier, mttca_seconds: mttcaSecs,
    total_latency_ms: totalLatency, ab_variant
  });

  const fullCase = await casesDb.findOne({ case_id });
  emit(case_id, { type: 'pipeline_complete', case_id, decision: fullCase, mttca_seconds: mttcaSecs });

  console.log(`✅ [${case_id.slice(0,8)}] ${cls.case_type} / ${cls.urgency_tier} → ${routingQueue} (${(mttcaSecs).toFixed(0)}s)`);
}
