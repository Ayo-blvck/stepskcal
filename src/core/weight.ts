import { isValidDateKey } from './profileInput';

export interface WeightEntry {
  date: string; // yyyy-mm-dd
  kg: number;
}

const DAY = 86400000;

export function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY);
}

export function dateFromDayNumber(n: number): string {
  const d = new Date(n * DAY);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

function keyOf(d: Date): string {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Trend in kg per week from a least-squares line through recent entries. */
export function weeklyRateKg(
  entries: WeightEntry[],
  today: string,
  windowDays = 28,
): number | null {
  const t = dayNumber(today);
  const pts = entries
    .map((e) => ({ x: dayNumber(e.date), y: e.kg }))
    .filter((p) => p.x >= t - windowDays && p.x <= t);
  if (pts.length < 2) return null;

  const xs = pts.map((p) => p.x);
  if (Math.max(...xs) - Math.min(...xs) < 7) return null;

  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n;
  const my = pts.reduce((a, p) => a + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of pts) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  return (num / den) * 7;
}

export function projectGoalDate(
  currentKg: number,
  goalKg: number,
  weeklyRate: number | null,
  today: string,
): string | null {
  if (weeklyRate === null || currentKg <= goalKg) return null;
  if (weeklyRate > -0.05) return null; // flat or rising
  const days = Math.ceil(((currentKg - goalKg) / -weeklyRate) * 7);
  if (days > 3650) return null;
  return dateFromDayNumber(dayNumber(today) + days);
}

export function plannedWeightOn(
  start: WeightEntry,
  goal: { date: string; kg: number },
  on: string,
): number {
  const s = dayNumber(start.date);
  const g = dayNumber(goal.date);
  const o = dayNumber(on);
  if (g <= s) return goal.kg;
  if (o <= s) return start.kg;
  if (o >= g) return goal.kg;
  return start.kg + ((goal.kg - start.kg) * (o - s)) / (g - s);
}

export interface WeightStats {
  startKg: number;
  startDate: string;
  currentKg: number;
  currentDate: string;
  changeKg: number;
  toGoalKg: number;
  weeklyRateKg: number | null;
  projectedGoalDate: string | null;
  plannedKgToday: number | null;
  vsPlanKg: number | null; // negative = ahead of plan
}

export function weightStats(
  entries: WeightEntry[],
  o: { goalKg: number; targetDate: string | null; today: string },
): WeightStats | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const start = sorted[0];
  const current = sorted[sorted.length - 1];

  const rate = weeklyRateKg(sorted, o.today);
  const planned =
    o.targetDate && dayNumber(o.targetDate) > dayNumber(start.date)
      ? plannedWeightOn(start, { date: o.targetDate, kg: o.goalKg }, o.today)
      : null;

  return {
    startKg: start.kg,
    startDate: start.date,
    currentKg: current.kg,
    currentDate: current.date,
    changeKg: current.kg - start.kg,
    toGoalKg: Math.max(0, current.kg - o.goalKg),
    weeklyRateKg: rate,
    projectedGoalDate: projectGoalDate(current.kg, o.goalKg, rate, o.today),
    plannedKgToday: planned,
    vsPlanKg: planned === null ? null : current.kg - planned,
  };
}

/** True when a new weight is further from the previous one than is plausible. */
export function weightJumpUnlikely(prev: WeightEntry | null, next: WeightEntry): boolean {
  if (!prev) return false;
  const gap = Math.abs(dayNumber(next.date) - dayNumber(prev.date));
  const allowed = Math.min(10, 1.5 + 0.25 * gap);
  return Math.abs(next.kg - prev.kg) > allowed;
}

export interface WeightForm {
  date: string;
  kg: string;
}
export type WeightErrors = Partial<Record<keyof WeightForm, string>>;
export type WeightValidation =
  | { ok: true; value: { date: string; kg: number } }
  | { ok: false; errors: WeightErrors };

export function validateWeightEntry(f: WeightForm, today: Date): WeightValidation {
  const errors: WeightErrors = {};

  const date = f.date.trim();
  if (!isValidDateKey(date)) errors.date = 'Use the format YYYY-MM-DD';
  else if (date > keyOf(today)) errors.date = 'That date is in the future';
  else if (date < '2000-01-01') errors.date = 'Please check the year';

  const t = f.kg.trim().replace(',', '.');
  const kg = t === '' ? NaN : Number(t);
  if (!Number.isFinite(kg) || kg < 30 || kg > 300) {
    errors.kg = 'Enter a weight between 30 and 300 kg';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { date, kg: Math.round(kg * 10) / 10 } };
}

/** Whole-number axis bounds with a little padding, at least minSpan tall. */
export function weightAxis(values: number[], minSpan = 4): { min: number; max: number } {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = Math.max(0.5, (hi - lo) * 0.08);
  let min = Math.floor(lo - pad);
  let max = Math.ceil(hi + pad);
  if (max - min < minSpan) {
    const extra = minSpan - (max - min);
    min -= Math.floor(extra / 2);
    max += Math.ceil(extra / 2);
  }
  return { min, max };
}