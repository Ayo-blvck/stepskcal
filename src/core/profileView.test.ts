import { describe, expect, it } from 'vitest';
import { describeLastBackup, profileRows, resolveMode } from './index';

describe('resolveMode', () => {
  it('keeps the current mode while the goal is unchanged', () => {
    expect(resolveMode({ existingMode: 'maintain', existingGoalKg: 80, goalKg: 80, weightKg: 80.6 })).toBe('maintain');
    expect(resolveMode({ existingMode: 'lose', existingGoalKg: 80, goalKg: 80, weightKg: 79 })).toBe('lose');
  });
  it('recomputes it when the goal changes or on first run', () => {
    expect(resolveMode({ existingMode: 'maintain', existingGoalKg: 80, goalKg: 75, weightKg: 80 })).toBe('lose');
    expect(resolveMode({ existingMode: null, existingGoalKg: null, goalKg: 80, weightKg: 100 })).toBe('lose');
    expect(resolveMode({ existingMode: null, existingGoalKg: null, goalKg: 80, weightKg: 79 })).toBe('maintain');
  });
});

describe('profile rows', () => {
  const p = {
    sex: 'male' as const,
    birthDate: '1997-05-07',
    heightCm: 180.3,
    goalWeightKg: 80,
    stretchGoalKg: 77,
    targetDate: '2027-05-07',
    dailyDeficitKcal: 500,
    stepFloor: 8000,
    mode: 'lose' as const,
  };
  const now = new Date(2026, 10, 4);
  const fmt = (k: string) => `<${k}>`;

  it('lists the plan in a readable form', () => {
    expect(profileRows(p, 95, now, fmt)).toEqual([
      { label: 'Sex', value: 'Male' },
      { label: 'Age', value: '29' },
      { label: 'Height', value: '5 ft 11 in · 180 cm' },
      { label: 'Current weight', value: '95.0 kg' },
      { label: 'Goal weight', value: '80 kg' },
      { label: 'Stretch goal', value: '77 kg' },
      { label: 'Target date', value: '<2027-05-07>' },
      { label: 'Daily deficit', value: '500 kcal' },
      { label: 'Minimum steps', value: '8,000' },
      { label: 'Mode', value: 'Losing weight' },
    ]);
  });
  it('leaves out what is not set and explains maintain mode', () => {
    const rows = profileRows({ ...p, stretchGoalKg: null, targetDate: null, mode: 'maintain' }, null, now, fmt);
    const labels = rows.map((r) => r.label);
    expect(labels).not.toContain('Stretch goal');
    expect(labels).not.toContain('Target date');
    expect(labels).not.toContain('Current weight');
    expect(rows.find((r) => r.label === 'Daily deficit')?.value).toBe('Paused while maintaining');
    expect(rows.find((r) => r.label === 'Mode')?.value).toBe('Maintaining');
  });
});

describe('last backup text', () => {
  const at = new Date(2026, 10, 8, 15, 30).getTime();
  const day = 86400000;
  it('describes how long ago it was', () => {
    expect(describeLastBackup(null, at)).toBe('No backup file has been created yet.');
    expect(describeLastBackup(at, at + 3600000)).toBe('Last backup file created: 8 Nov 2026 (today).');
    expect(describeLastBackup(at, at + day)).toBe('Last backup file created: 8 Nov 2026 (1 day ago).');
    expect(describeLastBackup(at, at + 3 * day)).toBe('Last backup file created: 8 Nov 2026 (3 days ago).');
  });
});