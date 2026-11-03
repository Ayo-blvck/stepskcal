export interface SearchableFood {
  name: string;
  category: string;
  servingLabel: string;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** 0 means no match. Every word in the query must match somewhere. */
export function scoreFood(query: string, food: SearchableFood): number {
  const q = normalize(query);
  if (q === '') return 1;
  const name = normalize(food.name);
  const other = normalize(`${food.category} ${food.servingLabel}`);

  let score = 0;
  for (const word of q.split(' ')) {
    if (` ${name}`.includes(` ${word}`)) score += 3; // word starts in the name
    else if (name.includes(word)) score += 2;
    else if (other.includes(word)) score += 1;
    else return 0;
  }
  if (name === q) score += 10;
  else if (name.startsWith(q)) score += 5;
  return score;
}

export function searchFoods<T extends SearchableFood>(foods: T[], query: string): T[] {
  return foods
    .map((f) => ({ f, s: scoreFood(query, f) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.f.name.localeCompare(b.f.name))
    .map((x) => x.f);
}

export function findDuplicateFood<T extends { id: number; name: string; servingLabel: string }>(
  foods: T[],
  name: string,
  servingLabel: string,
  excludeId?: number | null,
): T | undefined {
  const n = normalize(name);
  const s = normalize(servingLabel);
  return foods.find(
    (f) => f.id !== excludeId && normalize(f.name) === n && normalize(f.servingLabel) === s,
  );
}