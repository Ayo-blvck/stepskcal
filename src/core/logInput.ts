export const PORTION_CHIPS = [0.5, 1, 1.5, 2, 3];

export function scaleKcal(perServing: number, quantity: number): number {
  return Math.round(perServing * quantity);
}

/** Returns null when the text is not a number from 0.25 to 20. */
export function parseQuantity(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0.25 || n > 20) return null;
  return Math.round(n * 100) / 100;
}

export function formatQuantity(q: number): string {
  const whole = Math.floor(q);
  const frac = Math.round((q - whole) * 100) / 100;
  const sym: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
  if (frac === 0) return String(whole);
  const f = sym[frac];
  if (!f) return String(q);
  return whole === 0 ? f : `${whole}${f}`;
}

export interface EntryForm {
  name: string;
  qty: string;
  kcal: string;
}

export type EntryErrors = Partial<Record<keyof EntryForm, string>>;

export type EntryValidation =
  | { ok: true; value: { name: string; quantity: number; kcal: number } }
  | { ok: false; errors: EntryErrors };

export function validateEntry(f: EntryForm, mode: 'food' | 'quick'): EntryValidation {
  const errors: EntryErrors = {};

  let quantity = 1;
  if (mode === 'food') {
    const q = parseQuantity(f.qty);
    if (q === null) errors.qty = 'Enter a number from 0.25 to 20';
    else quantity = q;
  }

  const t = f.kcal.trim().replace(',', '.');
  const kcal = t === '' ? NaN : Number(t);
  const min = mode === 'quick' ? 1 : 0;
  if (!Number.isFinite(kcal) || kcal < min || kcal > 5000) {
    errors.kcal = `Enter calories from ${min} to 5000`;
  }

  const name = mode === 'quick' ? f.name.trim() || 'Quick add' : f.name.trim();
  if (name.length > 60) errors.name = 'Keep the name under 60 characters';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, quantity, kcal: Math.round(kcal) } };
}