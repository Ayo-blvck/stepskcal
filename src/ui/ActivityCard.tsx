import { useRouter } from 'expo-router';
import { View } from 'react-native';
import type { Activity } from '../db/schema';
import { AppText, Card, ListRow } from './kit';

export function ActivityCard(props: { items: Activity[]; creditKcal: number }) {
  const router = useRouter();
  if (props.items.length === 0) return null;

  const total = props.items.reduce((sum, a) => sum + a.kcal, 0);
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <AppText variant="h2">Activity today</AppText>
        <AppText variant="small" tone="muted">
          {total.toLocaleString('en-US')} kcal
        </AppText>
      </View>
      {props.items.map((a, i) => (
        <ListRow
          key={a.id}
          title={a.name}
          subtitle={a.durationMin ? `${a.durationMin} min` : undefined}
          right={`${a.kcal} kcal`}
          last={i === props.items.length - 1}
          onPress={() => router.push({ pathname: '/activity', params: { id: String(a.id) } })}
        />
      ))}
      <AppText variant="small" tone="muted" style={{ marginTop: 4 }}>
        {props.creditKcal > 0
          ? `+${props.creditKcal.toLocaleString('en-US')} kcal added to your food budget, half of what the session burns beyond your steps.`
          : 'Your steps already cover most of this, so it adds no extra budget.'}
      </AppText>
    </Card>
  );
}