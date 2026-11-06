export const CATEGORY_LABELS: Record<string, string> = {
  swallow: 'Swallow',
  soup: 'Soups',
  rice_pasta: 'Rice & pasta',
  yam_plantain: 'Yam & plantain',
  protein: 'Protein',
  snack: 'Snacks',
  fruit: 'Fruit',
  drink: 'Drinks',
  fast_food: 'Fast food',
  other: 'Other',
  custom: 'Custom',
};

export const CATEGORY_ORDER = [
  'swallow',
  'soup',
  'rice_pasta',
  'yam_plantain',
  'protein',
  'snack',
  'fruit',
  'drink',
  'fast_food',
  'other',
  'custom',
];

export function categoryLabel(key: string): string {
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  const spaced = key.replace(/_/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** The categories that actually have foods, in display order. */
export function categoriesPresent(foods: { category: string }[]): { key: string; label: string }[] {
  const present = new Set(foods.map((f) => f.category));
  const known = CATEGORY_ORDER.filter((k) => present.has(k));
  const unknown = [...present].filter((k) => !CATEGORY_ORDER.includes(k)).sort();
  return [...known, ...unknown].map((key) => ({ key, label: categoryLabel(key) }));
}

export function filterByCategory<T extends { category: string }>(foods: T[], key: string | null): T[] {
  return key === null ? foods : foods.filter((f) => f.category === key);
}