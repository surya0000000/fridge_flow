import 'dotenv/config';
import { initDb } from './db/database';
import { seedDatabase } from './seeds/seed';
import app from './app';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  await initDb();
  await seedDatabase();

  if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
      console.log(`FridgeFlow API running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
