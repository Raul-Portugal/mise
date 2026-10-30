import { WeeklyMealPlan, ShoppingListItem, GroceryAisle, ShoppingListSourceRecipe, CustomGroceryItem } from '../types/mealPlan';
import { Recipe } from '../types/recipe';
import { DensityRecord } from '../types/density';
import { ConversionMode } from '../types/conversion';
import { normalizeUnit } from '../engine/units';
import { findDensity } from '../engine/converter';

// Common preparation words and modifiers to strip when building stems
const PREP_WORDS = [
  'finely chopped',
  'coarsely chopped',
  'roughly chopped',
  'thinly sliced',
  'room temperature',
  'extra virgin',
  'extra-virgin',
  'cloves',
  'clove',
  'heads',
  'head',
  'stalks',
  'stalk',
  'sprigs',
  'sprig',
  'bunches',
  'bunch',
  'cans',
  'can',
  'leaves',
  'leaf',
  'diced',
  'minced',
  'chopped',
  'sliced',
  'peeled',
  'cubed',
  'grated',
  'shredded',
  'crushed',
  'melted',
  'softened',
  'divided',
  'finely',
  'coarsely',
  'roughly',
  'thinly',
  'warm',
  'cold',
  'hot',
  'large',
  'medium',
  'small',
  'fresh',
  'freshly',
  'ground',
  'whole',
  'halved',
  'quartered',
  'cooked',
  'uncooked',
  'raw',
  'canned',
  'drained',
  'rinsed',
];

// Common fresh herbs that shoppers purchase in bunches
const FRESH_HERB_KEYWORDS = [
  'cilantro',
  'coriander leaves',
  'parsley',
  'flat-leaf parsley',
  'italian parsley',
  'basil',
  'fresh basil',
  'dill',
  'rosemary',
  'thyme',
  'mint',
  'fresh mint',
  'chives',
  'tarragon',
  'sage',
  'oregano',
];

// Common pantry staples to collapse into "Check Pantry First"
const PANTRY_STAPLE_KEYWORDS = [
  'salt',
  'kosher salt',
  'sea salt',
  'fine sea salt',
  'table salt',
  'black pepper',
  'freshly ground black pepper',
  'ground black pepper',
  'peppercorns',
  'water',
  'tap water',
  'ice water',
  'warm water',
  'cold water',
  'boiling water',
  'olive oil',
  'extra virgin olive oil',
  'extra-virgin olive oil',
  'vegetable oil',
  'canola oil',
  'cooking oil',
  'neutral oil',
  'cooking spray',
];

/**
 * Cleans an ingredient item name into a singular, stripped canonical stem.
 * e.g. "2 medium yellow onions, diced" -> "yellow onion"
 */
export function cleanIngredientStem(itemName: string): string {
  let cleaned = itemName.toLowerCase().trim();

  // Remove content in parentheses e.g. "garlic (cloves)" -> "garlic"
  cleaned = cleaned.replace(/\([^)]*\)/g, ' ');

  // Remove commas and special punctuation
  cleaned = cleaned.replace(/[,;:]/g, ' ');

  // Strip known prep words
  for (const prep of PREP_WORDS) {
    const regex = new RegExp(`\\b${prep}\\b`, 'gi');
    cleaned = cleaned.replace(regex, ' ');
  }

  // Remove leading numbers or fractions if present in item name
  cleaned = cleaned.replace(/^[\d\s\/\.\-]+/, '');

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Basic singularization
  cleaned = singularizeWord(cleaned);

  return cleaned || itemName.toLowerCase().trim();
}

/**
 * Basic English singularization for grocery terms
 */
function singularizeWord(word: string): string {
  if (word.endsWith('ies') && !word.endsWith('series')) {
    return word.slice(0, -3) + 'y'; // berries -> berry
  }
  if (word.endsWith('es') && (word.endsWith('ches') || word.endsWith('shes') || word.endsWith('xes') || word.endsWith('zes') || word.endsWith('toes'))) {
    return word.slice(0, -2); // tomatoes -> tomato
  }
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us') && !word.endsWith('is')) {
    return word.slice(0, -1); // onions -> onion, eggs -> egg, cloves -> clove
  }
  return word;
}

