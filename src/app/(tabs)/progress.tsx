import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  dayNumber,
  formatDateInput,
  projectGoalDate,
  validateWeightEntry,
  weightJumpUnlikely,
  weightStats,
  type WeightEntry,
  type WeightErrors,
} from '../../core';
import { deleteWeight, getProfile, listWeights, logWeight, setMode } from '../../db/repo';
import type { Profile } from '../../db/schema';
import { dateKey, formatShort } from '../../lib/dates';
import { Field, PrimaryButton, SecondaryButton } from '../../ui/form';
import { colors } from '../../ui/theme';
import { WeightChart } from '../../ui/WeightChart';

const kg1 = (x: number) => x.toFixed(1);
const signed = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x).toFixed(1)}`;

export default function WeightScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dateText, setDateText] = useState(dateKey());
  const [kgText, setKgText] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [errors, setErrors] = useState<WeightErrors>({});
  const [saving, setSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);

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
        },
      },
    ]);
  }

  const today = dateKey();
  const stats =
    profile && entries.length > 0
      ? weightStats(entries, {
          goalKg: profile.goalWeightKg,
          targetDate: profile.targetDate,
          today,
        })
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

  let stretchLine: string | null = null;
  if (stats && profile?.stretchGoalKg != null && stats.currentKg > profile.stretchGoalKg) {
    const d = projectGoalDate(stats.currentKg, profile.stretchGoalKg, stats.weeklyRateKg, today);
    if (d) stretchLine = `Stretch goal of ${profile.stretchGoalKg} kg: around ${formatShort(d, true)}.`;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()}>
        <Text style={s.back}>‹ Back</Text>
      </Pressable>
      <Text style={s.title}>Weight and progress</Text>

      {profile && stats ? (
        <View style={s.card}>
          <Text style={s.cardLabel}>Now</Text>
          <Text style={s.cardValue}>{kg1(stats.currentKg)} kg</Text>
          <Text style={s.note}>
            Since your first weigh-in ({kg1(stats.startKg)} kg on {formatShort(stats.startDate, true)}):{' '}
            {signed(stats.changeKg)} kg.
          </Text>
          <Text style={s.note}>
            {stats.toGoalKg > 0
              ? `${kg1(stats.toGoalKg)} kg to go to reach ${profile.goalWeightKg} kg.`
              : `You have reached your goal of ${profile.goalWeightKg} kg.`}
          </Text>
          <Text style={s.note}>
            {stats.weeklyRateKg === null
              ? 'Pace: log a few weigh-ins across a week or more to see it.'
              : `Pace: ${signed(stats.weeklyRateKg)} kg per week over the last 4 weeks.`}
          </Text>
          {stats.toGoalKg > 0 && stats.weeklyRateKg !== null ? (
            <Text style={s.note}>
              {stats.projectedGoalDate
                ? `At this pace you reach ${profile.goalWeightKg} kg around ${formatShort(stats.projectedGoalDate, true)}.`
                : 'Your weight is flat or rising, so there is no projected date yet.'}
            </Text>
          ) : null}
          {stretchLine ? <Text style={s.note}>{stretchLine}</Text> : null}
          {stats.plannedKgToday !== null && stats.vsPlanKg !== null ? (
            <Text style={s.note}>
              Plan for today: {kg1(stats.plannedKgToday)} kg.{' '}
              {Math.abs(stats.vsPlanKg) < 0.1
                ? 'You are right on the plan.'
                : `You are ${kg1(Math.abs(stats.vsPlanKg))} kg ${stats.vsPlanKg < 0 ? 'ahead of' : 'behind'} the plan.`}
            </Text>
          ) : null}
        </View>
      ) : null}

      {profile && entries.length > 0 ? (
        <View style={s.card}>
          <WeightChart
            points={entries.map((e) => ({ t: dayNumber(e.date), kg: e.kg }))}
            goalKg={profile.goalWeightKg}
            stretchKg={profile.stretchGoalKg ?? null}
            plan={plan}
            xMin={xMin}
            xMax={xMax}
          />
        </View>
      ) : null}

      <View style={s.card}>
        <Text style={s.sectionTitle}>{editing ? 'Edit weigh-in' : 'Log a weigh-in'}</Text>
        <Field
          label="Weight (kg)"
          keyboardType="decimal-pad"
          value={kgText}
          onChangeText={setKgText}
          error={errors.kg}
        />
        <Field
          label="Date"
          keyboardType="number-pad"
          value={dateText}
          onChangeText={(t) => setDateText(formatDateInput(t))}
          error={errors.date}
          hint="Defaults to today. Weigh in at the same time of day for the cleanest trend."
        />
        <PrimaryButton
          title={editing ? 'Save changes' : 'Save weigh-in'}
          onPress={onSave}
          disabled={saving}
        />
        {editing ? (
          <>
            <SecondaryButton title="Cancel" onPress={resetForm} />
            {entries.length > 1 ? (
              <SecondaryButton title="Delete this weigh-in" danger onPress={onDelete} />
            ) : null}
          </>
        ) : null}
      </View>

      {entries.length > 0 ? (
        <View style={s.card}>
          <Text style={s.sectionTitle}>History</Text>
          <Text style={s.note}>Tap an entry to edit it.</Text>
          {visible.map((e) => (
            <Pressable key={e.date} style={s.row} onPress={() => onEdit(e)}>
              <Text style={s.rowDate}>{formatShort(e.date, true)}</Text>
              <Text style={s.rowKg}>{kg1(e.kg)} kg</Text>
            </Pressable>
          ))}
          {newestFirst.length > 15 ? (
            <Pressable onPress={() => setShowAll((v) => !v)}>
              <Text style={s.link}>
                {showAll ? 'Show fewer' : `Show all ${newestFirst.length}`}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 24, paddingTop: 64, paddingBottom: 48, gap: 14 },
  back: { fontSize: 16, color: colors.primary },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: { fontSize: 13, color: colors.muted },
  cardValue: { fontSize: 28, fontWeight: '700', color: colors.text },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  note: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowDate: { fontSize: 15, color: colors.text },
  rowKg: { fontSize: 15, fontWeight: '600', color: colors.text },
  link: { fontSize: 14, color: colors.primary, paddingTop: 6 },
});