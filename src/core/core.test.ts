import { describe, expect, it } from 'vitest';
import { ageOn, bmr, foodBudget, planDay, resolveSteps, DEFAULTS } from './index';

const base = {
  sex: 'male' as const,
  birthDate: '1997-05-07',
  heightCm: 175,
  weightKg: 90,
  mode: 'lose' as const,
  dailyDeficitKcal: DEFAULTS.dailyDeficitKcal,
  stepFloor: DEFAULTS.stepFloor,
  stepCap: DEFAULTS.stepCap,
  date: new Date(2026, 10, 3),
  eatenKcal: 0,
  activityKcal: 0,
  stepsDone: 0,
};

describe('bmr and age', () => {
  it('computes age around a birthday', () => {
    expect(ageOn('1997-05-07', new Date(2026, 10, 3))).toBe(29);
    expect(ageOn('1997-05-07', new Date(2027, 4, 7))).toBe(30);
  });
  it('matches Mifflin-St Jeor for a male', () => {
    expect(bmr({ sex: 'male', weightKg: 90, heightCm: 175, age: 29 })).toBeCloseTo(1853.75, 2);
  });
});

describe('food budget', () => {
  it('subtracts the deficit', () => {
    const b = foodBudget({ maintenanceKcal: 2224.5, sex: 'male', mode: 'lose', dailyDeficitKcal: 500 });
    expect(b.budgetKcal).toBe(1725);
    expect(b.limitedByFloor).toBe(false);
  });
  it('never goes below the calorie floor', () => {
    const b = foodBudget({ maintenanceKcal: 1546.8, sex: 'female', mode: 'lose', dailyDeficitKcal: 500 });
    expect(b.budgetKcal).toBe(1200);
    expect(b.limitedByFloor).toBe(true);
  });
  it('has no deficit in maintain mode', () => {
    const b = foodBudget({ maintenanceKcal: 2224.5, sex: 'male', mode: 'maintain', dailyDeficitKcal: 500 });
    expect(b.effectiveDeficitKcal).toBe(0);
  });
});

describe('day plan', () => {
  it('keeps the floor target while under budget', () => {
    const p = planDay({ ...base, eatenKcal: 90 });
    expect(p.stepTarget).toBe(8000);
  });
  it('adds steps only after the budget is exceeded', () => {
    const p = planDay({ ...base, eatenKcal: 1825 }); // 100 kcal over
    expect(p.overageKcal).toBe(100);
    expect(p.stepTarget).toBeCloseTo(10900, -2);
  });
  it('caps the target and reports what is uncovered', () => {
    const p = planDay({ ...base, eatenKcal: 5000 });
    expect(p.stepTarget).toBe(20000);
    expect(p.uncoveredKcal).toBeGreaterThan(0);
  });
  it('credits half of football calories', () => {
    const p = planDay({ ...base, eatenKcal: 1825, activityKcal: 200 });
    expect(p.overageKcal).toBe(0);
  });
});

describe('step sources', () => {
  it('uses the higher number by default', () => {
    expect(resolveSteps({ phone: 5000, watch: 7000 })).toBe(7000);
  });
  it('falls back to the phone when no watch entry exists', () => {
    expect(resolveSteps({ phone: 5000, watch: null, strategy: 'watch' })).toBe(5000);
  });
});