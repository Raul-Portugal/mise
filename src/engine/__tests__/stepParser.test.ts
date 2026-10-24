import { describe, it, expect } from 'vitest';
import { extractTimers, fahrenheitToCelsius, parseStepTokens } from '../stepParser';
import { INITIAL_DENSITIES } from '../../data/densityDatabase';
import { ParsedIngredient } from '../../types/ingredient';

describe('Step Parser & Timers', () => {
  it('extracts duration timers accurately', () => {
    const text = 'Combine water and yeast and let stand for 5 minutes until foamy.';
    const timers = extractTimers(text);
    expect(timers).toHaveLength(1);
    expect(timers[0].durationSeconds).toBe(300);
    expect(timers[0].label).toBe('5 minutes');
  });

  it('extracts range durations accurately', () => {
    const text = 'Simmer over low heat for 12-15 minutes until reduced.';
    const timers = extractTimers(text);
    expect(timers).toHaveLength(1);
    expect(timers[0].durationSeconds).toBe(720); // 12 mins lower bound for safety
  });

  it('converts oven notches correctly', () => {
    expect(fahrenheitToCelsius(350)).toBe(175);
    expect(fahrenheitToCelsius(400)).toBe(200);
    expect(fahrenheitToCelsius(450)).toBe(230);
  });

  it('injects converted ingredient amounts inline into instructions', () => {
    const ingredients: ParsedIngredient[] = [
      {
        id: '1',
        raw: '4 cups bread flour',
        quantity: 4,
        unit: 'cup',
        item: 'bread flour',
        densityId: 'flour_bread',
      },
    ];

    const instruction = 'Add the bread flour into the mixing bowl and knead for 10 minutes.';
    const tokens = parseStepTokens(instruction, ingredients, 'metric', 1.0, INITIAL_DENSITIES);

    // Expect an ingredient token with "bread flour (480 g)"
    const ingToken = tokens.find((t) => t.type === 'ingredient');
    expect(ingToken).toBeDefined();
    expect(ingToken?.value).toContain('bread flour');
    expect(ingToken?.value).toContain('480 g');

    // Expect a timer token for "10 minutes"
    const timerToken = tokens.find((t) => t.type === 'timer');
    expect(timerToken).toBeDefined();
    expect(timerToken?.timerData?.durationSeconds).toBe(600);
  });
});
