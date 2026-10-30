import { MealSlotType } from '../types/mealPlan';

export interface MealSlotConfig {
  type: MealSlotType;
  label: string;
  order: number;
}

export const MEAL_SLOTS: MealSlotConfig[] = [
  { type: 'breakfast', label: 'Breakfast', order: 1 },
  { type: 'lunch', label: 'Lunch', order: 2 },
  { type: 'snacks', label: 'Snacks', order: 3 },
  { type: 'dinner', label: 'Dinner', order: 4 },
];

export const QUICK_MEAL_TAGS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const;

const BREAKFAST_KEYWORDS = [
  'breakfast',
  'brunch',
  'morning',
  'pancake',
  'pancakes',
  'waffle',
  'waffles',
  'oatmeal',
  'granola',
  'egg',
  'eggs',
  'omelette',
  'omelet',
  'toast',
  'muffin',
  'muffins',
  'scramble',
  'frittata',
  'crepe',
  'crepes',
  'cereal',
  'smoothie',
];

const LUNCH_KEYWORDS = [
  'lunch',
  'salad',
  'sandwich',
  'sandwiches',
  'wrap',
  'wraps',
  'soup',
  'soups',
  'bowl',
  'bowls',
  'panini',
  'burger',
  'burgers',
  'lunchbox',
];

const SNACKS_KEYWORDS = [
  'snack',
  'snacks',
  'appetizer',
  'appetizers',
  'starter',
  'starters',
  'dessert',
  'desserts',
  'side',
  'sides',
  'dip',
  'dips',
  'cookie',
  'cookies',
  'baking',
  'baked',
  'bread',
  'cake',
  'pastry',
  'pastries',
  'treat',
  'bite',
  'bites',
  'tapas',
];

const DINNER_KEYWORDS = [
  'dinner',
  'supper',
  'main',
  'mains',
  'entree',
  'entrees',
  'pasta',
  'pizza',
  'roast',
  'curry',
  'steak',
  'stew',
  'casserole',
  'stir fry',
  'taco',
  'tacos',
  'seafood',
  'bbq',
  'grill',
];

/**
 * Categorizes a recipe into one or more meal slots based on tags and title.
 * Returns an array of MealSlotType.
 */
export function categorizeRecipeMealTypes(
  tags: string[] = [],
  title: string = ''
): MealSlotType[] {
  const normalizedTokens = [
    ...tags.map((t) => t.toLowerCase().trim()),
    ...title.toLowerCase().split(/\s+/),
  ].filter(Boolean);

  const matched = new Set<MealSlotType>();

  const matchesAny = (keywords: string[]) =>
    normalizedTokens.some((token) =>
      keywords.some((kw) => token === kw || token.includes(kw) || kw.includes(token))
    );

  if (matchesAny(BREAKFAST_KEYWORDS)) matched.add('breakfast');
  if (matchesAny(LUNCH_KEYWORDS)) matched.add('lunch');
  if (matchesAny(SNACKS_KEYWORDS)) matched.add('snacks');
  if (matchesAny(DINNER_KEYWORDS)) matched.add('dinner');

  // If nothing matched, provide sensible multi-slot inclusion:
  // default to dinner and lunch (most versatile)
  if (matched.size === 0) {
    matched.add('dinner');
    matched.add('lunch');
  }

  return Array.from(matched);
}

/**
 * Checks if a recipe matches a specific meal tab or slot.
 * slot 'all' matches everything.
 */
export function recipeMatchesSlotFilter(
  tags: string[] = [],
  title: string = '',
  slotFilter: MealSlotType | 'all'
): boolean {
  if (slotFilter === 'all') return true;
  const categories = categorizeRecipeMealTypes(tags, title);
  return categories.includes(slotFilter);
}
