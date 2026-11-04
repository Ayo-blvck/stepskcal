import { describe, expect, it } from 'vitest';
import {
  DEFAULTS,
  formatQuantity,
  parseQuantity,
  planDay,
  scaleKcal,
  validateEntry,
} from './index';

describe('portions', () => {
  it('scales calories', () => {
    expect(scaleKcal(380, 1.5)).toBe(570);
    expect(scaleKcal(95, 0.5)).toBe(48);
  });
  it('parses quantities', () => {
    expect(parseQuantity('1,5')).toBe(1.5);
    expect(parseQuantity('0.1')).toBeNull();
    expect(parseQuantity('25')).toBeNull();
    expect(parseQuantity('abc')).toBeNull();
    expect(parseQuantity('')).toBeNull();
  });
  it('formats quantities', () => {
    expect(formatQuantity(0.5)).toBe('½');
    expect(formatQuantity(1.5)).toBe('1½');
    expect(formatQuantity(2)).toBe('2');
    expect(formatQuantity(0.25)).toBe('¼');
    expect(formatQuantity(1.3)).toBe('1.3');
  });
});

describe('entry validation', () => {
  it('accepts a food entry and allows zero calories', () => {
    const r = validateEntry({ name: 'Water', qty: '1', kcal: '0' }, 'food');
    expect(r.ok).toBe(true);
  });
  it('rejects a bad quantity', () => {
    expect(validateEntry({ name: 'Rice', qty: '0', kcal: '300' }, 'food').ok).toBe(false);
  });
  it('quick add needs at least 1 kcal and defaults the name', () => {
    expect(validateEntry({ name: '', qty: '1', kcal: '0' }, 'quick').ok).toBe(false);
    const r = validateEntry({ name: '  ', qty: '1', kcal: '250' }, 'quick');
    expect(r.ok && r.value.name).toBe('Quick add');
  });
});

describe('the apple story', () => {
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
    activityKcal: 0,
    stepsDone: 0,
  };
  it('an apple inside the budget changes nothing', () => {
    expect(planDay({ ...base, eatenKcal: 95 }).stepTarget).toBe(8000);
    expect(planDay({ ...base, eatenKcal: 1882 }).stepTarget).toBe(8000);
  });
  it('going 90 kcal over adds about 2,300 steps', () => {
    const p = planDay({ ...base, eatenKcal: 1972 });
    expect(p.overageKcal).toBe(90);
    expect(p.stepTarget).toBe(10300);
  });
});