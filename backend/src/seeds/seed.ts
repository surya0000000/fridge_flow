import { getDb } from '../db/database';

interface RecipeSeed {
  name: string;
  description: string;
  image_url: string | null;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  dietary_tags: string[];
  instructions: string[];
  ingredients: {
    ingredient_name: string;
    quantity: number;
    unit: string;
    is_optional?: boolean;
  }[];
}

const recipes: RecipeSeed[] = [
  {
    name: 'Berry Smoothie Bowl',
    description: 'A vibrant, nutrient-packed smoothie bowl topped with granola and fresh fruit.',
    image_url: null,
    prep_time: 10,
    cook_time: 0,
    servings: 1,
    difficulty: 'easy',
    cuisine: 'American',
    dietary_tags: ['vegetarian', 'vegan', 'gluten-free'],
    instructions: [
      'Blend frozen berries, banana, and almond milk until smooth and thick.',
      'Pour into a bowl.',
      'Top with granola, sliced banana, and fresh berries.',
      'Drizzle with honey if desired and serve immediately.',
    ],
    ingredients: [
      { ingredient_name: 'frozen mixed berries', quantity: 1, unit: 'cup' },
      { ingredient_name: 'banana', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'almond milk', quantity: 0.5, unit: 'cup' },
      { ingredient_name: 'granola', quantity: 0.25, unit: 'cup' },
      { ingredient_name: 'honey', quantity: 1, unit: 'tbsp', is_optional: true },
    ],
  },
  {
    name: 'Scrambled Eggs with Toast',
    description: 'Classic fluffy scrambled eggs served on toasted sourdough with butter.',
    image_url: null,
    prep_time: 5,
    cook_time: 10,
    servings: 2,
    difficulty: 'easy',
    cuisine: 'American',
    dietary_tags: ['vegetarian', 'high-protein'],
    instructions: [
      'Crack eggs into a bowl, add a pinch of salt and pepper, whisk well.',
      'Melt butter in a non-stick pan over medium-low heat.',
      'Add egg mixture and gently stir with a spatula, cooking slowly.',
      'Remove from heat when eggs are just set but still creamy.',
      'Toast bread and serve eggs on top.',
    ],
    ingredients: [
      { ingredient_name: 'eggs', quantity: 4, unit: 'pcs' },
      { ingredient_name: 'butter', quantity: 1, unit: 'tbsp' },
      { ingredient_name: 'sourdough bread', quantity: 2, unit: 'pcs' },
      { ingredient_name: 'salt', quantity: 0.25, unit: 'tsp' },
      { ingredient_name: 'black pepper', quantity: 0.25, unit: 'tsp' },
    ],
  },
  {
    name: 'Overnight Oats',
    description: 'Creamy overnight oats with chia seeds, perfect for a quick make-ahead breakfast.',
    image_url: null,
    prep_time: 5,
    cook_time: 0,
    servings: 1,
    difficulty: 'easy',
    cuisine: 'American',
    dietary_tags: ['vegetarian', 'vegan'],
    instructions: [
      'Combine oats, chia seeds, and almond milk in a jar or bowl.',
      'Stir in maple syrup and vanilla extract.',
      'Cover and refrigerate overnight (at least 4 hours).',
      'In the morning, top with fresh fruit and serve.',
    ],
    ingredients: [
      { ingredient_name: 'rolled oats', quantity: 0.5, unit: 'cup' },
      { ingredient_name: 'chia seeds', quantity: 1, unit: 'tbsp' },
      { ingredient_name: 'almond milk', quantity: 0.75, unit: 'cup' },
      { ingredient_name: 'maple syrup', quantity: 1, unit: 'tbsp' },
      { ingredient_name: 'vanilla extract', quantity: 0.5, unit: 'tsp' },
      { ingredient_name: 'fresh berries', quantity: 0.25, unit: 'cup', is_optional: true },
    ],
  },
  {
    name: 'Avocado Toast',
    description: 'Creamy smashed avocado on crusty toast with lemon, chili flakes and everything bagel seasoning.',
    image_url: null,
    prep_time: 5,
    cook_time: 5,
    servings: 1,
    difficulty: 'easy',
    cuisine: 'American',
    dietary_tags: ['vegetarian', 'vegan'],
    instructions: [
      'Toast bread until golden and crispy.',
      'Cut avocado in half, remove pit, and scoop flesh into a bowl.',
      'Mash avocado with lemon juice, salt, and pepper.',
      'Spread avocado mixture on toast.',
      'Sprinkle with chili flakes and serve.',
    ],
    ingredients: [
      { ingredient_name: 'avocado', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'sourdough bread', quantity: 2, unit: 'pcs' },
      { ingredient_name: 'lemon', quantity: 0.5, unit: 'pcs' },
      { ingredient_name: 'chili flakes', quantity: 0.25, unit: 'tsp' },
      { ingredient_name: 'salt', quantity: 0.25, unit: 'tsp' },
    ],
  },
  {
    name: 'Caesar Salad',
    description: 'Classic Caesar salad with crispy croutons, parmesan, and homemade dressing.',
    image_url: null,
    prep_time: 15,
    cook_time: 10,
    servings: 2,
    difficulty: 'medium',
    cuisine: 'Italian',
    dietary_tags: ['vegetarian'],
    instructions: [
      'Make croutons by tossing bread cubes with olive oil, baking at 375°F for 10 minutes.',
      'Whisk together mayonnaise, lemon juice, garlic, dijon mustard, and parmesan for dressing.',
      'Chop romaine lettuce into bite-sized pieces.',
      'Toss lettuce with dressing, croutons, and extra parmesan.',
      'Season with black pepper and serve.',
    ],
    ingredients: [
      { ingredient_name: 'romaine lettuce', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'parmesan cheese', quantity: 50, unit: 'g' },
      { ingredient_name: 'sourdough bread', quantity: 2, unit: 'pcs' },
      { ingredient_name: 'olive oil', quantity: 3, unit: 'tbsp' },
      { ingredient_name: 'mayonnaise', quantity: 3, unit: 'tbsp' },
      { ingredient_name: 'lemon', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'garlic', quantity: 2, unit: 'pcs' },
    ],
  },
  {
    name: 'Tomato Basil Soup',
    description: 'Rich, velvety tomato soup with fresh basil and cream, perfect with crusty bread.',
    image_url: null,
    prep_time: 10,
    cook_time: 30,
    servings: 4,
    difficulty: 'easy',
    cuisine: 'Italian',
    dietary_tags: ['vegetarian', 'gluten-free'],
    instructions: [
      'Sauté onion and garlic in olive oil until soft, about 5 minutes.',
      'Add crushed tomatoes and vegetable broth, bring to a simmer.',
      'Cook for 20 minutes until flavors meld.',
      'Blend with an immersion blender until smooth.',
      'Stir in heavy cream and fresh basil, season and serve.',
    ],
    ingredients: [
      { ingredient_name: 'canned crushed tomatoes', quantity: 800, unit: 'g' },
      { ingredient_name: 'onion', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'garlic', quantity: 4, unit: 'pcs' },
      { ingredient_name: 'vegetable broth', quantity: 2, unit: 'cup' },
      { ingredient_name: 'heavy cream', quantity: 0.25, unit: 'cup' },
      { ingredient_name: 'fresh basil', quantity: 10, unit: 'g' },
      { ingredient_name: 'olive oil', quantity: 2, unit: 'tbsp' },
    ],
  },
  {
    name: 'Chicken Caesar Wrap',
    description: 'Grilled chicken breast with Caesar salad wrapped in a warm flour tortilla.',
    image_url: null,
    prep_time: 10,
    cook_time: 15,
    servings: 2,
    difficulty: 'easy',
    cuisine: 'American',
    dietary_tags: ['high-protein'],
    instructions: [
      'Season chicken with salt, pepper, and garlic powder.',
      'Grill or pan-fry chicken for 6-7 minutes per side until cooked through.',
      'Let chicken rest 5 minutes, then slice.',
      'Warm tortillas in a dry pan for 30 seconds per side.',
      'Layer romaine lettuce, chicken, parmesan, and Caesar dressing on tortilla.',
      'Roll tightly and cut in half diagonally.',
    ],
    ingredients: [
      { ingredient_name: 'chicken breast', quantity: 400, unit: 'g' },
      { ingredient_name: 'flour tortilla', quantity: 2, unit: 'pcs' },
      { ingredient_name: 'romaine lettuce', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'parmesan cheese', quantity: 30, unit: 'g' },
      { ingredient_name: 'mayonnaise', quantity: 2, unit: 'tbsp' },
      { ingredient_name: 'lemon', quantity: 0.5, unit: 'pcs' },
      { ingredient_name: 'garlic', quantity: 1, unit: 'pcs' },
    ],
  },
  {
    name: 'Spaghetti Bolognese',
    description: 'A hearty Italian meat sauce simmered low and slow over al dente spaghetti.',
    image_url: null,
    prep_time: 15,
    cook_time: 45,
    servings: 4,
    difficulty: 'medium',
    cuisine: 'Italian',
    dietary_tags: ['high-protein'],
    instructions: [
      'Brown ground beef in a large pan over medium-high heat, breaking it apart.',
      'Add diced onion, carrot, and celery, cook for 5 minutes.',
      'Add garlic and tomato paste, cook 2 minutes.',
      'Pour in crushed tomatoes and red wine, reduce heat and simmer 30 minutes.',
      'Cook spaghetti according to package instructions.',
      'Season sauce with salt, pepper, and Italian herbs. Serve over pasta with parmesan.',
    ],
    ingredients: [
      { ingredient_name: 'ground beef', quantity: 500, unit: 'g' },
      { ingredient_name: 'spaghetti', quantity: 400, unit: 'g' },
      { ingredient_name: 'canned crushed tomatoes', quantity: 400, unit: 'g' },
      { ingredient_name: 'onion', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'garlic', quantity: 3, unit: 'pcs' },
      { ingredient_name: 'carrot', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'tomato paste', quantity: 2, unit: 'tbsp' },
      { ingredient_name: 'red wine', quantity: 0.5, unit: 'cup', is_optional: true },
      { ingredient_name: 'parmesan cheese', quantity: 50, unit: 'g', is_optional: true },
    ],
  },
  {
    name: 'Chicken Stir-Fry',
    description: 'Quick and colorful chicken and vegetable stir-fry in a savory soy-ginger sauce.',
    image_url: null,
    prep_time: 15,
    cook_time: 15,
    servings: 3,
    difficulty: 'medium',
    cuisine: 'Asian',
    dietary_tags: ['high-protein', 'gluten-free'],
    instructions: [
      'Slice chicken breast thin and marinate in soy sauce for 10 minutes.',
      'Heat oil in a wok or large pan over high heat.',
      'Stir-fry chicken until cooked, about 4 minutes. Set aside.',
      'Stir-fry broccoli, bell pepper, and carrot for 3 minutes.',
      'Add garlic and ginger, cook 1 minute.',
      'Return chicken, add sauce (soy sauce, sesame oil, cornstarch mixture). Toss and serve over rice.',
    ],
    ingredients: [
      { ingredient_name: 'chicken breast', quantity: 400, unit: 'g' },
      { ingredient_name: 'broccoli', quantity: 200, unit: 'g' },
      { ingredient_name: 'bell pepper', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'carrot', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'soy sauce', quantity: 3, unit: 'tbsp' },
      { ingredient_name: 'garlic', quantity: 3, unit: 'pcs' },
      { ingredient_name: 'ginger', quantity: 1, unit: 'tbsp' },
      { ingredient_name: 'sesame oil', quantity: 1, unit: 'tbsp' },
      { ingredient_name: 'vegetable oil', quantity: 2, unit: 'tbsp' },
      { ingredient_name: 'jasmine rice', quantity: 1.5, unit: 'cup' },
    ],
  },
  {
    name: 'Margherita Pizza',
    description: 'Classic Neapolitan pizza with homemade tomato sauce, fresh mozzarella, and basil.',
    image_url: null,
    prep_time: 20,
    cook_time: 15,
    servings: 2,
    difficulty: 'medium',
    cuisine: 'Italian',
    dietary_tags: ['vegetarian'],
    instructions: [
      'Preheat oven to 450°F (230°C) with a pizza stone or baking sheet inside.',
      'Stretch or roll pizza dough into a 12-inch circle.',
      'Spread tomato sauce evenly, leaving a 1-inch border.',
      'Top with sliced fresh mozzarella.',
      'Bake 12-15 minutes until crust is golden and cheese bubbles.',
      'Top with fresh basil leaves and a drizzle of olive oil.',
    ],
    ingredients: [
      { ingredient_name: 'pizza dough', quantity: 300, unit: 'g' },
      { ingredient_name: 'canned crushed tomatoes', quantity: 200, unit: 'g' },
      { ingredient_name: 'fresh mozzarella', quantity: 200, unit: 'g' },
      { ingredient_name: 'fresh basil', quantity: 10, unit: 'g' },
      { ingredient_name: 'olive oil', quantity: 2, unit: 'tbsp' },
      { ingredient_name: 'garlic', quantity: 2, unit: 'pcs' },
    ],
  },
  {
    name: 'Lentil Dal',
    description: 'Comforting Indian red lentil dal with aromatic spices, perfect with basmati rice or naan.',
    image_url: null,
    prep_time: 10,
    cook_time: 30,
    servings: 4,
    difficulty: 'easy',
    cuisine: 'Indian',
    dietary_tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'],
    instructions: [
      'Rinse red lentils thoroughly and set aside.',
      'Sauté onion in oil until golden, about 8 minutes.',
      'Add garlic, ginger, cumin, coriander, and turmeric, cook 2 minutes.',
      'Add lentils and coconut milk or water, bring to a boil.',
      'Simmer 20-25 minutes until lentils are soft and creamy.',
      'Season with salt, squeeze of lemon, and fresh cilantro. Serve with rice.',
    ],
    ingredients: [
      { ingredient_name: 'red lentils', quantity: 1.5, unit: 'cup' },
      { ingredient_name: 'onion', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'garlic', quantity: 4, unit: 'pcs' },
      { ingredient_name: 'ginger', quantity: 1, unit: 'tbsp' },
      { ingredient_name: 'coconut milk', quantity: 400, unit: 'ml' },
      { ingredient_name: 'cumin', quantity: 1, unit: 'tsp' },
      { ingredient_name: 'turmeric', quantity: 0.5, unit: 'tsp' },
      { ingredient_name: 'coriander', quantity: 1, unit: 'tsp' },
      { ingredient_name: 'vegetable oil', quantity: 2, unit: 'tbsp' },
      { ingredient_name: 'lemon', quantity: 0.5, unit: 'pcs' },
    ],
  },
  {
    name: 'Greek Salad',
    description: 'Fresh Mediterranean salad with tomatoes, cucumber, olives, and feta cheese.',
    image_url: null,
    prep_time: 10,
    cook_time: 0,
    servings: 2,
    difficulty: 'easy',
    cuisine: 'Mediterranean',
    dietary_tags: ['vegetarian', 'gluten-free'],
    instructions: [
      'Chop tomatoes, cucumber, and red onion into chunks.',
      'Slice bell pepper and halve the olives.',
      'Combine all vegetables in a large bowl.',
      'Crumble feta cheese on top.',
      'Drizzle with olive oil, lemon juice, and dried oregano. Season and serve.',
    ],
    ingredients: [
      { ingredient_name: 'tomato', quantity: 3, unit: 'pcs' },
      { ingredient_name: 'cucumber', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'red onion', quantity: 0.5, unit: 'pcs' },
      { ingredient_name: 'feta cheese', quantity: 100, unit: 'g' },
      { ingredient_name: 'kalamata olives', quantity: 50, unit: 'g' },
      { ingredient_name: 'bell pepper', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'olive oil', quantity: 3, unit: 'tbsp' },
      { ingredient_name: 'lemon', quantity: 0.5, unit: 'pcs' },
    ],
  },
  {
    name: 'Grilled Salmon with Asparagus',
    description: 'Simple, elegant salmon fillet with lemon butter and tender asparagus spears.',
    image_url: null,
    prep_time: 10,
    cook_time: 20,
    servings: 2,
    difficulty: 'medium',
    cuisine: 'American',
    dietary_tags: ['gluten-free', 'high-protein', 'dairy-free'],
    instructions: [
      'Preheat grill or pan to medium-high heat.',
      'Season salmon fillets with salt, pepper, and a drizzle of olive oil.',
      'Trim woody ends from asparagus, toss with olive oil and salt.',
      'Grill salmon 4-5 minutes per side until flaky.',
      'Grill asparagus 3-4 minutes, turning occasionally.',
      'Serve with lemon wedges and a pat of butter on the salmon.',
    ],
    ingredients: [
      { ingredient_name: 'salmon fillet', quantity: 400, unit: 'g' },
      { ingredient_name: 'asparagus', quantity: 300, unit: 'g' },
      { ingredient_name: 'lemon', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'butter', quantity: 2, unit: 'tbsp' },
      { ingredient_name: 'olive oil', quantity: 2, unit: 'tbsp' },
      { ingredient_name: 'garlic', quantity: 2, unit: 'pcs' },
    ],
  },
  {
    name: 'Black Bean Tacos',
    description: 'Spiced black bean tacos with corn salsa, avocado, and cilantro on warm corn tortillas.',
    image_url: null,
    prep_time: 15,
    cook_time: 10,
    servings: 3,
    difficulty: 'easy',
    cuisine: 'Mexican',
    dietary_tags: ['vegetarian', 'vegan', 'gluten-free'],
    instructions: [
      'Drain and rinse black beans, season with cumin, chili powder, and salt.',
      'Warm beans in a pan over medium heat for 5 minutes.',
      'Mix diced tomato, corn, red onion, and cilantro for salsa.',
      'Warm corn tortillas in a dry pan for 30 seconds per side.',
      'Assemble tacos with beans, salsa, and sliced avocado.',
      'Squeeze lime juice over everything and serve.',
    ],
    ingredients: [
      { ingredient_name: 'canned black beans', quantity: 400, unit: 'g' },
      { ingredient_name: 'corn tortilla', quantity: 6, unit: 'pcs' },
      { ingredient_name: 'avocado', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'tomato', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'red onion', quantity: 0.25, unit: 'pcs' },
      { ingredient_name: 'lime', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'cumin', quantity: 1, unit: 'tsp' },
      { ingredient_name: 'chili powder', quantity: 1, unit: 'tsp' },
      { ingredient_name: 'fresh cilantro', quantity: 10, unit: 'g' },
    ],
  },
  {
    name: 'Banana Pancakes',
    description: 'Fluffy banana pancakes made with just 3 ingredients — banana, eggs, and oats.',
    image_url: null,
    prep_time: 5,
    cook_time: 15,
    servings: 2,
    difficulty: 'easy',
    cuisine: 'American',
    dietary_tags: ['vegetarian', 'gluten-free', 'dairy-free'],
    instructions: [
      'Mash ripe bananas thoroughly in a bowl.',
      'Add eggs and rolled oats, mix well to form a batter.',
      'Heat a non-stick pan over medium heat with a small amount of butter.',
      'Pour small amounts of batter to form pancakes.',
      'Cook 2-3 minutes per side until golden.',
      'Serve with maple syrup and fresh fruit.',
    ],
    ingredients: [
      { ingredient_name: 'banana', quantity: 2, unit: 'pcs' },
      { ingredient_name: 'eggs', quantity: 2, unit: 'pcs' },
      { ingredient_name: 'rolled oats', quantity: 0.5, unit: 'cup' },
      { ingredient_name: 'butter', quantity: 1, unit: 'tbsp' },
      { ingredient_name: 'maple syrup', quantity: 2, unit: 'tbsp', is_optional: true },
    ],
  },
  {
    name: 'Mushroom Risotto',
    description: 'Creamy Italian risotto with earthy mushrooms, white wine, and parmesan cheese.',
    image_url: null,
    prep_time: 10,
    cook_time: 35,
    servings: 4,
    difficulty: 'hard',
    cuisine: 'Italian',
    dietary_tags: ['vegetarian', 'gluten-free'],
    instructions: [
      'Warm vegetable broth in a separate pan.',
      'Sauté sliced mushrooms in butter until golden, set aside.',
      'Sauté onion and garlic in olive oil until soft.',
      'Add arborio rice, stir to coat, cook 2 minutes.',
      'Add white wine, stir until absorbed.',
      'Add warm broth one ladle at a time, stirring constantly, until absorbed each time (25 min).',
      'Stir in mushrooms, parmesan, and butter. Season and serve.',
    ],
    ingredients: [
      { ingredient_name: 'arborio rice', quantity: 300, unit: 'g' },
      { ingredient_name: 'mushrooms', quantity: 300, unit: 'g' },
      { ingredient_name: 'vegetable broth', quantity: 1, unit: 'l' },
      { ingredient_name: 'onion', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'garlic', quantity: 3, unit: 'pcs' },
      { ingredient_name: 'white wine', quantity: 0.5, unit: 'cup' },
      { ingredient_name: 'parmesan cheese', quantity: 80, unit: 'g' },
      { ingredient_name: 'butter', quantity: 3, unit: 'tbsp' },
      { ingredient_name: 'olive oil', quantity: 2, unit: 'tbsp' },
    ],
  },
  {
    name: 'Chicken Tikka Masala',
    description: 'Tender chicken in a rich, spiced tomato-cream sauce — a true crowd pleaser.',
    image_url: null,
    prep_time: 20,
    cook_time: 30,
    servings: 4,
    difficulty: 'medium',
    cuisine: 'Indian',
    dietary_tags: ['high-protein', 'gluten-free'],
    instructions: [
      'Marinate chicken in yogurt and spices for at least 1 hour.',
      'Cook chicken in a hot pan or broiler until charred, set aside.',
      'Sauté onion until golden, add garlic and ginger paste.',
      'Add garam masala, cumin, coriander, and chili powder, cook 2 minutes.',
      'Add crushed tomatoes, simmer 10 minutes.',
      'Stir in heavy cream and cooked chicken, simmer 10 minutes more.',
      'Serve over basmati rice with naan bread.',
    ],
    ingredients: [
      { ingredient_name: 'chicken breast', quantity: 600, unit: 'g' },
      { ingredient_name: 'plain yogurt', quantity: 200, unit: 'ml' },
      { ingredient_name: 'canned crushed tomatoes', quantity: 400, unit: 'g' },
      { ingredient_name: 'heavy cream', quantity: 150, unit: 'ml' },
      { ingredient_name: 'onion', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'garlic', quantity: 4, unit: 'pcs' },
      { ingredient_name: 'ginger', quantity: 1, unit: 'tbsp' },
      { ingredient_name: 'garam masala', quantity: 2, unit: 'tsp' },
      { ingredient_name: 'cumin', quantity: 1, unit: 'tsp' },
      { ingredient_name: 'vegetable oil', quantity: 2, unit: 'tbsp' },
      { ingredient_name: 'jasmine rice', quantity: 1.5, unit: 'cup' },
    ],
  },
  {
    name: 'Veggie Buddha Bowl',
    description: 'A nourishing bowl with roasted vegetables, quinoa, chickpeas, and tahini dressing.',
    image_url: null,
    prep_time: 15,
    cook_time: 25,
    servings: 2,
    difficulty: 'medium',
    cuisine: 'Mediterranean',
    dietary_tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'],
    instructions: [
      'Preheat oven to 400°F (200°C).',
      'Toss sweet potato, broccoli, and chickpeas with olive oil, salt, and cumin.',
      'Roast for 20-25 minutes until tender and lightly caramelized.',
      'Cook quinoa according to package instructions.',
      'Whisk tahini, lemon juice, garlic, and water for dressing.',
      'Assemble bowls with quinoa, roasted vegetables, and avocado.',
      'Drizzle with tahini dressing and serve.',
    ],
    ingredients: [
      { ingredient_name: 'quinoa', quantity: 0.75, unit: 'cup' },
      { ingredient_name: 'sweet potato', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'broccoli', quantity: 200, unit: 'g' },
      { ingredient_name: 'canned chickpeas', quantity: 400, unit: 'g' },
      { ingredient_name: 'avocado', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'tahini', quantity: 3, unit: 'tbsp' },
      { ingredient_name: 'lemon', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'garlic', quantity: 1, unit: 'pcs' },
      { ingredient_name: 'olive oil', quantity: 3, unit: 'tbsp' },
    ],
  },
];

