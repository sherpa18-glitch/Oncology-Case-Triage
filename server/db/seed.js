import { patientsDb, ordersDb, priorCasesDb } from './database.js';
import { PATIENTS } from './mockData.js';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Seeding mock data...');

  // Clear existing
  await patientsDb.remove({}, { multi: true });
  await ordersDb.remove({}, { multi: true });
  await priorCasesDb.remove({}, { multi: true });

  for (const patient of PATIENTS) {
    const { orders, prior_cases, ...patientData } = patient;

    await patientsDb.insert(patientData);

    for (const order of orders) {
      await ordersDb.insert({ ...order, patient_id: patient.patient_id });
    }

    for (const pc of prior_cases) {
      await priorCasesDb.insert({
        _id: uuidv4(),
        patient_id: patient.patient_id,
        ...pc
      });
    }
  }

  const patCount = await patientsDb.count({});
  const ordCount = await ordersDb.count({});
  const pcCount  = await priorCasesDb.count({});

  console.log(`✅ Seeded: ${patCount} patients, ${ordCount} orders, ${pcCount} prior cases`);
}

seed().catch(console.error);
