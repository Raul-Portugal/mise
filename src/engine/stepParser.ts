import { ParsedIngredient } from '../types/ingredient';
import { TimerInfo, TemperatureInfo } from '../types/recipe';
import { ConversionMode } from '../types/conversion';
import { DensityRecord } from '../types/density';
import { convertIngredient } from './converter';

export interface ParsedStepToken {
  type: 'text' | 'timer' | 'temperature' | 'pan_size' | 'ingredient';
  value: string;
  originalText: string;
  timerData?: TimerInfo;
  temperatureData?: TemperatureInfo;
  ingredientData?: {
    id: string;
    item: string;
    displayQuantity: string;
    displayUnit: string;
  };
}

/**
 * Parses time expressions such as:
 * "5 minutes", "10-12 mins", "45 seconds", "1 to 2 hours", "1.5 hours"
 */
export function extractTimers(text: string): TimerInfo[] {
  const timers: TimerInfo[] = [];
  const regex = /(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)|(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)/gi;

  let match;
  while ((match = regex.exec(text)) !== null) {
    let durationSeconds = 0;
    let label = match[0];

    if (match[4]) {
      // Single duration like "5 minutes"
      const val = parseFloat(match[4]);
      const unit = match[5].toLowerCase();
      if (unit.startsWith('h')) durationSeconds = Math.round(val * 3600);
      else if (unit.startsWith('m')) durationSeconds = Math.round(val * 60);
      else durationSeconds = Math.round(val);
    } else if (match[1] && match[2]) {
      // Range duration like "10-12 mins" -> pick lower or average; lower is best for kitchen vigilance!
      const minVal = parseFloat(match[1]);
      const unit = match[3].toLowerCase();
      if (unit.startsWith('h')) durationSeconds = Math.round(minVal * 3600);
      else if (unit.startsWith('m')) durationSeconds = Math.round(minVal * 60);
      else durationSeconds = Math.round(minVal);
    }

    if (durationSeconds > 0) {
      timers.push({
        label: label.trim(),
        durationSeconds,
      });
    }
  }

  return timers;
}

/**
 * Standard culinary oven notch converter:
 * 350°F is traditionally notched to 175°C or 180°C in European recipes.
 */
export function fahrenheitToCelsius(f: number): number {
  if (Math.abs(f - 350) < 5) return 175; // or 180
  if (Math.abs(f - 400) < 5) return 200;
  if (Math.abs(f - 425) < 5) return 220;
  if (Math.abs(f - 450) < 5) return 230;
  if (Math.abs(f - 375) < 5) return 190;
  if (Math.abs(f - 325) < 5) return 165;
  if (Math.abs(f - 300) < 5) return 150;
  return Math.round(((f - 32) * 5) / 9);
}

export function celsiusToFahrenheit(c: number): number {
  if (Math.abs(c - 175) < 3 || Math.abs(c - 180) < 3) return 350;
  if (Math.abs(c - 200) < 3) return 400;
  if (Math.abs(c - 220) < 3) return 425;
  if (Math.abs(c - 230) < 3) return 450;
  return Math.round((c * 9) / 5 + 32);
}

/**
 * Injects converted ingredient amounts directly into step instruction text
 * and extracts interactive tokens (timers, temperatures).
 */
