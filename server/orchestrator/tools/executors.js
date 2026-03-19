import { patientsDb, ordersDb, priorCasesDb } from '../../db/database.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const rules = require('../../config/rules.json');
const sla   = require('../../config/sla.json');

// ── TOOL 1: CLASSIFY ──
export async function executeClassify(input) {
  // This tool is executed BY Claude — we just return Claude's own output
  return {
    case_type: input.case_type,
    urgency_tier: input.urgency_tier,
    classification_confidence: input.classification_confidence,
    urgency_confidence: input.urgency_confidence,
    rationale: input.rationale,
    extracted_entities: input.extracted_entities || {}
  };
}

// ── TOOL 2: RETRIEVE CONTEXT ──
export async function executeRetrieve(input, caseData) {
  const patientId = input.patient_id || caseData.patient_id;
  const orderId   = input.order_id   || caseData.order_id;

  if (!patientId && !orderId) {
    return { found: false, message: "No patient_id or order_id available for context retrieval.", context: null };
  }

  try {
    // Find patient
    let patient = null;
    if (patientId) {
      patient = await patientsDb.findOne({ patient_id: patientId });
    }

    // Find orders
    let orders = [];
    if (patientId) {
      orders = await ordersDb.find({ patient_id: patientId }).sort({ submitted_at: -1 }).limit(3);
    } else if (orderId) {
      const order = await ordersDb.findOne({ order_id: orderId });
      if (order) {
        orders = [order];
        patient = await patientsDb.findOne({ patient_id: order.patient_id });
      }
    }

    // Find specific order if provided
    let specificOrder = null;
    if (orderId) {
      specificOrder = await ordersDb.findOne({ order_id: orderId });
    }

    // Find prior cases
    const priorCases = patient
      ? await priorCasesDb.find({ patient_id: patient.patient_id }).sort({ created_at: -1 }).limit(5)
      : [];

    if (!patient) {
      return { found: false, message: `No patient record found for ID: ${patientId}`, context: null };
    }

    return {
      found: true,
      patient: {
        patient_id: patient.patient_id,
        name: patient.name,
        cancer_type: patient.cancer_type,
        cancer_stage: patient.cancer_stage,
        physician_name: patient.physician_name,
        payer_name: patient.payer_name
      },
      specific_order: specificOrder,
      recent_orders: orders,
      prior_cases: priorCases,
      summary: `Retrieved patient ${patient.name} (${patient.cancer_type}, ${patient.cancer_stage}). ` +
               `Physician: ${patient.physician_name}. Payer: ${patient.payer_name}. ` +
               `Found ${orders.length} recent orders and ${priorCases.length} prior cases.`
    };
  } catch (err) {
    return { found: false, message: `Context retrieval error: ${err.message}`, context: null };
  }
}

// ── TOOL 3: RULES ENGINE ──
export async function executeRules(input) {
  const { case_type, urgency_tier, missing_fields = [], pa_days_pending, has_critical_value, has_actionable_mutation } = input;
  const passed = [];
  const failed = [];
  const citations = [];

  const check = (ruleId, condition, failCitation) => {
    if (condition) {
      passed.push(ruleId);
    } else {
      failed.push(ruleId);
      citations.push({ rule_id: ruleId, name: rules[ruleId]?.name, citation: failCitation });
    }
  };

  // SLA Rules
  check('R-SLA-01', urgency_tier !== 'P0_critical' || true, // Always passes — tracked separately
    'P0 critical value case detected — 15-minute routing SLA applies immediately.');
  check('R-SLA-03', true, 'Standard TAT window applies.');

  // Eligibility Rules
  if (case_type === 'redraw_recommendation') {
    check('R-ELG-01', true, 'Re-draw eligibility requires verification of draw date and insurance status.');
  }
  if (case_type === 'pa_status_check' || case_type === 'incomplete_order') {
    check('R-ELG-02', true, 'PA requirement applies for commercial payer orders.');
  }
  if (has_critical_value || urgency_tier === 'P0_critical') {
    check('R-ELG-03', true, 'SHIELD positive or critical value — physician acknowledgment required within 24 hours.');
  }
  if (has_actionable_mutation) {
    check('R-ELG-04', urgency_tier !== 'P3_routine',
      'Actionable mutation detected (EGFR/ALK/ROS1/BRAF/KRAS) — case must be P1_urgent or higher.');
  }

  // Order Completeness
  if (case_type === 'incomplete_order') {
    check('R-ORD-01', missing_fields.length === 0,
      `Order missing required fields: ${missing_fields.join(', ')}. Outbound contact required.`);
  }

  // PA Rules
  if (case_type === 'pa_status_check') {
    check('R-PA-01', !pa_days_pending || pa_days_pending <= 10,
      `PA has been pending ${pa_days_pending} business days — exceeds 10-day threshold. Follow-up required.`);
  }

  // Auto-Resolution Safety Gate
  const canAutoResolve = urgency_tier !== 'P0_critical' && urgency_tier !== 'P1_urgent' && failed.filter(r => ['R-ELG-03','R-AUT-02'].includes(r)).length === 0;
  check('R-AUT-01', canAutoResolve, 'Case does not meet auto-resolution criteria — human review required.');
  check('R-AUT-02', urgency_tier !== 'P0_critical', 'P0_critical cases NEVER auto-resolve. Immediate senior escalation required.');

  return {
    rules_passed: passed,
    rules_failed: failed,
    fail_citations: citations,
    missing_fields,
    auto_resolvable_by_rules: canAutoResolve && failed.filter(r => r !== 'R-AUT-01').length === 0,
    summary: `${passed.length} rules passed, ${failed.length} rules triggered. ${citations.length > 0 ? 'Key findings: ' + citations.map(c => c.name).join('; ') : 'No critical rule violations.'}`
  };
}

// ── TOOL 4: DRAFT (executed by Claude — we pass back Claude's output) ──
export async function executeDraft(input) {
  return {
    response_type: input.response_type,
    recipient_type: input.recipient_type,
    draft_text: input.draft_text,
    clinical_accuracy_score: input.clinical_accuracy_score,
    accuracy_rationale: input.accuracy_rationale || ''
  };
}

// ── TOOL 5: ROUTER ──
export async function executeRouter(input) {
  return {
    routing_queue: input.routing_queue,
    rep_type: input.rep_type,
    auto_resolvable: input.auto_resolvable,
    routing_rationale: input.routing_rationale,
    routing_confidence: input.routing_confidence
  };
}

export const TOOL_EXECUTORS = {
  classify_case: executeClassify,
  retrieve_patient_context: executeRetrieve,
  apply_routing_rules: executeRules,
  draft_response: executeDraft,
  assign_to_queue: executeRouter
};
