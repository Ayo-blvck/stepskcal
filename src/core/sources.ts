export type StepStrategy = 'higher' | 'watch' | 'phone';

export function resolveSteps(i: {
  phone?: number | null;
  watch?: number | null;
  strategy?: StepStrategy;
}): number {
  const phone = i.phone ?? 0;
  const watch = i.watch ?? 0;
  switch (i.strategy ?? 'higher') {
    case 'watch':
      return watch > 0 ? watch : phone;
    case 'phone':
      return phone;
    default:
      return Math.max(phone, watch);
  }
}