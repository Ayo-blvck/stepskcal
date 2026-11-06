import { describe, expect, it } from 'vitest';
import { buildTodayView, goalCardView, type TodayInput } from './index';

const base: TodayInput = {
  stepsDone: 5432,
  stepTarget: 8000,
  stepFloor: 8000,
  stepCap: 20000,
  hasSteps: true,
  eatenKcal: 1175,
  budgetKcal: 1882,
  activityCreditKcal: 0,
  overageKcal: 0,
  uncoveredKcal: 0,
};

describe('hero rings', () => {
  it('shows what is left while within budget', () => {
    const v = buildTodayView(base);
    expect(v.steps).toMatchObject({ value: '2,568', label: 'steps to go', sub: '5,432 of 8,000', reached: false });
    expect(v.steps.progress).toBeCloseTo(0.679, 2);
    expect(v.kcal).toMatchObject({ value: '707', label: 'kcal left', sub: '1,175 of 1,882', over: false });
    expect(v.kcal.progress).toBeCloseTo(0.624, 2);
    expect(v.note).toBe('Within budget, so your target stays at 8,000 steps.');
  });
  it('flips to over and explains the extra steps', () => {
    const v = buildTodayView({
      ...base,
      stepsDone: 6000,
      stepTarget: 13400,
      eatenKcal: 2095,
      overageKcal: 213,
    });
    expect(v.kcal).toMatchObject({ value: '213', label: 'kcal over', progress: 1, over: true });
    expect(v.note).toBe('+5,400 steps added for 213 kcal over budget.');
    expect(v.steps.value).toBe('7,400');
  });
  it('explains the cap when the extra cannot be walked off', () => {
    const v = buildTodayView({
      ...base,
      stepTarget: 20000,
      eatenKcal: 5000,
      overageKcal: 3118,
      uncoveredKcal: 2000,
    });
    expect(v.note).toContain('+12,000 steps');
    expect(v.note).toContain('The cap is 20,000 steps');
    expect(v.note).toContain('2,000 kcal');
  });
  it('celebrates reaching the steps target', () => {
    const v = buildTodayView({ ...base, stepsDone: 9000 });
    expect(v.steps).toMatchObject({ value: 'Done', label: 'target reached', progress: 1, reached: true });
  });
  it('asks for steps when none were logged', () => {
    const v = buildTodayView({ ...base, hasSteps: false, stepsDone: 0, eatenKcal: 0 });
    expect(v.note).toBe("Within budget. Add your watch steps to track today's walk.");
    expect(v.steps.sub).toBe('0 of 8,000');
  });
  it('widens the allowance when activity adds budget', () => {
    const v = buildTodayView({ ...base, activityCreditKcal: 290, eatenKcal: 2000 });
    expect(v.kcal).toMatchObject({ value: '172', sub: '2,000 of 2,172' });
  });
});

describe('goal card', () => {
  const g = {
    startKg: 100,
    currentKg: 95,
    goalKg: 80,
    targetDate: '2027-05-07',
    today: '2026-11-04',
    vsPlanKg: -0.1,
    mode: 'lose' as const,
  };
  it('matches the design copy', () => {
    expect(goalCardView(g)).toEqual({
      title: 'Goal: 80 kg',
      right: '184 days left',
      progress: 0.25,
      detail: '95.0 kg now · 15.0 kg to go · right on plan',
    });
  });
  it('words ahead, behind and unknown plan positions', () => {
    expect(goalCardView({ ...g, vsPlanKg: -1.24 }).detail).toContain('1.2 kg ahead of plan');
    expect(goalCardView({ ...g, vsPlanKg: 0.8 }).detail).toContain('0.8 kg behind plan');
    expect(goalCardView({ ...g, vsPlanKg: null }).detail).toBe('95.0 kg now · 15.0 kg to go');
  });
  it('handles the end of the road', () => {
    expect(goalCardView({ ...g, currentKg: 79 }).detail).toBe('79.0 kg now · goal reached');
    expect(goalCardView({ ...g, targetDate: '2026-11-05' }).right).toBe('1 day left');
    expect(goalCardView({ ...g, targetDate: '2026-11-04' }).right).toBe('Target date is today');
    expect(goalCardView({ ...g, targetDate: '2026-10-01' }).right).toBe('Target date passed');
    expect(goalCardView({ ...g, targetDate: null }).right).toBeNull();
  });
  it('maintain mode drops the countdown', () => {
    const v = goalCardView({ ...g, currentKg: 80, mode: 'maintain' });
    expect(v.title).toBe('Staying at 80 kg');
    expect(v.right).toBeNull();
    expect(v.progress).toBe(1);
  });
  it('clamps progress', () => {
    expect(goalCardView({ ...g, currentKg: 103 }).progress).toBe(0);
    expect(goalCardView({ ...g, startKg: 80 }).progress).toBe(1);
  });
});