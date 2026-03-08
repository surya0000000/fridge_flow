import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

interface Recipe {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: string | null;
  cuisine: string | null;
  dietary_tags: string;
  instructions: string;
  created_by: number | null;
}

interface RecipeIngredient {
  id: number;
  recipe_id: number;
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

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function ingredientMatches(inventoryName: string, recipeIngredient: string): boolean {
  const inv = normalizeIngredientName(inventoryName);
  const rec = normalizeIngredientName(recipeIngredient);
  return inv.includes(rec) || rec.includes(inv) || inv === rec;
}

router.get('/', async (req: Request, res: Response) => {
  const db = getDb();
  const { search, dietary, cuisine } = req.query;

  let query = 'SELECT * FROM recipes WHERE 1=1';
  const params: (string | number | boolean | null)[] = [];

  if (search && typeof search === 'string') {
    query += ` AND (name LIKE ? OR description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (cuisine && typeof cuisine === 'string') {
    query += ` AND cuisine = ?`;
    params.push(cuisine);
  }

  query += ' ORDER BY name ASC';

  const result = await db.execute({ sql: query, args: params });
  let recipes = result.rows as unknown as Recipe[];

  if (dietary && typeof dietary === 'string') {
    const tags = dietary.split(',').map(t => t.trim().toLowerCase());
    recipes = recipes.filter(recipe => {
      const recipeTags: string[] = JSON.parse(recipe.dietary_tags || '[]');
      return tags.every(tag => recipeTags.map(t => t.toLowerCase()).includes(tag));
    });
  }

  const recipesWithDetails = recipes.map(recipe => ({
    ...recipe,
    dietary_tags: JSON.parse(recipe.dietary_tags || '[]'),
    instructions: JSON.parse(recipe.instructions || '[]'),
  }));

  res.json(recipesWithDetails);
});

router.get('/saved', authenticate, async (req: Request, res: Response) => {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT r.*, sr.saved_at
     FROM recipes r
     JOIN saved_recipes sr ON r.id = sr.recipe_id
     WHERE sr.user_id = ?
     ORDER BY sr.saved_at DESC`,
    args: [req.user!.id],
  });

  const recipes = (result.rows as unknown as Recipe[]).map((recipe: Recipe) => ({
    ...recipe,
    dietary_tags: JSON.parse(recipe.dietary_tags || '[]'),
    instructions: JSON.parse(recipe.instructions || '[]'),
    is_saved: true,
  }));

  res.json(recipes);
});

router.get('/suggest', authenticate, async (req: Request, res: Response) => {
  const db = getDb();

  const inventoryResult = await db.execute({
    sql: 'SELECT name, quantity, unit FROM inventory_items WHERE user_id = ?',
    args: [req.user!.id],
  });
  const inventory = inventoryResult.rows as unknown as InventoryItem[];

  const recipesResult = await db.execute({ sql: 'SELECT * FROM recipes', args: [] });
  const recipes = recipesResult.rows as unknown as Recipe[];

  const suggestions = [];

  for (const recipe of recipes) {
    const ingResult = await db.execute({
      sql: 'SELECT * FROM recipe_ingredients WHERE recipe_id = ? AND is_optional = 0',
      args: [recipe.id],
    });
    const ingredients = ingResult.rows as unknown as RecipeIngredient[];

    if (ingredients.length === 0) continue;

    const matchedIngredients: string[] = [];
    const missingIngredients: string[] = [];

    for (const ingredient of ingredients) {
      const found = inventory.some(item =>
        ingredientMatches(item.name, ingredient.ingredient_name)
      );

      if (found) {
        matchedIngredients.push(ingredient.ingredient_name);
      } else {
        missingIngredients.push(ingredient.ingredient_name);
      }
    }

    const matchScore = Math.round((matchedIngredients.length / ingredients.length) * 100);

    if (matchScore > 30) {
      suggestions.push({
        ...recipe,
        dietary_tags: JSON.parse(recipe.dietary_tags || '[]'),
        instructions: JSON.parse(recipe.instructions || '[]'),
        matchScore,
        matchedIngredients,
        missingIngredients,
      });
    }
  }

  suggestions.sort((a, b) => b.matchScore - a.matchScore);

  const savedResult = await db.execute({
    sql: 'SELECT recipe_id FROM saved_recipes WHERE user_id = ?',
    args: [req.user!.id],
  });
  const savedRecipeIds = new Set(savedResult.rows.map((r: any) => Number(r.recipe_id)));

  const result2 = suggestions.map(r => ({
    ...r,
    is_saved: savedRecipeIds.has(r.id),
  }));

  res.json(result2);
});

router.get('/:id', async (req: Request, res: Response) => {
  const db = getDb();
  const recipeResult = await db.execute({
    sql: 'SELECT * FROM recipes WHERE id = ?',
    args: [req.params.id],
  });

  if (recipeResult.rows.length === 0) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }

  const recipe = recipeResult.rows[0] as unknown as Recipe;

  const ingredientsResult = await db.execute({
    sql: 'SELECT * FROM recipe_ingredients WHERE recipe_id = ?',
    args: [recipe.id],
  });

  res.json({
    ...recipe,
    dietary_tags: JSON.parse(recipe.dietary_tags || '[]'),
    instructions: JSON.parse(recipe.instructions || '[]'),
    ingredients: ingredientsResult.rows,
  });
});

router.post('/:id/save', authenticate, async (req: Request, res: Response) => {
  const db = getDb();
  const recipeId = parseInt(req.params.id);

  const recipeResult = await db.execute({
    sql: 'SELECT id FROM recipes WHERE id = ?',
    args: [recipeId],
  });
  if (recipeResult.rows.length === 0) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }

  const existingResult = await db.execute({
    sql: 'SELECT 1 FROM saved_recipes WHERE user_id = ? AND recipe_id = ?',
    args: [req.user!.id, recipeId],
  });

  if (existingResult.rows.length > 0) {
    res.status(409).json({ error: 'Recipe already saved' });
    return;
  }

  await db.execute({
    sql: 'INSERT INTO saved_recipes (user_id, recipe_id) VALUES (?, ?)',
    args: [req.user!.id, recipeId],
  });

  res.status(201).json({ success: true });
});

router.delete('/:id/save', authenticate, async (req: Request, res: Response) => {
  const db = getDb();
  const recipeId = parseInt(req.params.id);

  const existingResult = await db.execute({
    sql: 'SELECT 1 FROM saved_recipes WHERE user_id = ? AND recipe_id = ?',
    args: [req.user!.id, recipeId],
  });

  if (existingResult.rows.length === 0) {
    res.status(404).json({ error: 'Recipe not saved' });
    return;
  }

  await db.execute({
    sql: 'DELETE FROM saved_recipes WHERE user_id = ? AND recipe_id = ?',
    args: [req.user!.id, recipeId],
  });

  res.json({ success: true });
});

export default router;
