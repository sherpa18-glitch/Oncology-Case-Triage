import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { casesDb, decisionsDb } from '../db/database.js';
import { runPipeline } from '../orchestrator/pipeline.js';
import { logEvent } from '../orchestrator/pipeline.js';

const router = express.Router();

// POST /api/cases — submit a new case
router.post('/', async (req, res) => {
  const { case_text, case_source, patient_id, order_id, ab_variant } = req.body;

  if (!case_text || case_text.trim().length < 10) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'case_text must be at least 10 characters' });
  }
  if (!case_source) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'case_source is required' });
  }

  const caseRecord = {
    case_id:      uuidv4(),
    case_text:    case_text.trim().slice(0, 2000),
    case_source,
    patient_id:   patient_id || null,
    order_id:     order_id   || null,
    ab_variant:   ab_variant || 'strategy_a',
    status:       'processing',
    submitted_at: new Date().toISOString(),
    resolved_at:  null,
    mttca_seconds:null,
    agent_version:'1.0.0'
  };

  await casesDb.insert(caseRecord);
  await logEvent(caseRecord.case_id, 'case_submitted', { ab_variant: caseRecord.ab_variant });

  // Run pipeline asynchronously — SSE will stream results
  runPipeline(caseRecord).catch(err => console.error('[POST /cases] Pipeline error:', err.message));

  res.status(202).json({
    case_id:      caseRecord.case_id,
    status:       'processing',
    submitted_at: caseRecord.submitted_at,
    stream_url:   `/api/stream/${caseRecord.case_id}`
  });
});

// GET /api/cases/:id — get case + decision
router.get('/:id', async (req, res) => {
  const caseRecord = await casesDb.findOne({ case_id: req.params.id });
  if (!caseRecord) return res.status(404).json({ error: 'NOT_FOUND' });

  const decision = await decisionsDb.findOne({ case_id: req.params.id });

  res.json({ ...caseRecord, decision: decision || null });
});

// GET /api/cases — list recent cases
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const cases = await casesDb.find({}).sort({ submitted_at: -1 }).limit(limit);
  const results = await Promise.all(cases.map(async c => {
    const decision = await decisionsDb.findOne({ case_id: c.case_id });
    return { ...c, decision: decision || null };
  }));
  res.json(results);
});

// PATCH /api/cases/:id/action — human actions (accept draft, override routing)
router.patch('/:id/action', async (req, res) => {
  const { action, override_queue, draft_accepted, edit_distance } = req.body;
  const caseRecord = await casesDb.findOne({ case_id: req.params.id });
  if (!caseRecord) return res.status(404).json({ error: 'NOT_FOUND' });

  if (action === 'accept_draft') {
    await logEvent(req.params.id, 'draft_accepted', {
      draft_accepted: draft_accepted !== false,
      edit_distance:  edit_distance  || 0,
      ab_variant:     caseRecord.ab_variant
    });
  }

  if (action === 'override_routing' && override_queue) {
    await decisionsDb.update({ case_id: req.params.id }, { $set: { routing_queue: override_queue, human_overridden: true } });
    await logEvent(req.params.id, 'routing_overridden', {
      routing_queue: override_queue,
      ab_variant:    caseRecord.ab_variant
    });
  }

  res.json({ success: true });
});

export default router;
