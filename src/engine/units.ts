import { UnitDefinition, UnitType } from '../types/conversion';

export const UNITS: Record<string, UnitDefinition> = {
  // Volume - Dry & General
  cup: {
    canonical: 'cup',
    aliases: ['cup', 'cups', 'c.', 'c'],
    type: 'dry_volume',
    toBaseFactor: 236.588, // ml
  },
  tablespoon: {
    canonical: 'tbsp',
    aliases: ['tablespoon', 'tablespoons', 'tbsp', 'tbsps', 'tbsp.', 'tbs', 'tb', 't'],
    type: 'dry_volume',
    toBaseFactor: 14.7868, // ml
  },
  teaspoon: {
    canonical: 'tsp',
    aliases: ['teaspoon', 'teaspoons', 'tsp', 'tsps', 'tsp.'],
    type: 'dry_volume',
    toBaseFactor: 4.92892, // ml
  },

  // Volume - Liquids
  fluid_ounce: {
    canonical: 'fl oz',
    aliases: ['fluid ounce', 'fluid ounces', 'fl oz', 'fl. oz.', 'floz'],
    type: 'liquid_volume',
    toBaseFactor: 29.5735, // ml
  },
  pint: {
    canonical: 'pt',
    aliases: ['pint', 'pints', 'pt', 'pt.'],
    type: 'liquid_volume',
    toBaseFactor: 473.176, // ml
  },
  quart: {
    canonical: 'qt',
    aliases: ['quart', 'quarts', 'qt', 'qt.'],
    type: 'liquid_volume',
    toBaseFactor: 946.353, // ml
  },
  gallon: {
    canonical: 'gal',
    aliases: ['gallon', 'gallons', 'gal', 'gal.'],
    type: 'liquid_volume',
    toBaseFactor: 3785.41, // ml
  },
  milliliter: {
    canonical: 'ml',
    aliases: ['milliliter', 'milliliters', 'millilitre', 'millilitres', 'ml', 'ml.'],
    type: 'liquid_volume',
    toBaseFactor: 1, // ml
  },
  liter: {
    canonical: 'l',
    aliases: ['liter', 'liters', 'litre', 'litres', 'l', 'l.'],
    type: 'liquid_volume',
    toBaseFactor: 1000, // ml
  },

  // Weights
  gram: {
    canonical: 'g',
    aliases: ['gram', 'grams', 'g', 'g.', 'gr'],
    type: 'weight',
    toBaseFactor: 1, // g
  },
  kilogram: {
    canonical: 'kg',
    aliases: ['kilogram', 'kilograms', 'kg', 'kg.', 'kilo', 'kilos'],
    type: 'weight',
    toBaseFactor: 1000, // g
  },
  ounce: {
    canonical: 'oz',
    aliases: ['ounce', 'ounces', 'oz', 'oz.'],
    type: 'weight',
    toBaseFactor: 28.3495, // g
  },
  pound: {
    canonical: 'lb',
    aliases: ['pound', 'pounds', 'lb', 'lbs', 'lb.'],
    type: 'weight',
    toBaseFactor: 453.592, // g
  },

  // Informal / Pinch
  pinch: {
    canonical: 'pinch',
    aliases: ['pinch', 'pinches'],
    type: 'pinch',
    toBaseFactor: 0.3, // ~0.3g
  },
  dash: {
    canonical: 'dash',
    aliases: ['dash', 'dashes'],
    type: 'pinch',
    toBaseFactor: 0.6, // ~0.6g
  },
};

// Quick lookup map: alias -> UnitDefinition
const ALIAS_LOOKUP: Map<string, UnitDefinition> = new Map();
for (const unit of Object.values(UNITS)) {
  for (const alias of unit.aliases) {
    ALIAS_LOOKUP.set(alias.toLowerCase(), unit);
  }
}

export function normalizeUnit(rawUnit: string | null | undefined): UnitDefinition | null {
  if (!rawUnit) return null;
  const cleaned = rawUnit.trim().toLowerCase().replace(/\.$/, '');
  return ALIAS_LOOKUP.get(cleaned) || null;
}

export function isVolumeUnit(unit: UnitDefinition): boolean {
  return unit.type === 'dry_volume' || unit.type === 'liquid_volume';
}

export function isWeightUnit(unit: UnitDefinition): boolean {
  return unit.type === 'weight';
}
