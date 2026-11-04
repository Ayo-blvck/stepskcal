import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ACTIVITY_CREDIT,
  ACTIVITY_PRESETS,
  activityBonusKcal,
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
import { Field, PrimaryButton, SecondaryButton } from '../ui/form';
import { colors } from '../ui/theme';

const n = (x: number) => Math.round(x).toLocaleString('en-US');

export default function ActivityScreen() {
  const router = useRouter();
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
    const valid = Number.isInteger(m) && m >= 1 && m <= 600;
    if (!valid) return;
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

  function onMinutes(t: string) {
    setMinutes(t);
    recompute(met, spm, t);
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

  // Live explanation of what this session adds to the food budget.
  const kcalNum = Number(kcal.trim().replace(',', '.'));
  const stepsNum = stepsText.trim() === '' ? 0 : Number(stepsText.replace(/[,\s]/g, ''));
  let preview: string | null = null;
  if (body && Number.isFinite(kcalNum) && kcalNum > 0 && Number.isFinite(stepsNum) && stepsNum >= 0) {
    const kps = kcalPerStep(body.weightKg, body.heightCm);
    const covered = stepsNum * kps;
    const bonus = activityBonusKcal(kcalNum, stepsNum, kps);
    preview = `Your watch's ${n(stepsNum)} steps from this already earn about ${n(covered)} kcal. This adds about ${n(bonus)} kcal beyond your steps, and half of that, ${n(bonus * ACTIVITY_CREDIT)} kcal, goes to your food budget.`;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.title}>{editId !== null ? 'Edit activity' : 'Log activity'}</Text>
      <Text style={s.note}>
        Keep typing your watch's full step count as usual. Your watch also counts steps during
        sessions like football, so this screen subtracts what those steps already earn, and the same
        effort is never counted twice.
      </Text>

      <View style={{ gap: 8 }}>
        <Text style={s.label}>Type</Text>
        <View style={s.chips}>
          {ACTIVITY_PRESETS.map((p) => {
            const active = presetKey === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => onPreset(p)}
                style={[s.chip, active ? s.chipActive : null]}
              >
                <Text style={[s.chipText, active ? s.chipTextActive : null]}>{p.name}</Text>
              </Pressable>
            );
          })}
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
      {preview ? <Text style={s.preview}>{preview}</Text> : null}
      <Field
        label="Date"
        keyboardType="number-pad"
        value={date}
        onChangeText={(t) => setDate(formatDateInput(t))}
        error={errors.date}
      />

      {saveError ? <Text style={s.saveError}>Could not save: {saveError}</Text> : null}
      <PrimaryButton
        title={editId !== null ? 'Save changes' : 'Save activity'}
        onPress={onSave}
        disabled={saving}
      />
      <SecondaryButton title="Cancel" onPress={() => router.back()} />
      {editId !== null ? <SecondaryButton title="Delete" danger onPress={onDelete} /> : null}

      {editId === null && recent.length > 0 ? (
        <View style={{ gap: 4, marginTop: 8 }}>
          <Text style={s.label}>Recent sessions (tap to edit)</Text>
          {recent.map((a) => (
            <Pressable
              key={a.id}
              style={s.row}
              onPress={() => router.push({ pathname: '/activity', params: { id: String(a.id) } })}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.rowName}>{a.name}</Text>
                <Text style={s.rowSub}>
                  {formatShort(a.date, true)}
                  {a.durationMin ? ` · ${a.durationMin} min` : ''}
                </Text>
              </View>
              <Text style={s.rowKcal}>{a.kcal} kcal</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 24, paddingTop: 64, paddingBottom: 48, gap: 14 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  note: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  preview: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
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
  saveError: { color: colors.danger, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowName: { fontSize: 15, color: colors.text },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  rowKcal: { fontSize: 14, fontWeight: '600', color: colors.text },
});