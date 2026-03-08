import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const items = db.prepare(
    'SELECT * FROM inventory_items WHERE user_id = ? ORDER BY expiry_date ASC, added_at DESC'
  ).all(req.user!.id);
  res.json(items);
});

router.get('/expiring', (req: Request, res: Response) => {
  const db = getDb();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const today = new Date().toISOString().split('T')[0];
  const deadline = threeDaysFromNow.toISOString().split('T')[0];

  const items = db.prepare(
    `SELECT * FROM inventory_items
     WHERE user_id = ?
       AND expiry_date IS NOT NULL
       AND expiry_date >= ?
       AND expiry_date <= ?
     ORDER BY expiry_date ASC`
  ).all(req.user!.id, today, deadline);

  res.json(items);
});

router.post('/', (req: Request, res: Response) => {
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
  const result = db.prepare(
    `INSERT INTO inventory_items (user_id, name, quantity, unit, category, expiry_date)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(req.user!.id, name, quantity, unit, category, expiry_date || null);

  const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, quantity, unit, category, expiry_date } = req.body;
  const db = getDb();

  const existing = db.prepare(
    'SELECT * FROM inventory_items WHERE id = ? AND user_id = ?'
  ).get(id, req.user!.id);

  if (!existing) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  db.prepare(
    `UPDATE inventory_items
     SET name = ?, quantity = ?, unit = ?, category = ?, expiry_date = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    name || (existing as any).name,
    quantity !== undefined ? quantity : (existing as any).quantity,
    unit || (existing as any).unit,
    category || (existing as any).category,
    expiry_date !== undefined ? expiry_date : (existing as any).expiry_date,
    id,
    req.user!.id
  );

  const updated = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();

  const existing = db.prepare(
    'SELECT id FROM inventory_items WHERE id = ? AND user_id = ?'
  ).get(id, req.user!.id);

  if (!existing) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  db.prepare('DELETE FROM inventory_items WHERE id = ? AND user_id = ?').run(id, req.user!.id);
  res.json({ success: true });
});

export default router;
