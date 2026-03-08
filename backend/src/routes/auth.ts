import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, password, and name are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const db = getDb();

  try {
    const existingResult = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email],
    });
    if (existingResult.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insertResult = await db.execute({
      sql: 'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      args: [email, passwordHash, name, 'user'],
    });

    const userId = Number(insertResult.lastInsertRowid);

    await db.execute({
      sql: 'INSERT INTO user_preferences (user_id, dietary_goals, allergies, household_size) VALUES (?, ?, ?, ?)',
      args: [userId, '[]', '[]', 1],
    });

    const secret = process.env.JWT_SECRET || 'fridgeflow-dev-secret';
    const token = jwt.sign({ userId }, secret, { expiresIn: '7d' });

    const user = { id: userId, email, name, role: 'user' };
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getDb();

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email],
    });
    const user = result.rows[0] as unknown as {
      id: number;
      email: string;
      password_hash: string;
      name: string;
      role: string;
    } | undefined;

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'fridgeflow-dev-secret';
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

    const { password_hash: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
