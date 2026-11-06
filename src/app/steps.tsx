import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseSteps, stepProgress } from '../core';
import { clearSteps, getDayPlan, getStepEntries, setSteps } from '../db/repo';
import { dateKey, formatDayHeading, shiftDateKey } from '../lib/dates';
import { Segmented } from '../ui/form';
import { AppText, Button, Card } from '../ui/kit';
import { useTheme } from '../ui/ThemeProvider';
import { font } from '../ui/tokens';

type Day = 'today' | 'yesterday';
const n = (x: number) => x.toLocaleString('en-US');

export default function StepsScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [day, setDay] = useState<Day>('today');
  const [text, setText] = useState('');
  const [stored, setStored] = useState<number | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const date = day === 'today' ? dateKey() : shiftDateKey(dateKey(), -1);

  useEffect(() => {
    let active = true;
    Promise.all([getStepEntries(date), getDayPlan(date)]).then(([e, p]) => {
      if (!active) return;
      setStored(e.watch);
      setText(e.watch === null ? '' : String(e.watch));
      setTarget(p ? p.stepTarget : null);
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
      router.dismissTo('/(tabs)');
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
    if (r.kind === 'empty') {
      setError('Enter your step count');
      return;
    }
    setError(undefined);

    if (stored !== null && r.steps < stored) {
      Alert.alert(
        'Lower than before',
        `You saved ${n(stored)} earlier. Replace it with ${n(r.steps)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', onPress: () => save(r.steps) },
        ],
      );
      return;
    }
    await save(r.steps);
  }

  function onRemove() {
    Alert.alert('Remove this entry?', `Your saved steps for ${formatDayHeading(date)} will be cleared.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await clearSteps(date, 'watch');
          router.dismissTo('/');
        },
      },
    ]);
  }

  const parsed = parseSteps(text);
  let live: string | null = null;
  if (target !== null && parsed.kind === 'ok') {
    const p = stepProgress(parsed.steps, target);
    live = p.reached ? 'Target reached. Nice work.' : `${n(p.remaining)} steps to go.`;
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
      <View>
        <AppText variant="small" tone="muted">
          {formatDayHeading(date)}
        </AppText>
        <AppText variant="title">Update steps</AppText>
      </View>

      <Segmented<Day>
        options={[
          { value: 'today', label: 'Today' },
          { value: 'yesterday', label: 'Yesterday' },
        ]}
        value={day}
        onChange={setDay}
      />

      <Card style={{ alignItems: 'center', gap: 4, paddingVertical: 24 }}>
        <AppText variant="small" tone="muted">
          Steps from your watch
        </AppText>
        <TextInput
          value={text}
          onChangeText={(v) => {
            setText(v);
            setError(undefined);
          }}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={t.muted}
          textAlign="center"
          maxLength={7}
          autoFocus
          style={{
            alignSelf: 'stretch',
            fontFamily: font.extrabold,
            fontSize: 48,
            lineHeight: 58,
            color: t.text,
            paddingVertical: 4,
          }}
        />
        {error ? (
          <AppText variant="small" tone="danger">
            {error}
          </AppText>
        ) : (
          <AppText variant="small" tone="muted">
            {target !== null ? `Target for the day: ${n(target)} steps` : 'Open ZTplus and copy the count it shows'}
          </AppText>
        )}
        {live ? (
          <AppText variant="bodyStrong" tone="accent" style={{ marginTop: 6 }}>
            {live}
          </AppText>
        ) : null}
      </Card>

      <View style={{ gap: 10 }}>
        <Button title="Save" onPress={onSave} disabled={saving} />
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
        {stored !== null ? <Button title="Remove entry" variant="danger" onPress={onRemove} /> : null}
      </View>
    </ScrollView>
  );
}