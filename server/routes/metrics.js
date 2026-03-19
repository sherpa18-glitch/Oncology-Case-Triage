import express from 'express';
import { casesDb, eventsDb, decisionsDb } from '../db/database.js';

const router = express.Router();

function rangeToMs(range) {
  const map = { '1h': 3600000, '24h': 86400000, '7d': 604800000, '30d': 2592000000 };
  return map[range] || 86400000;
}

router.get('/', async (req, res) => {
  const range     = req.query.range || '24h';
  const abFilter  = req.query.ab_variant;
  const sinceMs   = Date.now() - rangeToMs(range);
  const sinceISO  = new Date(sinceMs).toISOString();

  // All resolved cases in range
  const caseQuery = { status: 'complete', submitted_at: { $gte: sinceISO } };
  const resolvedCases = await casesDb.find(caseQuery);

  // All events in range
  const eventQuery = abFilter && abFilter !== 'all'
    ? { timestamp: { $gte: sinceISO }, ab_variant: abFilter }
    : { timestamp: { $gte: sinceISO } };
  const events = await eventsDb.find(eventQuery);

  // All decisions in range
  const caseIds = resolvedCases.map(c => c.case_id);
  const decisions = caseIds.length > 0
    ? await decisionsDb.find({ case_id: { $in: caseIds } })
    : [];

  // ── MTTCA ──
  const casesWithMttca = resolvedCases.filter(c => c.mttca_seconds != null);
  const mttcaAvg = casesWithMttca.length > 0
    ? casesWithMttca.reduce((s, c) => s + c.mttca_seconds, 0) / casesWithMttca.length
    : null;

  // Trend: compare last 10 vs previous 10
  const all100 = await casesDb.find({ status: 'complete', mttca_seconds: { $exists: true } })
    .sort({ submitted_at: -1 }).limit(20);
  const first10 = all100.slice(0, 10);
  const prev10  = all100.slice(10, 20);
  const mttcaRecent = first10.length > 0 ? first10.reduce((s,c) => s + c.mttca_seconds, 0) / first10.length : null;
  const mttcaPrev   = prev10.length  > 0 ? prev10.reduce((s,c)  => s + c.mttca_seconds, 0) / prev10.length  : null;
  const mttcaTrend  = mttcaRecent && mttcaPrev ? (mttcaRecent < mttcaPrev ? 'improving' : 'degrading') : 'neutral';

  // Recent MTTCA per case for sparkline (last 20)
  const sparkline = all100.slice(0, 20).reverse().map(c => ({
    case_id: c.case_id.slice(0, 8),
    mttca_minutes: +(c.mttca_seconds / 60).toFixed(1),
    submitted_at: c.submitted_at
  }));

  // ── AUTO RESOLUTION RATE ──
  const autoCount   = decisions.filter(d => d.auto_resolvable).length;
  const autoRate    = decisions.length > 0 ? autoCount / decisions.length : 0;

  // ── TRIAGE ACCURACY ──
  const overrideEvents = await eventsDb.find({ event_type: 'routing_overridden', timestamp: { $gte: sinceISO } });
  // For demo purposes: accuracy based on override rate (fewer overrides = higher accuracy)
  const totalProcessed = decisions.length;
  const overrides      = overrideEvents.length;
  const accuracy       = totalProcessed > 0 ? Math.max(0, (totalProcessed - overrides) / totalProcessed) : null;

  // ── SLA BREACH RATE ──
  const urgentCases  = resolvedCases.filter(c => ['P0_critical','P1_urgent'].includes(c.urgency_tier));
  const P0_SLA = 900;  // 15 min
  const P1_SLA = 3600; // 60 min
  const slaBreaches = decisions.filter(d => {
    const c = resolvedCases.find(r => r.case_id === d.case_id);
    if (!c || !c.mttca_seconds) return false;
    if (d.urgency_tier === 'P0_critical') return c.mttca_seconds > P0_SLA;
    if (d.urgency_tier === 'P1_urgent')   return c.mttca_seconds > P1_SLA;
    return false;
  });
  const slaBreachRate = decisions.length > 0 ? slaBreaches.length / decisions.length : 0;

  // ── DRAFT ACCEPTANCE RATE ──
  const draftEvents    = await eventsDb.find({ event_type: 'draft_accepted', timestamp: { $gte: sinceISO } });
  const acceptedDrafts = draftEvents.filter(e => e.draft_accepted !== false);
  const draftRate      = draftEvents.length > 0 ? acceptedDrafts.length / draftEvents.length : null;

  // ── CONFIDENCE DISTRIBUTION ──
  const stepEvents = events.filter(e => e.event_type === 'step_complete' && e.confidence_score != null);
  const confDist   = Array.from({ length: 10 }, (_, i) => {
    const low  = i / 10;
    const high = (i + 1) / 10;
    return {
      bucket: `${Math.round(low * 100)}–${Math.round(high * 100)}%`,
      low,
      high,
      count: stepEvents.filter(e => e.confidence_score >= low && (i === 9 ? e.confidence_score <= high : e.confidence_score < high)).length
    };
  });

  // ── LATENCY PER STEP ──
  const stepNames = ['classify_case','retrieve_patient_context','apply_routing_rules','draft_response','assign_to_queue'];
  const stepLabels = {
    classify_case: 'Classifier',
    retrieve_patient_context: 'Context Retriever',
    apply_routing_rules: 'Rules Engine',
    draft_response: 'Drafter',
    assign_to_queue: 'Router'
  };
  const latencyByStep = {};
  for (const step of stepNames) {
    const stepEvts = events.filter(e => e.event_type === 'step_complete' && e.step_name === step && e.latency_ms);
    latencyByStep[step] = {
      label: stepLabels[step],
      avg_ms: stepEvts.length > 0 ? Math.round(stepEvts.reduce((s,e) => s + e.latency_ms, 0) / stepEvts.length) : 0,
      count: stepEvts.length
    };
  }

  // ── CASE VOLUME BY TYPE ──
  const typeCount = {};
  for (const d of decisions) {
    typeCount[d.case_type] = (typeCount[d.case_type] || 0) + 1;
  }

  // ── A/B COMPARISON ──
  const abMetrics = {};
  for (const variant of ['strategy_a', 'strategy_b']) {
    const vEvents = events.filter(e => e.ab_variant === variant);
    const vCases  = resolvedCases.filter(c => c.ab_variant === variant);
    const vDecisions = decisions.filter(d => {
      const c = vCases.find(vc => vc.case_id === d.case_id);
      return !!c;
    });
    const vStepEvts = vEvents.filter(e => e.event_type === 'step_complete' && e.confidence_score != null);
    const vDraftEvts = vEvents.filter(e => e.event_type === 'draft_accepted');
    abMetrics[variant] = {
      case_count:       vCases.length,
      avg_confidence:   vStepEvts.length > 0 ? +(vStepEvts.reduce((s,e) => s + e.confidence_score, 0) / vStepEvts.length).toFixed(3) : null,
      avg_latency_ms:   vCases.length > 0 ? Math.round(vCases.reduce((s,c) => s + (c.mttca_seconds||0)*1000, 0) / vCases.length) : null,
      draft_acceptance: vDraftEvts.length > 0 ? +(vDraftEvts.filter(e => e.draft_accepted !== false).length / vDraftEvts.length).toFixed(3) : null,
      auto_resolution:  vDecisions.length > 0 ? +(vDecisions.filter(d => d.auto_resolvable).length / vDecisions.length).toFixed(3) : null
    };
  }

  res.json({
    range,
    generated_at: new Date().toISOString(),
    mttca: {
      avg_seconds:  mttcaAvg ? +mttcaAvg.toFixed(0) : null,
      avg_minutes:  mttcaAvg ? +(mttcaAvg / 60).toFixed(1) : null,
      trend:        mttcaTrend,
      target_minutes: 45,
      sparkline
    },
    auto_resolution_rate: +autoRate.toFixed(3),
    auto_resolution_count: autoCount,
    total_cases: decisions.length,
    triage_accuracy: accuracy ? +accuracy.toFixed(3) : null,
    sla_breach_rate: +slaBreachRate.toFixed(3),
    draft_acceptance_rate: draftRate ? +draftRate.toFixed(3) : null,
    confidence_distribution: confDist,
    latency_by_step: latencyByStep,
    case_volume_by_type: typeCount,
    ab_comparison: abMetrics
  });
});

export default router;
