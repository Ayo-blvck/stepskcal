import { and, desc, eq, sql } from 'drizzle-orm';
import { buildBackup, planDay, resolveSteps, type BackupFile, type DaySnapshot, type ReminderContext } from '../core';
import { parseDateKey, shiftDateKey} from '../lib/dates';
import { db, sqlite } from './client';
import { SEED_FOODS } from '../data/seed-foods';
import {
  activities,
  foodLogs,
  foods,
  kv,
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

export async function addActivity(e: {
  date: string;
  name: string;
  kcal: number;
  durationMin?: number | null;
  stepsCounted?: number | null;
}) {
  await db.insert(activities).values({
    date: e.date,
    name: e.name,
    kcal: Math.round(e.kcal),
    durationMin: e.durationMin ?? null,
    stepsCounted: e.stepsCounted ?? null,
    createdAt: Date.now(),
  });
}

export async function daySummary(date: string) {
  const [food] = await db
    .select({ total: sql<number>`coalesce(sum(${foodLogs.kcal}), 0)` })
    .from(foodLogs)
    .where(eq(foodLogs.date, date));
  const acts = await db.select().from(activities).where(eq(activities.date, date));
  const steps = await db.select().from(stepEntries).where(eq(stepEntries.date, date));

  return {
    eatenKcal: Number(food?.total ?? 0),
    activityKcal: acts.reduce((sum, a) => sum + a.kcal, 0),
    activities: acts.map((a) => ({ kcal: a.kcal, stepsCounted: a.stepsCounted ?? 0 })),
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

  const plan = planDay({
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
    activities: s.activities,
    stepsDone,
  });

  return { ...plan, stepsDone, phoneSteps: s.phoneSteps, watchSteps: s.watchSteps };
}

export type DayPlanView = NonNullable<Awaited<ReturnType<typeof getDayPlan>>>;

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

export async function getFoodLog(id: number) {
  const rows = await db.select().from(foodLogs).where(eq(foodLogs.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateFoodLog(
  id: number,
  e: { name: string; quantity: number; kcal: number },
) {
  await db
    .update(foodLogs)
    .set({ name: e.name, quantity: e.quantity, kcal: Math.round(e.kcal) })
    .where(eq(foodLogs.id, id));
}

/** Foods you logged most recently, newest first, without duplicates. */
export async function recentFoods(limit = 8) {
  const rows = await db
    .select({ food: foods })
    .from(foodLogs)
    .innerJoin(foods, eq(foodLogs.foodId, foods.id))
    .where(eq(foods.archived, false))
    .groupBy(foods.id)
    .orderBy(desc(sql`max(${foodLogs.loggedAt})`))
    .limit(limit);
  return rows.map((r) => r.food);
}

export async function getStepEntries(date: string) {
  const rows = await db.select().from(stepEntries).where(eq(stepEntries.date, date));
  return {
    phone: rows.find((r) => r.source === 'phone')?.steps ?? null,
    watch: rows.find((r) => r.source === 'watch')?.steps ?? null,
  };
}

export async function clearSteps(date: string, source: 'phone' | 'watch') {
  await db
    .delete(stepEntries)
    .where(and(eq(stepEntries.date, date), eq(stepEntries.source, source)));
}

export async function listWeights() {
  return db.select().from(weightLogs).orderBy(weightLogs.date);
}

export async function deleteWeight(date: string) {
  await db.delete(weightLogs).where(eq(weightLogs.date, date));
}

export async function setMode(mode: 'lose' | 'maintain') {
  await db.update(profile).set({ mode }).where(eq(profile.id, 1));
}

export async function listActivities(date: string) {
  return db.select().from(activities).where(eq(activities.date, date)).orderBy(activities.createdAt);
}

export async function listRecentActivities(limit = 10) {
  return db
    .select()
    .from(activities)
    .orderBy(desc(activities.date), desc(activities.createdAt))
    .limit(limit);
}

export async function getActivity(id: number) {
  const rows = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateActivity(
  id: number,
  e: {
    date: string;
    name: string;
    kcal: number;
    durationMin: number | null;
    stepsCounted: number | null;
  },
) {
  await db
    .update(activities)
    .set({
      date: e.date,
      name: e.name,
      kcal: Math.round(e.kcal),
      durationMin: e.durationMin,
      stepsCounted: e.stepsCounted,
    })
    .where(eq(activities.id, id));
}

export async function deleteActivity(id: number) {
  await db.delete(activities).where(eq(activities.id, id));
}

export async function getKv(key: string) {
  const rows = await db.select().from(kv).where(eq(kv.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

export async function setKv(key: string, value: string) {
  await db.insert(kv).values({ key, value }).onConflictDoUpdate({ target: kv.key, set: { value } });
}

export async function exportAll(): Promise<BackupFile> {
  const [p, f, fl, st, w, a] = await Promise.all([
    db.select().from(profile),
    db.select().from(foods),
    db.select().from(foodLogs),
    db.select().from(stepEntries),
    db.select().from(weightLogs),
    db.select().from(activities),
  ]);
  return buildBackup(
    { profile: p, foods: f, foodLogs: fl, stepEntries: st, weightLogs: w, activities: a },
    new Date(),
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Replaces all user data with the backup. Runs as one transaction, so a failure changes nothing. */
export async function importAll(b: BackupFile) {
  await sqlite.withTransactionAsync(async () => {
    await db.delete(foodLogs);
    await db.delete(activities);
    await db.delete(stepEntries);
    await db.delete(weightLogs);
    await db.delete(profile);
    await db.delete(foods).where(eq(foods.isCustom, true));

    const existing = await db.select().from(foods);
    const bySeed = new Map<string, number>();
    for (const f of existing) if (f.seedKey) bySeed.set(f.seedKey, f.id);
    let nextId = existing.reduce((m, f) => Math.max(m, f.id), 0) + 1;

    const idMap = new Map<number, number>();
    for (const f of b.data.foods) {
      const fields = {
        name: f.name,
        category: f.category,
        servingLabel: f.servingLabel,
        kcal: f.kcal,
        archived: f.archived,
      };
      const existingId = f.seedKey ? bySeed.get(f.seedKey) : undefined;
      if (existingId !== undefined) {
        await db.update(foods).set(fields).where(eq(foods.id, existingId));
        idMap.set(f.id, existingId);
      } else {
        const id = nextId++;
        await db.insert(foods).values({
          id,
          ...fields,
          seedKey: f.seedKey,
          isCustom: f.isCustom,
          createdAt: f.createdAt,
        });
        idMap.set(f.id, id);
      }
    }

    for (const p of b.data.profile) {
      await db.insert(profile).values({ ...p, id: 1 });
    }
    for (const rows of chunk(b.data.weightLogs, 50)) {
      await db.insert(weightLogs).values(rows.map(({ id, ...r }) => r));
    }
    for (const rows of chunk(b.data.stepEntries, 50)) {
      await db.insert(stepEntries).values(rows.map(({ id, ...r }) => r));
    }
    for (const rows of chunk(b.data.activities, 50)) {
      await db.insert(activities).values(rows.map(({ id, ...r }) => r));
    }
    for (const rows of chunk(b.data.foodLogs, 50)) {
      await db.insert(foodLogs).values(
        rows.map(({ id, foodId, ...r }) => ({
          ...r,
          foodId: foodId === null ? null : (idMap.get(foodId) ?? null),
        })),
      );
    }
  });
}

export async function daySnapshot(date: string): Promise<DaySnapshot | null> {
  const [plan, s] = await Promise.all([getDayPlan(date), daySummary(date)]);
  if (!plan) return null;
  return {
    eatenKcal: s.eatenKcal,
    allowanceKcal: plan.budgetKcal + plan.activityCreditKcal,
    stepsDone: plan.stepsDone,
    stepTarget: plan.stepTarget,
    hasSteps: s.phoneSteps !== null || s.watchSteps !== null,
  };
}

export async function getReminderContext(today: string): Promise<ReminderContext | null> {
  const p = await getProfile();
  const w = await latestWeight();
  if (!p || !w) return null;

  const yesterday = shiftDateKey(today, -1);
  const [t, y] = await Promise.all([daySnapshot(today), daySnapshot(yesterday)]);
  const days: Record<string, DaySnapshot> = {};
  if (t) days[today] = t;
  if (y) days[yesterday] = y;

  return { kgToGoal: Math.max(0, w.weightKg - p.goalWeightKg), mode: p.mode, days };
}