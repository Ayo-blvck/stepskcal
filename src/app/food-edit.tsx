import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { findDuplicateFood, validateFoodForm, type FoodFormErrors, type RawFoodForm } from '../core';
import { addCustomFood, getFood, hideFood, listFoods, updateFood } from '../db/repo';
import { Field } from '../ui/form';
import { AppText, Button } from '../ui/kit';
import { useTheme } from '../ui/ThemeProvider';

export default function FoodEdit() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
  const foodId = id ? Number(id) : null;

  const [form, setForm] = useState<RawFoodForm>({ name: name ?? '', servingLabel: '', kcal: '' });
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
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
        gap: 18,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="title">{foodId === null ? 'Add a food' : 'Edit food'}</AppText>
      {isSeed ? (
        <AppText variant="small" tone="muted">
          Pre-loaded estimate. Change it to match what you actually eat.
        </AppText>
      ) : null}

      <Field label="Name" value={form.name} onChangeText={(v) => set('name', v)} error={errors.name} />
      <Field
        label="One serving is"
        value={form.servingLabel}
        onChangeText={(v) => set('servingLabel', v)}
        error={errors.servingLabel}
        hint={'For example "1 medium wrap (~300 g)" or "1 plate".'}
      />
      <Field
        label="Calories per serving (kcal)"
        keyboardType="decimal-pad"
        value={form.kcal}
        onChangeText={(v) => set('kcal', v)}
        error={errors.kcal}
      />

      {saveError ? (
        <AppText variant="small" tone="danger">
          Could not save: {saveError}
        </AppText>
      ) : null}

      <View style={{ gap: 10 }}>
        <Button title="Save" onPress={onSave} disabled={saving} />
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
        {foodId !== null ? <Button title="Hide this food" variant="danger" onPress={onHide} /> : null}
      </View>
    </ScrollView>
  );
}