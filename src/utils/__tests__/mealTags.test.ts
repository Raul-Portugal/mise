import { describe, it, expect } from 'vitest';
import { categorizeRecipeMealTypes, recipeMatchesSlotFilter } from '../mealTags';

describe('mealTags', () => {
  it('correctly maps tags to breakfast', () => {
    expect(categorizeRecipeMealTypes(['Brunch', 'Baking'], 'Buttermilk Pancakes')).toContain('breakfast');
    expect(categorizeRecipeMealTypes([], 'French Omelette')).toContain('breakfast');
  });

  it('correctly maps tags to lunch', () => {
    expect(categorizeRecipeMealTypes(['Healthy'], 'Caesar Salad')).toContain('lunch');
    expect(categorizeRecipeMealTypes(['Sandwich'], 'Turkey Club')).toContain('lunch');
  });

  it('correctly maps tags to dinner', () => {
    expect(categorizeRecipeMealTypes(['Italian'], 'Margherita Pizza')).toContain('dinner');
    expect(categorizeRecipeMealTypes(['Main'], 'Beef Stew')).toContain('dinner');
  });

  it('correctly maps tags to snacks', () => {
    expect(categorizeRecipeMealTypes(['Dessert'], 'Chocolate Chip Cookies')).toContain('snacks');
    expect(categorizeRecipeMealTypes(['Appetizer'], 'Garlic Bread')).toContain('snacks');
  });

  it('filters by slot correctly', () => {
    expect(recipeMatchesSlotFilter(['Dinner'], 'Pizza', 'dinner')).toBe(true);
    expect(recipeMatchesSlotFilter(['Dinner'], 'Pizza', 'all')).toBe(true);
    expect(recipeMatchesSlotFilter(['Dinner'], 'Pizza', 'breakfast')).toBe(false);
  });
});
