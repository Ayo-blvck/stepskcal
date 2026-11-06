import { projectGoalDate, type WeightStats } from './weight';

export function signedKg(x: number): string {
  const r = Math.round(x * 10) / 10;
  return r > 0 ? `+${r.toFixed(1)}` : r < 0 ? `−${Math.abs(r).toFixed(1)}` : '0.0';
}

export interface ProgressInput {
  stats: WeightStats;
  goalKg: number;
  stretchKg: number | null;
  today: string;
  mode: 'lose' | 'maintain';
}

export interface ProgressSummary {
  headline: string;
  facts: { label: string; value: string }[];
}

export function progressSummary(i: ProgressInput, fmtDate: (key: string) => string): ProgressSummary {
  const s = i.stats;

  let headline: string;
  if (i.mode === 'maintain') {
    const diff = s.currentKg - i.goalKg;
    headline =
      Math.abs(diff) < 0.05
        ? `Right on your ${i.goalKg} kg target`
        : `${Math.abs(diff).toFixed(1)} kg ${diff > 0 ? 'above' : 'below'} your ${i.goalKg} kg target`;
  } else if (s.toGoalKg <= 0) {
    headline = 'Goal reached';
  } else {
    headline = `${s.toGoalKg.toFixed(1)} kg to go`;
    if (s.vsPlanKg !== null && s.plannedKgToday !== null) {
      const v = s.vsPlanKg;
      const planned = s.plannedKgToday.toFixed(1);
      headline +=
        Math.abs(v) < 0.5
          ? ` · on plan (${planned} kg)`
          : v < 0
            ? ` · ${Math.abs(v).toFixed(1)} kg ahead of plan (${planned} kg)`
            : ` · ${v.toFixed(1)} kg behind plan (${planned} kg)`;
    }
  }

  const facts: { label: string; value: string }[] = [];
  if (s.startDate !== s.currentDate) {
    facts.push({ label: 'Since you started', value: `${signedKg(s.changeKg)} kg` });
  }
  facts.push({
    label: 'Pace',
    value: s.weeklyRateKg === null ? 'Needs a week of weigh-ins' : `${signedKg(s.weeklyRateKg)} kg / week`,
  });
  if (i.mode === 'lose' && s.toGoalKg > 0 && s.weeklyRateKg !== null) {
    facts.push({
      label: 'Projected goal date',
      value: s.projectedGoalDate ? fmtDate(s.projectedGoalDate) : 'Not yet, weight is flat or rising',
    });
  }
  if (
    i.mode === 'lose' &&
    i.stretchKg !== null &&
    s.currentKg > i.stretchKg &&
    s.weeklyRateKg !== null
  ) {
    const d = projectGoalDate(s.currentKg, i.stretchKg, s.weeklyRateKg, i.today);
    facts.push({ label: `Stretch goal ${i.stretchKg} kg`, value: d ? fmtDate(d) : 'Not yet' });
  }

  return { headline, facts };
}

/** Index of the x position closest to x, or -1 when there are none. */
export function nearestIndex(xs: number[], x: number): number {
  if (xs.length === 0) return -1;
  let best = 0;
  let bestDist = Math.abs(xs[0] - x);
  for (let i = 1; i < xs.length; i++) {
    const d = Math.abs(xs[i] - x);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}