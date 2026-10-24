const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

export function parseFraction(str: string): number | null {
  if (!str) return null;
  const trimmed = str.trim();

  // Check unicode fraction direct match
  if (UNICODE_FRACTIONS[trimmed] !== undefined) {
    return UNICODE_FRACTIONS[trimmed];
  }

  // Check for combined unicode like "1 ½"
  for (const [char, val] of Object.entries(UNICODE_FRACTIONS)) {
    if (trimmed.includes(char)) {
      const wholePart = trimmed.replace(char, '').trim();
      const wholeNum = wholePart ? parseFloat(wholePart) : 0;
      if (!isNaN(wholeNum)) {
        return wholeNum + val;
      }
    }
  }

  // Check standard textual fraction "1 1/2" or "3/4"
  const fractionMatch = trimmed.match(/^(\d+)?\s*(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    const whole = fractionMatch[1] ? parseInt(fractionMatch[1], 10) : 0;
    const num = parseInt(fractionMatch[2], 10);
    const denom = parseInt(fractionMatch[3], 10);
    if (denom !== 0) {
      return whole + num / denom;
    }
  }

  // Check decimal or integer
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

export interface SnappedImperial {
  display: string;
  subValue?: string;
}

/**
 * Snaps decimal cups or spoons into recognizable kitchen fractions (1/8, 1/4, 1/3, 1/2, 2/3, 3/4)
 * with remainders in tablespoons if necessary (e.g. 0.625 cups -> "½ cup" with subValue "+ 2 tbsp").
 */
export function snapImperialCups(totalCups: number): SnappedImperial {
  if (totalCups <= 0) return { display: '0' };

  const whole = Math.floor(totalCups);
  const frac = totalCups - whole;

  // Fraction dictionary (val -> display)
  const fractions: Array<[number, string]> = [
    [0, ''],
    [0.125, '⅛'],
    [0.25, '¼'],
    [0.333, '⅓'],
    [0.5, '½'],
    [0.667, '⅔'],
    [0.75, '¾'],
    [1.0, ''],
  ];

  // If very close to an exact kitchen fraction
  for (const [val, label] of fractions) {
    if (Math.abs(frac - val) < 0.04) {
      if (val === 1.0) {
        return { display: `${whole + 1}` };
      }
      if (val === 0) {
        return { display: whole > 0 ? `${whole}` : '0' };
      }
      return { display: whole > 0 ? `${whole} ${label}` : label };
    }
  }

  // Check if remaining fraction can be represented cleanly as tablespoons (1 cup = 16 tbsp)
  // e.g. 0.625 cups = 1/2 cup (0.5) + 2 tbsp (0.125)
  const halfOrQuarterBreakpoints = [0.75, 0.5, 0.25];
  for (const bp of halfOrQuarterBreakpoints) {
    if (frac > bp + 0.04) {
      const remainderCups = frac - bp;
      const remainderTbsp = Math.round(remainderCups * 16);
      if (remainderTbsp >= 1 && remainderTbsp <= 3) {
        const bpLabel = bp === 0.75 ? '¾' : bp === 0.5 ? '½' : '¼';
        const baseDisplay = whole > 0 ? `${whole} ${bpLabel}` : bpLabel;
        return {
          display: baseDisplay,
          subValue: `+ ${remainderTbsp} tbsp`,
        };
      }
    }
  }

  // Fallback to 2 decimal places or 1 decimal place
  const rounded = Math.round(totalCups * 10) / 10;
  return { display: `${rounded}` };
}

/**
 * Formats a generic decimal number to kitchen fraction or rounded decimal
 */
export function formatFractionOrDecimal(val: number): string {
  if (val <= 0) return '0';
  const whole = Math.floor(val);
  const frac = val - whole;

  const fractions: Array<[number, string]> = [
    [0, ''],
    [0.125, '⅛'],
    [0.25, '¼'],
    [0.333, '⅓'],
    [0.5, '½'],
    [0.667, '⅔'],
    [0.75, '¾'],
  ];

  for (const [v, label] of fractions) {
    if (Math.abs(frac - v) < 0.035) {
      if (v === 0) return `${whole}`;
      return whole > 0 ? `${whole} ${label}` : label;
    }
  }

  if (frac > 0.96) {
    return `${whole + 1}`;
  }

  // Return clean decimal
  return Number(val.toFixed(2)).toString();
}
