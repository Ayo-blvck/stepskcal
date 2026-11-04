import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  emptyForm,
  formatDateInput,
  formFromProfile,
  validateProfileForm,
  type FormErrors,
  type RawProfileForm,
} from '../core';
import { getProfile, latestWeight, logWeight, saveProfile } from '../db/repo';
import { dateKey } from '../lib/dates';
import { Field, PrimaryButton, SecondaryButton, Segmented } from '../ui/form';
import { colors } from '../ui/theme';

export default function Onboarding() {
  const router = useRouter();
  const [form, setForm] = useState<RawProfileForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      const w = await latestWeight();
      if (p && w) {
        setForm(formFromProfile(p, w.weightKg));
        setEditing(true);
      }
    })();
  }, []);

  const set = <K extends keyof RawProfileForm>(key: K, value: RawProfileForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSave() {
    const result = validateProfileForm(form, new Date());
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaveError(null);
    setSaving(true);
    try {
      const v = result.value;
      await saveProfile({
        sex: v.sex,
        birthDate: v.birthDate,
        heightCm: v.heightCm,
        goalWeightKg: v.goalWeightKg,
        stretchGoalKg: v.stretchGoalKg,
        targetDate: v.targetDate,
        mode: v.mode,
        dailyDeficitKcal: v.dailyDeficitKcal,
        stepFloor: v.stepFloor,
      });
      await logWeight(dateKey(), v.weightKg);
      router.replace('/');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.title}>{editing ? 'Edit your profile' : 'Set up your plan'}</Text>
      <Text style={s.intro}>
        These numbers stay on your phone. They are used to estimate how many calories your body
        uses and how many steps you need each day.
      </Text>
            {!editing ? (
        <SecondaryButton title="I already have a backup file" onPress={() => router.push('/backup')} />
      ) : null}

      <Text style={s.section}>About you</Text>
      <Segmented
        label="Sex"
        options={[
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ]}
        value={form.sex}
        onChange={(v) => set('sex', v)}
        error={errors.sex}
      />
      <Field
        label="Date of birth"
        placeholder="YYYY-MM-DD"
        keyboardType="number-pad"
        value={form.birthDate}
        onChangeText={(t) => set('birthDate', formatDateInput(t))}
        error={errors.birthDate}
        hint="Type the digits only, for example 19970507"
      />

      <Text style={s.section}>Height</Text>
      <Segmented
        options={[
          { value: 'ft', label: 'ft / in' },
          { value: 'cm', label: 'cm' },
        ]}
        value={form.heightUnit}
        onChange={(v) => set('heightUnit', v)}
      />
      {form.heightUnit === 'ft' ? (
        <View style={s.row}>
          <View style={s.half}>
            <Field
              label="Feet"
              keyboardType="number-pad"
              value={form.heightFt}
              onChangeText={(t) => set('heightFt', t)}
              error={errors.heightFt}
            />
          </View>
          <View style={s.half}>
            <Field
              label="Inches"
              keyboardType="decimal-pad"
              value={form.heightIn}
              onChangeText={(t) => set('heightIn', t)}
              error={errors.heightIn}
            />
          </View>
        </View>
      ) : (
        <Field
          label="Height (cm)"
          keyboardType="decimal-pad"
          value={form.heightCm}
          onChangeText={(t) => set('heightCm', t)}
          error={errors.heightCm}
        />
      )}

      <Text style={s.section}>Weight and goal</Text>
      <Field
        label="Current weight (kg)"
        keyboardType="decimal-pad"
        value={form.weightKg}
        onChangeText={(t) => set('weightKg', t)}
        error={errors.weightKg}
      />
      <Field
        label="Goal weight (kg)"
        keyboardType="decimal-pad"
        value={form.goalWeightKg}
        onChangeText={(t) => set('goalWeightKg', t)}
        error={errors.goalWeightKg}
      />
      <Field
        label="Stretch goal (kg, optional)"
        keyboardType="decimal-pad"
        value={form.stretchGoalKg}
        onChangeText={(t) => set('stretchGoalKg', t)}
        error={errors.stretchGoalKg}
      />
      <Field
        label="Target date (optional)"
        placeholder="YYYY-MM-DD"
        keyboardType="number-pad"
        value={form.targetDate}
        onChangeText={(t) => set('targetDate', formatDateInput(t))}
        error={errors.targetDate}
      />

      <Text style={s.section}>Plan</Text>
      <Field
        label="Daily calorie deficit (kcal)"
        keyboardType="number-pad"
        value={form.dailyDeficitKcal}
        onChangeText={(t) => set('dailyDeficitKcal', t)}
        error={errors.dailyDeficitKcal}
        hint="500 is about 0.5 kg a week. Use 0 to hold your weight steady."
      />
      <Field
        label="Minimum daily steps"
        keyboardType="number-pad"
        value={form.stepFloor}
        onChangeText={(t) => set('stepFloor', t)}
        error={errors.stepFloor}
        hint="Your daily floor, even on days you eat under budget."
      />

      {saveError ? <Text style={s.saveError}>Could not save: {saveError}</Text> : null}
      <PrimaryButton
        title={editing ? 'Save changes' : 'Save and continue'}
        onPress={onSave}
        disabled={saving}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 24, paddingTop: 64, paddingBottom: 48, gap: 14 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  intro: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  section: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 10 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  saveError: { color: colors.danger, fontSize: 13 },
});