import { KCAL_PER_KG_FAT } from './constants';

export type GoalVerdict = 'reached' | 'on_track' | 'tight' | 'behind';

export interface GoalOutlook {
  kgToLose: number;
  requiredDailyKcal: number | null; // null when there is no target date
  plannedDailyKcal: number;
  daysNeeded: number | null;
  verdict: GoalVerdict;
}

/**
 * plannedDaily = food deficit + calories burned by the step floor.
 * Verdict compares it with the daily deficit the target date requires.
 */
export function goalOutlook(i: {
  weightKg: number;
  goalKg: number;
  daysLeft: number | null;
  deficitKcal: number;
  stepFloor: number;
  kcalPerStep: number;
}): GoalOutlook {
  const kgToLose = Math.max(0, i.weightKg - i.goalKg);
  const planned = i.deficitKcal + i.stepFloor * i.kcalPerStep;

  if (kgToLose === 0) {
    return {
      kgToLose: 0,
      requiredDailyKcal: null,
      plannedDailyKcal: Math.round(planned),
      daysNeeded: null,
      verdict: 'reached',
    };
  }

  const needed = kgToLose * KCAL_PER_KG_FAT;
  const daysNeeded = planned > 0 ? Math.ceil(needed / planned) : null;

  if (i.daysLeft === null || i.daysLeft <= 0) {
    return {
      kgToLose,
      requiredDailyKcal: null,
      plannedDailyKcal: Math.round(planned),
      daysNeeded,
      verdict: 'on_track',
    };
  }

  const required = needed / i.daysLeft;
  const verdict: GoalVerdict =
    required <= planned ? 'on_track' : required <= planned * 1.15 ? 'tight' : 'behind';

  return {
    kgToLose,
    requiredDailyKcal: Math.round(required),
    plannedDailyKcal: Math.round(planned),
    daysNeeded,
    verdict,
  };
}