import { CALORIE_FLOOR, KCAL_PER_KG_FAT } from './constants';
import type { Mode, Sex } from './types';

export interface Budget {
  budgetKcal: number;
  effectiveDeficitKcal: number;
  limitedByFloor: boolean;
}

export function foodBudget(i: {
  maintenanceKcal: number;
  sex: Sex;
  mode: Mode;
  dailyDeficitKcal: number;
}): Budget {
  const wanted = i.mode === 'maintain' ? 0 : i.dailyDeficitKcal;
  const floor = CALORIE_FLOOR[i.sex];
  const raw = i.maintenanceKcal - wanted;
  const budget = Math.max(raw, floor);
  return {
    budgetKcal: Math.round(budget),
    effectiveDeficitKcal: Math.round(i.maintenanceKcal - budget),
    limitedByFloor: raw < floor,
  };
}

/** Daily deficit needed to reach goalKg in daysLeft days (for a feasibility check). */
export function requiredDailyDeficit(currentKg: number, goalKg: number, daysLeft: number): number {
  if (daysLeft <= 0 || currentKg <= goalKg) return 0;
  return ((currentKg - goalKg) * KCAL_PER_KG_FAT) / daysLeft;
}

export function suggestMode(currentKg: number, goalKg: number): Mode {
  return currentKg <= goalKg ? 'maintain' : 'lose';
}