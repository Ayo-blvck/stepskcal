import { dayNumber } from './weight';

const n = (x: number) => Math.round(x).toLocaleString('en-US');

// ---------- hero rings ----------

export interface TodayInput {
  stepsDone: number;
  stepTarget: number;
  stepFloor: number;
  stepCap: number;
  hasSteps: boolean;
  eatenKcal: number;
  budgetKcal: number;
  activityCreditKcal: number;
  overageKcal: number;
  uncoveredKcal: number;
}

export interface RingView {
  value: string;
  label: string;
  sub: string;
  progress: number;
}

export interface TodayView {
  steps: RingView & { reached: boolean };
  kcal: RingView & { over: boolean };
  note: string;
}

export function buildTodayView(i: TodayInput): TodayView {
  const stepsRemaining = Math.max(0, i.stepTarget - i.stepsDone);
  const reached = stepsRemaining === 0;

  const allowance = i.budgetKcal + i.activityCreditKcal;
  const remaining = Math.round(allowance - i.eatenKcal);
  const over = remaining < 0;

  let note: string;
  if (i.overageKcal > 0) {
    const extra = Math.max(0, i.stepTarget - i.stepFloor);
    note = `+${n(extra)} steps added for ${n(i.overageKcal)} kcal over budget.`;
    if (i.uncoveredKcal > 0) {
      note += ` The cap is ${n(i.stepCap)} steps, so about ${n(i.uncoveredKcal)} kcal can't be walked off today. Accept it and reset tomorrow.`;
    }
  } else if (!i.hasSteps) {
    note = "Within budget. Add your watch steps to track today's walk.";
  } else {
    note = `Within budget, so your target stays at ${n(i.stepTarget)} steps.`;
  }

  return {
    steps: {
      value: reached ? 'Done' : n(stepsRemaining),
      label: reached ? 'target reached' : 'steps to go',
      sub: `${n(i.stepsDone)} of ${n(i.stepTarget)}`,
      progress: i.stepTarget > 0 ? Math.min(1, i.stepsDone / i.stepTarget) : 1,
      reached,
    },
    kcal: {
      value: n(Math.abs(remaining)),
      label: over ? 'kcal over' : 'kcal left',
      sub: `${n(i.eatenKcal)} of ${n(allowance)}`,
      progress: allowance > 0 ? Math.min(1, i.eatenKcal / allowance) : 1,
      over,
    },
    note,
  };
}

// ---------- goal card ----------

export interface GoalCardInput {
  startKg: number;
  currentKg: number;
  goalKg: number;
  targetDate: string | null;
  today: string;
  vsPlanKg: number | null; // negative = ahead of plan
  mode: 'lose' | 'maintain';
}

export interface GoalCardView {
  title: string;
  right: string | null;
  progress: number;
  detail: string;
}

export function goalCardView(i: GoalCardInput): GoalCardView {
  const toGo = Math.max(0, i.currentKg - i.goalKg);
  const span = i.startKg - i.goalKg;
  const progress = span <= 0 ? 1 : Math.max(0, Math.min(1, (i.startKg - i.currentKg) / span));

  const title = i.mode === 'maintain' ? `Staying at ${i.goalKg} kg` : `Goal: ${i.goalKg} kg`;

  let right: string | null = null;
  if (i.mode === 'lose' && i.targetDate) {
    const days = dayNumber(i.targetDate) - dayNumber(i.today);
    right =
      days > 1 ? `${days} days left` : days === 1 ? '1 day left' : days === 0 ? 'Target date is today' : 'Target date passed';
  }

  const parts = [`${i.currentKg.toFixed(1)} kg now`];
  parts.push(toGo > 0 ? `${toGo.toFixed(1)} kg to go` : 'goal reached');
  if (toGo > 0 && i.mode === 'lose' && i.vsPlanKg !== null) {
    const v = i.vsPlanKg;
    parts.push(
      Math.abs(v) < 0.5
        ? 'right on plan'
        : v < 0
          ? `${Math.abs(v).toFixed(1)} kg ahead of plan`
          : `${v.toFixed(1)} kg behind plan`,
    );
  }

  return { title, right, progress, detail: parts.join(' · ') };
}