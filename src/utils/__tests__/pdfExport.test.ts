import { describe, it, expect } from 'vitest';
import { generateMealPlanHtml, exportMealPlanToPdf } from '../pdfExport';
import { WeeklyMealPlan } from '../../types/mealPlan';
import { Recipe } from '../../types/recipe';

describe('pdfExport', () => {
  const mealPlan: WeeklyMealPlan = {
    weekId: '2026-W44',
    days: {
      '2026-10-26': {
        breakfast: [],
        lunch: [],
        snacks: [],
        dinner: [{ id: 'pm_1', recipeId: 'rcp_1', servingsOverride: 2 }],
      },
    },
  };

  const recipes: Recipe[] = [
    {
      id: 'rcp_1',
      schemaVersion: '1.0',
      title: 'Margherita Pizza',
      servings: { amount: 2, unit: 'pizzas' },
      times: { prepMinutes: 20, cookMinutes: 10 },
      tags: ['Dinner'],
      ingredients: [],
      steps: [],
      createdAt: 0,
      updatedAt: 0,
    },
  ];

  it('generates HTML containing meal plan schedule and recipe title', () => {
    const html = generateMealPlanHtml(mealPlan, recipes, '2026-W44');
    expect(html).toContain('Mise en Place');
    expect(html).toContain('Margherita Pizza');
    expect(html).toContain('2 servings');
  });

  it('safely handles non-browser environments without throwing', () => {
    expect(() => {
      exportMealPlanToPdf(mealPlan, recipes, '2026-W44');
    }).not.toThrow();
  });
});
