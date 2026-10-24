import { Recipe, Step, RecipeTimes } from '../types/recipe';
import { ParsedIngredient } from '../types/ingredient';
import { DensityRecord } from '../types/density';
import { parseIngredientLine } from './ingredientParser';
import { extractTimers } from './stepParser';

/**
 * Parses Cooklang syntax:
 * Ingredients: @flour{120%g} or @salt or @milk{1%cup}
 * Cookware: #bowl or #pan{large}
 * Timers: ~{5%minutes} or ~timer{10%mins}
 */
export function parseCooklang(
  content: string,
  densityDatabase: DensityRecord[]
): Partial<Recipe> {
  const lines = content.split('\n');
  const ingredients: ParsedIngredient[] = [];
  const steps: Step[] = [];
  let title = 'Imported Cooklang Recipe';
  let stepCount = 1;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check metadata like >> title: My Recipe
    if (line.startsWith('>>')) {
      const meta = line.slice(2).trim();
      const colon = meta.indexOf(':');
      if (colon !== -1) {
        const key = meta.slice(0, colon).trim().toLowerCase();
        const val = meta.slice(colon + 1).trim();
        if (key === 'title') title = val;
      }
      continue;
    }

    // Parse Cooklang tokens in line
    // @ingredient{qty%unit} or @ingredient
    const ingRegex = /@([a-zA-Z0-9\s_-]+)(?:\{([^%}]*)(?:%([^}]*))?\})?/g;
    let cleanStepText = line;
    let match;

    while ((match = ingRegex.exec(line)) !== null) {
      const name = match[1].trim();
      const qtyStr = match[2]?.trim() || '';
      const unitStr = match[3]?.trim() || '';

      const lineRepresentation = qtyStr ? `${qtyStr} ${unitStr} ${name}`.trim() : name;
      const parsed = parseIngredientLine(lineRepresentation, densityDatabase);
      ingredients.push(parsed);

      cleanStepText = cleanStepText.replace(match[0], name);
    }

    // Clean cookware #pan{size} -> pan
    cleanStepText = cleanStepText.replace(/#([a-zA-Z0-9\s_-]+)(?:\{[^}]*\})?/g, '$1');

    // Clean timers ~{5%minutes} -> 5 minutes
    cleanStepText = cleanStepText.replace(/~([a-zA-Z0-9\s_-]*)\{([^%}]*)(?:%([^}]*))?\}/g, (_m, _label, qty, unit) => {
      return `${qty} ${unit}`.trim();
    });

    const timers = extractTimers(cleanStepText);

    steps.push({
      stepNumber: stepCount++,
      instruction: cleanStepText,
      timers: timers.length > 0 ? timers : undefined,
    });
  }

  return {
    title,
    ingredients,
    steps,
  };
}

/**
 * Extracts and normalizes Schema.org Recipe JSON-LD.
 */
export function parseSchemaOrgRecipe(
  jsonObj: any,
  densityDatabase: DensityRecord[]
): Partial<Recipe> | null {
  // Check if root is Recipe or graph contains Recipe
  let recipeData = jsonObj;
  if (jsonObj['@graph'] && Array.isArray(jsonObj['@graph'])) {
    recipeData = jsonObj['@graph'].find(
      (item: any) => item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
    );
  }

  if (!recipeData || (recipeData['@type'] !== 'Recipe' && !recipeData.recipeIngredient)) {
    return null;
  }

  const title = recipeData.name || 'Imported Recipe';
  const subtitle = recipeData.description || '';

  // Servings / yield
  let yieldAmount = 4;
  let yieldUnit = 'servings';
  if (recipeData.recipeYield) {
    const yieldStr = Array.isArray(recipeData.recipeYield)
      ? recipeData.recipeYield[0]
      : String(recipeData.recipeYield);
    const numMatch = yieldStr.match(/\d+/);
    if (numMatch) {
      yieldAmount = parseInt(numMatch[0], 10);
      const remainingUnit = yieldStr.replace(/\d+/, '').trim();
      if (remainingUnit) yieldUnit = remainingUnit;
    }
  }

  // Parse ISO 8601 durations like "PT30M"
  const parseIsoDuration = (d?: string): number | undefined => {
    if (!d || typeof d !== 'string') return undefined;
    const match = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return undefined;
    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const mins = match[2] ? parseInt(match[2], 10) : 0;
    return hours * 60 + mins;
  };

  const times: RecipeTimes = {
    prepMinutes: parseIsoDuration(recipeData.prepTime),
    cookMinutes: parseIsoDuration(recipeData.cookTime),
  };

  // Parse ingredients
  const ingredients: ParsedIngredient[] = [];
  const rawIngredients = recipeData.recipeIngredient || [];
  for (const raw of rawIngredients) {
    if (typeof raw === 'string') {
      ingredients.push(parseIngredientLine(raw, densityDatabase));
    }
  }

  // Parse instructions
  const steps: Step[] = [];
  const rawInstructions = recipeData.recipeInstructions || [];
  let stepIndex = 1;

  const addStepText = (text: string) => {
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) return;
    const timers = extractTimers(cleanText);
    steps.push({
      stepNumber: stepIndex++,
      instruction: cleanText,
      timers: timers.length > 0 ? timers : undefined,
    });
  };

  if (typeof rawInstructions === 'string') {
    const splitSteps = rawInstructions.split(/\n+/);
    for (const s of splitSteps) addStepText(s);
  } else if (Array.isArray(rawInstructions)) {
    for (const item of rawInstructions) {
      if (typeof item === 'string') {
        addStepText(item);
      } else if (item.text) {
        addStepText(item.text);
      } else if (item.itemListElement && Array.isArray(item.itemListElement)) {
        for (const subItem of item.itemListElement) {
          if (subItem.text) addStepText(subItem.text);
        }
      }
    }
  }

  return {
    title,
    subtitle,
    servings: { amount: yieldAmount, unit: yieldUnit },
    times,
    tags: Array.isArray(recipeData.recipeCategory)
      ? recipeData.recipeCategory
      : recipeData.recipeCategory
      ? [recipeData.recipeCategory]
      : ['Imported'],
    ingredients,
    steps,
  };
}

/**
 * Exports a Recipe to clean Markdown with Cooklang or standard formatting.
 */
export function exportRecipeToMarkdown(recipe: Recipe): string {
  let md = `# ${recipe.title}\n\n`;
  if (recipe.subtitle) md += `*${recipe.subtitle}*\n\n`;

  md += `**Yield**: ${recipe.servings.amount} ${recipe.servings.unit}\n`;
  if (recipe.times.prepMinutes) md += `**Prep Time**: ${recipe.times.prepMinutes} mins\n`;
  if (recipe.times.cookMinutes) md += `**Cook Time**: ${recipe.times.cookMinutes} mins\n`;
  if (recipe.tags.length > 0) md += `**Tags**: ${recipe.tags.join(', ')}\n`;
  md += `\n---\n\n### Ingredients\n\n`;

  for (const ing of recipe.ingredients) {
    const qty = ing.quantity !== null ? `${ing.quantity} ` : '';
    const unit = ing.unit ? `${ing.unit} ` : '';
    const notes = ing.notes ? ` (${ing.notes})` : '';
    md += `- ${qty}${unit}${ing.item}${notes}\n`;
  }

  md += `\n### Instructions\n\n`;
  for (const step of recipe.steps) {
    md += `${step.stepNumber}. ${step.instruction}\n`;
  }

  if (recipe.notes) {
    md += `\n### Notes\n\n${recipe.notes}\n`;
  }

  return md;
}
