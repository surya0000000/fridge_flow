import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT s.*, r.name as recipe_name
     FROM shopping_items s
     LEFT JOIN recipes r ON s.recipe_id = r.id
     WHERE s.user_id = ?
     ORDER BY s.category ASC, s.is_checked ASC, s.added_at DESC`,
    args: [req.user!.id],
  });
  res.json(result.rows);
});

router.post('/', async (req: Request, res: Response) => {
  const { name, quantity, unit, category, source, recipe_id } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Item name is required' });
    return;
  }

  const db = getDb();
  const insertResult = await db.execute({
    sql: `INSERT INTO shopping_items (user_id, name, quantity, unit, category, source, recipe_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      req.user!.id,
      name,
      quantity || null,
      unit || null,
      category || null,
      source || 'manual',
      recipe_id || null,
    ],
  });

  const newId = Number(insertResult.lastInsertRowid);
  const itemResult = await db.execute({
    sql: 'SELECT * FROM shopping_items WHERE id = ?',
    args: [newId],
  });
  res.status(201).json(itemResult.rows[0]);
});

router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();

  const existingResult = await db.execute({
    sql: 'SELECT * FROM shopping_items WHERE id = ? AND user_id = ?',
    args: [id, req.user!.id],
  });

  if (existingResult.rows.length === 0) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  const existing = existingResult.rows[0];
  const { name, quantity, unit, category, is_checked } = req.body;

  const isCheckedValue = is_checked !== undefined
    ? (Boolean(is_checked) ? 1 : 0)
    : existing.is_checked;

  await db.execute({
    sql: `UPDATE shopping_items
     SET name = ?, quantity = ?, unit = ?, category = ?, is_checked = ?
     WHERE id = ? AND user_id = ?`,
    args: [
      name !== undefined ? name : existing.name,
      quantity !== undefined ? quantity : existing.quantity,
      unit !== undefined ? unit : existing.unit,
      category !== undefined ? category : existing.category,
      isCheckedValue,
      id,
      req.user!.id,
    ],
  });

  const updatedResult = await db.execute({
    sql: 'SELECT * FROM shopping_items WHERE id = ?',
    args: [id],
  });
  res.json(updatedResult.rows[0]);
});

router.delete('/checked', async (req: Request, res: Response) => {
  const db = getDb();
  const result = await db.execute({
    sql: 'DELETE FROM shopping_items WHERE user_id = ? AND is_checked = 1',
    args: [req.user!.id],
  });
  res.json({ deleted: result.rowsAffected });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();

  const existingResult = await db.execute({
    sql: 'SELECT id FROM shopping_items WHERE id = ? AND user_id = ?',
    args: [id, req.user!.id],
  });

  if (existingResult.rows.length === 0) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  await db.execute({
    sql: 'DELETE FROM shopping_items WHERE id = ? AND user_id = ?',
    args: [id, req.user!.id],
  });
  res.json({ success: true });
});

export default router;