export function parseStepTokens(
  instruction: string,
  ingredients: ParsedIngredient[],
  mode: ConversionMode,
  yieldMultiplier: number,
  densityDatabase: DensityRecord[],
  exactMode: boolean = false
): ParsedStepToken[] {
  const tokens: ParsedStepToken[] = [];

  // Match:
  // 1. Durations: 5 minutes, 10-12 mins, etc.
  // 2. Temperatures: 350°F, 350 deg F, 180°C, etc.
  // 3. Pan sizes: 9x13-inch, 8-inch, 9x9 inch, etc.
  // 4. Ingredient names

  // Pre-calculate converted ingredient quantities
  const convertedMap = new Map<string, { displayQuantity: string; displayUnit: string; item: string }>();
  for (const ing of ingredients) {
    const converted = convertIngredient(ing, mode, yieldMultiplier, densityDatabase, exactMode);
    convertedMap.set(ing.item.toLowerCase(), {
      displayQuantity: converted.displayQuantity,
      displayUnit: converted.displayUnit,
      item: ing.item,
    });
  }

  // Combined master pattern
  const timerRegex = /(\b\d+(?:\.\d+)?\s*(?:-|to|–)\s*\d+(?:\.\d+)?\s*(?:hours?|hrs?|minutes?|mins?|seconds?|secs?)\b|\b\d+(?:\.\d+)?\s*(?:hours?|hrs?|minutes?|mins?|seconds?|secs?)\b)/i;
  const tempRegex = /(\b\d{2,3})\s*(?:°|deg|degrees)?\s*([FC])\b/i;
  const panRegex = /(\b\d+(?:\.\d+)?\s*(?:x|by)\s*\d+(?:\.\d+)?\s*(?:-| )?(?:inch|in\.|in|cm)\b)/i;

  let remaining = instruction;

  while (remaining.length > 0) {
    let earliestMatch: {
      type: 'timer' | 'temperature' | 'pan_size' | 'ingredient';
      index: number;
      length: number;
      raw: string;
      meta?: any;
    } | null = null;

    // Check timer match
    const tMatch = remaining.match(timerRegex);
    if (tMatch && tMatch.index !== undefined) {
      const timers = extractTimers(tMatch[0]);
      if (timers.length > 0) {
        earliestMatch = {
          type: 'timer',
          index: tMatch.index,
          length: tMatch[0].length,
          raw: tMatch[0],
          meta: timers[0],
        };
      }
    }

    // Check temperature match
    const tempMatch = remaining.match(tempRegex);
    if (tempMatch && tempMatch.index !== undefined) {
      if (!earliestMatch || tempMatch.index < earliestMatch.index) {
        const val = parseInt(tempMatch[1], 10);
        const unit = tempMatch[2].toUpperCase() as 'F' | 'C';
        earliestMatch = {
          type: 'temperature',
          index: tempMatch.index,
          length: tempMatch[0].length,
          raw: tempMatch[0],
          meta: { value: val, unit },
        };
      }
    }

    // Check pan size match
    const pMatch = remaining.match(panRegex);
    if (pMatch && pMatch.index !== undefined) {
      if (!earliestMatch || pMatch.index < earliestMatch.index) {
        earliestMatch = {
          type: 'pan_size',
          index: pMatch.index,
          length: pMatch[0].length,
          raw: pMatch[0],
        };
      }
    }

    // Check ingredient matches
    for (const [itemName, data] of convertedMap.entries()) {
      if (itemName.length < 3) continue; // Skip very short words like "egg" or "oil" unless exact boundary
      const ingRegex = new RegExp(`\\b${itemName}\\b`, 'i');
      const iMatch = remaining.match(ingRegex);
      if (iMatch && iMatch.index !== undefined) {
        if (!earliestMatch || iMatch.index < earliestMatch.index) {
          earliestMatch = {
            type: 'ingredient',
            index: iMatch.index,
            length: iMatch[0].length,
            raw: iMatch[0],
            meta: data,
          };
        }
      }
    }

    if (!earliestMatch) {
      tokens.push({
        type: 'text',
        value: remaining,
        originalText: remaining,
      });
      break;
    }

    // Add preceding text if any
    if (earliestMatch.index > 0) {
      tokens.push({
        type: 'text',
        value: remaining.slice(0, earliestMatch.index),
        originalText: remaining.slice(0, earliestMatch.index),
      });
    }

    // Add match token
    if (earliestMatch.type === 'timer') {
      tokens.push({
        type: 'timer',
        value: earliestMatch.raw,
        originalText: earliestMatch.raw,
        timerData: earliestMatch.meta,
      });
    } else if (earliestMatch.type === 'temperature') {
      const tempMeta: TemperatureInfo = earliestMatch.meta;
      const convertedVal =
        tempMeta.unit === 'F' ? fahrenheitToCelsius(tempMeta.value) : celsiusToFahrenheit(tempMeta.value);
      const convertedUnit = tempMeta.unit === 'F' ? '°C' : '°F';
      tokens.push({
        type: 'temperature',
        value: `${tempMeta.value}°${tempMeta.unit} (${convertedVal}${convertedUnit})`,
        originalText: earliestMatch.raw,
        temperatureData: tempMeta,
      });
    } else if (earliestMatch.type === 'ingredient') {
      const data = earliestMatch.meta;
      const qtyStr = data.displayQuantity ? ` (${data.displayQuantity} ${data.displayUnit})`.replace(/\s+/g, ' ') : '';
      tokens.push({
        type: 'ingredient',
        value: `${earliestMatch.raw}${qtyStr}`,
        originalText: earliestMatch.raw,
        ingredientData: data,
      });
    } else {
      tokens.push({
        type: 'pan_size',
        value: earliestMatch.raw,
        originalText: earliestMatch.raw,
      });
    }

    remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
  }

  return tokens;
}
