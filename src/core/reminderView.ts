const PLURAL = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function weighInSubtitle(day: number): string {
  return PLURAL[day] ?? 'Weekly';
}

export const QUICK_TIMES = {
  morning: ['06:30', '07:00', '08:00', '09:00'],
  evening: ['18:00', '19:00', '20:00', '21:00'],
  weighIn: ['07:00', '07:30', '08:00', '09:00'],
} as const;

export function scheduleSummary(count: number, anyOn: boolean): string {
  if (!anyOn) return 'All reminders are off.';
  if (count === 0) return 'Saved. Nothing is due in the coming days.';
  return `Saved · ${count} ${count === 1 ? 'reminder' : 'reminders'} scheduled. They refresh every time you open the app.`;
}