import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  anyReminderOn,
  parseReminderSettings,
  planReminders,
  type ReminderSettings,
} from '../core';
import { getKv, getReminderContext, setKv } from '../db/repo';
import { dateKey } from './dates';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = 'reminders';

export async function loadReminderSettings(): Promise<ReminderSettings> {
  return parseReminderSettings(await getKv('reminders'));
}

export async function saveReminderSettings(s: ReminderSettings) {
  await setKv('reminders', JSON.stringify(s));
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function ensurePermission(): Promise<boolean> {
  await ensureChannel();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function rebuild(): Promise<number> {
  const settings = await loadReminderSettings();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!anyReminderOn(settings)) return 0;

  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return 0;
  await ensureChannel();

  const ctx = await getReminderContext(dateKey());
  if (!ctx) return 0;

  const planned = planReminders({ now: new Date(), settings, ctx });
  for (const p of planned) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: { title: p.title, body: p.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: p.at,
        channelId: CHANNEL_ID,
      },
    });
  }
  return planned.length;
}

// One rebuild at a time, so two quick screen changes never interleave.
let chain: Promise<unknown> = Promise.resolve();

/** Rebuilds the schedule and reports how many reminders were set. Rejects on failure. */
export function applyReminders(): Promise<number> {
  const run = chain.then(rebuild);
  chain = run.catch(() => undefined);
  return run;
}

/** Fire-and-forget version for background refreshes. */
export function refreshReminders(): void {
  applyReminders().catch(() => undefined);
}

export async function scheduleTest(title: string, body: string) {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: CHANNEL_ID,
    },
  });
}