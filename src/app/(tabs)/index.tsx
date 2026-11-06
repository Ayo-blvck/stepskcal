import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { Moon, Smartphone, Sun } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  buildTodayView,
  formatQuantity,
  goalCardView,
  weightStats,
  type WeightEntry,
} from '../../core';
import {
  getDayPlan,
  getProfile,
  listActivities,
  listFoodLogs,
  listWeights,
  type DayPlanView,
} from '../../db/repo';
import type { Activity, FoodLog, Profile } from '../../db/schema';
import { dateKey, formatDayHeading } from '../../lib/dates';
import { refreshReminders } from '../../lib/notifications';
import { ActivityCard } from '../../ui/ActivityCard';
import { BackupNudge } from '../../ui/BackupNudge';
import {
  AppText,
  Button,
  Card,
  HeroCard,
  IconButton,
  ListRow,
  ProgressBar,
  RingStat,
} from '../../ui/kit';
import { useTheme, useThemePreference, type ThemePreference } from '../../ui/ThemeProvider';

type State =
  | { status: 'loading' }
  | { status: 'none' }
  | {
      status: 'ready';
      today: string;
      plan: DayPlanView;
      profile: Profile;
      logs: FoodLog[];
      activities: Activity[];
      weights: WeightEntry[];
    };

const NEXT_THEME: Record<ThemePreference, ThemePreference> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

export default function Today() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { preference, setPreference } = useThemePreference();
  const [state, setState] = useState<State>({ status: 'loading' });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const today = dateKey();
        const [profile, plan, logs, activities, weights] = await Promise.all([
          getProfile(),
          getDayPlan(today),
          listFoodLogs(today),
          listActivities(today),
          listWeights(),
        ]);
        if (!active) return;
        setState(
          profile && plan && weights.length > 0
            ? {
                status: 'ready',
                today,
                plan,
                profile,
                logs,
                activities,
                weights: weights.map((w) => ({ date: w.date, kg: w.weightKg })),
              }
            : { status: 'none' },
        );
        refreshReminders();
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  if (state.status === 'loading') return <View style={{ flex: 1, backgroundColor: t.bg }} />;
  if (state.status === 'none') return <Redirect href="/onboarding" />;

  const { today, plan, profile, logs, activities, weights } = state;
  const eaten = logs.reduce((sum, l) => sum + l.kcal, 0);

  const view = buildTodayView({
    stepsDone: plan.stepsDone,
    stepTarget: plan.stepTarget,
    stepFloor: profile.stepFloor,
    stepCap: profile.stepCap,
    hasSteps: plan.watchSteps !== null || plan.phoneSteps !== null,
    eatenKcal: eaten,
    budgetKcal: plan.budgetKcal,
    activityCreditKcal: plan.activityCreditKcal,
    overageKcal: plan.overageKcal,
    uncoveredKcal: plan.uncoveredKcal,
  });

  const stats = weightStats(weights, {
    goalKg: profile.goalWeightKg,
    targetDate: profile.targetDate,
    today,
  });
  const goal = stats
    ? goalCardView({
        startKg: stats.startKg,
        currentKg: stats.currentKg,
        goalKg: profile.goalWeightKg,
        targetDate: profile.targetDate,
        today,
        vsPlanKg: stats.vsPlanKg,
        mode: profile.mode,
      })
    : null;

  const ringSize = Math.max(100, Math.min(144, Math.floor((width - 88 - 16) / 2)));
  const ThemeIcon = preference === 'dark' ? Moon : preference === 'system' ? Smartphone : Sun;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: insets.top + 16,
        paddingBottom: 32,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <AppText variant="small" tone="muted">
            {formatDayHeading(today)}
          </AppText>
          <AppText variant="title">Today</AppText>
        </View>
        <IconButton
          icon={ThemeIcon}
          label={`Theme: ${preference}. Tap to change`}
          onPress={() => setPreference(NEXT_THEME[preference])}
        />
      </View>

      <BackupNudge profileCreatedAt={profile.createdAt} />

      <HeroCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <RingStat
            size={ringSize}
            value={view.steps.value}
            label={view.steps.label}
            sub={view.steps.sub}
            progress={view.steps.progress}
            color={t.lime}
          />
          <RingStat
            size={ringSize}
            value={view.kcal.value}
            label={view.kcal.label}
            sub={view.kcal.sub}
            progress={view.kcal.progress}
            color={t.amber}
          />
        </View>
        <View style={{ backgroundColor: t.heroPanel, borderRadius: 16, padding: 14, marginTop: 16 }}>
          <AppText tone="onHero">{view.note}</AppText>
        </View>
      </HeroCard>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          title="Update steps"
          variant="secondary"
          pill
          onPress={() => router.push('/steps')}
          style={{ flex: 1 }}
        />
        <Button
          title="Log activity"
          variant="secondary"
          pill
          onPress={() => router.push('/activity')}
          style={{ flex: 1 }}
        />
      </View>

      {goal ? (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <AppText variant="h2">{goal.title}</AppText>
            {goal.right ? (
              <AppText variant="small" tone="muted">
                {goal.right}
              </AppText>
            ) : null}
          </View>
          <View style={{ marginVertical: 12 }}>
            <ProgressBar value={goal.progress} />
          </View>
          <AppText variant="small" tone="muted">
            {goal.detail}
          </AppText>
        </Card>
      ) : null}

      <Card>
        <AppText variant="h2">Eaten today</AppText>
        {logs.length === 0 ? (
          <View style={{ gap: 12, marginTop: 8 }}>
            <AppText tone="muted">Nothing logged yet.</AppText>
            <Button title="Log your first meal" variant="dashed" onPress={() => router.push('/foods')} />
          </View>
        ) : (
          logs.map((l, i) => (
            <ListRow
              key={l.id}
              title={l.name}
              subtitle={
                l.servingLabel && l.quantity !== 1
                  ? `${formatQuantity(l.quantity)} × ${l.servingLabel}`
                  : undefined
              }
              right={`${l.kcal.toLocaleString('en-US')} kcal`}
              last={i === logs.length - 1}
              onPress={() =>
                router.push({ pathname: '/log/entry', params: { logId: String(l.id) } })
              }
            />
          ))
        )}
      </Card>

      <ActivityCard items={activities} creditKcal={plan.activityCreditKcal} />

      {/* Temporary: these move into Foods (R4) and Profile & data (R8). */}
      <AppText variant="caption" tone="muted" style={{ marginTop: 8 }}>
        More
      </AppText>
      <Button title="Edit profile" variant="secondary" onPress={() => router.push('/onboarding')} />
      <Button title="Backup and restore" variant="secondary" onPress={() => router.push('/backup')} />
      <Button title="R1 check" variant="secondary" onPress={() => router.push('/dev-r1')} />
    </ScrollView>
  );
}