import { describe, expect, it } from 'vitest';
import {
  DEFAULTS,
  activityBonusKcal,
  kcalPerStep,
  planDay,
  suggestActivityKcal,
  suggestStepsCounted,
  validateActivityEntry,
} from './index';

describe('activity estimates', () => {
  it('uses net METs', () => {
    expect(suggestActivityKcal(7, 100, 90)).toBe(900);
    expect(suggestActivityKcal(9.5, 100, 60)).toBe(850);
    expect(suggestActivityKcal(7, 100, 0)).toBe(0);
  });
  it('estimates the steps a watch counts', () => {
    expect(suggestStepsCounted(90, 90)).toBe(8100);
    expect(suggestStepsCounted(0, 45)).toBe(0);
  });
});

describe('no double counting', () => {
  const kps = kcalPerStep(100, 180);
  it('removes the calories the session steps already earn', () => {
    expect(activityBonusKcal(900, 8100, kps)).toBeCloseTo(580, 0);
  });
  it('treadmill walking adds almost nothing', () => {
    const kcal = suggestActivityKcal(3.8, 100, 30);
    expect(activityBonusKcal(kcal, suggestStepsCounted(110, 30), kps)).toBeLessThan(15);
  });
  it('never goes negative', () => {
    expect(activityBonusKcal(100, 5000, kps)).toBe(0);
  });
});

describe('activity validation', () => {
  const today = new Date(2026, 10, 7);
  const good = {
    date: '2026-11-07',
    name: 'Football (casual)',
    minutes: '90',
    kcal: '900',
    stepsCounted: '8100',
  };

  it('accepts a normal entry', () => {
    const r = validateActivityEntry(good, today);
    expect(r.ok && r.value).toEqual({
      date: '2026-11-07',
      name: 'Football (casual)',
      durationMin: 90,
      kcal: 900,
      stepsCounted: 8100,
    });
  });
  it('allows blank minutes and blank steps', () => {
    const r = validateActivityEntry({ ...good, minutes: '', stepsCounted: '' }, today);
    expect(r.ok && r.value.durationMin).toBeNull();
    expect(r.ok && r.value.stepsCounted).toBeNull();
  });
  it('rejects bad input', () => {
    expect(validateActivityEntry({ ...good, date: '2026-11-08' }, today).ok).toBe(false);
    expect(validateActivityEntry({ ...good, name: '' }, today).ok).toBe(false);
    expect(validateActivityEntry({ ...good, minutes: '0' }, today).ok).toBe(false);
    expect(validateActivityEntry({ ...good, kcal: '0' }, today).ok).toBe(false);
    expect(validateActivityEntry({ ...good, stepsCounted: '12.5' }, today).ok).toBe(false);
    expect(validateActivityEntry({ ...good, stepsCounted: '-5' }, today).ok).toBe(false);
  });
});

describe('football and the food budget', () => {
  const base = {
    sex: 'male' as const,
    birthDate: '1997-05-07',
    heightCm: 180,
    weightKg: 100,
    mode: 'lose' as const,
    dailyDeficitKcal: DEFAULTS.dailyDeficitKcal,
    stepFloor: DEFAULTS.stepFloor,
    stepCap: DEFAULTS.stepCap,
    date: new Date(2026, 10, 3),
    stepsDone: 0,
  };
  it('legacy path: credits half of the session', () => {
    const p = planDay({ ...base, eatenKcal: 2332, activityKcal: 900 });
    expect(p.activityCreditKcal).toBe(450);
    expect(p.stepTarget).toBe(8000);
  });
  it('credits half of what the steps do not already cover', () => {
    const p = planDay({
      ...base,
      eatenKcal: 0,
      activityKcal: 0,
      activities: [{ kcal: 900, stepsCounted: 8100 }],
    });
    expect(p.activityCreditKcal).toBe(290);
  });
  it('gives no credit when the steps already cover the session', () => {
    const p = planDay({
      ...base,
      eatenKcal: 0,
      activityKcal: 0,
      activities: [{ kcal: 100, stepsCounted: 5000 }],
    });
    expect(p.activityCreditKcal).toBe(0);
  });
});