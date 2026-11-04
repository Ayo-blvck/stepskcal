import { LINES, TITLES, type ReminderKind, type Spice } from '../data/reminder-lines';
import { parseTime, type ReminderSettings } from './reminderSettings';
import { dateFromDayNumber, dayNumber } from './weight';

export type { ReminderKind, Spice } from '../data/reminder-lines';

export const NEAR_KG = 3;
export const LOW_INTAKE_KCAL = 1000;
export const SCHEDULE_DAYS = 7;
export const WEIGH_IN_LOOKAHEAD_DAYS = 14;

export type GoalTier = 'far' | 'near' | 'goal';

export interface DaySnapshot {
  eatenKcal: number;
  allowanceKcal: number; // budget plus activity credit
  stepsDone: number;
  stepTarget: number;
  hasSteps: boolean;
}

export interface ReminderContext {
  kgToGoal: number;
  mode: 'lose' | 'maintain';
  days: Record<string, DaySnapshot>;
}

export interface LineVars {
  kg: number;
  over?: number;
  steps?: number;
  target?: number;
  eaten?: number;
}

export interface PlannedReminder {
  id: string;
  at: Date;
  title: string;
  body: string;
}

export function goalTier(kgToGoal: number, mode: 'lose' | 'maintain'): GoalTier {
  if (mode === 'maintain' || kgToGoal <= 0) return 'goal';
  return kgToGoal <= NEAR_KG ? 'near' : 'far';
}

export function classifyDay(s: DaySnapshot): ReminderKind {
  const hasFood = s.eatenKcal > 0;
  if (!hasFood) return s.hasSteps && s.stepsDone < s.stepTarget ? 'lowSteps' : 'generic';
  if (s.eatenKcal < LOW_INTAKE_KCAL) return 'lowIntake';
  if (s.eatenKcal > s.allowanceKcal) return 'overBudget';
  if (!s.hasSteps || s.stepsDone < s.stepTarget) return 'lowSteps';
  return 'onTrack';
}

export function linesFor(kind: ReminderKind, tier: GoalTier, spice: Spice): string[] {
  if (kind === 'lowIntake') return LINES.lowIntake;
  const set = LINES[kind];
  if (tier === 'near') return set.near;
  if (tier === 'goal') return set.goal;
  return set[spice];
}

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function fillTemplate(t: string, v: LineVars): string {
  const n = (x: number | undefined) => (x === undefined ? '0' : Math.round(x).toLocaleString('en-US'));
  return t
    .replace(/\{kg\}/g, v.kg.toFixed(1))
    .replace(/\{over\}/g, n(v.over))
    .replace(/\{steps\}/g, n(v.steps))
    .replace(/\{target\}/g, n(v.target))
    .replace(/\{eaten\}/g, n(v.eaten));
}

export function renderReminder(
  kind: ReminderKind,
  tier: GoalTier,
  spice: Spice,
  seed: string,
  vars: LineVars,
): { title: string; body: string } {
  const lines = linesFor(kind, tier, spice);
  const line = lines[hash(`${seed}|${kind}`) % lines.length];
  return { title: TITLES[kind], body: fillTemplate(line, vars) };
}

// ---------- scheduling ----------

function keyOf(d: Date): string {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function addDays(key: string, n: number): string {
  return dateFromDayNumber(dayNumber(key) + n);
}

function atTime(key: string, h: number, m: number): Date {
  const [y, mo, d] = key.split('-').map(Number);
  return new Date(y, mo - 1, d, h, m, 0, 0);
}

function weekdayOf(key: string): number {
  const [y, mo, d] = key.split('-').map(Number);
  return new Date(y, mo - 1, d).getDay();
}

function varsFor(ctx: ReminderContext, snap?: DaySnapshot): LineVars {
  return {
    kg: ctx.kgToGoal,
    over: snap ? Math.max(0, snap.eatenKcal - snap.allowanceKcal) : undefined,
    steps: snap?.stepsDone,
    target: snap?.stepTarget,
    eaten: snap?.eatenKcal,
  };
}

export function planReminders(i: {
  now: Date;
  settings: ReminderSettings;
  ctx: ReminderContext;
}): PlannedReminder[] {
  const { now, settings, ctx } = i;
  const out: PlannedReminder[] = [];
  const today = keyOf(now);
  const tier = goalTier(ctx.kgToGoal, ctx.mode);
  const earliest = now.getTime() + 60_000;

  const morning = settings.morning.on ? parseTime(settings.morning.time) : null;
  const evening = settings.evening.on ? parseTime(settings.evening.time) : null;
  const weighIn = settings.weighIn.on ? parseTime(settings.weighIn.time) : null;

  for (let o = 0; o < SCHEDULE_DAYS; o++) {
    const day = addDays(today, o);

    if (morning) {
      const at = atTime(day, morning.h, morning.m);
      if (at.getTime() > earliest) {
        const prev = addDays(day, -1);
        const complete = day === today || (prev === today && now.getHours() >= 18);
        const snap = complete ? ctx.days[prev] : undefined;
        const kind: ReminderKind = snap ? classifyDay(snap) : 'generic';
        const r = renderReminder(kind, tier, settings.spice, `${day}|morning`, varsFor(ctx, snap));
        out.push({ id: `morning-${day}`, at, ...r });
      }
    }

    if (evening) {
      const at = atTime(day, evening.h, evening.m);
      if (at.getTime() > earliest) {
        const r = renderReminder('evening', tier, settings.spice, `${day}|evening`, varsFor(ctx));
        out.push({ id: `evening-${day}`, at, ...r });
      }
    }
  }

  if (weighIn) {
    for (let o = 0; o < WEIGH_IN_LOOKAHEAD_DAYS; o++) {
      const day = addDays(today, o);
      if (weekdayOf(day) !== settings.weighIn.day) continue;
      const at = atTime(day, weighIn.h, weighIn.m);
      if (at.getTime() <= earliest) continue;
      const r = renderReminder('weighIn', tier, settings.spice, `${day}|weighIn`, varsFor(ctx));
      out.push({ id: `weighin-${day}`, at, ...r });
    }
  }

  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}