/**
 * Checks if an item is considered a basic pantry staple.
 */
export function isPantryStapleIngredient(itemName: string): boolean {
  const lower = itemName.toLowerCase().trim();
  return PANTRY_STAPLE_KEYWORDS.some((staple) => {
    return lower === staple || lower.includes(staple) || staple.includes(lower);
  });
}

/**
 * Checks if an item is fresh herbs usually bought in bunches.
 */
export function isFreshHerb(itemName: string): boolean {
  const lower = itemName.toLowerCase().trim();
  // Don't treat dried herbs as fresh bunches
  if (lower.includes('dried') || lower.includes('powder') || lower.includes('ground')) {
    return false;
  }
  return FRESH_HERB_KEYWORDS.some((herb) => lower.includes(herb));
}

/**
 * Categorizes an ingredient into one of 6 grocery aisles.
 */
export function detectAisle(
  itemName: string,
  densityId?: string,
  isPantryStaple?: boolean
): GroceryAisle {
  if (isPantryStaple) {
    return 'Pantry Staples & Spices';
  }

  const lower = itemName.toLowerCase();

  // 1. Meat, Poultry & Seafood
  const meatKeywords = [
    'chicken',
    'beef',
    'pork',
    'bacon',
    'turkey',
    'lamb',
    'steak',
    'salmon',
    'shrimp',
    'fish',
    'tuna',
    'sausage',
    'prosciutto',
    'pancetta',
    'cod',
    'halibut',
    'prawn',
    'prawns',
    'ribeye',
    'tenderloin',
    'sirloin',
    'ground meat',
    'chorizo',
    'ham',
    'patties',
  ];
  if (meatKeywords.some((k) => lower.includes(k))) {
    return 'Meat, Poultry & Seafood';
  }

  // 2. Dairy, Cheese & Eggs
  const dairyKeywords = [
    'milk',
    'cream',
    'butter',
    'cheese',
    'cheddar',
    'mozzarella',
    'parmesan',
    'parmigiano',
    'yogurt',
    'yoghurt',
    'egg',
    'eggs',
    'ricotta',
    'sour cream',
    'cream cheese',
    'feta',
    'gouda',
    'mascarpone',
    'brie',
    'gruyere',
    'ghee',
    'half-and-half',
  ];
  if (dairyKeywords.some((k) => lower.includes(k))) {
    return 'Dairy, Cheese & Eggs';
  }

  // 3. Bakery & Grains
  const grainKeywords = [
    'bread',
    'bun',
    'buns',
    'tortilla',
    'tortillas',
    'pasta',
    'spaghetti',
    'penne',
    'linguine',
    'fettuccine',
    'rigatoni',
    'noodle',
    'noodles',
    'rice',
    'quinoa',
    'oat',
    'oats',
    'rolled oats',
    'couscous',
    'bagel',
    'pita',
    'baguette',
    'croissant',
    'orzo',
    'barley',
  ];
  if (grainKeywords.some((k) => lower.includes(k))) {
    return 'Bakery & Grains';
  }

  // 4. Baking, Canned & Dry Goods
  const bakingCannedKeywords = [
    'flour',
    'sugar',
    'brown sugar',
    'powdered sugar',
    'yeast',
    'baking powder',
    'baking soda',
    'cocoa',
    'chocolate chips',
    'cacao',
    'cornstarch',
    'vanilla',
    'canned beans',
    'black beans',
    'kidney beans',
    'chickpeas',
    'garbanzo',
    'lentil',
    'lentils',
    'canned tomatoes',
    'tomato paste',
    'crushed tomatoes',
    'diced tomatoes',
    'tomato sauce',
    'broth',
    'stock',
    'walnut',
    'almond',
    'pecan',
    'cashew',
    'peanut',
    'nuts',
    'raisin',
    'dried cranberries',
    'sesame seeds',
    'chia seeds',
    'coconut milk',
  ];
  if (
    densityId?.includes('flour') ||
    densityId?.includes('sugar') ||
    bakingCannedKeywords.some((k) => lower.includes(k))
  ) {
    return 'Baking, Canned & Dry Goods';
  }

  // 5. Produce
  const produceKeywords = [
    'onion',
    'garlic',
    'shallot',
    'scallion',
    'green onion',
    'ginger',
    'lemon',
    'lime',
    'tomato',
    'potato',
    'potatoes',
    'carrot',
    'celery',
    'lettuce',
    'spinach',
    'kale',
    'arugula',
    'pepper',
    'bell pepper',
    'jalapeno',
    'chili',
    'mushroom',
    'mushrooms',
    'apple',
    'banana',
    'berry',
    'avocado',
    'cucumber',
    'zucchini',
    'broccoli',
    'cauliflower',
    'cabbage',
    'squash',
    'cilantro',
    'parsley',
    'basil',
    'dill',
    'rosemary',
    'thyme',
    'mint',
    'asparagus',
    'eggplant',
    'orange',
    'grapefruit',
    'pear',
  ];
  if (produceKeywords.some((k) => lower.includes(k))) {
    return 'Produce';
  }

  // 6. Pantry Staples & Spices
  const pantryKeywords = [
    'oil',
    'vinegar',
    'soy sauce',
    'hot sauce',
    'mustard',
    'honey',
    'maple syrup',
    'mayonnaise',
    'ketchup',
    'paprika',
    'cumin',
    'coriander',
    'cinnamon',
    'nutmeg',
    'oregano',
    'curry powder',
    'turmeric',
    'bay leaf',
    'bay leaves',
    'salt',
    'peppercorn',
  ];
  if (pantryKeywords.some((k) => lower.includes(k))) {
    return 'Pantry Staples & Spices';
  }

  return 'Other';
}

