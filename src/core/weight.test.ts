import { describe, expect, it } from 'vitest';
import {
  dateFromDayNumber,
  dayNumber,
  plannedWeightOn,
  projectGoalDate,
  validateWeightEntry,
  weeklyRateKg,
  weightAxis,
  weightJumpUnlikely,
  weightStats,
} from './index';

describe('day numbers', () => {
  it('round-trips dates', () => {
    expect(dateFromDayNumber(dayNumber('2027-05-07'))).toBe('2027-05-07');
    expect(dayNumber('2027-05-07') - dayNumber('2026-11-03')).toBe(185);
  });
});

describe('weekly rate', () => {
  const entries = [
    { date: '2026-11-03', kg: 100 },
    { date: '2026-11-10', kg: 99 },
    { date: '2026-11-17', kg: 98 },
  ];
  it('finds one kg per week', () => {
    expect(weeklyRateKg(entries, '2026-11-17')).toBeCloseTo(-1, 5);
  });
  it('needs at least a week of data', () => {
    expect(weeklyRateKg(entries.slice(0, 1), '2026-11-17')).toBeNull();
    const close = [
      { date: '2026-11-14', kg: 100 },
      { date: '2026-11-17', kg: 99 },
    ];
    expect(weeklyRateKg(close, '2026-11-17')).toBeNull();
  });
  it('ignores entries older than the window', () => {
    const old = [{ date: '2026-08-01', kg: 120 }, ...entries];
    expect(weeklyRateKg(old, '2026-11-17')).toBeCloseTo(-1, 5);
  });
});

describe('projection', () => {
  it('projects the goal date from the pace', () => {
    expect(projectGoalDate(98, 80, -1, '2026-11-17')).toBe('2027-03-23');
  });
  it('gives no date when weight is flat, rising or already at goal', () => {
    expect(projectGoalDate(98, 80, 0, '2026-11-17')).toBeNull();
    expect(projectGoalDate(98, 80, 0.4, '2026-11-17')).toBeNull();
    expect(projectGoalDate(79, 80, -1, '2026-11-17')).toBeNull();
    expect(projectGoalDate(98, 80, null, '2026-11-17')).toBeNull();
  });
});

describe('plan line', () => {
  const start = { date: '2026-11-03', kg: 100 };
  const goal = { date: '2027-05-07', kg: 80 };
  it('interpolates between start and goal', () => {
    expect(plannedWeightOn(start, goal, '2027-02-03')).toBeCloseTo(90.05, 1);
  });
  it('clamps outside the range', () => {
    expect(plannedWeightOn(start, goal, '2026-10-01')).toBe(100);
    expect(plannedWeightOn(start, goal, '2028-01-01')).toBe(80);
  });
});

describe('weight stats', () => {
  const entries = [
    { date: '2026-11-17', kg: 98 },
    { date: '2026-11-03', kg: 100 },
    { date: '2026-11-10', kg: 99 },
  ];
  it('summarises progress, ignoring input order', () => {
    const s = weightStats(entries, { goalKg: 80, targetDate: '2027-05-07', today: '2026-11-17' })!;
    expect(s.startKg).toBe(100);
    expect(s.currentKg).toBe(98);
    expect(s.changeKg).toBe(-2);
    expect(s.toGoalKg).toBe(18);
    expect(s.weeklyRateKg).toBeCloseTo(-1, 5);
    expect(s.projectedGoalDate).toBe('2027-03-23');
    expect(s.plannedKgToday).toBeCloseTo(98.49, 1);
    expect(s.vsPlanKg).toBeCloseTo(-0.49, 1);
  });
  it('returns null with no entries and skips the plan with no target date', () => {
    expect(weightStats([], { goalKg: 80, targetDate: null, today: '2026-11-17' })).toBeNull();
    const s = weightStats(entries, { goalKg: 80, targetDate: null, today: '2026-11-17' })!;
    expect(s.plannedKgToday).toBeNull();
  });
});

describe('implausible jumps', () => {
  const prev = { date: '2026-11-03', kg: 100 };
  it('flags a big change in a day and allows normal ones', () => {
    expect(weightJumpUnlikely(prev, { date: '2026-11-04', kg: 96 })).toBe(true);
    expect(weightJumpUnlikely(prev, { date: '2026-11-04', kg: 99 })).toBe(false);
  });
  it('allows more change over a longer gap', () => {
    expect(weightJumpUnlikely(prev, { date: '2026-12-01', kg: 93 })).toBe(false);
    expect(weightJumpUnlikely(prev, { date: '2026-12-01', kg: 91 })).toBe(true);
  });
  it('never flags the first entry', () => {
    expect(weightJumpUnlikely(null, { date: '2026-11-04', kg: 50 })).toBe(false);
  });
});

describe('weight entry validation', () => {
  const today = new Date(2026, 10, 4);
  it('accepts and rounds a normal entry', () => {
    const r = validateWeightEntry({ date: '2026-11-04', kg: '98,46' }, today);
    expect(r.ok && r.value).toEqual({ date: '2026-11-04', kg: 98.5 });
  });
  it('rejects future dates, bad dates and silly weights', () => {
    expect(validateWeightEntry({ date: '2026-11-05', kg: '98' }, today).ok).toBe(false);
    expect(validateWeightEntry({ date: '2026-02-30', kg: '98' }, today).ok).toBe(false);
    expect(validateWeightEntry({ date: '2026-11-04', kg: '29' }, today).ok).toBe(false);
    expect(validateWeightEntry({ date: '2026-11-04', kg: 'abc' }, today).ok).toBe(false);
  });
});

describe('chart axis', () => {
  it('covers all values with padding', () => {
    const a = weightAxis([98, 100, 80, 77]);
    expect(a.min).toBeLessThanOrEqual(77);
    expect(a.max).toBeGreaterThanOrEqual(100);
  });
  it('keeps a minimum height for a single value', () => {
    const a = weightAxis([90]);
    expect(a.max - a.min).toBeGreaterThanOrEqual(4);
  });
});