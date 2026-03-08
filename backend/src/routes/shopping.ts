import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const items = db.prepare(
    `SELECT s.*, r.name as recipe_name
     FROM shopping_items s
     LEFT JOIN recipes r ON s.recipe_id = r.id
     WHERE s.user_id = ?
     ORDER BY s.category ASC, s.is_checked ASC, s.added_at DESC`
  ).all(req.user!.id);
  res.json(items);
});

router.post('/', (req: Request, res: Response) => {
  const { name, quantity, unit, category, source, recipe_id } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Item name is required' });
    return;
  }

  const db = getDb();
  const result = db.prepare(
    `INSERT INTO shopping_items (user_id, name, quantity, unit, category, source, recipe_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.user!.id,
    name,
    quantity || null,
    unit || null,
    category || null,
    source || 'manual',
    recipe_id || null
  );

  const item = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();

  const existing = db.prepare(
    'SELECT * FROM shopping_items WHERE id = ? AND user_id = ?'
  ).get(id, req.user!.id) as any;

  if (!existing) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  const { name, quantity, unit, category, is_checked } = req.body;

  db.prepare(
    `UPDATE shopping_items
     SET name = ?, quantity = ?, unit = ?, category = ?, is_checked = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    name !== undefined ? name : existing.name,
    quantity !== undefined ? quantity : existing.quantity,
    unit !== undefined ? unit : existing.unit,
    category !== undefined ? category : existing.category,
    is_checked !== undefined ? (is_checked ? 1 : 0) : existing.is_checked,
    id,
    req.user!.id
  );

  const updated = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(id);
  res.json(updated);
});

router.delete('/checked', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare(
    'DELETE FROM shopping_items WHERE user_id = ? AND is_checked = 1'
  ).run(req.user!.id);
  res.json({ deleted: result.changes });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();

  const existing = db.prepare(
    'SELECT id FROM shopping_items WHERE id = ? AND user_id = ?'
  ).get(id, req.user!.id);

  if (!existing) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  db.prepare('DELETE FROM shopping_items WHERE id = ? AND user_id = ?').run(id, req.user!.id);
  res.json({ success: true });
});

export default router;
