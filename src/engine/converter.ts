import { ParsedIngredient } from '../types/ingredient';
import { DensityRecord } from '../types/density';
import { ConvertedQuantity, ConversionMode } from '../types/conversion';
import { normalizeUnit } from './units';
import { applyCulinaryRounding } from './rounding';
import { snapImperialCups, formatFractionOrDecimal } from './fractions';

/**
 * Resolves ingredient density by densityId or fuzzy matching item name and aliases.
 */
export function findDensity(
  item: string,
  densityId: string | undefined,
  database: DensityRecord[]
): DensityRecord | null {
  if (densityId) {
    if (densityId === 'none') return null;
    const direct = database.find((d) => d.id === densityId);
    if (direct) return direct;
  }

  const cleaned = item.toLowerCase().trim();

  // Exact name or alias match
  for (const record of database) {
    if (record.name.toLowerCase() === cleaned) return record;
    for (const alias of record.aliases) {
      if (alias.toLowerCase() === cleaned) return record;
    }
  }

  // Word substring matching (e.g. "bread flour, sifted" matching "bread flour")
  for (const record of database) {
    for (const alias of record.aliases) {
      if (cleaned.includes(alias.toLowerCase())) {
        return record;
      }
    }
  }

  return null;
}

/**
 * Returns ranked candidate density matches for a given ingredient string.
 */
