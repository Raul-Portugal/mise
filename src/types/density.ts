export type IngredientCategory =
  | 'flour'
  | 'sugar'
  | 'fat_dairy'
  | 'liquid'
  | 'leavener_salt'
  | 'nut_seed'
  | 'grain_cereal'
  | 'fruit_veg'
  | 'spice_herb'
  | 'chocolate'
  | 'other';

export interface DensityRecord {
  id: string;
  name: string;
  aliases: string[];
  category: IngredientCategory;
  gramsPerCup: number; // Based on 1 US Standard Cup = 236.588 ml
  gramsPerTbsp?: number; // Optional specific table spoon density (e.g. Diamond Crystal vs Morton salt)
  stateModifiers?: string[]; // e.g. ["sifted", "packed", "melted", "chopped"]
  densityGPerMl: number; // Computed or specified g/ml
  notes?: string;
  source?: 'king_arthur' | 'usda' | 'custom';
}
