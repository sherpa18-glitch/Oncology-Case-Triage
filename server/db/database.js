import Datastore from 'nedb-promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const casesDb     = new Datastore({ filename: path.join(DATA_DIR, 'cases.db'),     autoload: true });
export const decisionsDb = new Datastore({ filename: path.join(DATA_DIR, 'decisions.db'), autoload: true });
export const eventsDb    = new Datastore({ filename: path.join(DATA_DIR, 'events.db'),    autoload: true });
export const patientsDb  = new Datastore({ filename: path.join(DATA_DIR, 'patients.db'),  autoload: true });
export const ordersDb    = new Datastore({ filename: path.join(DATA_DIR, 'orders.db'),    autoload: true });
export const priorCasesDb= new Datastore({ filename: path.join(DATA_DIR, 'priorCases.db'),autoload: true });

// Ensure indexes
casesDb.ensureIndex({ fieldName: 'case_id', unique: true });
casesDb.ensureIndex({ fieldName: 'submitted_at' });
decisionsDb.ensureIndex({ fieldName: 'case_id' });
eventsDb.ensureIndex({ fieldName: 'case_id' });
eventsDb.ensureIndex({ fieldName: 'event_type' });
eventsDb.ensureIndex({ fieldName: 'timestamp' });
patientsDb.ensureIndex({ fieldName: 'patient_id', unique: true });
ordersDb.ensureIndex({ fieldName: 'order_id', unique: true });
ordersDb.ensureIndex({ fieldName: 'patient_id' });
priorCasesDb.ensureIndex({ fieldName: 'patient_id' });
