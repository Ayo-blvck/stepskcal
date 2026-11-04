import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { backupNudge } from '../core';
import { getKv } from '../db/repo';
import { SecondaryButton } from './form';
import { colors } from './theme';

export function BackupNudge(props: { profileCreatedAt: number }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getKv('lastBackupAt').then((v) => {
        if (active) setMsg(backupNudge(v ? Number(v) : null, props.profileCreatedAt, Date.now()));
      });
      return () => {
        active = false;
      };
    }, [props.profileCreatedAt]),
  );

  if (!msg) return null;
  return (
    <View style={s.card}>
      <Text style={s.text}>{msg}</Text>
      <SecondaryButton title="Back up now" onPress={() => router.push('/backup')} />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFF7E6',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F0D9A8',
  },
  text: { fontSize: 14, color: colors.text, lineHeight: 20 },
});