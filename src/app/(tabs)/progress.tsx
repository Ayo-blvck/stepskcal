import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  dayNumber,
  formatDateInput,
  progressSummary,
  signedKg,
  validateWeightEntry,
  weightJumpUnlikely,
  weightStats,
  type WeightEntry,
  type WeightErrors,
} from '../../core';
import { deleteWeight, getProfile, listWeights, logWeight, setMode } from '../../db/repo';
import type { Profile } from '../../db/schema';
import { dateKey, formatShort } from '../../lib/dates';
import { Field } from '../../ui/form';
import { AppText, Button, Card, ListRow } from '../../ui/kit';
import { useTheme } from '../../ui/ThemeProvider';
import { WeightChart } from '../../ui/WeightChart';

const kg1 = (x: number) => x.toFixed(1);

export default function Progress() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollViewInstance>(null);
  const [formY, setFormY] = useState(0);

  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dateText, setDateText] = useState(dateKey());
  const [kgText, setKgText] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [errors, setErrors] = useState<WeightErrors>({});
  const [saving, setSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [w, p] = await Promise.all([listWeights(), getProfile()]);
    const list = w.map((x) => ({ date: x.date, kg: x.weightKg }));
    setEntries(list);
    setProfile(p);
    return { list, p };
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function resetForm() {
    setEditing(null);
    setDateText(dateKey());
    setKgText('');
    setErrors({});
  }

  async function commit(v: { date: string; kg: number }) {
    setSaving(true);
    try {
      if (editing && editing !== v.date) await deleteWeight(editing);
      await logWeight(v.date, v.kg);
      const { list, p } = await load();
      resetForm();
      setSelected(null);

      const latest = list[list.length - 1];
      if (p && p.mode === 'lose' && latest && latest.kg <= p.goalWeightKg) {
        Alert.alert(
          'Goal reached 🎉',
          `You are at ${kg1(latest.kg)} kg, which meets your goal of ${p.goalWeightKg} kg. Switch to maintain mode so the app stops asking for a deficit?`,
          [
            { text: 'Not yet', style: 'cancel' },
            {
              text: 'Switch to maintain',
              onPress: async () => {
                await setMode('maintain');
                await load();
              },
            },
          ],
        );
      }
    } catch (e) {
      setErrors({ kg: e instanceof Error ? e.message : String(e) });
    } finally {
      setSaving(false);
    }
  }

  function onSave() {
    const result = validateWeightEntry({ date: dateText, kg: kgText }, new Date());
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    const v = result.value;

    const prev = entries.filter((e) => e.date < v.date && e.date !== editing).pop() ?? null;
    if (weightJumpUnlikely(prev, v)) {
      Alert.alert(
        'Is this right?',
        `That is ${kg1(Math.abs(v.kg - prev!.kg))} kg ${v.kg < prev!.kg ? 'lower' : 'higher'} than your weigh-in on ${formatShort(prev!.date, true)} (${kg1(prev!.kg)} kg).`,
        [
          { text: 'Check again', style: 'cancel' },
          { text: 'Yes, save it', onPress: () => commit(v) },
        ],
      );
      return;
    }
    commit(v);
  }

  function onEdit(e: WeightEntry) {
    setEditing(e.date);
    setDateText(e.date);
    setKgText(String(e.kg));
    setErrors({});
    scroller.current?.scrollTo({ y: Math.max(0, formY - 16), animated: true });
  }

  function onDelete() {
    if (!editing) return;
    Alert.alert('Delete this weigh-in?', formatShort(editing, true), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWeight(editing);
          await load();
          resetForm();
          setSelected(null);
        },
      },
    ]);
  }

  const today = dateKey();
  const stats =
    profile && entries.length > 0
      ? weightStats(entries, { goalKg: profile.goalWeightKg, targetDate: profile.targetDate, today })
      : null;
  const summary =
    stats && profile
      ? progressSummary(
          {
            stats,
            goalKg: profile.goalWeightKg,
            stretchKg: profile.stretchGoalKg ?? null,
            today,
            mode: profile.mode,
          },
          (k) => formatShort(k, true),
        )
      : null;

  const first = entries[0];
  const xMin = first ? dayNumber(first.date) : dayNumber(today);
  const xMaxBase = profile?.targetDate ? dayNumber(profile.targetDate) : dayNumber(today) + 28;
  const lastT = entries.length ? dayNumber(entries[entries.length - 1].date) : xMin;
  const xMax = Math.max(xMaxBase, lastT + 7, xMin + 14);
  const plan =
    first && profile?.targetDate && dayNumber(profile.targetDate) > xMin
      ? {
          from: { t: xMin, kg: first.kg },
          to: { t: dayNumber(profile.targetDate), kg: profile.goalWeightKg },
        }
      : null;

  const newestFirst = [...entries].reverse();
  const visible = showAll ? newestFirst : newestFirst.slice(0, 15);
  const selectedEntry = selected !== null ? entries[selected] : undefined;

  return (
    <ScrollView
      ref={scroller}
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: insets.top + 16,
        paddingBottom: 32,
        gap: 14,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="title">Progress</AppText>

      {stats && summary && profile ? (
        <>
          <Card style={{ gap: 4 }}>
            <AppText variant="small" tone="muted">
              Now
            </AppText>
            <AppText variant="numberLg" style={{ fontSize: 46, lineHeight: 54 }}>
              {kg1(stats.currentKg)} kg
            </AppText>
            <AppText variant="small" tone="muted">
              {summary.headline}
            </AppText>
          </Card>

          <Card>
            <AppText variant="small" tone={selectedEntry ? 'default' : 'muted'} style={{ marginBottom: 6 }}>
              {selectedEntry
                ? `${formatShort(selectedEntry.date, true)} · ${kg1(selectedEntry.kg)} kg`
                : 'Tap the chart to see a weigh-in'}
            </AppText>
            <WeightChart
              points={entries.map((e) => ({ t: dayNumber(e.date), kg: e.kg }))}
              goalKg={profile.goalWeightKg}
              stretchKg={profile.stretchGoalKg ?? null}
              plan={plan}
              xMin={xMin}
              xMax={xMax}
              selected={selected}
              onSelect={setSelected}
            />
          </Card>

          <Card>
            <AppText variant="h2">Details</AppText>
            {summary.facts.map((f, i) => (
              <ListRow
                key={f.label}
                title={f.label}
                right={f.value}
                last={i === summary.facts.length - 1}
              />
            ))}
          </Card>
        </>
      ) : (
        <Card>
          <AppText tone="muted">No weigh-ins yet. Log your first one below.</AppText>
        </Card>
      )}

      <View onLayout={(e) => setFormY(e.nativeEvent.layout.y)}>
        <Card style={{ gap: 14 }}>
          <AppText variant="h2">{editing ? 'Edit weigh-in' : 'Log a weigh-in'}</AppText>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Weight (kg)"
                keyboardType="decimal-pad"
                value={kgText}
                onChangeText={setKgText}
                error={errors.kg}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Date"
                keyboardType="number-pad"
                value={dateText}
                onChangeText={(v) => setDateText(formatDateInput(v))}
                error={errors.date}
              />
            </View>
          </View>
          <AppText variant="caption" tone="muted">
            Weigh in at the same time of day for the cleanest trend.
          </AppText>
          <Button
            title={editing ? 'Save changes' : 'Save weigh-in'}
            onPress={onSave}
            disabled={saving}
          />
          {editing ? (
            <>
              <Button title="Cancel" variant="secondary" onPress={resetForm} />
              {entries.length > 1 ? (
                <Button title="Delete this weigh-in" variant="danger" onPress={onDelete} />
              ) : null}
            </>
          ) : null}
        </Card>
      </View>

      {entries.length > 0 ? (
        <Card>
          <AppText variant="h2">History</AppText>
          <AppText variant="small" tone="muted" style={{ marginBottom: 2 }}>
            Tap an entry to edit it.
          </AppText>
          {visible.map((e, i) => {
            const older = newestFirst[i + 1];
            return (
              <ListRow
                key={e.date}
                title={formatShort(e.date, true)}
                subtitle={older ? `${signedKg(e.kg - older.kg)} kg since previous` : 'First weigh-in'}
                right={`${kg1(e.kg)} kg`}
                last={i === visible.length - 1}
                onPress={() => onEdit(e)}
              />
            );
          })}
          {newestFirst.length > 15 ? (
            <Button
              title={showAll ? 'Show fewer' : `Show all ${newestFirst.length}`}
              variant="ghost"
              size="sm"
              onPress={() => setShowAll((v) => !v)}
            />
          ) : null}
        </Card>
      ) : null}
    </ScrollView>
  );
}