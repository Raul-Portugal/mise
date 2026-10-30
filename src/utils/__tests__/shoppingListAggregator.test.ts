import { describe, it, expect } from 'vitest';
import {
  cleanIngredientStem,
  detectAisle,
  isPantryStapleIngredient,
  aggregateShoppingList,
} from '../shoppingListAggregator';
import { WeeklyMealPlan } from '../../types/mealPlan';
import { Recipe } from '../../types/recipe';
import { DensityRecord } from '../../types/density';

const mockDensityDb: DensityRecord[] = [
  {
    id: 'flour_all_purpose',
    name: 'Flour (All-Purpose)',
    aliases: ['all-purpose flour', 'plain flour', 'white flour'],
    category: 'flour',
    gramsPerCup: 120,
    gramsPerTbsp: 7.5,
    densityGPerMl: 0.507,
    source: 'king_arthur',
  },
  {
    id: 'sugar_granulated',
    name: 'Granulated Sugar',
    aliases: ['sugar', 'white sugar'],
    category: 'sugar',
    gramsPerCup: 200,
    gramsPerTbsp: 12.5,
    densityGPerMl: 0.845,
    source: 'king_arthur',
  },
];

describe('shoppingListAggregator', () => {
  describe('cleanIngredientStem', () => {
    it('strips preparation words and plural forms', () => {
      expect(cleanIngredientStem('2 medium yellow onions, diced')).toBe('yellow onion');
      expect(cleanIngredientStem('4 cloves garlic, minced')).toBe('garlic');
      expect(cleanIngredientStem('fresh cilantro leaves, finely chopped')).toBe('cilantro');
    });
  });

  describe('isPantryStapleIngredient', () => {
    it('flags basic oils, salts, and peppers as staples', () => {
      expect(isPantryStapleIngredient('Kosher salt')).toBe(true);
      expect(isPantryStapleIngredient('Freshly ground black pepper')).toBe(true);
      expect(isPantryStapleIngredient('Extra virgin olive oil')).toBe(true);
      expect(isPantryStapleIngredient('Chicken breast')).toBe(false);
    });
  });

  describe('detectAisle', () => {
    it('correctly maps ingredients to grocery aisles', () => {
      expect(detectAisle('yellow onion')).toBe('Produce');
      expect(detectAisle('chicken thighs')).toBe('Meat, Poultry & Seafood');
      expect(detectAisle('heavy cream')).toBe('Dairy, Cheese & Eggs');
      expect(detectAisle('sourdough bread')).toBe('Bakery & Grains');
      expect(detectAisle('all-purpose flour')).toBe('Baking, Canned & Dry Goods');
      expect(detectAisle('kosher salt', undefined, true)).toBe('Pantry Staples & Spices');
    });
  });

  describe('aggregateShoppingList', () => {
    it('merges cross-recipe ingredients across cups and grams via density', () => {
      const recipeA: Recipe = {
        id: 'r_pizza',
        schemaVersion: '1.0',
        title: 'Artisan Pizza',
        servings: { amount: 2, unit: 'pizzas' },
        times: {},
        tags: ['Dinner'],
        ingredients: [
          {
            id: 'ing_1',
            raw: '1 cup all-purpose flour',
            quantity: 1,
            unit: 'cup',
            item: 'all-purpose flour',
            densityId: 'flour_all_purpose',
          },
        ],
        steps: [],
        createdAt: 0,
        updatedAt: 0,
      };

      const recipeB: Recipe = {
        id: 'r_bread',
        schemaVersion: '1.0',
        title: 'Country Bread',
        servings: { amount: 1, unit: 'loaf' },
        times: {},
        tags: ['Baking'],
        ingredients: [
          {
            id: 'ing_2',
            raw: '350g plain flour',
            quantity: 350,
            unit: 'g',
            item: 'plain flour',
            densityId: 'flour_all_purpose',
          },
        ],
        steps: [],
        createdAt: 0,
        updatedAt: 0,
      };

      const mealPlan: WeeklyMealPlan = {
        weekId: '2026-W44',
        days: {
          '2026-10-26': {
            breakfast: [],
            lunch: [],
            snacks: [],
            dinner: [
              { id: 'pm_1', recipeId: 'r_pizza', servingsOverride: 2 },
              { id: 'pm_2', recipeId: 'r_bread', servingsOverride: 1 },
            ],
          },
        },
      };

      const result = aggregateShoppingList(
        mealPlan,
        [recipeA, recipeB],
        mockDensityDb,
        'metric'
      );

      // 1 cup flour (120g) + 350g flour = 470g.
      // 470g rounded to nearest 25g -> 475g
      const flourItem = result.find((item) => item.canonicalKey.includes('flour_all_purpose'));
      expect(flourItem).toBeDefined();
      expect(flourItem?.displayName).toBe('Flour (All-Purpose)');
      expect(flourItem?.totalGrams).toBeCloseTo(470, 1);
      expect(flourItem?.displayQuantity).toBe('475');
      expect(flourItem?.displayUnit).toBe('g');
      expect(flourItem?.sourceRecipes.length).toBe(2);
    });

    it('applies market rounding to produce and garlic', () => {
      const recipeOnions: Recipe = {
        id: 'r_soup',
        schemaVersion: '1.0',
        title: 'French Onion Soup',
        servings: { amount: 2, unit: 'bowls' },
        times: {},
        tags: ['Dinner'],
        ingredients: [
          {
            id: 'ing_onions',
            raw: '2.25 yellow onions',
            quantity: 2.25,
            unit: null,
            item: 'yellow onions',
          },
          {
            id: 'ing_garlic',
            raw: '7 cloves garlic',
            quantity: 7,
            unit: null,
            item: 'garlic cloves',
          },
        ],
        steps: [],
        createdAt: 0,
        updatedAt: 0,
      };

      const mealPlan: WeeklyMealPlan = {
        weekId: '2026-W44',
        days: {
          '2026-10-27': {
            breakfast: [],
            lunch: [],
            snacks: [],
            dinner: [{ id: 'pm_3', recipeId: 'r_soup', servingsOverride: 2 }],
          },
        },
      };

      const result = aggregateShoppingList(
        mealPlan,
        [recipeOnions],
        mockDensityDb,
        'metric'
      );

      const onionItem = result.find((item) => item.displayName.toLowerCase().includes('onion'));
      expect(onionItem).toBeDefined();
      expect(onionItem?.displayQuantity).toBe('3');

      const garlicItem = result.find((item) => item.displayName.toLowerCase().includes('garlic'));
      expect(garlicItem).toBeDefined();
      expect(garlicItem?.displayQuantity).toBe('1');
      expect(garlicItem?.displayUnit).toBe('head');
    });
  });
});
