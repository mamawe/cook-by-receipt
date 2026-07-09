/**
 * Receipt 2 meal Shared TypeScript Types
 * English-native data model. Chinese is treated as a localization layer.
 */

export type IngredientCategory =
  | 'vegetables'
  | 'meat_poultry'
  | 'seafood'
  | 'dairy_eggs'
  | 'staples'
  | 'soy_products'
  | 'seasonings'
  | 'fruits'
  | 'dry_goods'
  | 'frozen'
  | 'beverages'
  | 'other';

export type IngredientUnit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'L'
  | 'lb'
  | 'oz'
  | 'cup'
  | 'tbsp'
  | 'tsp'
  | 'pcs'
  | 'bunch'
  | 'bag'
  | 'box'
  | 'slice'
  | 'fl_oz'
  | 'gallon';

export type StorageType = 'pantry' | 'fridge' | 'freezer';

export type IngredientStatus =
  | 'pending_confirm'
  | 'active'
  | 'depleted'
  | 'expired'
  | 'discarded';

export interface IngredientItem {
  id: string;
  userId: string;
  name: string;
  category: IngredientCategory;
  quantity: number;
  unit: IngredientUnit;
  purchasedAt: string; // ISO String or YYYY-MM-DD
  expireAt: string;    // YYYY-MM-DD
  storage: StorageType;
  remainingQuantity: number;
  status: IngredientStatus;
  confidence?: number;
  rawSource?: 'receipt_photo' | 'item_photo' | 'text' | 'manual';
  rawText?: string;
  rawImageUrl?: string;
}

export type CookingSkill = 'beginner' | 'intermediate' | 'advanced';

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export interface UserProfile {
  userId: string;
  householdSize: number;
  servingsMultiplier: number;
  cuisinesPreferred: string[];
  allergens: string[];
  dietaryGoals: string[];
  cookingSkill: CookingSkill;
  kitchenTools: string[];
}

export interface MealRecipeIngredient {
  name: string;
  quantity: number;
  unit: IngredientUnit;
  isOptional?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  difficulty: RecipeDifficulty;
  cookTimeMin: number;
  steps: string[];
  coverImageUrl?: string;
  nutrition: {
    calories: number; // kcal
    protein: number;  // g
    fat: number;      // g
    carbs: number;    // g
  };
  ingredients: MealRecipeIngredient[];
  source: 'llm_generated' | 'curated';
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export interface MealPlanRecipe {
  id: string; // unique for this meal in the plan
  date: string; // YYYY-MM-DD
  mealSlot: MealSlot;
  recipe: Recipe;
  status: 'planned' | 'cooked' | 'skipped' | 'replaced';
  userFeedback?: string;
}

export interface MealPlan {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  mealsPerDay: number;
  cuisines: string[];
  constraints: {
    maxCookTime?: number;
    cookingSkill?: string;
    allergens?: string[];
  };
  status: 'draft' | 'active' | 'completed';
  recipes: MealPlanRecipe[];
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  deltaQuantity: number;
  unit: IngredientUnit;
  reason: 'cook' | 'waste' | 'manual_edit' | 'expire' | 'add';
  refRecipeId?: string;
  createdAt: string;
}