export async function seedDatabase(): Promise<void> {
  const db = getDb();

  const countResult = await db.execute({ sql: 'SELECT COUNT(*) as count FROM recipes', args: [] });
  const recipeCount = Number(countResult.rows[0].count);

  if (recipeCount > 0) {
    console.log(`Recipes table already has ${recipeCount} recipes. Skipping seed.`);
    return;
  }

  console.log('Seeding database with recipes...');

  for (const recipe of recipes) {
    await db.execute({
      sql: `INSERT INTO recipes (name, description, image_url, prep_time, cook_time, servings, difficulty, cuisine, dietary_tags, instructions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        recipe.name,
        recipe.description,
        recipe.image_url,
        recipe.prep_time,
        recipe.cook_time,
        recipe.servings,
        recipe.difficulty,
        recipe.cuisine,
        JSON.stringify(recipe.dietary_tags),
        JSON.stringify(recipe.instructions),
      ],
    });

    const idResult = await db.execute({
      sql: 'SELECT id FROM recipes WHERE name = ?',
      args: [recipe.name],
    });
    const recipeId = Number(idResult.rows[0].id);

    for (const ingredient of recipe.ingredients) {
      await db.execute({
        sql: `INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, is_optional)
         VALUES (?, ?, ?, ?, ?)`,
        args: [
          recipeId,
          ingredient.ingredient_name,
          ingredient.quantity,
          ingredient.unit,
          ingredient.is_optional ? 1 : 0,
        ],
      });
    }
  }

  console.log(`Successfully seeded ${recipes.length} recipes.`);
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