interface IntermediateGroup {
  canonicalKey: string;
  displayName: string;
  density?: DensityRecord | null;
  totalGrams: number;
  totalMl: number;
  rawCount: number;
  hasGrams: boolean;
  hasMl: boolean;
  hasCount: boolean;
  sourceRecipes: ShoppingListSourceRecipe[];
  isPantryStaple: boolean;
}

/**
 * Rounds raw totals to sensible grocery market amounts.
 */
function applyMarketRounding(
  group: IntermediateGroup,
  unitMode: ConversionMode
): { displayQuantity: string; displayUnit?: string; note?: string } {
  const itemName = group.displayName.toLowerCase();

  // 1. Garlic Modification
  if (itemName.includes('garlic') && !itemName.includes('powder')) {
    if (group.hasCount && group.rawCount >= 5) {
      const heads = Math.ceil(group.rawCount / 10);
      const clovesNeeded = Math.round(group.rawCount);
      return {
        displayQuantity: `${heads}`,
        displayUnit: heads === 1 ? 'head' : 'heads',
        note: `${clovesNeeded} cloves needed (~10 cloves/head)`,
      };
    }
  }

  // 2. Fresh Herbs
  if (isFreshHerb(itemName)) {
    // If measured in tbsp / tsp or small weight, round to whole bunches
    if (group.hasCount || group.hasMl || group.totalGrams < 60) {
      return {
        displayQuantity: '1',
        displayUnit: 'bunch',
        note: 'Fresh produce bunch',
      };
    }
  }

  // 3. Countable Produce / Eggs (e.g. 2.25 onions -> 3 onions)
  const isCountableProduce =
    !group.hasGrams &&
    !group.hasMl &&
    group.hasCount &&
    [
      'onion',
      'lemon',
      'lime',
      'egg',
      'avocado',
      'apple',
      'banana',
      'carrot',
      'tomato',
      'cucumber',
      'zucchini',
      'bell pepper',
      'shallot',
    ].some((k) => itemName.includes(k));

  if (isCountableProduce) {
    const rawVal = group.rawCount;
    if (rawVal <= 0.5) {
      return {
        displayQuantity: '1/2',
        displayUnit: '',
        note: `${rawVal.toFixed(2)} needed`,
      };
    }
    const ceiled = Math.ceil(rawVal);
    const hasFraction = Math.abs(ceiled - rawVal) > 0.05;
    return {
      displayQuantity: `${ceiled}`,
      displayUnit: '',
      note: hasFraction ? `${rawVal.toFixed(2)} needed` : undefined,
    };
  }

  // 4. Weight (Metric vs Imperial)
  if (group.hasGrams && group.totalGrams > 0) {
    const grams = group.totalGrams;

    if (unitMode === 'imperial') {
      const totalOz = grams / 28.3495;
      const totalLb = grams / 453.592;

      if (totalLb >= 0.75) {
        // Snap to practical butcher/market increments: 1/4 lb, 1/2 lb, 3/4 lb, 1 lb...
        const ceiledLb = Math.ceil(totalLb * 4) / 4;
        return {
          displayQuantity: `${ceiledLb}`,
          displayUnit: ceiledLb === 1 ? 'lb' : 'lbs',
          note: `~${Math.round(totalOz)} oz`,
        };
      } else {
        // Ceil to nearest 1 oz
        const ceiledOz = Math.ceil(totalOz);
        return {
          displayQuantity: `${ceiledOz}`,
          displayUnit: 'oz',
        };
      }
    } else {
      // Metric
      if (grams >= 1000) {
        // Display in kg rounded to 0.05 or 0.1
        const kg = Math.ceil((grams / 1000) * 20) / 20; // snaps to nearest 0.05 kg
        return {
          displayQuantity: `${kg.toFixed(2).replace(/\.00$/, '').replace(/\.0$/, '')}`,
          displayUnit: 'kg',
          note: `~${Math.round(grams)} g`,
        };
      } else if (grams >= 100) {
        // Ceil to nearest 10g or 25g
        const ceiledGrams = Math.ceil(grams / 25) * 25;
        return {
          displayQuantity: `${ceiledGrams}`,
          displayUnit: 'g',
        };
      } else {
        // Small baking quantities (< 100g)
        const ceiledGrams = Math.ceil(grams / 5) * 5;
        return {
          displayQuantity: `${Math.max(5, ceiledGrams)}`,
          displayUnit: 'g',
        };
      }
    }
  }

  // 5. Liquids (Volume ml)
  if (group.hasMl && group.totalMl > 0) {
    const ml = group.totalMl;

    if (unitMode === 'imperial') {
      const flOz = ml / 29.5735;
      const cups = ml / 236.588;

      if (cups >= 1) {
        const ceiledCups = Math.ceil(cups * 4) / 4; // nearest 1/4 cup
        return {
          displayQuantity: `${ceiledCups}`,
          displayUnit: ceiledCups === 1 ? 'cup' : 'cups',
          note: `~${Math.round(flOz)} fl oz`,
        };
      } else {
        const ceiledFlOz = Math.ceil(flOz);
        return {
          displayQuantity: `${ceiledFlOz}`,
          displayUnit: 'fl oz',
        };
      }
    } else {
      // Metric
      if (ml >= 1000) {
        const liters = Math.ceil((ml / 1000) * 4) / 4; // nearest 0.25 L
        return {
          displayQuantity: `${liters}`,
          displayUnit: 'L',
          note: `~${Math.round(ml)} ml`,
        };
      } else {
        // Ceil to nearest 25 ml
        const ceiledMl = Math.ceil(ml / 25) * 25;
        return {
          displayQuantity: `${ceiledMl}`,
          displayUnit: 'ml',
        };
      }
    }
  }

  // Fallback: rawCount or generic
  if (group.rawCount > 0) {
    const countVal = Math.ceil(group.rawCount);
    return {
      displayQuantity: `${countVal}`,
      displayUnit: '',
    };
  }

  return {
    displayQuantity: '1',
    displayUnit: '',
  };
}

