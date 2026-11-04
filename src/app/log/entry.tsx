import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  PORTION_CHIPS,
  formatQuantity,
  parseQuantity,
  scaleKcal,
  validateEntry,
  type EntryErrors,
} from '../../core';
import { addFoodLog, deleteFoodLog, getFood, getFoodLog, updateFoodLog } from '../../db/repo';
import { dateKey } from '../../lib/dates';
import { Field, PrimaryButton, SecondaryButton } from '../../ui/form';
import { colors } from '../../ui/theme';

export default function LogEntry() {
  const router = useRouter();
  const { foodId, logId, quick } = useLocalSearchParams<{
    foodId?: string;
    logId?: string;
    quick?: string;
  }>();
  const isEdit = Boolean(logId);

  const [mode, setMode] = useState<'food' | 'quick'>(quick ? 'quick' : 'food');
  const [name, setName] = useState('');
  const [servingLabel, setServingLabel] = useState<string | null>(null);
  const [perServing, setPerServing] = useState<number | null>(null);
  const [foodRefId, setFoodRefId] = useState<number | null>(null);
  const [qty, setQty] = useState('1');
  const [kcal, setKcal] = useState('');
  const [errors, setErrors] = useState<EntryErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (logId) {
        const l = await getFoodLog(Number(logId));
        if (!l) return;
        setName(l.name);
        setQty(String(l.quantity));
        setKcal(String(l.kcal));
        if (l.servingLabel !== null) {
          setMode('food');
          setServingLabel(l.servingLabel);
          setPerServing(l.kcal / l.quantity);
        } else {
          setMode('quick');
        }
      } else if (foodId) {
        const f = await getFood(Number(foodId));
        if (!f) return;
        setName(f.name);
        setServingLabel(f.servingLabel);
        setPerServing(f.kcal);
        setFoodRefId(f.id);
        setQty('1');
        setKcal(String(f.kcal));
      }
    })();
  }, [logId, foodId]);

  function onQty(text: string) {
    setQty(text);
    const q = parseQuantity(text);
    if (perServing !== null && q !== null) setKcal(String(scaleKcal(perServing, q)));
  }

  async function onSave() {
    const result = validateEntry({ name, qty, kcal }, mode);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaveError(null);
    setSaving(true);
    try {
      const v = result.value;
      if (isEdit) {
        await updateFoodLog(Number(logId), v);
      } else {
        await addFoodLog({
          date: dateKey(),
          name: v.name,
          kcal: v.kcal,
          quantity: v.quantity,
          servingLabel: servingLabel ?? undefined,
          foodId: foodRefId ?? undefined,
        });
      }
      router.dismissTo('/');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    Alert.alert('Delete this entry?', 'It will be removed from today\'s log.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteFoodLog(Number(logId));
          router.dismissTo('/');
        },
      },
    ]);
  }

  const activeQty = parseQuantity(qty);

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.title}>
        {isEdit ? 'Edit entry' : mode === 'quick' ? 'Quick add' : 'Add to today'}
      </Text>

      {mode === 'food' ? (
        <View style={{ gap: 4 }}>
          <Text style={s.foodName}>{name}</Text>
          <Text style={s.muted}>
            1 serving = {servingLabel}
            {perServing !== null ? ` · ${Math.round(perServing)} kcal` : ''}
          </Text>
        </View>
      ) : (
        <Field
          label="What was it? (optional)"
          value={name}
          onChangeText={setName}
          error={errors.name}
          placeholder="For example office snack"
        />
      )}

      {mode === 'food' ? (
        <View style={{ gap: 10 }}>
          <Text style={s.label}>Servings</Text>
          <View style={s.chips}>
            {PORTION_CHIPS.map((c) => {
              const active = activeQty === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => onQty(String(c))}
                  style={[s.chip, active ? s.chipActive : null]}
                >
                  <Text style={[s.chipText, active ? s.chipTextActive : null]}>
                    {formatQuantity(c)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Field
            label="Or type a number"
            keyboardType="decimal-pad"
            value={qty}
            onChangeText={onQty}
            error={errors.qty}
          />
        </View>
      ) : null}

      <Field
        label={mode === 'food' ? 'Total calories (kcal)' : 'Calories (kcal)'}
        keyboardType="decimal-pad"
        value={kcal}
        onChangeText={setKcal}
        error={errors.kcal}
        hint={
          mode === 'food'
            ? 'Filled in from the servings. Change it if the portion was bigger or smaller.'
            : undefined
        }
      />

      {saveError ? <Text style={s.saveError}>Could not save: {saveError}</Text> : null}
      <PrimaryButton title={isEdit ? 'Save changes' : 'Add to today'} onPress={onSave} disabled={saving} />
      <SecondaryButton title="Cancel" onPress={() => router.back()} />
      {isEdit ? <SecondaryButton title="Delete entry" danger onPress={onDelete} /> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 24, paddingTop: 64, paddingBottom: 48, gap: 16 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  foodName: { fontSize: 20, fontWeight: '600', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minWidth: 52,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 16, color: colors.text },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  saveError: { color: colors.danger, fontSize: 13 },
});