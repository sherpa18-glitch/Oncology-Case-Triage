import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { casesDb, eventsDb, patientsDb, ordersDb, priorCasesDb } from './db/database.js';
import { GOLDEN_CASES } from './db/mockData.js';
import { runPipeline } from './orchestrator/pipeline.js';
import { v4 as uuidv4 } from 'uuid';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── MIDDLEWARE ──────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173','http://localhost:5174'], credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/', rateLimit({ windowMs: 60_000, max: 200 }));

// ── SSE STORE ───────────────────────────────────────────────────
export const sseClients = new Map();

export function emitSSE(caseId, event) {
  const clients = sseClients.get(caseId) || [];
  const data = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach(res => { try { res.write(data); } catch (_) {} });
}

// ── ROUTES ──────────────────────────────────────────────────────

app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Oncology Case Triage Agent' })
);

// POST /api/cases
app.post('/api/cases', async (req, res) => {
  const { case_text, case_source, patient_id, order_id, ab_variant = 'strategy_a' } = req.body;
  if (!case_text || case_text.trim().length < 10)
    return res.status(400).json({ error: 'case_text must be at least 10 characters' });
  if (!case_source)
    return res.status(400).json({ error: 'case_source is required' });

  const caseId = uuidv4();
  const now    = new Date().toISOString();

  const caseRecord = {
    case_id: caseId, case_text: case_text.trim(), case_source,
    patient_id: patient_id || null, order_id: order_id || null,
    ab_variant, status: 'processing',
    submitted_at: now, resolved_at: null, mttca_seconds: null
  };

  await casesDb.insert(caseRecord);
  await eventsDb.insert({ _id: uuidv4(), case_id: caseId, event_type: 'case_submitted', ab_variant, timestamp: now });

  // Run pipeline async
  runPipeline(caseRecord).catch(err => console.error(`Pipeline error [${caseId}]:`, err.message));

  res.status(202).json({ case_id: caseId, status: 'processing', submitted_at: now, stream_url: `/api/stream/${caseId}` });
});

// GET /api/cases
app.get('/api/cases', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const cases = await casesDb.find({}).sort({ submitted_at: -1 }).limit(limit);
  res.json(cases);
});

// GET /api/cases/:id
app.get('/api/cases/:id', async (req, res) => {
  const caseRecord = await casesDb.findOne({ case_id: req.params.id });
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });

  const events = await eventsDb.find({ case_id: req.params.id }).sort({ timestamp: 1 });

  const STEP_LABELS = {
    classify_case:              'Case Classifier',
    retrieve_patient_context:   'Context Retriever',
    apply_routing_rules:        'Rules Engine',
    draft_response:             'Response Drafter',
    assign_to_queue:            'Case Router'
  };

  const trace = events
    .filter(e => ['step_complete','step_failed'].includes(e.event_type))
    .map(e => ({
      step:       e.step_name,
      label:      STEP_LABELS[e.step_name] || e.step_name,
      status:     e.event_type === 'step_failed' ? 'failed' : 'complete',
      latency_ms: e.latency_ms,
      confidence: e.confidence_score,
      summary:    e.summary
    }));

  res.json({ ...caseRecord, trace, events });
});

// GET /api/stream/:id — SSE
app.get('/api/stream/:id', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const { id } = req.params;
  if (!sseClients.has(id)) sseClients.set(id, []);
  sseClients.get(id).push(res);

  const beat = setInterval(() => { try { res.write(': hb\n\n'); } catch (_) { clearInterval(beat); } }, 15_000);
  req.on('close', () => {
    clearInterval(beat);
    const list = sseClients.get(id) || [];
    const i = list.indexOf(res);
    if (i > -1) list.splice(i, 1);
    if (list.length === 0) sseClients.delete(id);
  });
});

