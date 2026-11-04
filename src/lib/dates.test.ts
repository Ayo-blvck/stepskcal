import { describe, expect, it } from 'vitest';
import { shiftDateKey } from './dates';

describe('shiftDateKey', () => {
  it('moves across month and year boundaries', () => {
    expect(shiftDateKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDateKey('2027-01-01', -1)).toBe('2026-12-31');
    expect(shiftDateKey('2026-11-04', 1)).toBe('2026-11-05');
  });
});