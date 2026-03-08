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

router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { search, dietary, cuisine } = req.query;

  let query = 'SELECT * FROM recipes WHERE 1=1';
  const params: unknown[] = [];

  if (search && typeof search === 'string') {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (cuisine && typeof cuisine === 'string') {
    query += ' AND cuisine = ?';
    params.push(cuisine);
  }

  query += ' ORDER BY name ASC';

  let recipes = db.prepare(query).all(...params) as Recipe[];

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

router.get('/saved', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(
    `SELECT r.*, sr.saved_at
     FROM recipes r
     JOIN saved_recipes sr ON r.id = sr.recipe_id
     WHERE sr.user_id = ?
     ORDER BY sr.saved_at DESC`
  ).all(req.user!.id) as Recipe[];

  const recipes = rows.map(recipe => ({
    ...recipe,
    dietary_tags: JSON.parse(recipe.dietary_tags || '[]'),
    instructions: JSON.parse(recipe.instructions || '[]'),
    is_saved: true,
  }));

  res.json(recipes);
});

router.get('/suggest', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const inventory = db.prepare(
    'SELECT name, quantity, unit FROM inventory_items WHERE user_id = ?'
  ).all(req.user!.id) as InventoryItem[];

  const recipes = db.prepare('SELECT * FROM recipes').all() as Recipe[];

  const suggestions = recipes.map(recipe => {
    const ingredients = db.prepare(
      'SELECT * FROM recipe_ingredients WHERE recipe_id = ? AND is_optional = 0'
    ).all(recipe.id) as RecipeIngredient[];

    if (ingredients.length === 0) return null;

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

    return {
      ...recipe,
      dietary_tags: JSON.parse(recipe.dietary_tags || '[]'),
      instructions: JSON.parse(recipe.instructions || '[]'),
      matchScore,
      matchedIngredients,
      missingIngredients,
    };
  })
    .filter(r => r !== null && r.matchScore > 30)
    .sort((a, b) => b!.matchScore - a!.matchScore);

  const savedRecipeIds = new Set(
    (db.prepare('SELECT recipe_id FROM saved_recipes WHERE user_id = ?').all(req.user!.id) as { recipe_id: number }[])
      .map(r => r.recipe_id)
  );

  const result = suggestions.map(r => ({
    ...r!,
    is_saved: savedRecipeIds.has(r!.id),
  }));

  res.json(result);
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id) as Recipe | undefined;

  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }

  const ingredients = db.prepare(
    'SELECT * FROM recipe_ingredients WHERE recipe_id = ?'
  ).all(recipe.id) as RecipeIngredient[];

  res.json({
    ...recipe,
    dietary_tags: JSON.parse(recipe.dietary_tags || '[]'),
    instructions: JSON.parse(recipe.instructions || '[]'),
    ingredients,
  });
});

router.post('/:id/save', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const recipeId = parseInt(req.params.id);

  const recipe = db.prepare('SELECT id FROM recipes WHERE id = ?').get(recipeId);
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }

  const existing = db.prepare(
    'SELECT 1 FROM saved_recipes WHERE user_id = ? AND recipe_id = ?'
  ).get(req.user!.id, recipeId);

  if (existing) {
    res.status(409).json({ error: 'Recipe already saved' });
    return;
  }

  db.prepare(
    'INSERT INTO saved_recipes (user_id, recipe_id) VALUES (?, ?)'
  ).run(req.user!.id, recipeId);

  res.status(201).json({ success: true });
});

router.delete('/:id/save', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const recipeId = parseInt(req.params.id);

  const existing = db.prepare(
    'SELECT 1 FROM saved_recipes WHERE user_id = ? AND recipe_id = ?'
  ).get(req.user!.id, recipeId);

  if (!existing) {
    res.status(404).json({ error: 'Recipe not saved' });
    return;
  }

  db.prepare(
    'DELETE FROM saved_recipes WHERE user_id = ? AND recipe_id = ?'
  ).run(req.user!.id, recipeId);

  res.json({ success: true });
});

export default router;
