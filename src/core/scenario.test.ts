import { describe, expect, it } from 'vitest';
import { ageOn, bmr, maintenanceKcal, foodBudget, kcalPerStep, requiredDailyDeficit } from './index';

const today = new Date(2026, 10, 3);
const deadline = new Date(2027, 4, 7);
const daysLeft = Math.round((deadline.getTime() - today.getTime()) / 86400000);

describe('my plan', () => {
  const age = ageOn('1997-05-07', today);
  const b = bmr({ sex: 'male', weightKg: 100, heightCm: 180, age });
  const m = maintenanceKcal(b);

  it('has the expected baseline', () => {
    expect(daysLeft).toBe(185);
    expect(age).toBe(29);
    expect(Math.round(b)).toBe(1985);
    expect(Math.round(m)).toBe(2382);
  });

  it('has the expected budget and step cost', () => {
    const budget = foodBudget({ maintenanceKcal: m, sex: 'male', mode: 'lose', dailyDeficitKcal: 500 });
    expect(budget.budgetKcal).toBe(1882);
    expect(kcalPerStep(100, 180)).toBeCloseTo(0.0395, 3);
  });

  it('needs about 830 kcal/day to reach 80 kg by the deadline', () => {
    expect(requiredDailyDeficit(100, 80, daysLeft)).toBeCloseTo(832, 0);
    expect(requiredDailyDeficit(100, 77, daysLeft)).toBeCloseTo(957, 0);
  });
});