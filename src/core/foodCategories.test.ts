import { describe, expect, it } from 'vitest';
import { SEED_FOODS } from '../data/seed-foods';
import {
  CATEGORY_ORDER,
  categoriesPresent,
  categoryLabel,
  filterByCategory,
  searchFoods,
} from './index';

const foods = SEED_FOODS.map((f) => ({ name: f.name, category: f.category, servingLabel: f.serving }));

describe('food categories', () => {
  it('knows every category used by the starter foods', () => {
    for (const f of SEED_FOODS) expect(CATEGORY_ORDER).toContain(f.category);
  });
  it('labels known and unknown keys', () => {
    expect(categoryLabel('soup')).toBe('Soups');
    expect(categoryLabel('rice_pasta')).toBe('Rice & pasta');
    expect(categoryLabel('my_stuff')).toBe('My stuff');
  });
  it('lists only categories that have foods, in order', () => {
    const list = categoriesPresent([
      { category: 'snack' },
      { category: 'swallow' },
      { category: 'custom' },
      { category: 'zzz' },
      { category: 'snack' },
    ]);
    expect(list.map((c) => c.key)).toEqual(['swallow', 'snack', 'custom', 'zzz']);
    expect(list[0].label).toBe('Swallow');
  });
  it('filters by category and combines with search', () => {
    expect(filterByCategory(foods, null)).toHaveLength(foods.length);
    const swallow = filterByCategory(foods, 'swallow');
    expect(swallow.length).toBeGreaterThan(3);
    expect(swallow.every((f) => f.category === 'swallow')).toBe(true);
    const hits = searchFoods(swallow, 'wheat');
    expect(hits).toHaveLength(1);
    expect(hits[0].name).toContain('Wheat');
    expect(searchFoods(swallow, 'jollof')).toHaveLength(0);
  });
});