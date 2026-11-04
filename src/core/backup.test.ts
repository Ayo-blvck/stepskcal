import { describe, expect, it } from 'vitest';
import {
  backupFileName,
  backupNudge,
  backupSummary,
  buildBackup,
  parseBackup,
  type BackupData,
} from './index';

const sample: BackupData = {
  profile: [
    {
      id: 1,
      sex: 'male',
      birthDate: '1997-05-07',
      heightCm: 180.3,
      goalWeightKg: 80,
      stretchGoalKg: 77,
      targetDate: '2027-05-07',
      mode: 'lose',
      dailyDeficitKcal: 500,
      stepFloor: 8000,
      stepCap: 20000,
      stepStrategy: 'higher',
      createdAt: 1730000000000,
    },
  ],
  foods: [
    {
      id: 1,
      name: 'Eba (garri)',
      category: 'swallow',
      servingLabel: '1 medium wrap (~300 g)',
      kcal: 380,
      seedKey: 'eba',
      isCustom: false,
      archived: false,
      createdAt: 1730000000000,
    },
    {
      id: 101,
      name: 'Ofada rice',
      category: 'custom',
      servingLabel: '1 plate',
      kcal: 520,
      seedKey: null,
      isCustom: true,
      archived: false,
      createdAt: 1730000001000,
    },
  ],
  foodLogs: [
    {
      id: 1,
      date: '2026-11-04',
      foodId: 1,
      name: 'Eba (garri)',
      servingLabel: '1 medium wrap (~300 g)',
      quantity: 1.5,
      kcal: 570,
      loggedAt: 1730000002000,
    },
    {
      id: 2,
      date: '2026-11-04',
      foodId: null,
      name: 'Quick add',
      servingLabel: null,
      quantity: 1,
      kcal: 250,
      loggedAt: 1730000003000,
    },
  ],
  stepEntries: [{ id: 1, date: '2026-11-04', source: 'watch', steps: 8432, recordedAt: 1730000004000 }],
  weightLogs: [{ id: 1, date: '2026-11-03', weightKg: 100, createdAt: 1730000005000 }],
  activities: [
    {
      id: 1,
      date: '2026-11-07',
      name: 'Football (casual)',
      kcal: 900,
      durationMin: 90,
      stepsCounted: 8100,
      createdAt: 1730000006000,
    },
  ],
};

const make = (mutate?: (b: any) => void) => {
  const b: any = JSON.parse(JSON.stringify(buildBackup(sample, new Date('2026-11-08T15:30:00Z'))));
  mutate?.(b);
  return JSON.stringify(b);
};

describe('backup round trip', () => {
  it('restores exactly what was exported', () => {
    const backup = buildBackup(sample, new Date('2026-11-08T15:30:00Z'));
    const r = parseBackup(JSON.stringify(backup));
    expect(r.ok && r.backup).toEqual(backup);
  });
  it('treats missing optional fields as null (older backups)', () => {
    const r = parseBackup(make((b) => delete b.data.activities[0].stepsCounted));
    expect(r.ok && r.backup.data.activities[0].stepsCounted).toBeNull();
  });
  it('summarises the contents', () => {
    const r = parseBackup(make());
    expect(r.ok && backupSummary(r.backup)).toBe(
      'Backup from 2026-11-08: profile, 1 weigh-ins, 2 food entries, 1 step entries, 1 activities, 1 custom foods.',
    );
  });
});

describe('backup validation', () => {
  it('rejects non-JSON and other files', () => {
    expect(parseBackup('hello').ok).toBe(false);
    expect(parseBackup('{"app":"other"}').ok).toBe(false);
    expect(parseBackup('[]').ok).toBe(false);
  });
  it('rejects a newer version with a helpful message', () => {
    const r = parseBackup(make((b) => (b.version = 99)));
    expect(!r.ok && r.error).toContain('newer version');
  });
  it('rejects bad values and says where', () => {
    const bad = parseBackup(make((b) => (b.data.profile[0].mode = 'turbo')));
    expect(!bad.ok && bad.error).toContain('"profile"');
    expect(parseBackup(make((b) => (b.data.weightLogs[0].date = '2026-02-30'))).ok).toBe(false);
    expect(parseBackup(make((b) => delete b.data.foods[0].name)).ok).toBe(false);
    expect(parseBackup(make((b) => delete b.data.foodLogs)).ok).toBe(false);
  });
  it('rejects duplicates that the database would refuse', () => {
    const dupWeights = parseBackup(
      make((b) => b.data.weightLogs.push({ ...b.data.weightLogs[0], id: 2 })),
    );
    expect(dupWeights.ok).toBe(false);
    const dupSteps = parseBackup(
      make((b) => b.data.stepEntries.push({ ...b.data.stepEntries[0], id: 2 })),
    );
    expect(dupSteps.ok).toBe(false);
  });
});

describe('file name and reminder', () => {
  it('names the file with the local date and time', () => {
    expect(backupFileName(new Date(2026, 10, 8, 15, 30))).toBe('stepcal-backup-2026-11-08-1530.json');
  });
  it('reminds only when a backup is due', () => {
    const day = 86400000;
    const now = 1_800_000_000_000;
    expect(backupNudge(null, now - 1 * day, now)).toBeNull();
    expect(backupNudge(null, now - 5 * day, now)).toContain('not backed up');
    expect(backupNudge(now - 3 * day, now - 90 * day, now)).toBeNull();
    expect(backupNudge(now - 20 * day, now - 90 * day, now)).toContain('20 days');
  });
});