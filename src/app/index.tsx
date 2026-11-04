import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  formatQuantity,
  goalOutlook,
  type GoalOutlook,
  type GoalVerdict,
} from '../core';
import { getDayPlan, getProfile, latestWeight, listFoodLogs, type DayPlanView } from '../db/repo';
import type { FoodLog, Profile } from '../db/schema';
import { dateKey, parseDateKey } from '../lib/dates';
import { PrimaryButton, SecondaryButton } from '../ui/form';
import { colors } from '../ui/theme';
import { StepsCard } from '../ui/StepsCard';
import { ActivityCard } from '../ui/ActivityCard';
import { BackupNudge } from '../ui/BackupNudge';
import { refreshReminders } from '../lib/notifications';

type State =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'ready'; plan: DayPlanView; profile: Profile; weightKg: number; logs: FoodLog[] };

const VERDICT: Record<GoalVerdict, string> = {
  reached: 'Reached',
  on_track: 'On track',
  tight: 'Tight but possible',
  behind: 'Behind pace',
};

const n = (x: number) => x.toLocaleString('en-US');

function outlookText(label: string, o: GoalOutlook): string {
  if (o.verdict === 'reached') return `${label}: reached.`;
  const need =
    o.requiredDailyKcal === null
      ? 'no target date set'
      : `needs ${o.requiredDailyKcal} kcal/day by your target date`;
  const weeks = o.daysNeeded ? `, about ${Math.ceil(o.daysNeeded / 7)} weeks at your planned pace` : '';
  return `${label} (${o.kgToLose.toFixed(1)} kg to go): ${VERDICT[o.verdict]}. ${need}${weeks}.`;
}

function Card(props: { label: string; value: string; note?: string; children?: React.ReactNode }) {
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>{props.label}</Text>
      <Text style={s.cardValue}>{props.value}</Text>
      {props.note ? <Text style={s.cardNote}>{props.note}</Text> : null}
      {props.children}
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
        const today = dateKey();
        const profile = await getProfile();
        const weight = await latestWeight();
        const plan = await getDayPlan(today);
        const logs = await listFoodLogs(today);
        if (!active) return;
        setState(
          profile && weight && plan
            ? { status: 'ready', plan, profile, weightKg: weight.weightKg, logs }
            : { status: 'none' },
        );
        refreshReminders();
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  if (state.status === 'loading') return null;
  if (state.status === 'none') return <Redirect href="/onboarding" />;

  const { plan, profile, weightKg, logs } = state;
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
  const goalNote = [outlookText('Goal', main), stretch ? outlookText('Stretch', stretch) : null]
    .filter(Boolean)
    .join('\n\n');

  const eaten = logs.reduce((sum, l) => sum + l.kcal, 0);
  const extraSteps = Math.max(0, plan.stepTarget - profile.stepFloor);

  let stepNote: string;
  if (plan.overageKcal > 0) {
    stepNote = `+${n(extraSteps)} steps from eating ${n(plan.overageKcal)} kcal over budget.`;
    if (plan.uncoveredKcal > 0) {
      stepNote += ` The cap is ${n(profile.stepCap)} steps, so about ${n(plan.uncoveredKcal)} kcal can't be walked off today. Accept it and stay on plan tomorrow.`;
    }
  } else {
    stepNote = `You are within budget, so you only need your floor of ${n(profile.stepFloor)} steps.`;
  }

  const left = plan.remainingKcal;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={s.page}>
      <Text style={s.title}>Today</Text>
      <BackupNudge profileCreatedAt={profile.createdAt} />

      <Card label="Step target" value={`${n(plan.stepTarget)} steps`} note={stepNote} />
      <StepsCard
        done={plan.stepsDone}
        target={plan.stepTarget}
        watch={plan.watchSteps}
        phone={plan.phoneSteps}
      />

      <PrimaryButton title="Log food" onPress={() => router.push('/log')} />

      <Card
        label="Food today"
        value={left >= 0 ? `${n(left)} kcal left` : `${n(-left)} kcal over`}
        note={`Eaten ${n(eaten)} of ${n(plan.budgetKcal + plan.activityCreditKcal)} kcal${plan.activityCreditKcal > 0 ? ` (budget ${n(plan.budgetKcal)} + ${n(plan.activityCreditKcal)} from activity)` : ' budget'}. Maintenance is ${n(plan.maintenanceKcal)} kcal minus a ${plan.effectiveDeficitKcal} kcal deficit${plan.limitedByFloor ? ' (held at the calorie floor)' : ''}.`}
        >
        {logs.length === 0 ? (
          <Text style={s.cardNote}>Nothing logged yet.</Text>
        ) : (
          <View style={{ marginTop: 8 }}>
            {logs.map((l) => (
              <Pressable
                key={l.id}
                style={s.logRow}
                onPress={() => router.push({ pathname: '/log/entry', params: { logId: String(l.id) } })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.logName}>{l.name}</Text>
                  {l.servingLabel ? (
                    <Text style={s.logSub}>
                      {formatQuantity(l.quantity)} × {l.servingLabel}
                    </Text>
                  ) : null}
                </View>
                <Text style={s.logKcal}>{l.kcal} kcal</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Card>

      <ActivityCard creditKcal={plan.activityCreditKcal} />
      
      <Card
        label="Goal"
        value={`${weightKg} kg → ${profile.goalWeightKg} kg`}
        note={`${daysLeft !== null ? `${daysLeft} days to ${profile.targetDate}.\n\n` : ''}${goalNote}`}
      />
      <SecondaryButton title="Weight and progress" onPress={() => router.push('/weight')} />
      <SecondaryButton title="Food library" onPress={() => router.push('/foods')} />
      <SecondaryButton title="Edit profile" onPress={() => router.push('/onboarding')} />
      <SecondaryButton title="Backup and restore" onPress={() => router.push('/backup')} />
      <SecondaryButton title="Reminders" onPress={() => router.push('/reminders')} />
      <SecondaryButton title="R0 check" onPress={() => router.push('/dev-r0')} />
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
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  logName: { fontSize: 15, color: colors.text },
  logSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  logKcal: { fontSize: 14, fontWeight: '600', color: colors.text },
});