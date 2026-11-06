import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { findDuplicateFood, validateFoodForm, type FoodFormErrors, type RawFoodForm } from '../../core';
import { addCustomFood, getFood, hideFood, listFoods, updateFood } from '../../db/repo';
import { Field, PrimaryButton, SecondaryButton } from '../../ui/form';
import { colors } from '../../ui/theme';

export default function FoodEdit() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
  const foodId = id ? Number(id) : null;

  const [form, setForm] = useState<RawFoodForm>({
    name: name ?? '',
    servingLabel: '',
    kcal: '',
  });
  const [errors, setErrors] = useState<FoodFormErrors>({});
  const [isSeed, setIsSeed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (foodId === null) return;
    (async () => {
      const f = await getFood(foodId);
      if (f) {
        setForm({ name: f.name, servingLabel: f.servingLabel, kcal: String(f.kcal) });
        setIsSeed(!f.isCustom);
      }
    })();
  }, [foodId]);

  const set = (key: keyof RawFoodForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function onSave() {
    const result = validateFoodForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    const existing = await listFoods();
    const dup = findDuplicateFood(existing, result.value.name, result.value.servingLabel, foodId);
    if (dup) {
      setErrors({
        name: `"${dup.name}" with this serving already exists (${dup.kcal} kcal). Edit that one instead.`,
      });
      return;
    }

    setErrors({});
    setSaveError(null);
    setSaving(true);
    try {
      if (foodId === null) await addCustomFood(result.value);
      else await updateFood(foodId, result.value);
      router.back();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function onHide() {
    if (foodId === null) return;
    Alert.alert('Hide this food?', 'It will no longer appear in your list. Past logs are not affected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Hide',
        style: 'destructive',
        onPress: async () => {
          await hideFood(foodId);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.title}>{foodId === null ? 'Add a food' : 'Edit food'}</Text>
      {isSeed ? (
        <Text style={s.note}>Pre-loaded estimate. Change it to match what you actually eat.</Text>
      ) : null}

      <Field
        label="Name"
        value={form.name}
        onChangeText={(t) => set('name', t)}
        error={errors.name}
      />
      <Field
        label="One serving is"
        value={form.servingLabel}
        onChangeText={(t) => set('servingLabel', t)}
        error={errors.servingLabel}
        hint='For example "1 medium wrap (~300 g)" or "1 plate".'
      />
      <Field
        label="Calories per serving (kcal)"
        keyboardType="decimal-pad"
        value={form.kcal}
        onChangeText={(t) => set('kcal', t)}
        error={errors.kcal}
      />

      {saveError ? <Text style={s.saveError}>Could not save: {saveError}</Text> : null}
      <PrimaryButton title="Save" onPress={onSave} disabled={saving} />
      <SecondaryButton title="Cancel" onPress={() => router.back()} />
      {foodId !== null ? <SecondaryButton title="Hide this food" danger onPress={onHide} /> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 24, paddingTop: 64, paddingBottom: 48, gap: 14 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  note: { fontSize: 13, color: colors.muted },
  saveError: { color: colors.danger, fontSize: 13 },
});