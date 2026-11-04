import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { parseSteps } from '../core';
import { clearSteps, getStepEntries, setSteps } from '../db/repo';
import { dateKey, shiftDateKey } from '../lib/dates';
import { Field, PrimaryButton, SecondaryButton, Segmented } from '../ui/form';
import { colors } from '../ui/theme';

type Day = 'today' | 'yesterday';

export default function StepsScreen() {
  const router = useRouter();
  const [day, setDay] = useState<Day>('today');
  const [text, setText] = useState('');
  const [stored, setStored] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const date = day === 'today' ? dateKey() : shiftDateKey(dateKey(), -1);

  useEffect(() => {
    let active = true;
    getStepEntries(date).then((e) => {
      if (!active) return;
      setStored(e.watch);
      setText(e.watch === null ? '' : String(e.watch));
      setError(undefined);
    });
    return () => {
      active = false;
    };
  }, [date]);

  async function save(steps: number) {
    setSaving(true);
    try {
      await setSteps(date, 'watch', steps);
      router.dismissTo('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function onSave() {
    const r = parseSteps(text);
    if (r.kind === 'error') {
      setError(r.message);
      return;
    }
    setError(undefined);

    if (r.kind === 'empty') {
      if (stored !== null) await clearSteps(date, 'watch');
      router.dismissTo('/');
      return;
    }

    if (stored !== null && r.steps < stored) {
      Alert.alert(
        'Lower than before',
        `You saved ${stored.toLocaleString('en-US')} earlier. Replace it with ${r.steps.toLocaleString('en-US')}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', onPress: () => save(r.steps) },
        ],
      );
      return;
    }
    await save(r.steps);
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.title}>Update steps</Text>

      <Segmented<Day>
        options={[
          { value: 'today', label: 'Today' },
          { value: 'yesterday', label: 'Yesterday' },
        ]}
        value={day}
        onChange={setDay}
      />

      <Field
        label="Watch steps"
        keyboardType="number-pad"
        value={text}
        onChangeText={(t) => {
          setText(t);
          setError(undefined);
        }}
        error={error}
        hint="Open ZTplus and copy the step count it shows. Leave empty and save to remove the entry."
      />

      <PrimaryButton title="Save" onPress={onSave} disabled={saving} />
      <SecondaryButton title="Cancel" onPress={() => router.back()} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 24, paddingTop: 64, paddingBottom: 48, gap: 16 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
});