import { createClient, Client } from '@libsql/client';

let client: Client;

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || 'file:./fridgeflow.db';
    const authToken = process.env.TURSO_AUTH_TOKEN;
    client = createClient({ url, authToken });
  }
  return client;
}

export async function initDb(): Promise<void> {
  const db = getDb();
  const schema = require('fs').readFileSync(require('path').join(__dirname, 'schema.sql'), 'utf-8');
  // Split on semicolons and run each statement
  const statements = schema.split(';').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
  for (const statement of statements) {
    await db.execute(statement);
  }
}
