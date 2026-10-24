import { describe, it, expect } from 'vitest';
import { formatTime } from '../formatters';

describe('formatTime', () => {
  it('formats zero seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats seconds under a minute', () => {
    expect(formatTime(45)).toBe('00:45');
    expect(formatTime(9)).toBe('00:09');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(125)).toBe('02:05');
    expect(formatTime(600)).toBe('10:00');
    expect(formatTime(599)).toBe('09:59');
  });

  it('formats durations of one hour or more with hour prefix', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3665)).toBe('1:01:05');
    expect(formatTime(7200)).toBe('2:00:00');
  });

  it('handles negative or decimal seconds gracefully', () => {
    expect(formatTime(-10)).toBe('00:00');
    expect(formatTime(59.9)).toBe('00:59');
  });
});
