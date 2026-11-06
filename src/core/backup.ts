import { isValidDateKey } from './profileInput';

export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 8 * 1024 * 1024;

export interface BackupProfile {
  id: number;
  sex: 'male' | 'female';
  birthDate: string;
  heightCm: number;
  goalWeightKg: number;
  stretchGoalKg: number | null;
  targetDate: string | null;
  mode: 'lose' | 'maintain';
  dailyDeficitKcal: number;
  stepFloor: number;
  stepCap: number;
  stepStrategy: 'higher' | 'watch' | 'phone';
  createdAt: number;
}

export interface BackupFood {
  id: number;
  name: string;
  category: string;
  servingLabel: string;
  kcal: number;
  seedKey: string | null;
  isCustom: boolean;
  archived: boolean;
  createdAt: number;
}

export interface BackupFoodLog {
  id: number;
  date: string;
  foodId: number | null;
  name: string;
  servingLabel: string | null;
  quantity: number;
  kcal: number;
  loggedAt: number;
}

export interface BackupStepEntry {
  id: number;
  date: string;
  source: 'phone' | 'watch';
  steps: number;
  recordedAt: number;
}

export interface BackupWeightLog {
  id: number;
  date: string;
  weightKg: number;
  createdAt: number;
}

export interface BackupActivity {
  id: number;
  date: string;
  name: string;
  kcal: number;
  durationMin: number | null;
  stepsCounted: number | null;
  createdAt: number;
}

export interface BackupData {
  profile: BackupProfile[];
  foods: BackupFood[];
  foodLogs: BackupFoodLog[];
  stepEntries: BackupStepEntry[];
  weightLogs: BackupWeightLog[];
  activities: BackupActivity[];
}

export interface BackupFile {
  app: 'stepcal';
  version: number;
  exportedAt: string;
  data: BackupData;
}

export function buildBackup(data: BackupData, now: Date): BackupFile {
  return { app: 'stepcal', version: BACKUP_VERSION, exportedAt: now.toISOString(), data };
}

export function backupFileName(now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `stepcal-backup-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}.json`;
}

// ---------- validation ----------

type Kind =
  | 'string'
  | 'number'
  | 'int'
  | 'boolean'
  | 'date'
  | 'string?'
  | 'number?'
  | 'int?'
  | 'date?'
  | readonly string[];
type Spec = Record<string, Kind>;

const SPECS: Record<keyof BackupData, Spec> = {
  profile: {
    id: 'int',
    sex: ['male', 'female'],
    birthDate: 'date',
    heightCm: 'number',
    goalWeightKg: 'number',
    stretchGoalKg: 'number?',
    targetDate: 'date?',
    mode: ['lose', 'maintain'],
    dailyDeficitKcal: 'int',
    stepFloor: 'int',
    stepCap: 'int',
    stepStrategy: ['higher', 'watch', 'phone'],
    createdAt: 'number',
  },
  foods: {
    id: 'int',
    name: 'string',
    category: 'string',
    servingLabel: 'string',
    kcal: 'int',
    seedKey: 'string?',
    isCustom: 'boolean',
    archived: 'boolean',
    createdAt: 'number',
  },
  foodLogs: {
    id: 'int',
    date: 'date',
    foodId: 'int?',
    name: 'string',
    servingLabel: 'string?',
    quantity: 'number',
    kcal: 'int',
    loggedAt: 'number',
  },
  stepEntries: {
    id: 'int',
    date: 'date',
    source: ['phone', 'watch'],
    steps: 'int',
    recordedAt: 'number',
  },
  weightLogs: { id: 'int', date: 'date', weightKg: 'number', createdAt: 'number' },
  activities: {
    id: 'int',
    date: 'date',
    name: 'string',
    kcal: 'int',
    durationMin: 'int?',
    stepsCounted: 'int?',
    createdAt: 'number',
  },
};

function readRow(raw: unknown, spec: Spec): { row: Record<string, unknown> } | { error: string } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { error: 'not an object' };
  }
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [key, kind] of Object.entries(spec)) {
    const v = src[key];

    if (typeof kind !== 'string') {
      const allowed = kind as readonly string[];
      if (typeof v !== 'string' || !allowed.includes(v)) return { error: `bad value for "${key}"` };
      out[key] = v;
      continue;
    }

    const optional = kind.endsWith('?');
    const base = optional ? kind.slice(0, -1) : kind;

    if (v === undefined || v === null) {
      if (optional) {
        out[key] = null;
        continue;
      }
      return { error: `missing "${key}"` };
    }

    const ok =
      base === 'string'
        ? typeof v === 'string'
        : base === 'number'
          ? typeof v === 'number' && Number.isFinite(v)
          : base === 'int'
            ? typeof v === 'number' && Number.isInteger(v)
            : base === 'boolean'
              ? typeof v === 'boolean'
              : base === 'date'
                ? typeof v === 'string' && isValidDateKey(v)
                : false;
    if (!ok) return { error: `bad value for "${key}"` };
    out[key] = v;
  }
  return { row: out };
}

