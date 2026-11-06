import { describe, expect, it } from 'vitest';
import { formatDayHeading, formatShort, shiftDateKey } from './dates';

describe('shiftDateKey', () => {
  it('moves across month and year boundaries', () => {
    expect(shiftDateKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDateKey('2027-01-01', -1)).toBe('2026-12-31');
    expect(shiftDateKey('2026-11-04', 1)).toBe('2026-11-05');
  });
});

describe('formatShort', () => {
  it('formats with and without the year', () => {
    expect(formatShort('2027-05-07')).toBe('7 May');
    expect(formatShort('2027-05-07', true)).toBe('7 May 2027');
  });
});

describe('formatDayHeading', () => {
  it('writes the weekday and date', () => {
    expect(formatDayHeading('2026-11-04')).toBe('Wednesday, 4 Nov');
    expect(formatDayHeading('2027-05-07')).toBe('Friday, 7 May');
  });
});