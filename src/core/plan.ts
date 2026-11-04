import { ACTIVITY_CREDIT } from './constants';
import { activityBonusKcal } from './activity';
import { ageOn, bmr, maintenanceKcal } from './bmr';
import { foodBudget } from './budget';
import { kcalPerStep, stepTarget } from './steps';
import type { Mode, Sex } from './types';

export interface PlanInput {
  sex: Sex;
  birthDate: string; // yyyy-mm-dd
  heightCm: number;
  weightKg: number;
  mode: Mode;
  dailyDeficitKcal: number;
  stepFloor: number;
  stepCap: number;
  date: Date;
  eatenKcal: number;
  activityKcal: number;
  /** When given, replaces activityKcal: each session's calories minus what its steps already earn. */
  activities?: { kcal: number; stepsCounted: number }[];
  stepsDone: number;
}

export interface DayPlan {
  maintenanceKcal: number;
  budgetKcal: number;
  effectiveDeficitKcal: number;
  limitedByFloor: boolean;
  remainingKcal: number;
  overageKcal: number;
  activityCreditKcal: number;
  kcalPerStep: number;
  stepTarget: number;
  stepsRemaining: number;
  uncoveredKcal: number;
}

export function planDay(i: PlanInput): DayPlan {
  const age = ageOn(i.birthDate, i.date);
  const maintenance = maintenanceKcal(bmr({ sex: i.sex, weightKg: i.weightKg, heightCm: i.heightCm, age }));
  const b = foodBudget({
    maintenanceKcal: maintenance,
    sex: i.sex,
    mode: i.mode,
    dailyDeficitKcal: i.dailyDeficitKcal,
  });

  const kps = kcalPerStep(i.weightKg, i.heightCm);
  const bonus = i.activities
    ? i.activities.reduce((sum, a) => sum + activityBonusKcal(a.kcal, a.stepsCounted, kps), 0)
    : i.activityKcal;
  const credit = bonus * ACTIVITY_CREDIT;

  const allowance = b.budgetKcal + credit;
  const overage = Math.max(0, i.eatenKcal - allowance);
  const { target, uncoveredKcal } = stepTarget({
    overageKcal: overage,
    kcalPerStep: kps,
    stepFloor: i.stepFloor,
    stepCap: i.stepCap,
  });

  return {
    maintenanceKcal: Math.round(maintenance),
    budgetKcal: b.budgetKcal,
    effectiveDeficitKcal: b.effectiveDeficitKcal,
    limitedByFloor: b.limitedByFloor,
    remainingKcal: Math.round(allowance - i.eatenKcal),
    overageKcal: Math.round(overage),
    activityCreditKcal: Math.round(credit),
    kcalPerStep: kps,
    stepTarget: target,
    stepsRemaining: Math.max(0, target - i.stepsDone),
    uncoveredKcal,
  };
}