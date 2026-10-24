import { ParsedIngredient, IngredientToken } from '../types/ingredient';
import { DensityRecord } from '../types/density';
import { UNITS, normalizeUnit } from './units';
import { parseFraction } from './fractions';
import { findDensity } from './converter';

/**
 * Parses a raw line of text into structured ParsedIngredient.
 * Handles parenthetical weights like "(180g)" and prep notes like ", sifted".
 */
export function parseIngredientLine(
  rawLine: string,
  densityDatabase: DensityRecord[],
  idPrefix: string = 'ing'
): ParsedIngredient {
  const line = rawLine.trim();
  if (!line) {
    return {
      id: `${idPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      raw: '',
      quantity: null,
      unit: null,
      item: '',
    };
  }

  // 1. Check parenthetical notes or alternative weights e.g. "(180g)" or "(about 2 cups)"
  let workingLine = line;
  let extractedNote = '';

  const parentheticalMatch = workingLine.match(/\(([^)]+)\)/);
  if (parentheticalMatch) {
    extractedNote = parentheticalMatch[1];
    workingLine = workingLine.replace(parentheticalMatch[0], ' ').trim();
  }

  // 2. Check comma-separated prep notes e.g. "all-purpose flour, sifted"
  const commaIndex = workingLine.indexOf(',');
  if (commaIndex !== -1) {
    const notePart = workingLine.slice(commaIndex + 1).trim();
    extractedNote = extractedNote ? `${extractedNote}, ${notePart}` : notePart;
    workingLine = workingLine.slice(0, commaIndex).trim();
  }

  // 3. Extract quantity from start of line
  // Matches "1 1/2", "3/4", "1.5", "2", "½", etc.
  const qtyRegex = /^((?:\d+\s+)?\d+\s*\/\s*\d+|\d+(?:\.\d+)?|[½⅓⅔¼¾⅛⅜⅝⅞])\s*/;
  const qtyMatch = workingLine.match(qtyRegex);

  let quantity: number | null = null;
  if (qtyMatch) {
    quantity = parseFraction(qtyMatch[1]);
    workingLine = workingLine.slice(qtyMatch[0].length).trim();
  }

  // 4. Extract unit from remaining start of line
  let unit: string | null = null;
  const words = workingLine.split(/\s+/);
  if (words.length > 0) {
    const candidateUnit = words[0].toLowerCase().replace(/\.$/, '');
    const unitDef = normalizeUnit(candidateUnit);
    if (unitDef) {
      unit = unitDef.canonical;
      workingLine = words.slice(1).join(' ').trim();
    }
  }

  // 5. Remaining string is the item
  const item = workingLine.trim();

  // 6. Match against density database
  const density = findDensity(item, undefined, densityDatabase);

  return {
    id: `${idPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    raw: line,
    quantity,
    unit,
    item,
    densityId: density ? density.id : undefined,
    notes: extractedNote || undefined,
  };
}

/**
 * Real-time tokenizer for the live "Paste & Parse" editor.
 * Returns an array of tokens with highlight types for immediate visual chips.
 */
export function tokenizeIngredientLine(line: string, densityDatabase: DensityRecord[]): IngredientToken[] {
  if (!line.trim()) return [];

  const parsed = parseIngredientLine(line, densityDatabase);
  const tokens: IngredientToken[] = [];

  if (parsed.quantity !== null) {
    tokens.push({
      type: 'quantity',
      value: parsed.quantity.toString(),
    });
  }

  if (parsed.unit) {
    tokens.push({
      type: 'unit',
      value: parsed.unit,
    });
  }

  if (parsed.item) {
    tokens.push({
      type: 'item',
      value: parsed.item,
      densityMatched: !!parsed.densityId,
    });
  }

  if (parsed.notes) {
    tokens.push({
      type: 'notes',
      value: parsed.notes,
    });
  }

  return tokens;
}
