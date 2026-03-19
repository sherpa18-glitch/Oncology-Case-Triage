import express from 'express';
import { patientsDb, ordersDb, priorCasesDb } from '../db/database.js';
import { GOLDEN_CASES } from '../db/mockData.js';

const router = express.Router();

router.get('/patients', async (req, res) => {
  const patients = await patientsDb.find({});
  const result = await Promise.all(patients.map(async p => {
    const orders     = await ordersDb.find({ patient_id: p.patient_id }).sort({ submitted_at: -1 });
    const priorCases = await priorCasesDb.find({ patient_id: p.patient_id }).sort({ created_at: -1 });
    return { ...p, orders, prior_cases: priorCases };
  }));
  res.json(result);
});

router.get('/golden-cases', (req, res) => {
  res.json(GOLDEN_CASES);
});

export default router;
