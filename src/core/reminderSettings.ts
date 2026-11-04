import type { Spice } from '../data/reminder-lines';

export interface ReminderSettings {
  morning: { on: boolean; time: string };
  evening: { on: boolean; time: string };
  weighIn: { on: boolean; day: number; time: string }; // day: 0 = Sunday ... 6 = Saturday
  spice: Spice;
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  morning: { on: false, time: '08:00' },
  evening: { on: false, time: '20:00' },
  weighIn: { on: false, day: 1, time: '07:30' },
  spice: 'banter',
};

export function parseTime(s: string): { h: number; m: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(s.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return { h, m };
}

/** Turns typed digits into HH:MM as the user types. */
export function formatTimeInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

export function anyReminderOn(s: ReminderSettings): boolean {
  return s.morning.on || s.evening.on || s.weighIn.on;
}

const asObj = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
const asBool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const asTime = (v: unknown, d: string) => (typeof v === 'string' && parseTime(v) ? v : d);

export function parseReminderSettings(json: string | null): ReminderSettings {
  if (!json) return DEFAULT_REMINDERS;
  let raw: Record<string, unknown>;
  try {
    raw = asObj(JSON.parse(json));
  } catch {
    return DEFAULT_REMINDERS;
  }
  const d = DEFAULT_REMINDERS;
  const m = asObj(raw.morning);
  const e = asObj(raw.evening);
  const w = asObj(raw.weighIn);
  const spice: Spice =
    raw.spice === 'gentle' || raw.spice === 'banter' || raw.spice === 'roast' ? raw.spice : d.spice;
  const day =
    typeof w.day === 'number' && Number.isInteger(w.day) && w.day >= 0 && w.day <= 6
      ? w.day
      : d.weighIn.day;

  return {
    morning: { on: asBool(m.on, d.morning.on), time: asTime(m.time, d.morning.time) },
    evening: { on: asBool(e.on, d.evening.on), time: asTime(e.time, d.evening.time) },
    weighIn: { on: asBool(w.on, d.weighIn.on), day, time: asTime(w.time, d.weighIn.time) },
    spice,
  };
}