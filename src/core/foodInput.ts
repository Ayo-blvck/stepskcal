export interface RawFoodForm {
  name: string;
  servingLabel: string;
  kcal: string;
}

export type FoodFormErrors = Partial<Record<keyof RawFoodForm, string>>;

export type FoodValidation =
  | { ok: true; value: { name: string; servingLabel: string; kcal: number } }
  | { ok: false; errors: FoodFormErrors };

export function validateFoodForm(f: RawFoodForm): FoodValidation {
  const errors: FoodFormErrors = {};

  const name = f.name.trim();
  if (name.length < 2 || name.length > 60) errors.name = 'Enter a name (2 to 60 characters)';

  const servingLabel = f.servingLabel.trim();
  if (servingLabel.length < 1 || servingLabel.length > 60) {
    errors.servingLabel = 'Describe one serving, for example "1 plate"';
  }

  const t = f.kcal.trim().replace(',', '.');
  const kcal = t === '' ? NaN : Number(t);
  if (!Number.isFinite(kcal) || kcal < 0 || kcal > 3000) {
    errors.kcal = 'Enter calories from 0 to 3000';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, servingLabel, kcal: Math.round(kcal) } };
}