// GET /api/metrics
app.get('/api/metrics', async (req, res) => {
  const range    = req.query.range || '24h';
  const hoursMap = { '1h': 1, '24h': 24, '7d': 168, '30d': 720 };
  const since    = new Date(Date.now() - (hoursMap[range] || 24) * 3_600_000).toISOString();

  const [allCases, resolvedCases, stepEvents, draftEvents, overrideEvents] = await Promise.all([
    casesDb.find({ submitted_at: { $gte: since } }),
    casesDb.find({ status: 'complete', submitted_at: { $gte: since }, mttca_seconds: { $exists: true } }),
    eventsDb.find({ event_type: 'step_complete', timestamp: { $gte: since } }),
    eventsDb.find({ event_type: 'draft_accepted', timestamp: { $gte: since } }),
    eventsDb.find({ event_type: 'human_override', timestamp: { $gte: since } }),
  ]);

  const mttcaAvg = resolvedCases.length
    ? +(resolvedCases.reduce((s,c) => s + c.mttca_seconds, 0) / resolvedCases.length / 60).toFixed(1)
    : null;

  const autoResolved = allCases.filter(c => c.auto_resolved).length;

  const SLA_LIMITS = { P0_critical: 900, P1_urgent: 3600, P2_standard: 86400, P3_routine: 259200 };
  const slaBreaches = resolvedCases.filter(c => SLA_LIMITS[c.urgency_tier] && c.mttca_seconds > SLA_LIMITS[c.urgency_tier]).length;

  const acceptedDrafts = draftEvents.filter(e => e.draft_accepted).length;

  const confDist = Array(10).fill(0);
  stepEvents.forEach(e => {
    if (e.confidence_score != null) confDist[Math.min(9, Math.floor(e.confidence_score * 10))]++;
  });

  const latencyAcc = {}; const latencyCnt = {};
  stepEvents.forEach(e => {
    if (!latencyAcc[e.step_name]) { latencyAcc[e.step_name] = 0; latencyCnt[e.step_name] = 0; }
    latencyAcc[e.step_name] += e.latency_ms || 0;
    latencyCnt[e.step_name]++;
  });
  const avgLatencyByStep = {};
  Object.keys(latencyAcc).forEach(k => { avgLatencyByStep[k] = Math.round(latencyAcc[k] / latencyCnt[k]); });

  const caseTypeDist = {};
  allCases.forEach(c => { const t = c.case_type || 'unknown'; caseTypeDist[t] = (caseTypeDist[t]||0) + 1; });

  // A/B comparison
  const ab = { strategy_a: { cases:0,mttca:[],conf:[],accepted:0,drafts:0 }, strategy_b: { cases:0,mttca:[],conf:[],accepted:0,drafts:0 } };
  allCases.forEach(c => { if (ab[c.ab_variant]) { ab[c.ab_variant].cases++; if (c.mttca_seconds) ab[c.ab_variant].mttca.push(c.mttca_seconds); } });
  stepEvents.forEach(e => { if (ab[e.ab_variant] && e.confidence_score != null) ab[e.ab_variant].conf.push(e.confidence_score); });
  draftEvents.forEach(e => { if (ab[e.ab_variant]) { ab[e.ab_variant].drafts++; if (e.draft_accepted) ab[e.ab_variant].accepted++; } });

  const abComparison = {};
  ['strategy_a','strategy_b'].forEach(v => {
    const d = ab[v];
    abComparison[v] = {
      cases:                d.cases,
      avg_mttca_min:        d.mttca.length ? +(d.mttca.reduce((a,b)=>a+b,0)/d.mttca.length/60).toFixed(1) : null,
      avg_confidence:       d.conf.length  ? +(d.conf.reduce((a,b)=>a+b,0)/d.conf.length).toFixed(3) : null,
      draft_acceptance_rate:d.drafts       ? +(d.accepted/d.drafts).toFixed(3) : null
    };
  });

  res.json({
    range,
    total_cases:           allCases.length,
    resolved_cases:        resolvedCases.length,
    mttca_avg_minutes:     mttcaAvg,
    auto_resolution_rate:  allCases.length ? +(autoResolved/allCases.length).toFixed(3) : 0,
    triage_accuracy:       overrideEvents.length ? +(overrideEvents.filter(e=>e.was_correct).length/overrideEvents.length).toFixed(3) : null,
    sla_breach_rate:       resolvedCases.length ? +(slaBreaches/resolvedCases.length).toFixed(3) : 0,
    draft_acceptance_rate: draftEvents.length   ? +(acceptedDrafts/draftEvents.length).toFixed(3) : 0,
    confidence_distribution: confDist,
    avg_latency_by_step_ms:  avgLatencyByStep,
    case_type_distribution:  caseTypeDist,
    ab_comparison:           abComparison
  });
});

// GET /api/patients
app.get('/api/patients', async (req, res) => {
  const patients = await patientsDb.find({});
  const result = await Promise.all(patients.map(async p => ({
    ...p,
    orders:      await ordersDb.find({ patient_id: p.patient_id }).sort({ submitted_at: -1 }),
    prior_cases: await priorCasesDb.find({ patient_id: p.patient_id })
  })));
  res.json(result);
});

// GET /api/golden-cases
app.get('/api/golden-cases', (_, res) => res.json(GOLDEN_CASES));

// GET /api/config
app.get('/api/config', async (req, res) => {
  const { default: rules } = await import('./config/rules.json', { assert: { type: 'json' } });
  const { default: sla }   = await import('./config/sla.json',   { assert: { type: 'json' } });
  res.json({ rules, sla });
});

// POST /api/cases/:id/draft-action — Accept / edit draft
app.post('/api/cases/:id/draft-action', async (req, res) => {
  const { action, final_text } = req.body; // action: 'accepted' | 'edited'
  const caseRecord = await casesDb.findOne({ case_id: req.params.id });
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });

  const original = caseRecord.draft_response || '';
  const editDist = final_text ? levenshtein(original, final_text) : 0;

  await eventsDb.insert({
    _id: uuidv4(), case_id: req.params.id, event_type: 'draft_accepted',
    draft_accepted: action === 'accepted', edit_distance: editDist,
    ab_variant: caseRecord.ab_variant, timestamp: new Date().toISOString()
  });

  res.json({ ok: true });
});

// POST /api/cases/:id/override — Human routing override
app.post('/api/cases/:id/override', async (req, res) => {
  const { new_queue, reason } = req.body;
  const caseRecord = await casesDb.findOne({ case_id: req.params.id });
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });

  await casesDb.update({ case_id: req.params.id }, { $set: { routing_queue: new_queue, human_overridden: true } });
  await eventsDb.insert({
    _id: uuidv4(), case_id: req.params.id, event_type: 'human_override',
    new_queue, reason: reason || '', original_queue: caseRecord.routing_queue,
    was_correct: false, ab_variant: caseRecord.ab_variant, timestamp: new Date().toISOString()
  });

  res.json({ ok: true });
});

// Simple Levenshtein for edit distance
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// ── START ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏥  Oncology Case Triage Agent`);
  console.log(`    API → http://localhost:${PORT}`);
  console.log(`    Health → http://localhost:${PORT}/api/health\n`);
});
