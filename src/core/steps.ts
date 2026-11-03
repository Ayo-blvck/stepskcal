import { NET_WALK_KCAL_PER_KG_KM, STEP_LENGTH_FACTOR } from './constants';

export function stepLengthM(heightCm: number): number {
  return (heightCm * STEP_LENGTH_FACTOR) / 100;
}

export function kcalPerStep(weightKg: number, heightCm: number): number {
  return (NET_WALK_KCAL_PER_KG_KM * weightKg * stepLengthM(heightCm)) / 1000;
}

export function stepTarget(i: {
  overageKcal: number;
  kcalPerStep: number;
  stepFloor: number;
  stepCap: number;
}): { target: number; uncoveredKcal: number } {
  const raw = i.stepFloor + i.overageKcal / i.kcalPerStep;
  const target = Math.min(i.stepCap, Math.ceil(raw / 50) * 50);
  const uncoveredKcal = raw > i.stepCap ? Math.round((raw - i.stepCap) * i.kcalPerStep) : 0;
  return { target, uncoveredKcal };
}