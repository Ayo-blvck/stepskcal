import { describe, expect, it } from 'vitest';
import {
  cmToFtIn,
  emptyForm,
  formatDateInput,
  ftInToCm,
  goalOutlook,
  kcalPerStep,
  minHealthyWeightKg,
  validateProfileForm,
  type RawProfileForm,
} from './index';

const today = new Date(2026, 10, 3);
const good: RawProfileForm = {
  ...emptyForm,
  sex: 'male',
  birthDate: '1997-05-07',
  heightUnit: 'ft',
  heightFt: '5',
  heightIn: '11',
  weightKg: '100',
  goalWeightKg: '80',
  stretchGoalKg: '77',
  targetDate: '2027-05-07',
};

describe('conversions and formatting', () => {
  it('converts 5ft 11in to cm and back', () => {
    expect(ftInToCm(5, 11)).toBeCloseTo(180.3, 1);
    expect(cmToFtIn(180.3)).toEqual({ ft: 5, inch: 11 });
  });
  it('formats typed dates', () => {
    expect(formatDateInput('19970507')).toBe('1997-05-07');
    expect(formatDateInput('19970')).toBe('1997-0');
    expect(formatDateInput('abc')).toBe('');
  });
  it('has a healthy weight floor', () => {
    expect(minHealthyWeightKg(180)).toBe(60);
  });
});

describe('profile validation', () => {
  it('accepts my profile', () => {
    const r = validateProfileForm(good, today);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.heightCm).toBeCloseTo(180.3, 1);
      expect(r.value.mode).toBe('lose');
      expect(r.value.stretchGoalKg).toBe(77);
      expect(r.value.dailyDeficitKcal).toBe(500);
    }
  });
  it('rejects an impossible date', () => {
    const r = validateProfileForm({ ...good, birthDate: '1997-02-30' }, today);
    expect(r.ok).toBe(false);
  });
  it('rejects under-18s', () => {
    const r = validateProfileForm({ ...good, birthDate: '2012-01-01' }, today);
    expect(r.ok).toBe(false);
  });
  it('rejects a goal below the healthy floor', () => {
    const r = validateProfileForm({ ...good, goalWeightKg: '55', stretchGoalKg: '' }, today);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.goalWeightKg).toBeDefined();
  });
  it('rejects a stretch goal above the goal', () => {
    const r = validateProfileForm({ ...good, stretchGoalKg: '82' }, today);
    expect(r.ok).toBe(false);
  });
  it('rejects a target date that is not in the future', () => {
    expect(validateProfileForm({ ...good, targetDate: '2026-11-03' }, today).ok).toBe(false);
    expect(validateProfileForm({ ...good, targetDate: '2026-11-04' }, today).ok).toBe(true);
  });
  it('switches to maintain mode when already at goal', () => {
    const r = validateProfileForm({ ...good, goalWeightKg: '100', stretchGoalKg: '' }, today);
    expect(r.ok && r.value.mode).toBe('maintain');
  });
});

describe('goal outlook', () => {
  const kps = kcalPerStep(100, 180);
  const base = { weightKg: 100, deficitKcal: 500, stepFloor: 8000, kcalPerStep: kps };

  it('80 kg by the target date is tight', () => {
    const o = goalOutlook({ ...base, goalKg: 80, daysLeft: 185 });
    expect(o.plannedDailyKcal).toBe(816);
    expect(o.requiredDailyKcal).toBe(832);
    expect(o.verdict).toBe('tight');
  });
  it('77 kg by the target date is behind', () => {
    const o = goalOutlook({ ...base, goalKg: 77, daysLeft: 185 });
    expect(o.requiredDailyKcal).toBe(957);
    expect(o.verdict).toBe('behind');
  });
  it('is on track with more time', () => {
    expect(goalOutlook({ ...base, goalKg: 80, daysLeft: 400 }).verdict).toBe('on_track');
  });
  it('reports reached goals', () => {
    expect(goalOutlook({ ...base, goalKg: 100, daysLeft: 185 }).verdict).toBe('reached');
  });
  it('still estimates days with no target date', () => {
    const o = goalOutlook({ ...base, goalKg: 80, daysLeft: null });
    expect(o.requiredDailyKcal).toBeNull();
    expect(o.daysNeeded).toBe(189);
  });
});