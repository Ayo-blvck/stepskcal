import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ACTIVITY_PRESETS,
  activityPreview,
  formatDateInput,
  kcalPerStep,
  suggestActivityKcal,
  suggestStepsCounted,
  validateActivityEntry,
  type ActivityErrors,
  type ActivityPreset,
} from '../core';
import {
  addActivity,
  deleteActivity,
  getActivity,
  getProfile,
  latestWeight,
  listRecentActivities,
  updateActivity,
} from '../db/repo';
import type { Activity } from '../db/schema';
import { dateKey, formatShort } from '../lib/dates';
import { Field } from '../ui/form';
import { AppText, Button, Card, Chip, ListRow } from '../ui/kit';
import { useTheme } from '../ui/ThemeProvider';

const n = (x: number) => Math.round(x).toLocaleString('en-US');

function PreviewRow(props: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <AppText variant="small" tone="muted" style={{ flex: 1 }}>
        {props.label}
      </AppText>
      <AppText variant="bodyStrong">{props.value}</AppText>
    </View>
  );
}

export default function ActivityScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = id ? Number(id) : null;

  const [date, setDate] = useState(dateKey());
  const [presetKey, setPresetKey] = useState<string | null>(null);
  const [met, setMet] = useState<number | null>(null);
  const [spm, setSpm] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('');
  const [kcal, setKcal] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [body, setBody] = useState<{ weightKg: number; heightCm: number } | null>(null);
  const [errors, setErrors] = useState<ActivityErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recent, setRecent] = useState<Activity[]>([]);

  useEffect(() => {
    Promise.all([latestWeight(), getProfile()]).then(([w, p]) => {
      if (w && p) setBody({ weightKg: w.weightKg, heightCm: p.heightCm });
    });
  }, []);

  useEffect(() => {
    if (editId === null) return;
    getActivity(editId).then((a) => {
      if (!a) return;
      setDate(a.date);
      setName(a.name);
      setMinutes(a.durationMin === null ? '' : String(a.durationMin));
      setKcal(String(a.kcal));
      setStepsText(a.stepsCounted === null ? '' : String(a.stepsCounted));
    });
  }, [editId]);

  useFocusEffect(
    useCallback(() => {
      if (editId !== null) return;
      let active = true;
      listRecentActivities(10).then((rows) => {
        if (active) setRecent(rows);
      });
      return () => {
        active = false;
      };
    }, [editId]),
  );

  function recompute(nextMet: number | null, nextSpm: number | null, minutesText: string) {
    const m = Number(minutesText.trim());
    if (!(Number.isInteger(m) && m >= 1 && m <= 600)) return;
    if (nextMet !== null && body) setKcal(String(suggestActivityKcal(nextMet, body.weightKg, m)));
    if (nextSpm !== null) setStepsText(String(suggestStepsCounted(nextSpm, m)));
  }

  function onPreset(p: ActivityPreset) {
    const nextSpm = p.met === null ? null : p.stepsPerMin;
    setPresetKey(p.key);
    setMet(p.met);
    setSpm(nextSpm);
    setName(p.met === null ? '' : p.name);
    recompute(p.met, nextSpm, minutes);
  }

  function onMinutes(text: string) {
    setMinutes(text);
    recompute(met, spm, text);
  }

  async function onSave() {
    const result = validateActivityEntry({ date, name, minutes, kcal, stepsCounted: stepsText }, new Date());
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaveError(null);
    setSaving(true);
    try {
      if (editId !== null) await updateActivity(editId, result.value);
      else await addActivity(result.value);
      router.dismissTo('/');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    if (editId === null) return;
    Alert.alert('Delete this activity?', name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteActivity(editId);
          router.dismissTo('/');
        },
      },
    ]);
  }

  const kcalNum = Number(kcal.trim().replace(',', '.'));
  const stepsNum = stepsText.trim() === '' ? 0 : Number(stepsText.replace(/[,\s]/g, ''));
  const preview =
    body && Number.isFinite(kcalNum) && kcalNum > 0 && Number.isFinite(stepsNum) && stepsNum >= 0
      ? activityPreview(kcalNum, stepsNum, kcalPerStep(body.weightKg, body.heightCm))
      : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
        gap: 18,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="title">{editId !== null ? 'Edit activity' : 'Log activity'}</AppText>
      <AppText variant="small" tone="muted">
        Keep typing your watch's full step count as usual. Steps counted during a session are
        subtracted below, so nothing is counted twice.
      </AppText>

      <View style={{ gap: 8 }}>
        <AppText variant="label">Type</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ACTIVITY_PRESETS.map((p) => (
            <Chip key={p.key} label={p.name} selected={presetKey === p.key} onPress={() => onPreset(p)} />
          ))}
        </View>
      </View>

      <Field label="Name" value={name} onChangeText={setName} error={errors.name} />
      <Field
        label="Duration (minutes)"
        keyboardType="number-pad"
        value={minutes}
        onChangeText={onMinutes}
        error={errors.minutes}
      />
      <Field
        label="Calories burned (kcal)"
        keyboardType="decimal-pad"
        value={kcal}
        onChangeText={setKcal}
        error={errors.kcal}
        hint={
          met !== null
            ? 'Estimated from your weight and the duration. Change it if you think it is off.'
            : 'Pick a type and enter the duration for an estimate, or type your own number.'
        }
      />
      <Field
        label="Steps your watch counts during this"
        keyboardType="number-pad"
        value={stepsText}
        onChangeText={setStepsText}
        error={errors.stepsCounted}
        hint="A rough guess is filled in. To calibrate, note your watch count at the start and end once."
      />

      {preview ? (
        <Card style={{ gap: 10 }}>
          <AppText variant="label" tone="muted">
            What this adds
          </AppText>
          <PreviewRow label="Your steps already earn" value={`${n(preview.coveredKcal)} kcal`} />
          <PreviewRow label="Burned beyond your steps" value={`${n(preview.bonusKcal)} kcal`} />
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="h2">Added to food budget</AppText>
            <AppText variant="number" tone="accent">
              +{n(preview.creditKcal)}
            </AppText>
          </View>
          <AppText variant="caption" tone="muted">
            Half of the extra is credited, because calorie estimates tend to run high.
          </AppText>
        </Card>
      ) : null}

      <Field
        label="Date"
        keyboardType="number-pad"
        value={date}
        onChangeText={(v) => setDate(formatDateInput(v))}
        error={errors.date}
      />

      {saveError ? (
        <AppText variant="small" tone="danger">
          Could not save: {saveError}
        </AppText>
      ) : null}

      <View style={{ gap: 10 }}>
        <Button
          title={editId !== null ? 'Save changes' : 'Save activity'}
          onPress={onSave}
          disabled={saving}
        />
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
        {editId !== null ? <Button title="Delete" variant="danger" onPress={onDelete} /> : null}
      </View>

      {editId === null && recent.length > 0 ? (
        <Card>
          <AppText variant="h2">Recent sessions</AppText>
          {recent.map((a, i) => (
            <ListRow
              key={a.id}
              title={a.name}
              subtitle={`${formatShort(a.date, true)}${a.durationMin ? ` · ${a.durationMin} min` : ''}`}
              right={`${a.kcal} kcal`}
              last={i === recent.length - 1}
              onPress={() => router.push({ pathname: '/activity', params: { id: String(a.id) } })}
            />
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}