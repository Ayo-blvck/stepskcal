import { isValidDateKey } from './profileInput';

export interface ActivityPreset {
  key: string;
  name: string;
  met: number | null; // null = enter calories yourself
  stepsPerMin: number; // rough steps a wrist watch counts per minute
}

export const ACTIVITY_PRESETS: ActivityPreset[] = [
  { key: 'football-casual', name: 'Football (casual)', met: 7, stepsPerMin: 90 },
  { key: 'football-match', name: 'Football (match)', met: 9.5, stepsPerMin: 110 },
  { key: 'treadmill-walk', name: 'Treadmill (walking)', met: 3.8, stepsPerMin: 110 },
  { key: 'treadmill-run', name: 'Treadmill (running)', met: 9, stepsPerMin: 165 },
  { key: 'jogging', name: 'Jogging', met: 7, stepsPerMin: 160 },
  { key: 'gym', name: 'Gym workout', met: 5, stepsPerMin: 15 },
  { key: 'cycling', name: 'Cycling', met: 6.8, stepsPerMin: 0 },
  { key: 'swimming', name: 'Swimming', met: 6, stepsPerMin: 0 },
  { key: 'other', name: 'Other', met: null, stepsPerMin: 0 },
];

/** Net calories: resting burn is already inside your maintenance figure. */
export function suggestActivityKcal(met: number, weightKg: number, minutes: number): number {
  return Math.max(0, Math.round(((met - 1) * weightKg * minutes) / 60));
}

export function suggestStepsCounted(stepsPerMin: number, minutes: number): number {
  return Math.round(stepsPerMin * minutes);
}

/** Calories beyond what the session's own steps already earn. */
export function activityBonusKcal(kcal: number, stepsCounted: number, kcalPerStep: number): number {
  return Math.max(0, kcal - stepsCounted * kcalPerStep);
}

export interface ActivityForm {
  date: string;
  name: string;
  minutes: string;
  kcal: string;
  stepsCounted?: string;
}

export type ActivityErrors = Partial<Record<keyof ActivityForm, string>>;

export type ActivityValidation =
  | {
      ok: true;
      value: {
        date: string;
        name: string;
        durationMin: number | null;
        kcal: number;
        stepsCounted: number | null;
      };
    }
  | { ok: false; errors: ActivityErrors };

function keyOf(d: Date): string {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function validateActivityEntry(f: ActivityForm, today: Date): ActivityValidation {
  const errors: ActivityErrors = {};

  const date = f.date.trim();
  if (!isValidDateKey(date)) errors.date = 'Use the format YYYY-MM-DD';
  else if (date > keyOf(today)) errors.date = 'That date is in the future';
  else if (date < '2000-01-01') errors.date = 'Please check the year';

  const name = f.name.trim();
  if (name.length < 2 || name.length > 60) errors.name = 'Enter a name (2 to 60 characters)';

  let durationMin: number | null = null;
  const mt = f.minutes.trim();
  if (mt !== '') {
    const m = Number(mt);
    if (!Number.isInteger(m) || m < 1 || m > 600) {
      errors.minutes = 'Whole minutes from 1 to 600, or leave blank';
    } else durationMin = m;
  }

  const kt = f.kcal.trim().replace(',', '.');
  const kcal = kt === '' ? NaN : Number(kt);
  if (!Number.isFinite(kcal) || kcal < 1 || kcal > 5000) errors.kcal = 'Enter calories from 1 to 5000';

  let stepsCounted: number | null = null;
  const st = (f.stepsCounted ?? '').trim().replace(/[,\s]/g, '');
  if (st !== '') {
    const n = Number(st);
    if (!Number.isInteger(n) || n < 0 || n > 100000) {
      errors.stepsCounted = 'Whole number of steps, or leave blank';
    } else stepsCounted = n;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { date, name, durationMin, kcal: Math.round(kcal), stepsCounted } };
}