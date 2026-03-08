export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface UserPreferences {
  user_id?: number;
  dietary_goals: string[];
  allergies: string[];
  household_size: number;
}

export interface UserProfile extends User {
  preferences: UserPreferences;
}

export interface InventoryItem {
  id: number;
  user_id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string | null;
  added_at: string;
}

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  ingredient_name: string;
  quantity: number;
  unit: string;
  is_optional: number;
}

export interface Recipe {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  cuisine: string | null;
  dietary_tags: string[];
  instructions: string[];
  created_by: number | null;
  ingredients?: RecipeIngredient[];
  is_saved?: boolean;
}

export interface SuggestedRecipe extends Recipe {
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}

export interface MealPlan {
  id: number;
  user_id: number;
  recipe_id: number;
  planned_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  created_at: string;
  recipe_name?: string;
  prep_time?: number | null;
  cook_time?: number | null;
  dietary_tags?: string[];
  cuisine?: string | null;
  image_url?: string | null;
}

export interface ShoppingItem {
  id: number;
  user_id: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  is_checked: number;
  source: string;
  recipe_id: number | null;
  added_at: string;
  recipe_name?: string | null;
}

export type InventoryUnit = 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'tbsp' | 'tsp' | 'cup' | 'oz' | 'lb';
export type InventoryCategory = 'dairy' | 'produce' | 'protein' | 'grains' | 'condiments' | 'beverages' | 'frozen' | 'other';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
