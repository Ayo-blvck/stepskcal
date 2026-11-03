import { ACTIVITY_FACTOR_SEDENTARY } from './constants';
import type { Sex } from './types';

export function ageOn(birthDate: string, on: Date): number {
  const [y, m, d] = birthDate.split('-').map(Number);
  let age = on.getFullYear() - y;
  const month = on.getMonth() + 1;
  const hadBirthday = month > m || (month === m && on.getDate() >= d);
  if (!hadBirthday) age -= 1;
  return age;
}

export function bmr(p: { sex: Sex; weightKg: number; heightCm: number; age: number }): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === 'male' ? base + 5 : base - 161;
}

export function maintenanceKcal(bmrKcal: number, factor = ACTIVITY_FACTOR_SEDENTARY): number {
  return bmrKcal * factor;
}