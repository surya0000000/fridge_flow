import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM inventory_items WHERE user_id = ? ORDER BY category, name',
    args: [req.user!.id],
  });
  res.json(result.rows);
});

router.get('/expiring', async (req: Request, res: Response) => {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM inventory_items
     WHERE user_id = ?
       AND expiry_date IS NOT NULL
       AND date(expiry_date) <= date('now', '+3 days')
       AND date(expiry_date) >= date('now')
     ORDER BY expiry_date ASC`,
    args: [req.user!.id],
  });

  res.json(result.rows);
});

router.post('/', async (req: Request, res: Response) => {
  const { name, quantity, unit, category, expiry_date } = req.body;

  if (!name || quantity === undefined || !unit || !category) {
    res.status(400).json({ error: 'Name, quantity, unit, and category are required' });
    return;
  }

  const validUnits = ['g', 'kg', 'ml', 'l', 'pcs', 'tbsp', 'tsp', 'cup', 'oz', 'lb'];
  const validCategories = ['dairy', 'produce', 'protein', 'grains', 'condiments', 'beverages', 'frozen', 'other'];

  if (!validUnits.includes(unit)) {
    res.status(400).json({ error: `Invalid unit. Must be one of: ${validUnits.join(', ')}` });
    return;
  }

  if (!validCategories.includes(category)) {
    res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    return;
  }

  const db = getDb();
  const insertResult = await db.execute({
    sql: `INSERT INTO inventory_items (user_id, name, quantity, unit, category, expiry_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    args: [req.user!.id, name, quantity, unit, category, expiry_date || null],
  });

  const newId = Number(insertResult.lastInsertRowid);
  const itemResult = await db.execute({
    sql: 'SELECT * FROM inventory_items WHERE id = ?',
    args: [newId],
  });
  res.status(201).json(itemResult.rows[0]);
});

router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, quantity, unit, category, expiry_date } = req.body;
  const db = getDb();

  const existingResult = await db.execute({
    sql: 'SELECT * FROM inventory_items WHERE id = ? AND user_id = ?',
    args: [id, req.user!.id],
  });

  if (existingResult.rows.length === 0) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  const existing = existingResult.rows[0];

  await db.execute({
    sql: `UPDATE inventory_items
     SET name = ?, quantity = ?, unit = ?, category = ?, expiry_date = ?
     WHERE id = ? AND user_id = ?`,
    args: [
      name || existing.name,
      quantity !== undefined ? quantity : existing.quantity,
      unit || existing.unit,
      category || existing.category,
      expiry_date !== undefined ? expiry_date : existing.expiry_date,
      id,
      req.user!.id,
    ],
  });

  const updatedResult = await db.execute({
    sql: 'SELECT * FROM inventory_items WHERE id = ?',
    args: [id],
  });
  res.json(updatedResult.rows[0]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();

  const existingResult = await db.execute({
    sql: 'SELECT id FROM inventory_items WHERE id = ? AND user_id = ?',
    args: [id, req.user!.id],
  });

  if (existingResult.rows.length === 0) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  await db.execute({
    sql: 'DELETE FROM inventory_items WHERE id = ? AND user_id = ?',
    args: [id, req.user!.id],
  });
  res.json({ success: true });
});

export default router;
