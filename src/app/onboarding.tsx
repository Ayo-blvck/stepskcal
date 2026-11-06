import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  emptyForm,
  formatDateInput,
  formFromProfile,
  resolveMode,
  validateProfileForm,
  type FormErrors,
  type RawProfileForm,
} from '../core';
import { getProfile, latestWeight, logWeight, saveProfile } from '../db/repo';
import type { Profile } from '../db/schema';
import { dateKey } from '../lib/dates';
import { Field, Segmented } from '../ui/form';
import { AppText, Button, Card } from '../ui/kit';
import { useTheme } from '../ui/ThemeProvider';

export default function Onboarding() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<RawProfileForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [existing, setExisting] = useState<Profile | null>(null);
  const [latestKg, setLatestKg] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const editing = existing !== null;

  useEffect(() => {
    (async () => {
      const [p, w] = await Promise.all([getProfile(), latestWeight()]);
      if (p && w) {
        setForm(formFromProfile(p, w.weightKg));
        setExisting(p);
        setLatestKg(w.weightKg);
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
        mode: resolveMode({
          existingMode: existing?.mode ?? null,
          existingGoalKg: existing?.goalWeightKg ?? null,
          goalKg: v.goalWeightKg,
          weightKg: v.weightKg,
        }),
        dailyDeficitKcal: v.dailyDeficitKcal,
        stepFloor: v.stepFloor,
      });
      // Editing the profile should not add a weigh-in unless the weight was changed.
      if (!editing || latestKg === null || v.weightKg !== latestKg) {
        await logWeight(dateKey(), v.weightKg);
      }
      if (editing) router.dismissTo('/(tabs)');
      else router.replace('/(tabs)');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
        gap: 14,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {editing ? (
        <AppText variant="title">Edit profile</AppText>
      ) : (
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
          <Image
            source={require('../../assets/images/splash-icon.png')}
            style={{ width: 72, height: 72, borderRadius: 20 }}
          />
          <AppText variant="title" style={{ textAlign: 'center' }}>
            Welcome to StepsKcal
          </AppText>
          <AppText tone="muted" style={{ textAlign: 'center' }}>
            Eat smart. Walk it off. A few numbers and your plan is ready. They stay on your phone.
          </AppText>
          <Button
            title="I already have a backup file"
            variant="dashed"
            onPress={() => router.push('/backup')}
            style={{ alignSelf: 'stretch', marginTop: 6 }}
          />
        </View>
      )}

      <Card style={{ gap: 14 }}>
        <AppText variant="h2">About you</AppText>
        <Segmented<'male' | 'female'>
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
          onChangeText={(v) => set('birthDate', formatDateInput(v))}
          error={errors.birthDate}
          hint="Type the digits only, for example 19970507"
        />
      </Card>

      <Card style={{ gap: 14 }}>
        <AppText variant="h2">Height</AppText>
        <Segmented<'ft' | 'cm'>
          options={[
            { value: 'ft', label: 'ft / in' },
            { value: 'cm', label: 'cm' },
          ]}
          value={form.heightUnit}
          onChange={(v) => set('heightUnit', v)}
        />
        {form.heightUnit === 'ft' ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Feet"
                keyboardType="number-pad"
                value={form.heightFt}
                onChangeText={(v) => set('heightFt', v)}
                error={errors.heightFt}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Inches"
                keyboardType="decimal-pad"
                value={form.heightIn}
                onChangeText={(v) => set('heightIn', v)}
                error={errors.heightIn}
              />
            </View>
          </View>
        ) : (
          <Field
            label="Height (cm)"
            keyboardType="decimal-pad"
            value={form.heightCm}
            onChangeText={(v) => set('heightCm', v)}
            error={errors.heightCm}
          />
        )}
      </Card>

      <Card style={{ gap: 14 }}>
        <AppText variant="h2">Weight and goal</AppText>
        <Field
          label="Current weight (kg)"
          keyboardType="decimal-pad"
          value={form.weightKg}
          onChangeText={(v) => set('weightKg', v)}
          error={errors.weightKg}
        />
        <Field
          label="Goal weight (kg)"
          keyboardType="decimal-pad"
          value={form.goalWeightKg}
          onChangeText={(v) => set('goalWeightKg', v)}
          error={errors.goalWeightKg}
        />
        <Field
          label="Stretch goal (kg, optional)"
          keyboardType="decimal-pad"
          value={form.stretchGoalKg}
          onChangeText={(v) => set('stretchGoalKg', v)}
          error={errors.stretchGoalKg}
        />
        <Field
          label="Target date (optional)"
          placeholder="YYYY-MM-DD"
          keyboardType="number-pad"
          value={form.targetDate}
          onChangeText={(v) => set('targetDate', formatDateInput(v))}
          error={errors.targetDate}
        />
      </Card>

      <Card style={{ gap: 14 }}>
        <AppText variant="h2">Your plan</AppText>
        <Field
          label="Daily calorie deficit (kcal)"
          keyboardType="number-pad"
          value={form.dailyDeficitKcal}
          onChangeText={(v) => set('dailyDeficitKcal', v)}
          error={errors.dailyDeficitKcal}
          hint="500 is about 0.5 kg a week. Use 0 to hold your weight steady."
        />
        <Field
          label="Minimum daily steps"
          keyboardType="number-pad"
          value={form.stepFloor}
          onChangeText={(v) => set('stepFloor', v)}
          error={errors.stepFloor}
          hint="Your daily floor, even on days you eat under budget."
        />
      </Card>

      {saveError ? (
        <AppText variant="small" tone="danger">
          Could not save: {saveError}
        </AppText>
      ) : null}

      <View style={{ gap: 10 }}>
        <Button
          title={editing ? 'Save changes' : 'Save and continue'}
          onPress={onSave}
          disabled={saving}
        />
        {editing ? <Button title="Cancel" variant="secondary" onPress={() => router.back()} /> : null}
      </View>
    </ScrollView>
  );
}