/**
 * 4-Stage Aggregation Pipeline: Merges recipes from a weekly meal plan into a categorized shopping list.
 */
export function aggregateShoppingList(
  mealPlan: WeeklyMealPlan,
  recipes: Recipe[],
  densityDatabase: DensityRecord[],
  unitMode: ConversionMode = 'metric',
  checkedItemKeys: Record<string, boolean> = {}
): ShoppingListItem[] {
  const recipeMap = new Map<string, Recipe>();
  recipes.forEach((r) => recipeMap.set(r.id, r));

  const intermediateGroups = new Map<string, IntermediateGroup>();

  // Stage 1 & 2: Iterate all planned meals and ingredients
  for (const dateKey of Object.keys(mealPlan.days || {})) {
    const day = mealPlan.days[dateKey];
    if (!day) continue;

    const slots = [day.breakfast, day.lunch, day.snacks, day.dinner];

    for (const slotItems of slots) {
      if (!Array.isArray(slotItems)) continue;

      for (const planned of slotItems) {
        const recipe = recipeMap.get(planned.recipeId);
        if (!recipe) continue;

        const baseServings = recipe.servings.amount > 0 ? recipe.servings.amount : 1;
        const scaleFactor = (planned.servingsOverride || baseServings) / baseServings;

        for (const ing of recipe.ingredients) {
          // If tap water, optionally skip or mark as staple
          const isStaple = isPantryStapleIngredient(ing.item);

          // Find density
          const density = findDensity(ing.item, ing.densityId, densityDatabase);

          // Determine canonical key
          let canonicalKey: string;
          if (density) {
            canonicalKey = `density_${density.id}`;
          } else {
            const stem = cleanIngredientStem(ing.item);
            canonicalKey = `stem_${stem}`;
          }

          // Compute scaled amount and normalize to base units
          const rawQuantity = (ing.quantity ?? 1) * scaleFactor;
          const unitDef = normalizeUnit(ing.unit);

          let itemGrams = 0;
          let itemMl = 0;
          let itemCount = 0;
          let hasGrams = false;
          let hasMl = false;
          let hasCount = false;

          if (unitDef) {
            if (unitDef.type === 'weight') {
              itemGrams = rawQuantity * unitDef.toBaseFactor;
              hasGrams = true;
            } else if (unitDef.type === 'dry_volume' || unitDef.type === 'liquid_volume') {
              const volumeMl = rawQuantity * unitDef.toBaseFactor;
              if (density) {
                // If density exists, dry volume converts cleanly to grams!
                if (unitDef.canonical === 'cup') {
                  itemGrams = rawQuantity * density.gramsPerCup;
                } else if (unitDef.canonical === 'tbsp') {
                  itemGrams = rawQuantity * (density.gramsPerTbsp || density.gramsPerCup / 16);
                } else if (unitDef.canonical === 'tsp') {
                  itemGrams = rawQuantity * ((density.gramsPerTbsp || density.gramsPerCup / 16) / 3);
                } else {
                  itemGrams = volumeMl * density.densityGPerMl;
                }
                hasGrams = true;
              } else {
                itemMl = volumeMl;
                hasMl = true;
              }
            } else if (unitDef.type === 'pinch') {
              itemGrams = rawQuantity * 0.5;
              hasGrams = true;
            } else {
              itemCount = rawQuantity;
              hasCount = true;
            }
          } else {
            // Unitless or count (e.g. "3 eggs")
            itemCount = rawQuantity;
            hasCount = true;
          }

          // Provenance text
          const formattedQty = Number(rawQuantity.toFixed(2)).toString();
          const origText = ing.unit ? `${formattedQty} ${ing.unit}` : `${formattedQty}`;
          const provenance: ShoppingListSourceRecipe = {
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            originalText: `${origText} (${recipe.title})`,
          };

          // Grouping
          let group = intermediateGroups.get(canonicalKey);
          if (!group) {
            // Capitalize display name
            const displayName = density?.name || cleanIngredientStem(ing.item) || ing.item;
            const capitalized = displayName.charAt(0).toUpperCase() + displayName.slice(1);

            group = {
              canonicalKey,
              displayName: capitalized,
              density,
              totalGrams: 0,
              totalMl: 0,
              rawCount: 0,
              hasGrams: false,
              hasMl: false,
              hasCount: false,
              sourceRecipes: [],
              isPantryStaple: isStaple,
            };
            intermediateGroups.set(canonicalKey, group);
          }

          if (hasGrams) {
            group.totalGrams += itemGrams;
            group.hasGrams = true;
          }
          if (hasMl) {
            group.totalMl += itemMl;
            group.hasMl = true;
          }
          if (hasCount) {
            group.rawCount += itemCount;
            group.hasCount = true;
          }

          group.sourceRecipes.push(provenance);
          if (isStaple) group.isPantryStaple = true;
        }
      }
    }
  }

  // Stage 3 & 4: Sensible Grocery Rounding & Aisle Categorization
  const result: ShoppingListItem[] = [];

  for (const [key, group] of intermediateGroups.entries()) {
    const rounding = applyMarketRounding(group, unitMode);
    const aisle = detectAisle(group.displayName, group.density?.id, group.isPantryStaple);

    result.push({
      id: `sli_${key}`,
      canonicalKey: key,
      displayName: group.displayName,
      aisle,
      totalGrams: group.hasGrams ? group.totalGrams : undefined,
      totalMl: group.hasMl ? group.totalMl : undefined,
      rawCount: group.hasCount ? group.rawCount : undefined,
      displayQuantity: rounding.displayQuantity,
      displayUnit: rounding.displayUnit,
      note: rounding.note,
      sourceRecipes: group.sourceRecipes,
      checked: Boolean(checkedItemKeys[key]),
      isPantryStaple: group.isPantryStaple,
    });
  }

  // Sort: Active items first, then by aisle, then alphabetically
  const aisleOrder: Record<GroceryAisle, number> = {
    Produce: 1,
    'Meat, Poultry & Seafood': 2,
    'Dairy, Cheese & Eggs': 3,
    'Bakery & Grains': 4,
    'Baking, Canned & Dry Goods': 5,
    'Pantry Staples & Spices': 6,
    Other: 7,
  };

  result.sort((a, b) => {
    // Keep pantry staples at the bottom if grouped together
    if (a.isPantryStaple !== b.isPantryStaple) {
      return a.isPantryStaple ? 1 : -1;
    }
    const aisleDiff = (aisleOrder[a.aisle] || 99) - (aisleOrder[b.aisle] || 99);
    if (aisleDiff !== 0) return aisleDiff;
    return a.displayName.localeCompare(b.displayName);
  });

  return result;
}

