import { ageOn } from './bmr';
import { suggestMode } from './budget';
import type { Mode, Sex } from './types';

export interface RawProfileForm {
  sex: Sex | null;
  birthDate: string;
  heightUnit: 'cm' | 'ft';
  heightCm: string;
  heightFt: string;
  heightIn: string;
  weightKg: string;
  goalWeightKg: string;
  stretchGoalKg: string;
  targetDate: string;
  dailyDeficitKcal: string;
  stepFloor: string;
}

export interface ValidProfile {
  sex: Sex;
  birthDate: string;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  stretchGoalKg: number | null;
  targetDate: string | null;
  mode: Mode;
  dailyDeficitKcal: number;
  stepFloor: number;
}

export type FormErrors = Partial<Record<keyof RawProfileForm, string>>;
export type ValidationResult =
  | { ok: true; value: ValidProfile }
  | { ok: false; errors: FormErrors };

export const emptyForm: RawProfileForm = {
  sex: null,
  birthDate: '',
  heightUnit: 'ft',
  heightCm: '',
  heightFt: '',
  heightIn: '',
  weightKg: '',
  goalWeightKg: '',
  stretchGoalKg: '',
  targetDate: '',
  dailyDeficitKcal: '500',
  stepFloor: '8000',
};

export const MIN_HEALTHY_BMI = 18.5;

export function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * 2.54 * 10) / 10;
}

export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const total = cm / 2.54;
  let ft = Math.floor(total / 12);
  let inch = Math.round((total - ft * 12) * 10) / 10;
  if (inch >= 12) {
    ft += 1;
    inch = 0;
  }
  return { ft, inch };
}

export function minHealthyWeightKg(heightCm: number): number {
  const m = heightCm / 100;
  return Math.ceil(MIN_HEALTHY_BMI * m * m * 10) / 10;
}

/** Turns typed digits into YYYY-MM-DD as the user types. */
export function formatDateInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

export function isValidDateKey(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

function keyOf(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function num(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function formFromProfile(
  p: {
    sex: Sex;
    birthDate: string;
    heightCm: number;
    goalWeightKg: number;
    stretchGoalKg: number | null;
    targetDate: string | null;
    dailyDeficitKcal: number;
    stepFloor: number;
  },
  weightKg: number,
): RawProfileForm {
  const { ft, inch } = cmToFtIn(p.heightCm);
  return {
    sex: p.sex,
    birthDate: p.birthDate,
    heightUnit: 'ft',
    heightCm: String(p.heightCm),
    heightFt: String(ft),
    heightIn: String(inch),
    weightKg: String(weightKg),
    goalWeightKg: String(p.goalWeightKg),
    stretchGoalKg: p.stretchGoalKg == null ? '' : String(p.stretchGoalKg),
    targetDate: p.targetDate ?? '',
    dailyDeficitKcal: String(p.dailyDeficitKcal),
    stepFloor: String(p.stepFloor),
  };
}

export function validateProfileForm(f: RawProfileForm, today: Date): ValidationResult {
  const errors: FormErrors = {};

  if (!f.sex) errors.sex = 'Choose one';

  const birthDate = f.birthDate.trim();
  if (!isValidDateKey(birthDate)) {
    errors.birthDate = 'Use the format YYYY-MM-DD';
  } else {
    const age = ageOn(birthDate, today);
    if (age < 18) errors.birthDate = 'This app is for adults (18+)';
    else if (age > 100) errors.birthDate = 'Please check the year';
  }

  let heightCm: number | null = null;
  if (f.heightUnit === 'cm') {
    heightCm = num(f.heightCm);
    if (heightCm === null) errors.heightCm = 'Enter your height in cm';
  } else {
    const ft = num(f.heightFt);
    const inch = f.heightIn.trim() === '' ? 0 : num(f.heightIn);
    if (ft === null || ft < 3 || ft > 8) errors.heightFt = 'Enter whole feet, for example 5';
    else if (inch === null || inch < 0 || inch >= 12) errors.heightIn = 'Inches should be from 0 to 11';
    else heightCm = ftInToCm(ft, inch);
  }
  if (heightCm !== null && (heightCm < 120 || heightCm > 230)) {
    if (f.heightUnit === 'cm') errors.heightCm = 'Height should be between 120 and 230 cm';
    else errors.heightFt = 'Height should be between about 4 ft and 7 ft 6 in';
    heightCm = null;
  }

  const weightKg = num(f.weightKg);
  if (weightKg === null || weightKg < 30 || weightKg > 300) {
    errors.weightKg = 'Enter a weight between 30 and 300 kg';
  }

  const floor = heightCm === null ? null : minHealthyWeightKg(heightCm);
  const goalKg = num(f.goalWeightKg);
  if (goalKg === null || goalKg < 30 || goalKg > 300) {
    errors.goalWeightKg = 'Enter a goal between 30 and 300 kg';
  } else if (floor !== null && goalKg < floor) {
    errors.goalWeightKg = `Too low for your height. The healthy minimum is about ${floor} kg`;
  }

  let stretchGoalKg: number | null = null;
  if (f.stretchGoalKg.trim() !== '') {
    stretchGoalKg = num(f.stretchGoalKg);
    if (stretchGoalKg === null || stretchGoalKg < 30) {
      errors.stretchGoalKg = 'Enter a weight in kg, or leave this blank';
    } else if (floor !== null && stretchGoalKg < floor) {
      errors.stretchGoalKg = `Too low for your height. The healthy minimum is about ${floor} kg`;
    } else if (goalKg !== null && stretchGoalKg > goalKg) {
      errors.stretchGoalKg = 'Stretch goal should be at or below your goal';
    }
  }

  let targetDate: string | null = null;
  if (f.targetDate.trim() !== '') {
    const t = f.targetDate.trim();
    if (!isValidDateKey(t)) errors.targetDate = 'Use the format YYYY-MM-DD';
    else if (t <= keyOf(today)) errors.targetDate = 'Pick a date in the future';
    else targetDate = t;
  }

  const deficit = num(f.dailyDeficitKcal);
  if (deficit === null || !Number.isInteger(deficit) || deficit < 0 || deficit > 1000) {
    errors.dailyDeficitKcal = 'Whole number from 0 to 1000';
  }

  const stepFloor = num(f.stepFloor);
  if (stepFloor === null || !Number.isInteger(stepFloor) || stepFloor < 2000 || stepFloor > 15000) {
    errors.stepFloor = 'Whole number from 2000 to 15000';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      sex: f.sex!,
      birthDate,
      heightCm: heightCm!,
      weightKg: weightKg!,
      goalWeightKg: goalKg!,
      stretchGoalKg,
      targetDate,
      mode: suggestMode(weightKg!, goalKg!),
      dailyDeficitKcal: deficit!,
      stepFloor: stepFloor!,
    },
  };
}