import { describe, expect, it } from 'vitest';
import { SEED_FOODS } from '../data/seed-foods';
import { normalize, searchFoods, validateFoodForm, findDuplicateFood} from './index';

const foods = SEED_FOODS.map((f) => ({
  name: f.name,
  category: f.category,
  servingLabel: f.serving,
}));

describe('food search', () => {
  it('normalizes case and punctuation', () => {
    expect(normalize('  Efo-Riro!! ')).toBe('efo riro');
  });
  it('finds egusi soup first', () => {
    expect(searchFoods(foods, 'egusi')[0].name).toBe('Egusi soup');
  });
  it('finds fried plantain by its local name', () => {
    expect(searchFoods(foods, 'dodo')[0].name).toContain('Fried plantain');
  });
  it('matches several words in any order', () => {
    expect(searchFoods(foods, 'rice jollof')[0].name).toBe('Jollof rice');
  });
  it('returns nothing for gibberish', () => {
    expect(searchFoods(foods, 'xyzzy')).toHaveLength(0);
  });
  it('returns everything for an empty query', () => {
    expect(searchFoods(foods, '')).toHaveLength(foods.length);
  });
});

describe('seed data', () => {
  it('has unique keys', () => {
    const keys = SEED_FOODS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('has sane values', () => {
    for (const f of SEED_FOODS) {
      expect(Number.isInteger(f.kcal)).toBe(true);
      expect(f.kcal).toBeGreaterThanOrEqual(0);
      expect(f.kcal).toBeLessThanOrEqual(1500);
      expect(f.name.length).toBeGreaterThan(1);
      expect(f.serving.length).toBeGreaterThan(0);
    }
  });
});

describe('food form validation', () => {
  it('accepts a valid food', () => {
    const r = validateFoodForm({ name: ' Ofada rice ', servingLabel: '1 plate', kcal: '520.4' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ name: 'Ofada rice', servingLabel: '1 plate', kcal: 520 });
  });
  it('accepts zero calories', () => {
    expect(validateFoodForm({ name: 'Water', servingLabel: '1 glass', kcal: '0' }).ok).toBe(true);
  });
  it('rejects bad input', () => {
    expect(validateFoodForm({ name: '', servingLabel: '1 plate', kcal: '100' }).ok).toBe(false);
    expect(validateFoodForm({ name: 'Rice', servingLabel: '', kcal: '100' }).ok).toBe(false);
    expect(validateFoodForm({ name: 'Rice', servingLabel: '1 plate', kcal: 'abc' }).ok).toBe(false);
    expect(validateFoodForm({ name: 'Rice', servingLabel: '1 plate', kcal: '5000' }).ok).toBe(false);
  });
});

describe('duplicate detection', () => {
  const list = [
    { id: 1, name: 'Ofada rice', servingLabel: '1 plate' },
    { id: 2, name: 'Coca-Cola', servingLabel: '50 cl bottle' },
  ];
  it('finds the same food ignoring case and spacing', () => {
    expect(findDuplicateFood(list, ' ofada  RICE ', '1 Plate')?.id).toBe(1);
  });
  it('allows the same name with a different serving', () => {
    expect(findDuplicateFood(list, 'Coca-Cola', '35 cl bottle')).toBeUndefined();
  });
  it('ignores the food being edited', () => {
    expect(findDuplicateFood(list, 'Ofada rice', '1 plate', 1)).toBeUndefined();
  });
});