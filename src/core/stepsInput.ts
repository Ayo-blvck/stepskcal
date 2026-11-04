export type StepsParse =
  | { kind: 'empty' }
  | { kind: 'ok'; steps: number }
  | { kind: 'error'; message: string };

export function parseSteps(s: string): StepsParse {
  const t = s.trim().replace(/[,\s]/g, '');
  if (t === '') return { kind: 'empty' };
  if (!/^\d+$/.test(t)) return { kind: 'error', message: 'Use digits only, for example 8432' };
  const n = Number(t);
  if (n > 100000) return { kind: 'error', message: 'That looks too high. Check the number' };
  return { kind: 'ok', steps: n };
}

export function stepProgress(
  done: number,
  target: number,
): { fraction: number; remaining: number; reached: boolean } {
  const remaining = Math.max(0, target - done);
  const fraction = target <= 0 ? 1 : Math.min(1, done / target);
  return { fraction, remaining, reached: remaining === 0 };
}