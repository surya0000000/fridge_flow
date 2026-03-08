import 'dotenv/config';
import { initDb } from '../backend/src/db/database';
import { seedDatabase } from '../backend/src/seeds/seed';
import app from '../backend/src/app';

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initDb();
    await seedDatabase();
    initialized = true;
  }
}

export default async function handler(req: any, res: any) {
  await ensureInitialized();
  return app(req, res);
}
