import { describe, expect, it } from 'vitest';
import { QUICK_TIMES, WEEKDAY_SHORT, parseTime, scheduleSummary, weighInSubtitle } from './index';

describe('reminder view helpers', () => {
  it('names the weigh-in day', () => {
    expect(weighInSubtitle(1)).toBe('Mondays');
    expect(weighInSubtitle(0)).toBe('Sundays');
    expect(weighInSubtitle(6)).toBe('Saturdays');
    expect(weighInSubtitle(9)).toBe('Weekly');
    expect(WEEKDAY_SHORT).toHaveLength(7);
  });
  it('offers only valid quick times', () => {
    for (const list of Object.values(QUICK_TIMES)) {
      for (const time of list) expect(parseTime(time)).not.toBeNull();
    }
  });
  it('summarises what was scheduled', () => {
    expect(scheduleSummary(0, false)).toBe('All reminders are off.');
    expect(scheduleSummary(0, true)).toBe('Saved. Nothing is due in the coming days.');
    expect(scheduleSummary(1, true)).toContain('1 reminder scheduled');
    expect(scheduleSummary(14, true)).toContain('14 reminders scheduled');
  });
});