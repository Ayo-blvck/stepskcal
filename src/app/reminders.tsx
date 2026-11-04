import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import {
  DEFAULT_REMINDERS,
  formatTimeInput,
  goalTier,
  parseTime,
  renderReminder,
  type GoalTier,
  type ReminderSettings,
  type Spice,
} from '../core';
import { getReminderContext } from '../db/repo';
import { dateKey } from '../lib/dates';
import {
  applyReminders,
  ensurePermission,
  loadReminderSettings,
  saveReminderSettings,
  scheduleTest,
} from '../lib/notifications';
import { Field, PrimaryButton, SecondaryButton, Segmented } from '../ui/form';
import { colors } from '../ui/theme';

type Key = 'morning' | 'evening' | 'weighIn';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SPICE_INFO: Record<Spice, string> = {
  gentle: 'Friendly nudges.',
  banter: 'Teasing, like a friend who knows you.',
  roast: 'Rude and funny. Aimed at your habits, not your body.',
};

function Row(props: {
  title: string;
  sub: string;
  on: boolean;
  onToggle: (v: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <View style={s.card}>
      <View style={s.rowHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.section}>{props.title}</Text>
          <Text style={s.note}>{props.sub}</Text>
        </View>
        <Switch
          value={props.on}
          onValueChange={props.onToggle}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
      {props.on ? props.children : null}
    </View>
  );
}

export default function RemindersScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDERS);
  const [tier, setTier] = useState<GoalTier>('far');
  const [kg, setKg] = useState(20);
  const [seed, setSeed] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadReminderSettings().then(setSettings);
    getReminderContext(dateKey()).then((c) => {
      if (c) {
        setTier(goalTier(c.kgToGoal, c.mode));
        setKg(c.kgToGoal);
      }
    });
  }, []);

  async function toggle(key: Key, on: boolean) {
    if (on && !(await ensurePermission())) {
      setDenied(true);
      return;
    }
    setDenied(false);
    setSettings((cur) => ({ ...cur, [key]: { ...cur[key], on } }) as ReminderSettings);
  }

  const setTime = (key: Key, text: string) =>
    setSettings((cur) => ({ ...cur, [key]: { ...cur[key], time: formatTimeInput(text) } }) as ReminderSettings);

  async function onSave() {
    const errs: Partial<Record<Key, string>> = {};
    for (const k of ['morning', 'evening', 'weighIn'] as const) {
      if (settings[k].on && !parseTime(settings[k].time)) errs[k] = 'Use 24-hour time, like 08:00';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    setMessage(null);
    try {
      await saveReminderSettings(settings);
      const n = await applyReminders();
      setMessage({
        kind: 'ok',
        text:
          n === 0
            ? 'Saved. Nothing is scheduled right now.'
            : `Saved. ${n} reminders are scheduled over the coming days, and they refresh every time you open the app.`,
      });
    } catch (e) {
      setMessage({ kind: 'error', text: `Could not schedule: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  }

  async function onTest() {
    if (!(await ensurePermission())) {
      setDenied(true);
      return;
    }
    const r = renderReminder('overBudget', tier, settings.spice, `test${seed}`, { kg, over: 320 });
    await scheduleTest(r.title, r.body);
    setMessage({ kind: 'ok', text: 'Test sent. It arrives in about 5 seconds. Lock your phone or leave the app.' });
  }

  const sampleVars = { kg, over: 320, steps: 3100, target: 8000, eaten: 2200 };
  const samples = (['overBudget', 'lowSteps', 'evening'] as const).map((kind) =>
    renderReminder(kind, tier, settings.spice, `p${seed}-${kind}`, sampleVars),
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()}>
        <Text style={s.back}>‹ Back</Text>
      </Pressable>
      <Text style={s.title}>Reminders</Text>
      <Text style={s.note}>
        Morning lines react to how yesterday went, using what you had logged when you last opened the
        app. The tone follows your distance from your goal: banter while you are more than 3 kg away,
        encouraging once you are close.
      </Text>

      <View style={s.card}>
        <Text style={s.section}>Tone</Text>
        <Segmented<Spice>
          options={[
            { value: 'gentle', label: 'Gentle' },
            { value: 'banter', label: 'Banter' },
            { value: 'roast', label: 'Roast' },
          ]}
          value={settings.spice}
          onChange={(v) => setSettings((cur) => ({ ...cur, spice: v }))}
        />
        <Text style={s.note}>{SPICE_INFO[settings.spice]}</Text>
        {tier !== 'far' ? (
          <Text style={s.note}>
            You are {tier === 'near' ? 'within 3 kg of your goal' : 'at your goal'}, so the messages
            use the encouraging set whichever tone you pick.
          </Text>
        ) : null}
        <View style={s.preview}>
          <Text style={s.previewLabel}>Examples</Text>
          {samples.map((r, i) => (
            <View key={i} style={{ gap: 2 }}>
              <Text style={s.previewTitle}>{r.title}</Text>
              <Text style={s.previewBody}>{r.body}</Text>
            </View>
          ))}
          <Pressable onPress={() => setSeed((n) => n + 1)}>
            <Text style={s.link}>Show other examples</Text>
          </Pressable>
        </View>
      </View>

      <Row
        title="Morning check"
        sub="Reacts to yesterday: calories, steps, or nothing logged."
        on={settings.morning.on}
        onToggle={(v) => toggle('morning', v)}
      >
        <Field
          label="Time (24-hour)"
          keyboardType="number-pad"
          value={settings.morning.time}
          onChangeText={(t) => setTime('morning', t)}
          error={errors.morning}
        />
      </Row>

      <Row
        title="Evening check-in"
        sub="Reminds you to log your steps and what you ate."
        on={settings.evening.on}
        onToggle={(v) => toggle('evening', v)}
      >
        <Field
          label="Time (24-hour)"
          keyboardType="number-pad"
          value={settings.evening.time}
          onChangeText={(t) => setTime('evening', t)}
          error={errors.evening}
        />
      </Row>

      <Row
        title="Weekly weigh-in"
        sub="One reminder a week to step on the scale."
        on={settings.weighIn.on}
        onToggle={(v) => toggle('weighIn', v)}
      >
        <View style={s.chips}>
          {DAYS.map((d, i) => {
            const active = settings.weighIn.day === i;
            return (
              <Pressable
                key={d}
                onPress={() => setSettings((cur) => ({ ...cur, weighIn: { ...cur.weighIn, day: i } }))}
                style={[s.chip, active ? s.chipActive : null]}
              >
                <Text style={[s.chipText, active ? s.chipTextActive : null]}>{d}</Text>
              </Pressable>
            );
          })}
        </View>
        <Field
          label="Time (24-hour)"
          keyboardType="number-pad"
          value={settings.weighIn.time}
          onChangeText={(t) => setTime('weighIn', t)}
          error={errors.weighIn}
        />
      </Row>

      {denied ? (
        <View style={s.card}>
          <Text style={[s.message, s.error]}>
            Notifications are blocked for this app. Allow them in your phone's settings, then come back.
          </Text>
          <SecondaryButton title="Open phone settings" onPress={() => Linking.openSettings()} />
        </View>
      ) : null}

      {message ? (
        <Text style={[s.message, message.kind === 'error' ? s.error : s.ok]}>{message.text}</Text>
      ) : null}

      <PrimaryButton title="Save and schedule" onPress={onSave} disabled={busy} />
      <SecondaryButton title="Send a test in 5 seconds" onPress={onTest} />

      <View style={s.card}>
        <Text style={s.section}>If reminders do not arrive</Text>
        <Text style={s.note}>
          Your phone looks like a Redmi (Xiaomi) model, and these are known for closing background
          apps. Open Settings, then Apps, then this app, and allow Autostart. Set Battery saver to No
          restrictions. Exact menu names vary between versions. Reminders can also arrive a few
          minutes late.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 24, paddingTop: 64, paddingBottom: 48, gap: 14 },
  back: { fontSize: 16, color: colors.primary },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  section: { fontSize: 17, fontWeight: '700', color: colors.text },
  note: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  preview: {
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: { fontSize: 12, fontWeight: '600', color: colors.muted },
  previewTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  previewBody: { fontSize: 13, color: colors.text, lineHeight: 19 },
  link: { fontSize: 14, color: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  message: { fontSize: 14, lineHeight: 20 },
  ok: { color: colors.primary },
  error: { color: colors.danger },
});