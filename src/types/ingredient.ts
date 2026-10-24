export interface ParsedIngredient {
  id: string;
  raw: string;
  quantity: number | null;
  unit: string | null;
  item: string;
  densityId?: string;
  notes?: string;
  group?: string; // e.g. "Dough", "Topping", "Sauce"
  isOptional?: boolean;
}

export interface IngredientToken {
  type: 'quantity' | 'unit' | 'item' | 'notes' | 'text';
  value: string;
  densityMatched?: boolean;
}
