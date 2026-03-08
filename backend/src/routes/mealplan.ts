import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

interface MealPlan {
  id: number;
  user_id: number;
  recipe_id: number;
  planned_date: string;
  meal_type: string;
  servings: number;
}

interface RecipeIngredient {
  ingredient_name: string;
  quantity: number;
  unit: string;
  is_optional: number;
}

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

router.get('/', async (req: Request, res: Response) => {
  const db = getDb();
  const { start_date, end_date } = req.query;

  let query = `
    SELECT mp.*, r.name as recipe_name, r.prep_time, r.cook_time,
           r.dietary_tags, r.cuisine, r.image_url
    FROM meal_plans mp
    JOIN recipes r ON mp.recipe_id = r.id
    WHERE mp.user_id = ?
  `;
  const params: (string | number | boolean | null)[] = [req.user!.id];

  if (start_date && typeof start_date === 'string') {
    query += ` AND mp.planned_date >= ?`;
    params.push(start_date);
  }

  if (end_date && typeof end_date === 'string') {
    query += ` AND mp.planned_date <= ?`;
    params.push(end_date);
  }

  query += ' ORDER BY mp.planned_date ASC, mp.meal_type ASC';

  const result = await db.execute({ sql: query, args: params });
  const meals = result.rows;

  const resultMeals = meals.map((meal: any) => ({
    ...meal,
    dietary_tags: JSON.parse(meal.dietary_tags || '[]'),
  }));

  res.json(resultMeals);
});

router.post('/', async (req: Request, res: Response) => {
  const { recipe_id, planned_date, meal_type, servings } = req.body;

  if (!recipe_id || !planned_date || !meal_type) {
    res.status(400).json({ error: 'recipe_id, planned_date, and meal_type are required' });
    return;
  }

  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  if (!validMealTypes.includes(meal_type)) {
    res.status(400).json({ error: `meal_type must be one of: ${validMealTypes.join(', ')}` });
    return;
  }

  const db = getDb();

  const recipeResult = await db.execute({
    sql: 'SELECT id FROM recipes WHERE id = ?',
    args: [recipe_id],
  });
  if (recipeResult.rows.length === 0) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }

  const insertResult = await db.execute({
    sql: `INSERT INTO meal_plans (user_id, recipe_id, planned_date, meal_type, servings)
     VALUES (?, ?, ?, ?, ?)`,
    args: [req.user!.id, recipe_id, planned_date, meal_type, servings || 1],
  });

  const newId = Number(insertResult.lastInsertRowid);
  const mealResult = await db.execute({
    sql: `SELECT mp.*, r.name as recipe_name, r.prep_time, r.cook_time,
            r.dietary_tags, r.cuisine, r.image_url
     FROM meal_plans mp
     JOIN recipes r ON mp.recipe_id = r.id
     WHERE mp.id = ?`,
    args: [newId],
  });

  const meal = mealResult.rows[0] as any;

  res.status(201).json({
    ...meal,
    dietary_tags: JSON.parse(meal.dietary_tags || '[]'),
  });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();

  const existingResult = await db.execute({
    sql: 'SELECT id FROM meal_plans WHERE id = ? AND user_id = ?',
    args: [id, req.user!.id],
  });

  if (existingResult.rows.length === 0) {
    res.status(404).json({ error: 'Meal plan entry not found' });
    return;
  }

  await db.execute({
    sql: 'DELETE FROM meal_plans WHERE id = ? AND user_id = ?',
    args: [id, req.user!.id],
  });
  res.json({ success: true });
});

router.post('/sync-shopping', async (req: Request, res: Response) => {
  const db = getDb();
  const userId = req.user!.id;

  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const mealPlansResult = await db.execute({
    sql: `SELECT mp.*, r.name as recipe_name
     FROM meal_plans mp
     JOIN recipes r ON mp.recipe_id = r.id
     WHERE mp.user_id = ? AND mp.planned_date >= ? AND mp.planned_date <= ?`,
    args: [userId, today, nextWeekStr],
  });
  const mealPlans = mealPlansResult.rows as unknown as (MealPlan & { recipe_name: string })[];

  if (mealPlans.length === 0) {
    res.json({ added: 0, message: 'No upcoming meals found in meal plan' });
    return;
  }

  const inventoryResult = await db.execute({
    sql: 'SELECT * FROM inventory_items WHERE user_id = ?',
    args: [userId],
  });
  const inventory = inventoryResult.rows as unknown as InventoryItem[];

  const inventoryMap = new Map<string, InventoryItem>();
  for (const item of inventory) {
    inventoryMap.set(item.name.toLowerCase().trim(), item);
  }

  const neededIngredients = new Map<string, {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    recipe_id: number;
  }>();

  for (const meal of mealPlans) {
    const ingredientsResult = await db.execute({
      sql: 'SELECT * FROM recipe_ingredients WHERE recipe_id = ? AND is_optional = 0',
      args: [meal.recipe_id],
    });
    const ingredients = ingredientsResult.rows as unknown as RecipeIngredient[];

    for (const ingredient of ingredients) {
      const normalizedName = ingredient.ingredient_name.toLowerCase().trim();
      const inInventory = Array.from(inventoryMap.keys()).some(invName =>
        invName.includes(normalizedName) || normalizedName.includes(invName)
      );

      if (!inInventory) {
        const servingMultiplier = meal.servings || 1;
        const key = `${normalizedName}-${ingredient.unit}`;

        if (neededIngredients.has(key)) {
          const existing = neededIngredients.get(key)!;
          existing.quantity += ingredient.quantity * servingMultiplier;
        } else {
          neededIngredients.set(key, {
            name: ingredient.ingredient_name,
            quantity: ingredient.quantity * servingMultiplier,
            unit: ingredient.unit,
            category: 'other',
            recipe_id: meal.recipe_id,
          });
        }
      }
    }
  }

  let addedCount = 0;

  for (const [, item] of neededIngredients) {
    const alreadyInListResult = await db.execute({
      sql: `SELECT id FROM shopping_items
       WHERE user_id = ? AND name = ? AND is_checked = 0`,
      args: [userId, item.name],
    });

    if (alreadyInListResult.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO shopping_items (user_id, name, quantity, unit, category, source, recipe_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [userId, item.name, item.quantity, item.unit, item.category, 'meal_plan', item.recipe_id],
      });
      addedCount++;
    }
  }

  res.json({
    added: addedCount,
    message: `Added ${addedCount} items to your shopping list`,
  });
});

export default router;
