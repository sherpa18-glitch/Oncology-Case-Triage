import express from 'express';
import { sseEmitter } from '../sse.js';

const router = express.Router();

router.get('/:case_id', (req, res) => {
  const { case_id } = req.params;

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial heartbeat
  res.write(`data: ${JSON.stringify({ type: 'connected', case_id })}\n\n`);

  const send = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    if (payload.type === 'pipeline_complete' || payload.type === 'pipeline_failed') {
      setTimeout(() => { try { res.end(); } catch(e){} }, 500);
    }
  };

  sseEmitter.on(case_id, send);

  // Heartbeat every 15s to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    try { res.write(`: heartbeat\n\n`); } catch(e) { clearInterval(heartbeat); }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseEmitter.off(case_id, send);
  });
});

export default router;