export function getCandidateDensities(
  item: string,
  database: DensityRecord[],
  limit: number = 8
): DensityRecord[] {
  if (!item || !item.trim()) return [];
  const cleaned = item.toLowerCase().trim();
  const candidates: Array<{ record: DensityRecord; score: number }> = [];
  const seenIds = new Set<string>();

  // 1. Exact name or alias match (highest relevance)
  for (const record of database) {
    if (seenIds.has(record.id)) continue;
    if (
      record.name.toLowerCase() === cleaned ||
      record.aliases.some((a) => a.toLowerCase() === cleaned)
    ) {
      candidates.push({ record, score: 100 });
      seenIds.add(record.id);
    }
  }

  // 2. Starts with query
  for (const record of database) {
    if (seenIds.has(record.id)) continue;
    if (
      record.name.toLowerCase().startsWith(cleaned) ||
      record.aliases.some((a) => a.toLowerCase().startsWith(cleaned))
    ) {
      candidates.push({ record, score: 80 });
      seenIds.add(record.id);
    }
  }

  // 3. Contains query as substring (e.g. "oat" matches "Oats (King Arthur Rolled)")
  for (const record of database) {
    if (seenIds.has(record.id)) continue;
    if (
      record.name.toLowerCase().includes(cleaned) ||
      record.aliases.some((a) => a.toLowerCase().includes(cleaned))
    ) {
      candidates.push({ record, score: 60 });
      seenIds.add(record.id);
    }
  }

  // 4. Query contains record name or alias
  for (const record of database) {
    if (seenIds.has(record.id)) continue;
    if (
      record.aliases.some((a) => cleaned.includes(a.toLowerCase())) ||
      cleaned.includes(record.name.toLowerCase())
    ) {
      candidates.push({ record, score: 40 });
      seenIds.add(record.id);
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit).map((c) => c.record);
}

/**
 * Converts and scales an ingredient based on the chosen ConversionMode, multiplier, and density DB.
 */
export function convertIngredient(
  ingredient: ParsedIngredient,
  mode: ConversionMode,
  yieldMultiplier: number = 1.0,
  densityDatabase: DensityRecord[],
  exactMode: boolean = false
): ConvertedQuantity {
  const rawQty = ingredient.quantity;
  if (rawQty === null || rawQty === undefined || isNaN(rawQty)) {
    return {
      displayQuantity: '',
      rawQuantity: 0,
      displayUnit: ingredient.unit || '',
    };
  }

  const scaledQty = rawQty * yieldMultiplier;
  const unitDef = normalizeUnit(ingredient.unit);
  const density = findDensity(ingredient.item, ingredient.densityId, densityDatabase);

  // 1. ORIGINAL MODE
  if (mode === 'original' || !unitDef) {
    return {
      displayQuantity: formatFractionOrDecimal(scaledQty),
      rawQuantity: scaledQty,
      displayUnit: ingredient.unit || '',
    };
  }

  // 2. METRIC MODE
  if (mode === 'metric') {
    // Case A: Ingredient is already in grams
    if (unitDef.canonical === 'g') {
      const rounded = applyCulinaryRounding(scaledQty, 'weight_g', exactMode);
      return {
        displayQuantity: rounded.display,
        rawQuantity: scaledQty,
        displayUnit: 'g',
        exactGrams: scaledQty,
      };
    }

    // Case B: Ingredient is in kg
    if (unitDef.canonical === 'kg') {
      const totalGrams = scaledQty * 1000;
      if (totalGrams < 1000) {
        const rounded = applyCulinaryRounding(totalGrams, 'weight_g', exactMode);
        return {
          displayQuantity: rounded.display,
          rawQuantity: totalGrams,
          displayUnit: 'g',
          exactGrams: totalGrams,
        };
      }
      return {
        displayQuantity: Number(scaledQty.toFixed(2)).toString(),
        rawQuantity: scaledQty,
        displayUnit: 'kg',
        exactGrams: totalGrams,
      };
    }

    // Case C: Ingredient is in volume (cups, tbsp, tsp, fl oz, pt, qt, gal)
    if (unitDef.type === 'dry_volume' || unitDef.type === 'liquid_volume') {
      const volumeMl = scaledQty * unitDef.toBaseFactor;

      // If we have density mapping, convert dry volume to weight (grams)
      if (density) {
        let grams: number;
        if (unitDef.canonical === 'cup') {
          grams = scaledQty * density.gramsPerCup;
        } else if (unitDef.canonical === 'tbsp') {
          grams = scaledQty * (density.gramsPerTbsp || density.gramsPerCup / 16);
        } else if (unitDef.canonical === 'tsp') {
          grams = scaledQty * ((density.gramsPerTbsp || density.gramsPerCup / 16) / 3);
        } else {
          grams = volumeMl * density.densityGPerMl;
        }

        const rounded = applyCulinaryRounding(grams, 'weight_g', exactMode);
        return {
          displayQuantity: rounded.display,
          rawQuantity: grams,
          displayUnit: 'g',
          exactGrams: grams,
          exactMl: volumeMl,
        };
      }

      // If no density, liquids convert to ml, dry volume keeps cups or standard ml
      if (unitDef.type === 'liquid_volume' || unitDef.canonical === 'cup') {
        const rounded = applyCulinaryRounding(volumeMl, 'volume_ml', exactMode);
        return {
          displayQuantity: rounded.display,
          rawQuantity: volumeMl,
          displayUnit: 'ml',
          exactMl: volumeMl,
        };
      }
    }

    // Case D: Imperial weight (oz, lb) -> grams
    if (unitDef.type === 'weight') {
      const grams = scaledQty * unitDef.toBaseFactor;
      const rounded = applyCulinaryRounding(grams, 'weight_g', exactMode);
      return {
        displayQuantity: rounded.display,
        rawQuantity: grams,
        displayUnit: 'g',
        exactGrams: grams,
      };
    }

    // Fallback: Pinch / Dash / Count
    return {
      displayQuantity: formatFractionOrDecimal(scaledQty),
      rawQuantity: scaledQty,
      displayUnit: ingredient.unit || '',
    };
  }

  // 3. IMPERIAL MODE
  if (mode === 'imperial') {
    // If unit is already cups, snap fractions
    if (unitDef.canonical === 'cup') {
      const snapped = snapImperialCups(scaledQty);
      return {
        displayQuantity: snapped.display,
        rawQuantity: scaledQty,
        displayUnit: 'cup' + (scaledQty > 1 && !snapped.display.includes(' ') ? 's' : ''),
        subValue: snapped.subValue,
      };
    }

    // If unit is grams and density is known, convert grams -> cups!
    if (unitDef.canonical === 'g' && density && density.gramsPerCup > 0) {
      const cups = scaledQty / density.gramsPerCup;

      if (cups >= 0.25) {
        const snapped = snapImperialCups(cups);
        return {
          displayQuantity: snapped.display,
          rawQuantity: cups,
          displayUnit: 'cup' + (cups > 1 && !snapped.display.includes(' ') ? 's' : ''),
          subValue: snapped.subValue,
          exactGrams: scaledQty,
        };
      } else {
        // Less than 1/4 cup -> convert to tablespoons
        const tbspWeight = density.gramsPerTbsp || density.gramsPerCup / 16;
        const tbsp = scaledQty / tbspWeight;
        const roundedTbsp = Math.round(tbsp * 2) / 2;
        return {
          displayQuantity: formatFractionOrDecimal(roundedTbsp),
          rawQuantity: tbsp,
          displayUnit: 'tbsp',
          exactGrams: scaledQty,
        };
      }
    }

    // If unit is grams without density, convert to ounces
    if (unitDef.canonical === 'g') {
      const oz = scaledQty / 28.3495;
      const rounded = applyCulinaryRounding(oz, 'imperial_oz', exactMode);
      return {
        displayQuantity: rounded.display,
        rawQuantity: oz,
        displayUnit: 'oz',
        exactGrams: scaledQty,
      };
    }

    // If unit is ml, convert to fl oz or cups
    if (unitDef.canonical === 'ml') {
      if (scaledQty >= 120) {
        const cups = scaledQty / 236.588;
        const snapped = snapImperialCups(cups);
        return {
          displayQuantity: snapped.display,
          rawQuantity: cups,
          displayUnit: 'cups',
          subValue: snapped.subValue,
        };
      }
      const flOz = scaledQty / 29.5735;
      const rounded = applyCulinaryRounding(flOz, 'imperial_oz', exactMode);
      return {
        displayQuantity: rounded.display,
        rawQuantity: flOz,
        displayUnit: 'fl oz',
      };
    }

    // Standard fallback
    return {
      displayQuantity: formatFractionOrDecimal(scaledQty),
      rawQuantity: scaledQty,
      displayUnit: ingredient.unit || '',
    };
  }

  return {
    displayQuantity: formatFractionOrDecimal(scaledQty),
    rawQuantity: scaledQty,
    displayUnit: ingredient.unit || '',
  };
}
