import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const db = getDb();
  const userResult = await db.execute({
    sql: 'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
    args: [req.user!.id],
  });
  const user = userResult.rows[0];

  const prefsResult = await db.execute({
    sql: 'SELECT * FROM user_preferences WHERE user_id = ?',
    args: [req.user!.id],
  });
  const prefs = prefsResult.rows[0];

  res.json({
    ...user,
    preferences: prefs
      ? {
          ...prefs,
          dietary_goals: JSON.parse((prefs.dietary_goals as string) || '[]'),
          allergies: JSON.parse((prefs.allergies as string) || '[]'),
        }
      : {
          dietary_goals: [],
          allergies: [],
          household_size: 1,
        },
  });
});

router.put('/', async (req: Request, res: Response) => {
  const { name, household_size } = req.body;
  const db = getDb();

  if (name) {
    await db.execute({
      sql: 'UPDATE users SET name = ? WHERE id = ?',
      args: [name, req.user!.id],
    });
  }

  if (household_size !== undefined) {
    const existingResult = await db.execute({
      sql: 'SELECT user_id FROM user_preferences WHERE user_id = ?',
      args: [req.user!.id],
    });

    if (existingResult.rows.length > 0) {
      await db.execute({
        sql: 'UPDATE user_preferences SET household_size = ? WHERE user_id = ?',
        args: [household_size, req.user!.id],
      });
    } else {
      await db.execute({
        sql: 'INSERT INTO user_preferences (user_id, household_size, dietary_goals, allergies) VALUES (?, ?, ?, ?)',
        args: [req.user!.id, household_size, '[]', '[]'],
      });
    }
  }

  const userResult = await db.execute({
    sql: 'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
    args: [req.user!.id],
  });
  const user = userResult.rows[0];

  const prefsResult = await db.execute({
    sql: 'SELECT * FROM user_preferences WHERE user_id = ?',
    args: [req.user!.id],
  });
  const prefs = prefsResult.rows[0];

  res.json({
    ...user,
    preferences: prefs
      ? {
          ...prefs,
          dietary_goals: JSON.parse((prefs.dietary_goals as string) || '[]'),
          allergies: JSON.parse((prefs.allergies as string) || '[]'),
        }
      : { dietary_goals: [], allergies: [], household_size: 1 },
  });
});

router.put('/preferences', async (req: Request, res: Response) => {
  const { dietary_goals, allergies } = req.body;
  const db = getDb();

  const existingResult = await db.execute({
    sql: 'SELECT user_id FROM user_preferences WHERE user_id = ?',
    args: [req.user!.id],
  });

  const goalsJson = JSON.stringify(Array.isArray(dietary_goals) ? dietary_goals : []);
  const allergiesJson = JSON.stringify(Array.isArray(allergies) ? allergies : []);

  if (existingResult.rows.length > 0) {
    await db.execute({
      sql: 'UPDATE user_preferences SET dietary_goals = ?, allergies = ? WHERE user_id = ?',
      args: [goalsJson, allergiesJson, req.user!.id],
    });
  } else {
    await db.execute({
      sql: 'INSERT INTO user_preferences (user_id, dietary_goals, allergies, household_size) VALUES (?, ?, ?, ?)',
      args: [req.user!.id, goalsJson, allergiesJson, 1],
    });
  }

  const prefsResult = await db.execute({
    sql: 'SELECT * FROM user_preferences WHERE user_id = ?',
    args: [req.user!.id],
  });
  const prefs = prefsResult.rows[0];

  res.json({
    ...prefs,
    dietary_goals: JSON.parse((prefs.dietary_goals as string) || '[]'),
    allergies: JSON.parse((prefs.allergies as string) || '[]'),
  });
});

export default router;
