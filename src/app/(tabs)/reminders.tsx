import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DEFAULT_REMINDERS,
  QUICK_TIMES,
  WEEKDAY_SHORT,
  anyReminderOn,
  formatTimeInput,
  goalTier,
  parseTime,
  renderReminder,
  scheduleSummary,
  weighInSubtitle,
  type GoalTier,
  type ReminderKind,
  type ReminderSettings,
  type Spice,
} from '../../core';
import { getReminderContext } from '../../db/repo';
import { dateKey } from '../../lib/dates';
import {
  applyReminders,
  ensurePermission,
  loadReminderSettings,
  saveReminderSettings,
  scheduleTest,
} from '../../lib/notifications';
import { Segmented } from '../../ui/form';
import { AppText, Button, Card, Chip, Toggle } from '../../ui/kit';
import { NotificationPreview } from '../../ui/NotificationPreview';
import { useTheme } from '../../ui/ThemeProvider';
import { font, radius } from '../../ui/tokens';

type Key = 'morning' | 'evening' | 'weighIn';

const SPICE_INFO: Record<Spice, string> = {
  gentle: 'Friendly nudges.',
  banter: 'Teasing, like a friend who knows you.',
  roast: 'Rude and funny. Aimed at your habits, not your body.',
};

const SAMPLE_KINDS: ReminderKind[] = ['overBudget', 'lowSteps', 'onTrack', 'evening', 'weighIn'];
const SHEET_TITLE: Record<Key, string> = {
  morning: 'Morning check time',
  evening: 'Evening check-in time',
  weighIn: 'Weigh-in time',
};

