CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`name` text NOT NULL,
	`kcal` integer NOT NULL,
	`duration_min` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `activities_date_idx` ON `activities` (`date`);--> statement-breakpoint
CREATE TABLE `food_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`food_id` integer,
	`name` text NOT NULL,
	`serving_label` text,
	`quantity` real DEFAULT 1 NOT NULL,
	`kcal` integer NOT NULL,
	`logged_at` integer NOT NULL,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `food_logs_date_idx` ON `food_logs` (`date`);--> statement-breakpoint
CREATE TABLE `foods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`serving_label` text NOT NULL,
	`kcal` integer NOT NULL,
	`seed_key` text,
	`is_custom` integer DEFAULT false NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `foods_seed_key_unique` ON `foods` (`seed_key`);--> statement-breakpoint
CREATE TABLE `profile` (
	`id` integer PRIMARY KEY NOT NULL,
	`sex` text NOT NULL,
	`birth_date` text NOT NULL,
	`height_cm` real NOT NULL,
	`goal_weight_kg` real NOT NULL,
	`stretch_goal_kg` real,
	`target_date` text,
	`mode` text DEFAULT 'lose' NOT NULL,
	`daily_deficit_kcal` integer DEFAULT 500 NOT NULL,
	`step_floor` integer DEFAULT 8000 NOT NULL,
	`step_cap` integer DEFAULT 20000 NOT NULL,
	`step_strategy` text DEFAULT 'higher' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `step_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`source` text NOT NULL,
	`steps` integer NOT NULL,
	`recorded_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `step_entries_date_source_uq` ON `step_entries` (`date`,`source`);--> statement-breakpoint
CREATE TABLE `weight_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weight_logs_date_unique` ON `weight_logs` (`date`);