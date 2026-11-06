import { ageOn } from './bmr';
import { cmToFtIn } from './profileInput';

export interface ProfileLike {
  sex: 'male' | 'female';
  birthDate: string;
  heightCm: number;
  goalWeightKg: number;
  stretchGoalKg: number | null;
  targetDate: string | null;
  dailyDeficitKcal: number;
  stepFloor: number;
  mode: 'lose' | 'maintain';
}

export function profileRows(
  p: ProfileLike,
  weightKg: number | null,
  now: Date,
  fmtDate: (key: string) => string,
): { label: string; value: string }[] {
  const { ft, inch } = cmToFtIn(p.heightCm);
  const inchText = Number.isInteger(inch) ? String(inch) : inch.toFixed(1);

  const rows = [
    { label: 'Sex', value: p.sex === 'male' ? 'Male' : 'Female' },
    { label: 'Age', value: String(ageOn(p.birthDate, now)) },
    { label: 'Height', value: `${ft} ft ${inchText} in · ${Math.round(p.heightCm)} cm` },
  ];
  if (weightKg !== null) rows.push({ label: 'Current weight', value: `${weightKg.toFixed(1)} kg` });
  rows.push({ label: 'Goal weight', value: `${p.goalWeightKg} kg` });
  if (p.stretchGoalKg !== null) rows.push({ label: 'Stretch goal', value: `${p.stretchGoalKg} kg` });
  if (p.targetDate) rows.push({ label: 'Target date', value: fmtDate(p.targetDate) });
  rows.push({
    label: 'Daily deficit',
    value: p.mode === 'maintain' ? 'Paused while maintaining' : `${p.dailyDeficitKcal} kcal`,
  });
  rows.push({ label: 'Minimum steps', value: p.stepFloor.toLocaleString('en-US') });
  rows.push({ label: 'Mode', value: p.mode === 'maintain' ? 'Maintaining' : 'Losing weight' });
  return rows;
}