function readTable<T>(
  name: keyof BackupData,
  raw: unknown,
): { ok: true; rows: T[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: `"${name}" is missing from the file.` };
  if (raw.length > 200000) return { ok: false, error: `"${name}" has too many rows.` };
  const rows: T[] = [];
  for (let i = 0; i < raw.length; i++) {
    const r = readRow(raw[i], SPECS[name]);
    if ('error' in r) {
      return { ok: false, error: `Problem in "${name}", row ${i + 1}: ${r.error}.` };
    }
    rows.push(r.row as T);
  }
  return { ok: true, rows };
}

export type BackupParse = { ok: true; backup: BackupFile } | { ok: false; error: string };

export function parseBackup(text: string): BackupParse {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file could not be read as a backup (it is not valid JSON).' };
  }

  if (typeof raw !== 'object' || raw === null || (raw as { app?: unknown }).app !== 'stepcal') {
    return { ok: false, error: 'This does not look like a backup file from this app.' };
  }
  const top = raw as Record<string, unknown>;

  if (typeof top.version !== 'number' || !Number.isInteger(top.version) || top.version < 1) {
    return { ok: false, error: 'This backup file has no valid version number.' };
  }
  if (top.version > BACKUP_VERSION) {
    return {
      ok: false,
      error: 'This backup was made by a newer version of the app. Update the app first, then try again.',
    };
  }
  if (typeof top.exportedAt !== 'string') {
    return { ok: false, error: 'This backup file is missing its date.' };
  }
  if (typeof top.data !== 'object' || top.data === null) {
    return { ok: false, error: 'This backup file has no data section.' };
  }
  const d = top.data as Record<string, unknown>;

  const profile = readTable<BackupProfile>('profile', d.profile);
  if (!profile.ok) return profile;
  const foods = readTable<BackupFood>('foods', d.foods);
  if (!foods.ok) return foods;
  const foodLogs = readTable<BackupFoodLog>('foodLogs', d.foodLogs);
  if (!foodLogs.ok) return foodLogs;
  const stepEntries = readTable<BackupStepEntry>('stepEntries', d.stepEntries);
  if (!stepEntries.ok) return stepEntries;
  const weightLogs = readTable<BackupWeightLog>('weightLogs', d.weightLogs);
  if (!weightLogs.ok) return weightLogs;
  const activities = readTable<BackupActivity>('activities', d.activities);
  if (!activities.ok) return activities;

  if (profile.rows.length > 1) {
    return { ok: false, error: 'This backup contains more than one profile.' };
  }
  if (new Set(weightLogs.rows.map((w) => w.date)).size !== weightLogs.rows.length) {
    return { ok: false, error: 'This backup has two weigh-ins on the same day.' };
  }
  if (
    new Set(stepEntries.rows.map((s) => `${s.date}|${s.source}`)).size !== stepEntries.rows.length
  ) {
    return { ok: false, error: 'This backup has duplicate step entries.' };
  }

  return {
    ok: true,
    backup: {
      app: 'stepcal',
      version: top.version,
      exportedAt: top.exportedAt,
      data: {
        profile: profile.rows,
        foods: foods.rows,
        foodLogs: foodLogs.rows,
        stepEntries: stepEntries.rows,
        weightLogs: weightLogs.rows,
        activities: activities.rows,
      },
    },
  };
}

export function backupSummary(b: BackupFile): string {
  const d = b.data;
  const custom = d.foods.filter((f) => f.isCustom).length;
  return `Backup from ${b.exportedAt.slice(0, 10)}: ${d.profile.length ? 'profile, ' : ''}${d.weightLogs.length} weigh-ins, ${d.foodLogs.length} food entries, ${d.stepEntries.length} step entries, ${d.activities.length} activities, ${custom} custom foods.`;
}

/** A reminder message, or null when no reminder is due. */
export function backupNudge(
  lastBackupAt: number | null,
  profileCreatedAt: number,
  now: number,
): string | null {
  const day = 86400000;
  if (lastBackupAt === null) {
    return (now - profileCreatedAt) / day >= 3
      ? 'You have not backed up yet. Your data lives only on this phone.'
      : null;
  }
  const days = Math.floor((now - lastBackupAt) / day);
  return days >= 14 ? `Your last backup was ${days} days ago.` : null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function describeLastBackup(lastAt: number | null, now: number): string {
  if (lastAt === null) return 'No backup file has been created yet.';
  const d = new Date(lastAt);
  const days = Math.max(0, Math.floor((now - lastAt) / 86400000));
  const when = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const ago = days === 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
  return `Last backup file created: ${when} (${ago}).`;
}