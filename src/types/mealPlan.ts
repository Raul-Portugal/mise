export type MealSlotType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export interface PlannedMealItem {
  id: string;               // Unique instance ID (e.g., "pm_1698300000_abc")
  recipeId: string;         // References Mise Recipe.id
  servingsOverride: number; // Defaults to recipe.servings.amount, user-adjustable per meal
}

export interface DayMealPlan {
  breakfast: PlannedMealItem[];
  lunch: PlannedMealItem[];
  snacks: PlannedMealItem[];
  dinner: PlannedMealItem[];
}

export interface WeeklyMealPlan {
  weekId: string;           // ISO Week string, e.g., "2026-W44"
  days: {
    [isoDate: string]: DayMealPlan; // e.g. "2026-10-26"
  };
}

export type GroceryAisle =
  | 'Produce'
  | 'Meat, Poultry & Seafood'
  | 'Dairy, Cheese & Eggs'
  | 'Bakery & Grains'
  | 'Baking, Canned & Dry Goods'
  | 'Pantry Staples & Spices'
  | 'Other';

export interface ShoppingListSourceRecipe {
  recipeId: string;
  recipeTitle: string;
  originalText: string;
}

export interface ShoppingListItem {
  id: string;
  canonicalKey: string;     // densityId || normalized item name (e.g., "flour_all_purpose")
  displayName: string;      // "All-purpose flour"
  aisle: GroceryAisle;      // Clean grocery aisle grouping
  totalGrams?: number;      // Normalized base weight (if density is known)
  totalMl?: number;         // Normalized base volume (if liquid)
  rawCount?: number;        // For unitless/count items (e.g., "3 cloves garlic", "4 large eggs")
  displayQuantity: string;  // Sensible grocery-rounded output, e.g., "550 g" or "1.25 lbs" or "6 large"
  displayUnit?: string;
  sourceRecipes: ShoppingListSourceRecipe[];
  checked: boolean;
  isPantryStaple: boolean;  // Auto-flagged for salt, black pepper, water, cooking oil
  isCustom?: boolean;       // True for user-added custom groceries
  note?: string;            // Secondary context like "2.25 needed" or original count
}

export interface CustomGroceryItem {
  id: string;
  name: string;
  aisle: GroceryAisle;
  checked: boolean;
  createdAt: number;
}
