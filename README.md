# StepsKcal

**Eat smart. Walk it off.**

A personal weight-loss companion for Android. You get a daily calorie budget and a daily step target. Eat within budget and the target stays at your minimum. Go over, and the app adds the steps needed to cover it.

Everything stays on the phone. There are no accounts, no servers and no network calls.

## How it works

- **Food budget** = maintenance calories minus a deficit (500 kcal by default). Maintenance is Mifflin-St Jeor BMR × 1.2 (sedentary). The budget never drops below 1,500 kcal for men or 1,200 kcal for women.
- **Step target** starts at a floor (8,000 steps by default) and rises by about 2,500 steps for every 100 kcal eaten over budget, capped at 20,000. The exact cost per step is personalised from weight and height.
- **Activity** such as football adds back half of the calories it burns beyond the steps your watch already counted, so the same effort is never counted twice.
- **Weight** is logged over time. The app shows the trend, your pace, a projected goal date, and a comparison against a planned path to your target date.
- **Lose and maintain modes.** After reaching the goal, the app offers to switch to maintenance and stops asking for a deficit.

Calorie and step figures are estimates to guide habits, not medical advice.

## Features

- Today dashboard with two rings (steps to go, kcal left), a goal card and the day's log
- About 100 pre-loaded Nigerian foods with estimated calories, plus custom foods, search and categories
- One-tap food logging with undo, and a servings screen for custom portions
- Manual watch step entry for today and yesterday
- Activity log with calorie and step estimates
- Progress screen with a weight chart, pace and history
- Reminders: morning, evening and weekly weigh-in, with Gentle, Banter and Roast tones that soften near the goal
- Backup and restore through a JSON file
- Light and dark themes (system, light or dark)

## Tech stack

- Expo (React Native) with TypeScript and Expo Router
- SQLite via `expo-sqlite` and Drizzle ORM, local only
- Vitest for unit tests
- `react-native-svg`, `react-native-reanimated`, `expo-linear-gradient`, `lucide-react-native`
- `expo-notifications` for local reminders
- Plus Jakarta Sans via `@expo-google-fonts/plus-jakarta-sans`

## Project structure

```
src/
  app/           Screens (Expo Router). (tabs)/ holds Today, Foods, Progress, Reminders
  core/          Pure TypeScript logic with no React Native imports, fully unit tested
  data/          Starter foods and reminder message lines
  db/            SQLite schema, client and repository
  lib/           Date and notification helpers
  ui/            Design tokens, theme and shared components
drizzle/         Generated database migrations (commit these)
assets/images/   App icon, splash, adaptive icon, notification icon
scripts/brand.js One-off script that applied the name, icons and plugins to app.json
```

The calculation logic lives in `src/core` on purpose. Keep it free of React Native imports so it stays easy to test.

## Getting started

Prerequisites: Node.js LTS, Android Studio (for the SDK, platform tools and a bundled JDK), and an Android phone with USB debugging on.

```bash
npm install
npx expo run:android      # builds the native app, installs it, starts Metro
```

After the first build, day-to-day development only needs:

```bash
npx expo start
```

Open the installed app on the phone. It connects to Metro on your computer (same Wi-Fi, or run `adb reverse tcp:8081 tcp:8081` with the phone plugged in). You only need to rebuild when a native library is added or `app.json` changes.

### Checks

```bash
npm test                  # unit tests
npx tsc --noEmit          # type check
```

If the editor flags a new route as unknown, restart `npx expo start -c` and run "TypeScript: Restart TS Server".

### Database

The schema is in `src/db/schema.ts`. After changing it, generate a migration and commit the new files in `drizzle/`:

```bash
npm run db:generate
```

Migrations are applied automatically when the app starts. Never edit generated migration files by hand.

### Release build

```bash
npx expo run:android --variant release
```

This installs a standalone build that does not need Metro. It installs over the existing app and keeps its data. To go back to development mode, run `npx expo run:android` again.

## Windows setup notes

These solved real build failures:

- **Keep the project path short**, for example `C:\dev\app`. Native builds create very long paths.
- **Install the Android SDK at a path without spaces**, for example `C:\Android\Sdk`. A space in the user folder made the NDK linker run through shortened 8.3 paths and fail with undefined C++ symbols.
- **Set the environment variables:** `ANDROID_HOME` to the SDK folder, `JAVA_HOME` to the `jbr` folder inside the Android Studio install, and add `%ANDROID_HOME%\platform-tools` to `PATH`.
- **Enable Windows long paths** (`LongPathsEnabled` = 1 in the registry, then restart).
- **Install CMake 3.31.6** from Android Studio's SDK Tools tab and add this line to `~/.gradle/gradle.properties`:
  ```
  android.cmakeVersion=3.31.6
  ```
  The default CMake 3.22.1 ships an old Ninja that fails on long paths.

## Backups and privacy

All data lives in a local SQLite database on the phone. Use **Profile & data, Backup and restore** to create a backup file and keep it somewhere outside the phone, such as Google Drive. Uninstalling the app or clearing its storage erases the data.

Backup files contain health data. They are named `stepskcal-backup-*.json` and are ignored by Git. Do not commit them.

## Reminders

Reminders are scheduled up to 7 days ahead and refreshed every time the app is opened. The morning message reflects what you had logged at your last app open. On Xiaomi/Redmi phones, allow Autostart and set battery saver to "No restrictions" for the app, or the system may stop scheduled reminders.

## Credits

Developed by Ayoblvck. UI design by the StepsKcal design boards.