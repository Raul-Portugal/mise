import { describe, it, expect } from 'vitest';
import {
  getISOWeekId,
  parseISOWeekId,
  getDaysOfISOWeek,
  getPreviousWeekId,
  getNextWeekId,
  formatWeekRangeDisplay,
} from '../dateUtils';

describe('dateUtils', () => {
  it('correctly calculates ISO week ID', () => {
    // 2026-10-30 is in week 44 of 2026
    const date = new Date(2026, 9, 30); // October 30, 2026
    expect(getISOWeekId(date)).toBe('2026-W44');
  });

  it('parses ISO week ID', () => {
    const parsed = parseISOWeekId('2026-W44');
    expect(parsed.year).toBe(2026);
    expect(parsed.weekNumber).toBe(44);
  });

  it('computes 7 days of ISO week starting with Monday', () => {
    const days = getDaysOfISOWeek('2026-W44');
    expect(days.length).toBe(7);
    expect(days[0].dayName).toBe('Mon');
    expect(days[0].isoDate).toBe('2026-10-26');
    expect(days[6].dayName).toBe('Sun');
    expect(days[6].isoDate).toBe('2026-11-01');
  });

  it('navigates previous and next weeks', () => {
    expect(getPreviousWeekId('2026-W44')).toBe('2026-W43');
    expect(getNextWeekId('2026-W44')).toBe('2026-W45');
  });

  it('formats week range display', () => {
    const display = formatWeekRangeDisplay('2026-W44');
    expect(display).toBe('Oct 26 – Nov 1, 2026');
  });
});
