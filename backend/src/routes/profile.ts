import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, email, name, role, created_at FROM users WHERE id = ?'
  ).get(req.user!.id) as any;

  const prefs = db.prepare(
    'SELECT * FROM user_preferences WHERE user_id = ?'
  ).get(req.user!.id) as any;

  res.json({
    ...user,
    preferences: prefs
      ? {
          ...prefs,
          dietary_goals: JSON.parse(prefs.dietary_goals || '[]'),
          allergies: JSON.parse(prefs.allergies || '[]'),
        }
      : {
          dietary_goals: [],
          allergies: [],
          household_size: 1,
        },
  });
});

router.put('/', (req: Request, res: Response) => {
  const { name, household_size } = req.body;
  const db = getDb();

  if (name) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user!.id);
  }

  if (household_size !== undefined) {
    const existing = db.prepare(
      'SELECT user_id FROM user_preferences WHERE user_id = ?'
    ).get(req.user!.id);

    if (existing) {
      db.prepare(
        'UPDATE user_preferences SET household_size = ? WHERE user_id = ?'
      ).run(household_size, req.user!.id);
    } else {
      db.prepare(
        'INSERT INTO user_preferences (user_id, household_size, dietary_goals, allergies) VALUES (?, ?, ?, ?)'
      ).run(req.user!.id, household_size, '[]', '[]');
    }
  }

  const user = db.prepare(
    'SELECT id, email, name, role, created_at FROM users WHERE id = ?'
  ).get(req.user!.id) as any;

  const prefs = db.prepare(
    'SELECT * FROM user_preferences WHERE user_id = ?'
  ).get(req.user!.id) as any;

  res.json({
    ...user,
    preferences: prefs
      ? {
          ...prefs,
          dietary_goals: JSON.parse(prefs.dietary_goals || '[]'),
          allergies: JSON.parse(prefs.allergies || '[]'),
        }
      : { dietary_goals: [], allergies: [], household_size: 1 },
  });
});

router.put('/preferences', (req: Request, res: Response) => {
  const { dietary_goals, allergies } = req.body;
  const db = getDb();

  const existing = db.prepare(
    'SELECT user_id FROM user_preferences WHERE user_id = ?'
  ).get(req.user!.id);

  const goalsJson = JSON.stringify(Array.isArray(dietary_goals) ? dietary_goals : []);
  const allergiesJson = JSON.stringify(Array.isArray(allergies) ? allergies : []);

  if (existing) {
    db.prepare(
      'UPDATE user_preferences SET dietary_goals = ?, allergies = ? WHERE user_id = ?'
    ).run(goalsJson, allergiesJson, req.user!.id);
  } else {
    db.prepare(
      'INSERT INTO user_preferences (user_id, dietary_goals, allergies, household_size) VALUES (?, ?, ?, ?)'
    ).run(req.user!.id, goalsJson, allergiesJson, 1);
  }

  const prefs = db.prepare(
    'SELECT * FROM user_preferences WHERE user_id = ?'
  ).get(req.user!.id) as any;

  res.json({
    ...prefs,
    dietary_goals: JSON.parse(prefs.dietary_goals || '[]'),
    allergies: JSON.parse(prefs.allergies || '[]'),
  });
});

export default router;
