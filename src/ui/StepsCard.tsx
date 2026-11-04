import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { stepProgress } from '../core';
import { SecondaryButton } from './form';
import { colors } from './theme';

const n = (x: number) => x.toLocaleString('en-US');

export function StepsCard(props: {
  done: number;
  target: number;
  watch: number | null;
  phone: number | null;
}) {
  const router = useRouter();
  const p = stepProgress(props.done, props.target);
  const nothingYet = props.watch === null && props.phone === null;

  return (
    <View style={s.card}>
      <Text style={s.label}>Steps today</Text>
      <Text style={s.value}>
        {n(props.done)} / {n(props.target)}
      </Text>
      <View style={s.track}>
        <View style={[s.fill, { width: `${Math.round(p.fraction * 100)}%` }]} />
      </View>
      <Text style={s.note}>
        {nothingYet
          ? "Enter your watch's step count to see your progress."
          : p.reached
            ? 'Target reached. Nice work.'
            : `${n(p.remaining)} steps to go.`}
      </Text>
      <Text style={s.note}>
        Watch {props.watch !== null ? n(props.watch) : '–'} · Phone{' '}
        {props.phone !== null ? n(props.phone) : 'not tracked yet'}
      </Text>
      <View style={{ marginTop: 8 }}>
        <SecondaryButton title="Update steps" onPress={() => router.push('/steps')} />
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
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: { height: 10, borderRadius: 5, backgroundColor: colors.primary },
  note: { fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 4 },
});