export default function Reminders() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDERS);
  const [tier, setTier] = useState<GoalTier>('far');
  const [kg, setKg] = useState(20);
  const [seed, setSeed] = useState(0);
  const [denied, setDenied] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [editing, setEditing] = useState<Key | null>(null);
  const [timeText, setTimeText] = useState('');
  const [timeError, setTimeError] = useState<string | undefined>();

  const latest = useRef<ReminderSettings>(DEFAULT_REMINDERS);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  const persist = useCallback(async () => {
    const s = latest.current;
    try {
      await saveReminderSettings(s);
      const n = await applyReminders();
      if (mounted.current) setStatus({ kind: 'ok', text: scheduleSummary(n, anyReminderOn(s)) });
    } catch (e) {
      if (mounted.current) {
        setStatus({
          kind: 'error',
          text: `Could not schedule: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    }
  }, []);

  function update(next: ReminderSettings) {
    latest.current = next;
    setSettings(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      persist();
    }, 500);
  }

  useEffect(() => {
    mounted.current = true;
    loadReminderSettings().then((s) => {
      latest.current = s;
      setSettings(s);
      setLoaded(true);
    });
    getReminderContext(dateKey()).then((c) => {
      if (c) {
        setTier(goalTier(c.kgToGoal, c.mode));
        setKg(c.kgToGoal);
      }
    });
    return () => {
      mounted.current = false;
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        persist(); // do not lose a change made just before leaving
      }
    };
  }, [persist]);

  async function toggle(key: Key, on: boolean) {
    if (on && !(await ensurePermission())) {
      setDenied(true);
      return;
    }
    setDenied(false);
    const cur = latest.current;
    update({ ...cur, [key]: { ...cur[key], on } } as ReminderSettings);
  }

  function openTime(key: Key) {
    setTimeText(settings[key].time);
    setTimeError(undefined);
    setEditing(key);
  }

  function saveTime(value: string = timeText) {
    if (!editing) return;
    const v = value.trim();
    if (!parseTime(v)) {
      setTimeError('Use 24-hour time. Type four digits, like 0830.');
      return;
    }
    const cur = latest.current;
    update({ ...cur, [editing]: { ...cur[editing], time: v } } as ReminderSettings);
    setEditing(null);
  }

  async function onTest() {
    if (!(await ensurePermission())) {
      setDenied(true);
      return;
    }
    const r = renderReminder('overBudget', tier, settings.spice, `test${seed}`, { kg, over: 320 });
    await scheduleTest(r.title, r.body);
    setStatus({ kind: 'ok', text: 'Test sent. It arrives in about 5 seconds. Lock your phone or leave the app.' });
  }

  if (!loaded) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

  const sampleKind = SAMPLE_KINDS[seed % SAMPLE_KINDS.length];
  const sample = renderReminder(sampleKind, tier, settings.spice, `p${seed}`, {
    kg,
    over: 320,
    steps: 3100,
    target: 8000,
    eaten: 2200,
  });
  const sampleTime =
    sampleKind === 'evening'
      ? settings.evening.time
      : sampleKind === 'weighIn'
        ? settings.weighIn.time
        : settings.morning.time;

  const rows: { key: Key; title: string; sub: string }[] = [
    { key: 'morning', title: 'Morning check', sub: 'Reacts to yesterday' },
    { key: 'evening', title: 'Evening check-in', sub: 'Log steps and food' },
    { key: 'weighIn', title: 'Weekly weigh-in', sub: weighInSubtitle(settings.weighIn.day) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 16,
          paddingBottom: 32,
          gap: 14,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="title">Reminders</AppText>

        <Segmented<Spice>
          options={[
            { value: 'gentle', label: 'Gentle' },
            { value: 'banter', label: 'Banter' },
            { value: 'roast', label: 'Roast' },
          ]}
          value={settings.spice}
          onChange={(v) => update({ ...latest.current, spice: v })}
        />
        <AppText variant="small" tone="muted">
          {SPICE_INFO[settings.spice]}
          {tier !== 'far'
            ? tier === 'near'
              ? ' You are within 3 kg of your goal, so messages use the encouraging set whichever tone you pick.'
              : ' You are at your goal, so messages use the calm maintenance set whichever tone you pick.'
            : ''}
        </AppText>

        <NotificationPreview time={sampleTime} title={sample.title} body={sample.body} />
        <Button
          title="Show another example"
          variant="ghost"
          size="sm"
          onPress={() => setSeed((n) => n + 1)}
          style={{ alignSelf: 'flex-start', marginTop: -6 }}
        />

        {rows.map((r) => {
          const on = settings[r.key].on;
          return (
            <Card
              key={r.key}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}
            >
              <View style={{ flex: 1 }}>
                <AppText variant="h2">{r.title}</AppText>
                <AppText variant="small" tone="muted">
                  {r.sub}
                </AppText>
              </View>
              <Pressable
                onPress={() => openTime(r.key)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`${r.title} time ${settings[r.key].time}. Tap to change`}
              >
                <AppText
                  variant="number"
                  style={{ fontFamily: font.extrabold, color: on ? t.text : t.muted }}
                >
                  {settings[r.key].time}
                </AppText>
              </Pressable>
              <Toggle value={on} onValueChange={(v) => toggle(r.key, v)} />
            </Card>
          );
        })}

        <View style={{ flexDirection: 'row', gap: 6, opacity: settings.weighIn.on ? 1 : 0.5 }}>
          {WEEKDAY_SHORT.map((d, i) => (
            <Chip
              key={d}
              label={d}
              selected={settings.weighIn.day === i}
              onPress={() => update({ ...latest.current, weighIn: { ...latest.current.weighIn, day: i } })}
              style={{ flex: 1, minWidth: 0, paddingHorizontal: 0 }}
            />
          ))}
        </View>

        {status ? (
          <AppText variant="small" tone={status.kind === 'ok' ? 'accent' : 'danger'}>
            {status.text}
          </AppText>
        ) : null}

        {denied ? (
          <Card style={{ gap: 12 }}>
            <AppText tone="danger">
              Notifications are blocked for this app. Allow them in your phone's settings, then come back.
            </AppText>
            <Button title="Open phone settings" variant="secondary" onPress={() => Linking.openSettings()} />
          </Card>
        ) : null}

        <Button title="Send a test in 5 seconds" variant="secondary" onPress={onTest} />

        <Card style={{ gap: 6 }}>
          <AppText variant="label">If reminders do not arrive</AppText>
          <AppText variant="small" tone="muted">
            Your phone looks like a Redmi (Xiaomi) model, and these are known for closing background
            apps. Open Settings, then Apps, then this app, and allow Autostart. Set Battery saver to
            No restrictions. Menu names vary between versions, and reminders can arrive a few minutes
            late.
          </AppText>
        </Card>
      </ScrollView>

      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setEditing(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: t.overlay,
            paddingHorizontal: 24,
            paddingTop: insets.top + 72,
          }}
          onPress={() => setEditing(null)}
        >
          <Pressable
            onPress={() => undefined}
            style={{ backgroundColor: t.card, borderRadius: radius.hero, padding: 20, gap: 14 }}
          >
            <AppText variant="h2">{editing ? SHEET_TITLE[editing] : ''}</AppText>
            <TextInput
              value={timeText}
              onChangeText={(v) => {
                setTimeText(formatTimeInput(v));
                setTimeError(undefined);
              }}
              keyboardType="number-pad"
              maxLength={5}
              autoFocus
              selectTextOnFocus
              textAlign="center"
              placeholder="08:00"
              placeholderTextColor={t.muted}
              style={{
                fontFamily: font.extrabold,
                fontSize: 40,
                lineHeight: 50,
                color: t.text,
                borderWidth: 1,
                borderColor: timeError ? t.danger : t.border,
                borderRadius: radius.field,
                backgroundColor: t.bg,
                paddingVertical: 6,
              }}
            />
            {timeError ? (
              <AppText variant="small" tone="danger">
                {timeError}
              </AppText>
            ) : (
              <AppText variant="small" tone="muted">
                24-hour time. Type four digits, like 0830.
              </AppText>
            )}
            {editing ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {QUICK_TIMES[editing].map((q) => (
                  <Chip key={q} label={q} selected={timeText === q} onPress={() => saveTime(q)} />
                ))}
              </View>
            ) : null}
            <Button title="Save time" onPress={() => saveTime()} />
            <Button title="Cancel" variant="secondary" onPress={() => setEditing(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}