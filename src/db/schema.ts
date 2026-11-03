import { integer, real, sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey(),
  sex: text('sex', { enum: ['male', 'female'] }).notNull(),
  birthDate: text('birth_date').notNull(),
  heightCm: real('height_cm').notNull(),
  goalWeightKg: real('goal_weight_kg').notNull(),
  stretchGoalKg: real('stretch_goal_kg'),
  targetDate: text('target_date'),
  mode: text('mode', { enum: ['lose', 'maintain'] }).notNull().default('lose'),
  dailyDeficitKcal: integer('daily_deficit_kcal').notNull().default(500),
  stepFloor: integer('step_floor').notNull().default(8000),
  stepCap: integer('step_cap').notNull().default(20000),
  stepStrategy: text('step_strategy', { enum: ['higher', 'watch', 'phone'] }).notNull().default('higher'),
  createdAt: integer('created_at').notNull(),
});

export const foods = sqliteTable('foods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').notNull().default('other'),
  servingLabel: text('serving_label').notNull(),
  kcal: integer('kcal').notNull(), // per serving
  seedKey: text('seed_key').unique(), // stable id for pre-loaded foods
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
});

export const foodLogs = sqliteTable(
  'food_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    foodId: integer('food_id').references(() => foods.id, { onDelete: 'set null' }),
    name: text('name').notNull(), // snapshot
    servingLabel: text('serving_label'),
    quantity: real('quantity').notNull().default(1),
    kcal: integer('kcal').notNull(), // total for this entry
    loggedAt: integer('logged_at').notNull(),
  },
  (t) => [index('food_logs_date_idx').on(t.date)],
);

export const stepEntries = sqliteTable(
  'step_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    source: text('source', { enum: ['phone', 'watch'] }).notNull(),
    steps: integer('steps').notNull(),
    recordedAt: integer('recorded_at').notNull(),
  },
  (t) => [uniqueIndex('step_entries_date_source_uq').on(t.date, t.source)],
);

export const weightLogs = sqliteTable('weight_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(),
  weightKg: real('weight_kg').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const activities = sqliteTable(
  'activities',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    name: text('name').notNull(),
    kcal: integer('kcal').notNull(),
    durationMin: integer('duration_min'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('activities_date_idx').on(t.date)],
);

export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
export type Food = typeof foods.$inferSelect;