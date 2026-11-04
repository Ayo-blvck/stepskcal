import { describe, expect, it } from 'vitest';
import { LINES } from '../data/reminder-lines';
import {
  DEFAULT_REMINDERS,
  classifyDay,
  fillTemplate,
  formatTimeInput,
  goalTier,
  linesFor,
  parseReminderSettings,
  parseTime,
  planReminders,
  renderReminder,
  type DaySnapshot,
  type ReminderContext,
  type ReminderSettings,
} from './index';

const snap = (over: Partial<DaySnapshot> = {}): DaySnapshot => ({
  eatenKcal: 1800,
  allowanceKcal: 1900,
  stepsDone: 9000,
  stepTarget: 8000,
  hasSteps: true,
  ...over,
});

// Every group of lines inside an entry of LINES, whether it is a plain list or a set of tones.
const slots = (v: unknown): string[][] =>
  Array.isArray(v) ? [v as string[]] : (Object.values(v as object) as string[][]);

describe('lines', () => {
  const all: string[] = Object.values(LINES).flatMap((v) => slots(v).flat());

  it('only uses known placeholders and fits a notification', () => {
    const known = new Set(['{kg}', '{over}', '{steps}', '{target}', '{eaten}']);
    for (const line of all) {
      for (const m of line.match(/\{[^}]*\}/g) ?? []) expect(known.has(m)).toBe(true);
      expect(line.length).toBeLessThanOrEqual(160);
    }
  });
  it('has lines in every slot', () => {
    for (const v of Object.values(LINES)) {
      for (const group of slots(v)) expect(group.length).toBeGreaterThan(0);
    }
  });
  it('keeps the numbers each kind promises', () => {
    for (const arr of Object.values(LINES.overBudget)) for (const l of arr) expect(l).toContain('{over}');
    for (const arr of Object.values(LINES.lowSteps)) for (const l of arr) expect(l).toContain('{steps}');
  });
  it('fills placeholders', () => {
    expect(fillTemplate('{over} over, {steps} steps, {kg} kg', { kg: 4.26, over: 320, steps: 3100 })).toBe(
      '320 over, 3,100 steps, 4.3 kg',
    );
  });
});

describe('classification and tiers', () => {
  it('classifies yesterday', () => {
    expect(classifyDay(snap({ eatenKcal: 2200 }))).toBe('overBudget');
    expect(classifyDay(snap({ stepsDone: 3000 }))).toBe('lowSteps');
    expect(classifyDay(snap())).toBe('onTrack');
    expect(classifyDay(snap({ eatenKcal: 700 }))).toBe('lowIntake');
    expect(classifyDay(snap({ eatenKcal: 0, hasSteps: false }))).toBe('generic');
    expect(classifyDay(snap({ eatenKcal: 0, stepsDone: 2000 }))).toBe('lowSteps');
    expect(classifyDay(snap({ eatenKcal: 0, stepsDone: 9000 }))).toBe('generic');
  });
  it('switches tone near the goal', () => {
    expect(goalTier(20, 'lose')).toBe('far');
    expect(goalTier(3.1, 'lose')).toBe('far');
    expect(goalTier(3, 'lose')).toBe('near');
    expect(goalTier(0, 'lose')).toBe('goal');
    expect(goalTier(10, 'maintain')).toBe('goal');
  });
  it('uses the spice only while far from the goal', () => {
    expect(linesFor('overBudget', 'far', 'roast')).toBe(LINES.overBudget.roast);
    expect(linesFor('overBudget', 'near', 'roast')).toBe(LINES.overBudget.near);
    expect(linesFor('overBudget', 'goal', 'roast')).toBe(LINES.overBudget.goal);
  });
  it('never teases after a very low intake day', () => {
    for (const spice of ['gentle', 'banter', 'roast'] as const) {
      expect(linesFor('lowIntake', 'far', spice)).toBe(LINES.lowIntake);
    }
  });
  it('is deterministic for the same seed', () => {
    const a = renderReminder('generic', 'far', 'banter', 'seed', { kg: 20 });
    expect(renderReminder('generic', 'far', 'banter', 'seed', { kg: 20 })).toEqual(a);
  });
});

