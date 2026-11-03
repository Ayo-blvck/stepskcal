import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { goalOutlook, type DayPlan, type GoalOutlook, type GoalVerdict } from '../core';
import { getDayPlan, getProfile, latestWeight } from '../db/repo';
import type { Profile } from '../db/schema';
import { dateKey, parseDateKey } from '../lib/dates';
import { PrimaryButton, SecondaryButton} from '../ui/form';
import { colors } from '../ui/theme';

type State =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'ready'; plan: DayPlan; profile: Profile; weightKg: number };

const VERDICT: Record<GoalVerdict, string> = {
  reached: 'Reached',
  on_track: 'On track',
  tight: 'Tight but possible',
  behind: 'Behind pace',
};

function outlookText(label: string, o: GoalOutlook): string {
  if (o.verdict === 'reached') return `${label}: reached.`;
  const need =
    o.requiredDailyKcal === null
      ? 'no target date set'
      : `needs ${o.requiredDailyKcal} kcal/day by your target date`;
  const weeks = o.daysNeeded ? `, about ${Math.ceil(o.daysNeeded / 7)} weeks at your planned pace` : '';
  return `${label} (${o.kgToLose.toFixed(1)} kg to go): ${VERDICT[o.verdict]}. ${need}${weeks}.`;
}

function Card(props: { label: string; value: string; note?: string }) {
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>{props.label}</Text>
      <Text style={s.cardValue}>{props.value}</Text>
      {props.note ? <Text style={s.cardNote}>{props.note}</Text> : null}
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: 'loading' });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const profile = await getProfile();
        const weight = await latestWeight();
        const plan = await getDayPlan(dateKey());
        if (!active) return;
        setState(
          profile && weight && plan
            ? { status: 'ready', plan, profile, weightKg: weight.weightKg }
            : { status: 'none' },
        );
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  if (state.status === 'loading') return null;
  if (state.status === 'none') return <Redirect href="/onboarding" />;

  const { plan, profile, weightKg } = state;
  const today = parseDateKey(dateKey());
  const daysLeft = profile.targetDate
    ? Math.round((parseDateKey(profile.targetDate).getTime() - today.getTime()) / 86400000)
    : null;

  const outlookBase = {
    weightKg,
    daysLeft,
    deficitKcal: plan.effectiveDeficitKcal,
    stepFloor: profile.stepFloor,
    kcalPerStep: plan.kcalPerStep,
  };
  const main = goalOutlook({ ...outlookBase, goalKg: profile.goalWeightKg });
  const stretch =
    profile.stretchGoalKg != null
      ? goalOutlook({ ...outlookBase, goalKg: profile.stretchGoalKg })
      : null;

  const goalNote = [
    outlookText('Goal', main),
    stretch ? outlookText('Stretch', stretch) : null,
  ]
    .filter(Boolean)
    .join('\n\n');

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={s.page}>
      <Text style={s.title}>Today</Text>

      <Card
        label="Food budget"
        value={`${plan.budgetKcal.toLocaleString('en-US')} kcal`}
        note={`Maintenance ${plan.maintenanceKcal.toLocaleString('en-US')} kcal minus a ${plan.effectiveDeficitKcal} kcal deficit${plan.limitedByFloor ? ' (held at the calorie floor)' : ''}.`}
      />
      <Card
        label="Step target"
        value={`${plan.stepTarget.toLocaleString('en-US')} steps`}
        note={`Your floor is ${profile.stepFloor.toLocaleString('en-US')}. Eating over budget adds steps. 1,000 steps burn about ${Math.round(plan.kcalPerStep * 1000)} kcal.`}
      />
      <Card
        label="Goal"
        value={`${weightKg} kg → ${profile.goalWeightKg} kg`}
        note={`${daysLeft !== null ? `${daysLeft} days to ${profile.targetDate}.\n\n` : ''}${goalNote}`}
      />

      <PrimaryButton title="Food library" onPress={() => router.push('/foods')} />
      <SecondaryButton title="Edit profile" onPress={() => router.push('/onboarding')} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 24, paddingTop: 64, paddingBottom: 48, gap: 14 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: { fontSize: 13, color: colors.muted },
  cardValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  cardNote: { fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 4 },
});