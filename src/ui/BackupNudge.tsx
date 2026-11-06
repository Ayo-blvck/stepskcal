import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { backupNudge } from '../core';
import { getKv } from '../db/repo';
import { AppText, Button } from './kit';
import { useTheme } from './ThemeProvider';
import { radius } from './tokens';

export function BackupNudge(props: { profileCreatedAt: number }) {
  const router = useRouter();
  const t = useTheme();
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
    <View
      style={{
        backgroundColor: t.warnBg,
        borderColor: t.warnBorder,
        borderWidth: 1,
        borderRadius: radius.card,
        padding: 16,
        gap: 12,
      }}
    >
      <AppText>{msg}</AppText>
      <Button
        title="Back up now"
        variant="secondary"
        size="sm"
        onPress={() => router.push('/backup')}
        style={{ alignSelf: 'flex-start' }}
      />
    </View>
  );
}