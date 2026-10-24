/**
 * Culinary Rounding Engine
 * Prevents impractical floating points (e.g. 118.29g or 236.59ml) while maintaining baking precision.
 */
export function applyCulinaryRounding(
  value: number,
  unitType: 'weight_g' | 'volume_ml' | 'imperial_oz' | 'spoons' | 'count',
  exactMode: boolean = false
): { roundedValue: number; display: string } {
  if (value <= 0) return { roundedValue: 0, display: '0' };
  if (exactMode) {
    const rawFixed = Number(value.toFixed(2));
    return { roundedValue: rawFixed, display: rawFixed.toString() };
  }

  if (unitType === 'weight_g') {
    if (value < 10) {
      // High-precision: round to nearest 0.1g
      const rounded = Math.round(value * 10) / 10;
      return { roundedValue: rounded, display: rounded.toString() };
    }
    if (value <= 100) {
      // Standard solids: round to nearest 1g
      const rounded = Math.round(value);
      return { roundedValue: rounded, display: rounded.toString() };
    }
    // Bulk solids (> 100g): round to nearest 5g
    const rounded = Math.round(value / 5) * 5;
    return { roundedValue: rounded, display: rounded.toString() };
  }

  if (unitType === 'volume_ml') {
    if (value < 15) {
      // Spoons equivalent: round to nearest 0.5ml or 1ml
      const rounded = Math.round(value * 2) / 2;
      return { roundedValue: rounded, display: rounded.toString() };
    }
    if (value <= 100) {
      // Standard liquids: round to nearest 5ml
      const rounded = Math.round(value / 5) * 5;
      return { roundedValue: rounded, display: rounded.toString() };
    }
    // Bulk liquids (> 100ml): round to nearest 5ml or 10ml
    const rounded = Math.round(value / 5) * 5;
    return { roundedValue: rounded, display: rounded.toString() };
  }

  if (unitType === 'imperial_oz') {
    if (value < 1) {
      const rounded = Math.round(value * 10) / 10;
      return { roundedValue: rounded, display: rounded.toString() };
    }
    // Round to 1 decimal place or quarter ounce
    const rounded = Math.round(value * 4) / 4;
    return { roundedValue: rounded, display: rounded.toString() };
  }

  // Count / general items: round to 2 decimal places if fractional, else integer
  if (Number.isInteger(value)) {
    return { roundedValue: value, display: value.toString() };
  }
  const rounded = Math.round(value * 10) / 10;
  return { roundedValue: rounded, display: rounded.toString() };
}
