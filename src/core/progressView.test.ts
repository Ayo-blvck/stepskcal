import { describe, expect, it } from 'vitest';
import { nearestIndex, progressSummary, signedKg, weightStats } from './index';

const fmt = (k: string) => `<${k}>`;
const entries = [
  { date: '2026-11-03', kg: 100 },
  { date: '2026-11-10', kg: 99 },
  { date: '2026-11-17', kg: 98 },
];
const run = (e = entries, mode: 'lose' | 'maintain' = 'lose', stretch: number | null = 77, goal = 80) => {
  const stats = weightStats(e, { goalKg: goal, targetDate: '2027-05-07', today: '2026-11-17' })!;
  return progressSummary({ stats, goalKg: goal, stretchKg: stretch, today: '2026-11-17', mode }, fmt);
};

describe('signedKg', () => {
  it('uses a real minus and never shows negative zero', () => {
    expect(signedKg(-1.04)).toBe('−1.0');
    expect(signedKg(2)).toBe('+2.0');
    expect(signedKg(0)).toBe('0.0');
    expect(signedKg(-0.02)).toBe('0.0');
  });
});

describe('progress summary', () => {
  it('describes a steady loss that is on plan', () => {
    const s = run();
    expect(s.headline).toBe('18.0 kg to go · on plan (98.5 kg)');
    expect(s.facts).toEqual([
      { label: 'Since you started', value: '−2.0 kg' },
      { label: 'Pace', value: '−1.0 kg / week' },
      { label: 'Projected goal date', value: '<2027-03-23>' },
      { label: 'Stretch goal 77 kg', value: '<2027-04-13>' },
    ]);
  });
  it('words falling behind and a flat trend', () => {
    const s = run([
      { date: '2026-11-03', kg: 100 },
      { date: '2026-11-17', kg: 100 },
    ]);
    expect(s.headline).toBe('20.0 kg to go · 1.5 kg behind plan (98.5 kg)');
    expect(s.facts).toContainEqual({ label: 'Pace', value: '0.0 kg / week' });
    expect(s.facts).toContainEqual({
      label: 'Projected goal date',
      value: 'Not yet, weight is flat or rising',
    });
  });
  it('words being ahead of plan', () => {
    const s = run([
      { date: '2026-11-03', kg: 100 },
      { date: '2026-11-17', kg: 96 },
    ]);
    expect(s.headline).toBe('16.0 kg to go · 2.5 kg ahead of plan (98.5 kg)');
  });
  it('keeps it short with a single weigh-in', () => {
    const s = run([{ date: '2026-11-03', kg: 100 }], 'lose', null);
    expect(s.facts).toEqual([{ label: 'Pace', value: 'Needs a week of weigh-ins' }]);
  });
  it('handles reaching the goal and maintain mode', () => {
    const reached = run([...entries, { date: '2026-11-17', kg: 79 }].slice(0, 2), 'lose', null, 99.5);
    expect(reached.headline).toBe('Goal reached');
    expect(run(entries, 'maintain', null, 98.4).headline).toBe('0.4 kg below your 98.4 kg target');
    expect(run(entries, 'maintain', null, 98).headline).toBe('Right on your 98 kg target');
    expect(run(entries, 'maintain', null, 98.6).headline).toBe('0.6 kg below your 98.6 kg target');
  });
});

describe('nearestIndex', () => {
  it('finds the closest point', () => {
    expect(nearestIndex([10, 50, 90], 60)).toBe(1);
    expect(nearestIndex([10, 50, 90], 100)).toBe(2);
    expect(nearestIndex([10, 50, 90], -5)).toBe(0);
    expect(nearestIndex([], 5)).toBe(-1);
  });
});