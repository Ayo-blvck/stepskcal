import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { listActivities } from '../db/repo';
import type { Activity } from '../db/schema';
import { dateKey } from '../lib/dates';
import { SecondaryButton } from './form';
import { colors } from './theme';

export function ActivityCard(props: { creditKcal: number }) {
  const router = useRouter();
  const [items, setItems] = useState<Activity[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listActivities(dateKey()).then((rows) => {
        if (active) setItems(rows);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const total = items.reduce((sum, a) => sum + a.kcal, 0);

  return (
    <View style={s.card}>
      <Text style={s.label}>Activity today</Text>
      {items.length === 0 ? (
        <Text style={s.note}>
          Nothing logged. Log football or other sessions here. Walking is already counted in your steps.
        </Text>
      ) : (
        <>
          <Text style={s.value}>{total.toLocaleString('en-US')} kcal</Text>
          {items.map((a) => (
            <Pressable
              key={a.id}
              style={s.row}
              onPress={() => router.push({ pathname: '/activity', params: { id: String(a.id) } })}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{a.name}</Text>
                {a.durationMin ? <Text style={s.sub}>{a.durationMin} min</Text> : null}
              </View>
              <Text style={s.kcal}>{a.kcal} kcal</Text>
            </Pressable>
          ))}
        <Text style={s.note}>
            +{props.creditKcal.toLocaleString('en-US')} kcal added to your food budget. That is half
            of what the session burns beyond the steps your watch already counts.
          </Text>
        </>
      )}
      <View style={{ marginTop: 8 }}>
        <SecondaryButton title="Log activity" onPress={() => router.push('/activity')} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 13, color: colors.muted },
  value: { fontSize: 24, fontWeight: '700', color: colors.text },
  note: { fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  name: { fontSize: 15, color: colors.text },
  sub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  kcal: { fontSize: 14, fontWeight: '600', color: colors.text },
});