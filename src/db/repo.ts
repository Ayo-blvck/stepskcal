import { desc, eq, sql } from 'drizzle-orm';
import { planDay, resolveSteps } from '../core';
import { parseDateKey } from '../lib/dates';
import { db } from './client';
import { SEED_FOODS } from '../data/seed-foods';
import {
  activities,
  foodLogs,
  foods,
  profile,
  stepEntries,
  weightLogs,
  type NewProfile,
} from './schema';

export async function getProfile() {
  const rows = await db.select().from(profile).where(eq(profile.id, 1)).limit(1);
  return rows[0] ?? null;
}

export async function saveProfile(input: Omit<NewProfile, 'id' | 'createdAt'>) {
  await db
    .insert(profile)
    .values({ ...input, id: 1, createdAt: Date.now() })
    .onConflictDoUpdate({ target: profile.id, set: input });
}

export async function logWeight(date: string, weightKg: number) {
  await db
    .insert(weightLogs)
    .values({ date, weightKg, createdAt: Date.now() })
    .onConflictDoUpdate({ target: weightLogs.date, set: { weightKg } });
}

export async function latestWeight() {
  const rows = await db.select().from(weightLogs).orderBy(desc(weightLogs.date)).limit(1);
  return rows[0] ?? null;
}

export async function setSteps(date: string, source: 'phone' | 'watch', steps: number) {
  await db
    .insert(stepEntries)
    .values({ date, source, steps, recordedAt: Date.now() })
    .onConflictDoUpdate({
      target: [stepEntries.date, stepEntries.source],
      set: { steps, recordedAt: Date.now() },
    });
}

export async function addFoodLog(e: {
  date: string;
  name: string;
  kcal: number;
  quantity?: number;
  servingLabel?: string;
  foodId?: number;
}) {
  await db.insert(foodLogs).values({
    date: e.date,
    name: e.name,
    kcal: Math.round(e.kcal),
    quantity: e.quantity ?? 1,
    servingLabel: e.servingLabel ?? null,
    foodId: e.foodId ?? null,
    loggedAt: Date.now(),
  });
}

export async function deleteFoodLog(id: number) {
  await db.delete(foodLogs).where(eq(foodLogs.id, id));
}

export async function listFoodLogs(date: string) {
  return db.select().from(foodLogs).where(eq(foodLogs.date, date)).orderBy(foodLogs.loggedAt);
}

export async function addActivity(e: { date: string; name: string; kcal: number; durationMin?: number }) {
  await db.insert(activities).values({
    date: e.date,
    name: e.name,
    kcal: Math.round(e.kcal),
    durationMin: e.durationMin ?? null,
    createdAt: Date.now(),
  });
}

export async function daySummary(date: string) {
  const [food] = await db
    .select({ total: sql<number>`coalesce(sum(${foodLogs.kcal}), 0)` })
    .from(foodLogs)
    .where(eq(foodLogs.date, date));
  const [act] = await db
    .select({ total: sql<number>`coalesce(sum(${activities.kcal}), 0)` })
    .from(activities)
    .where(eq(activities.date, date));
  const steps = await db.select().from(stepEntries).where(eq(stepEntries.date, date));

  return {
    eatenKcal: Number(food?.total ?? 0),
    activityKcal: Number(act?.total ?? 0),
    phoneSteps: steps.find((s) => s.source === 'phone')?.steps ?? null,
    watchSteps: steps.find((s) => s.source === 'watch')?.steps ?? null,
  };
}

/** Everything the dashboard needs: DB state run through the core engine. */
export async function getDayPlan(date: string) {
  const p = await getProfile();
  const w = await latestWeight();
  if (!p || !w) return null;

  const s = await daySummary(date);
  const stepsDone = resolveSteps({ phone: s.phoneSteps, watch: s.watchSteps, strategy: p.stepStrategy });

  return planDay({
    sex: p.sex,
    birthDate: p.birthDate,
    heightCm: p.heightCm,
    weightKg: w.weightKg,
    mode: p.mode,
    dailyDeficitKcal: p.dailyDeficitKcal,
    stepFloor: p.stepFloor,
    stepCap: p.stepCap,
    date: parseDateKey(date),
    eatenKcal: s.eatenKcal,
    activityKcal: s.activityKcal,
    stepsDone,
  });
}

export async function seedFoods() {
  const now = Date.now();
  for (let i = 0; i < SEED_FOODS.length; i += 25) {
    const chunk = SEED_FOODS.slice(i, i + 25).map((f) => ({
      seedKey: f.key,
      name: f.name,
      category: f.category,
      servingLabel: f.serving,
      kcal: f.kcal,
      isCustom: false,
      archived: false,
      createdAt: now,
    }));
    // Existing rows (including ones you edited or hid) are left untouched.
    await db.insert(foods).values(chunk).onConflictDoNothing({ target: foods.seedKey });
  }
}

export async function listFoods() {
  return db.select().from(foods).where(eq(foods.archived, false)).orderBy(foods.name);
}

export async function getFood(id: number) {
  const rows = await db.select().from(foods).where(eq(foods.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function addCustomFood(f: { name: string; servingLabel: string; kcal: number }) {
  await db.insert(foods).values({
    name: f.name,
    servingLabel: f.servingLabel,
    kcal: f.kcal,
    category: 'custom',
    isCustom: true,
    archived: false,
    createdAt: Date.now(),
  });
}

export async function updateFood(
  id: number,
  f: { name: string; servingLabel: string; kcal: number },
) {
  await db
    .update(foods)
    .set({ name: f.name, servingLabel: f.servingLabel, kcal: f.kcal })
    .where(eq(foods.id, id));
}

export async function hideFood(id: number) {
  await db.update(foods).set({ archived: true }).where(eq(foods.id, id));
}