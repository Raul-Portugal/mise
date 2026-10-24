import { describe, it, expect } from 'vitest';
import { parseFraction, snapImperialCups, formatFractionOrDecimal } from '../fractions';

describe('Fraction Parsing & Snapping', () => {
  it('parses standard fractions and decimals', () => {
    expect(parseFraction('1 1/2')).toBe(1.5);
    expect(parseFraction('3/4')).toBe(0.75);
    expect(parseFraction('2.25')).toBe(2.25);
    expect(parseFraction('½')).toBe(0.5);
    expect(parseFraction('1 ½')).toBe(1.5);
    expect(parseFraction('¾')).toBe(0.75);
  });

  it('snaps decimal cups to clean kitchen fractions', () => {
    expect(snapImperialCups(1.5).display).toBe('1 ½');
    expect(snapImperialCups(0.25).display).toBe('¼');
    expect(snapImperialCups(0.333).display).toBe('⅓');
    expect(snapImperialCups(0.75).display).toBe('¾');
  });

  it('snaps fractions with tablespoon remainders (0.625 cups -> 1/2 cup + 2 tbsp)', () => {
    const res = snapImperialCups(0.625);
    expect(res.display).toBe('½');
    expect(res.subValue).toBe('+ 2 tbsp');
  });

  it('formats decimals nicely', () => {
    expect(formatFractionOrDecimal(2.5)).toBe('2 ½');
    expect(formatFractionOrDecimal(0.75)).toBe('¾');
    expect(formatFractionOrDecimal(3)).toBe('3');
  });
});
