import { describe, it, expect } from 'vitest';
import { convertIngredient, findDensity } from '../converter';
import { INITIAL_DENSITIES } from '../../data/densityDatabase';
import { SEED_RECIPES } from '../../data/seedRecipes';
import { ParsedIngredient } from '../../types/ingredient';

describe('Culinary Conversion Engine (Verified Data)', () => {
  it('converts 1 cup all-purpose flour to 120g using King Arthur verified chart', () => {
    const flourIng: ParsedIngredient = {
      id: '1',
      raw: '1 cup all-purpose flour',
      quantity: 1,
      unit: 'cup',
      item: 'all-purpose flour',
    };

    const metric = convertIngredient(flourIng, 'metric', 1.0, INITIAL_DENSITIES);
    expect(metric.displayQuantity).toBe('120');
    expect(metric.displayUnit).toBe('g');
  });

  it('converts 1 cup granulated sugar to 198g (exact) or 200g (rounded in bulk tier)', () => {
    const sugarIng: ParsedIngredient = {
      id: '2',
      raw: '1 cup granulated sugar',
      quantity: 1,
      unit: 'cup',
      item: 'granulated sugar',
    };

    const metric = convertIngredient(sugarIng, 'metric', 1.0, INITIAL_DENSITIES);
    expect(metric.displayQuantity).toBe('200'); // 198g rounds to 200g under >100g bulk tier

    const exactMetric = convertIngredient(sugarIng, 'metric', 1.0, INITIAL_DENSITIES, true);
    expect(exactMetric.displayQuantity).toBe('198');
  });

  it('accurately distinguishes Diamond Crystal kosher salt (8g/tbsp verified) vs Table Salt (18g/tbsp verified)', () => {
    const diamondSalt: ParsedIngredient = {
      id: '3',
      raw: '1 tbsp diamond crystal kosher salt',
      quantity: 1,
      unit: 'tbsp',
      item: 'diamond crystal kosher salt',
    };

    const tableSalt: ParsedIngredient = {
      id: '4',
      raw: '1 tbsp table salt',
      quantity: 1,
      unit: 'tbsp',
      item: 'table salt',
    };

    const metricDiamond = convertIngredient(diamondSalt, 'metric', 1.0, INITIAL_DENSITIES);
    const metricTable = convertIngredient(tableSalt, 'metric', 1.0, INITIAL_DENSITIES);

    expect(metricDiamond.displayQuantity).toBe('8'); // King Arthur verified: 1 tbsp = 8g
    expect(metricTable.displayQuantity).toBe('18'); // King Arthur & USDA verified: 1 tbsp = 18g
  });

  it('scales ingredients dynamically by yield multiplier', () => {
    const butterIng: ParsedIngredient = {
      id: '5',
      raw: '1 cup butter',
      quantity: 1,
      unit: 'cup',
      item: 'butter',
    };

    // 0.5x yield of 1 cup butter = 0.5 cup
    const scaled = convertIngredient(butterIng, 'metric', 0.5, INITIAL_DENSITIES, true);
    expect(scaled.displayQuantity).toBe('113'); // King Arthur verified: 1/2 cup (8 tbsp) = 113g
  });

  it('verifies that core seed recipe ingredients successfully resolve to verified database records', () => {
    for (const recipe of SEED_RECIPES) {
      for (const ing of recipe.ingredients) {
        if (ing.unit) {
          const match = findDensity(ing.item, ing.densityId, INITIAL_DENSITIES);
          expect(match, `Expected ${ing.item} in recipe "${recipe.title}" to resolve to a verified density`).toBeDefined();
          expect(match?.source).toMatch(/king_arthur|usda/);
        }
      }
    }
  });
});