/**
 * Formats a shopping list into clean Markdown / Apple Reminders text for copying to clipboard.
 */
export function formatShoppingListForClipboard(
  items: ShoppingListItem[],
  customItems: CustomGroceryItem[] = [],
  includeCompleted: boolean = false
): string {
  const allItems = [
    ...items.map((i) => ({
      name: i.displayName,
      qty: i.displayUnit ? `${i.displayQuantity} ${i.displayUnit}` : i.displayQuantity,
      aisle: i.aisle,
      checked: i.checked,
      isPantry: i.isPantryStaple,
    })),
    ...customItems.map((c) => ({
      name: c.name,
      qty: '',
      aisle: c.aisle,
      checked: c.checked,
      isPantry: c.aisle === 'Pantry Staples & Spices',
    })),
  ];

  const filtered = includeCompleted ? allItems : allItems.filter((i) => !i.checked);

  if (filtered.length === 0) {
    return 'Shopping List is empty!';
  }

  // Group by aisle
  const byAisle = new Map<GroceryAisle, typeof filtered>();
  for (const item of filtered) {
    const list = byAisle.get(item.aisle) || [];
    list.push(item);
    byAisle.set(item.aisle, list);
  }

  let text = '🛒 MISE SHOPPING LIST\n\n';

  for (const [aisle, groupItems] of byAisle.entries()) {
    text += `## ${aisle}\n`;
    for (const item of groupItems) {
      const box = item.checked ? '[x]' : '[ ]';
      const qtyStr = item.qty ? `${item.qty} ` : '';
      text += `- ${box} ${qtyStr}${item.name}\n`;
    }
    text += '\n';
  }

  return text.trim();
}
