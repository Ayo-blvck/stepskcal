import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { Field } from '../../ui/form';
import { AppText, Button, Chip } from '../../ui/kit';
import { useTheme } from '../../ui/ThemeProvider';

export default function LogEntry() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
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
      router.dismissTo('/(tabs)');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    Alert.alert('Delete this entry?', "It will be removed from today's log.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteFoodLog(Number(logId));
          router.dismissTo('/(tabs)');
        },
      },
    ]);
  }

  const activeQty = parseQuantity(qty);
  const title = isEdit ? 'Edit entry' : mode === 'quick' ? 'Quick add' : 'Add to today';

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
      <AppText variant="title">{title}</AppText>

      {mode === 'food' ? (
        <View style={{ gap: 4 }}>
          <AppText variant="number">{name}</AppText>
          <AppText variant="small" tone="muted">
            1 serving = {servingLabel}
            {perServing !== null ? ` · ${Math.round(perServing)} kcal` : ''}
          </AppText>
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
          <AppText variant="label">Servings</AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {PORTION_CHIPS.map((c) => (
              <Chip
                key={c}
                label={formatQuantity(c)}
                tone="green"
                selected={activeQty === c}
                onPress={() => onQty(String(c))}
                style={{ flex: 1, paddingHorizontal: 0 }}
              />
            ))}
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

      {saveError ? (
        <AppText variant="small" tone="danger">
          Could not save: {saveError}
        </AppText>
      ) : null}

      <View style={{ gap: 10 }}>
        <Button title={isEdit ? 'Save changes' : 'Add to today'} onPress={onSave} disabled={saving} />
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
        {isEdit ? <Button title="Delete entry" variant="danger" onPress={onDelete} /> : null}
        {!isEdit && mode === 'food' && foodRefId !== null ? (
          <Button
            title="Edit this food"
            variant="ghost"
            size="sm"
            onPress={() => router.replace({ pathname: '/food-edit', params: { id: String(foodRefId) } })}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}