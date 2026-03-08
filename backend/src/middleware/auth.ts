import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'fridgeflow-dev-secret';

  try {
    const decoded = jwt.verify(token, secret) as { userId: number };
    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT id, email, name, role FROM users WHERE id = ?',
      args: [decoded.userId],
    });
    const user = result.rows[0] as unknown as AuthUser | undefined;

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