describe('settings', () => {
  it('parses times', () => {
    expect(parseTime('08:30')).toEqual({ h: 8, m: 30 });
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('8:30')).toBeNull();
    expect(formatTimeInput('0830')).toBe('08:30');
    expect(formatTimeInput('08')).toBe('08');
  });
  it('falls back to defaults on bad data', () => {
    expect(parseReminderSettings(null)).toEqual(DEFAULT_REMINDERS);
    expect(parseReminderSettings('nonsense')).toEqual(DEFAULT_REMINDERS);
    const s = parseReminderSettings(
      JSON.stringify({ morning: { on: true, time: '99:99' }, weighIn: { day: 9 }, spice: 'nuclear' }),
    );
    expect(s.morning).toEqual({ on: true, time: '08:00' });
    expect(s.weighIn.day).toBe(1);
    expect(s.spice).toBe('banter');
  });
});

describe('schedule', () => {
  const all: ReminderSettings = {
    morning: { on: true, time: '08:00' },
    evening: { on: true, time: '20:00' },
    weighIn: { on: true, day: 1, time: '07:30' }, // Monday
    spice: 'banter',
  };
  const ctx = (days: ReminderContext['days'], kg = 20): ReminderContext => ({
    kgToGoal: kg,
    mode: 'lose',
    days,
  });

  it('plans the week and uses tonight to judge tomorrow morning', () => {
    const now = new Date(2026, 10, 4, 20, 30); // Wed, after the 20:00 reminder time
    const plan = planReminders({
      now,
      settings: all,
      ctx: ctx({ '2026-11-04': snap({ eatenKcal: 2200 }) }),
    });
    expect(plan).toHaveLength(14); // 6 mornings + 6 evenings + 2 Mondays
    const first = plan.find((p) => p.id === 'morning-2026-11-05')!;
    expect(first.body).toContain('300'); // over budget by 300
    expect(plan.find((p) => p.id === 'morning-2026-11-06')!.title).toBe('Good morning');
    expect(plan.map((p) => p.at.getTime())).toEqual([...plan.map((p) => p.at.getTime())].sort((a, b) => a - b));
    expect(plan.filter((p) => p.id.startsWith('weighin-')).map((p) => p.id)).toEqual([
      'weighin-2026-11-09',
      'weighin-2026-11-16',
    ]);
  });
  it('stays generic before 6 pm, because the day is not finished', () => {
    const now = new Date(2026, 10, 4, 10, 0);
    const plan = planReminders({
      now,
      settings: { ...all, evening: { ...all.evening, on: false }, weighIn: { ...all.weighIn, on: false } },
      ctx: ctx({ '2026-11-04': snap({ eatenKcal: 2200 }) }),
    });
    expect(plan[0].title).toBe('Good morning');
  });
  it("uses yesterday's finished data for a morning that is still ahead today", () => {
    const now = new Date(2026, 10, 4, 7, 0);
    const plan = planReminders({
      now,
      settings: { ...all, evening: { ...all.evening, on: false }, weighIn: { ...all.weighIn, on: false } },
      ctx: ctx({ '2026-11-03': snap({ stepsDone: 2000 }) }),
    });
    expect(plan[0].id).toBe('morning-2026-11-04');
    expect(plan[0].body).toContain('2,000');
  });
  it('schedules nothing when everything is off, and skips times that have passed', () => {
    const off = { ...all, morning: { ...all.morning, on: false }, evening: { ...all.evening, on: false }, weighIn: { ...all.weighIn, on: false } };
    expect(planReminders({ now: new Date(2026, 10, 4, 9, 0), settings: off, ctx: ctx({}) })).toHaveLength(0);
    const plan = planReminders({ now: new Date(2026, 10, 4, 21, 0), settings: all, ctx: ctx({}) });
    expect(plan.some((p) => p.id === 'evening-2026-11-04')).toBe(false);
  });
  it('switches to encouraging lines near the goal', () => {
    const plan = planReminders({
      now: new Date(2026, 10, 4, 21, 0),
      settings: { ...all, morning: { ...all.morning, on: false }, weighIn: { ...all.weighIn, on: false } },
      ctx: ctx({}, 2),
    });
    expect(LINES.evening.near.some((l) => l.replace('{kg}', '2.0') === plan[0].body)).toBe(true);
  });
});