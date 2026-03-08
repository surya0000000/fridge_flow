import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getDb } from './db/database';
import { seedDatabase } from './seeds/seed';

import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import recipesRoutes from './routes/recipes';
import shoppingRoutes from './routes/shopping';
import mealplanRoutes from './routes/mealplan';
import profileRoutes from './routes/profile';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/mealplan', mealplanRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

async function main() {
  getDb();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`FridgeFlow API running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
