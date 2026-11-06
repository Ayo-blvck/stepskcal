import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { describeLastBackup, profileRows } from '../core';
import { getKv, getProfile, latestWeight } from '../db/repo';
import type { Profile } from '../db/schema';
import { formatShort } from '../lib/dates';
import { Segmented } from '../ui/form';
import { AppText, Button, Card, ListRow, ScreenHeader } from '../ui/kit';
import { useTheme, useThemePreference, type ThemePreference } from '../ui/ThemeProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { preference, setPreference } = useThemePreference();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [lastBackup, setLastBackup] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getProfile(), latestWeight(), getKv('lastBackupAt')]).then(([p, w, k]) => {
        if (!active) return;
        setProfile(p);
        setWeightKg(w?.weightKg ?? null);
        setLastBackup(k ? Number(k) : null);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const rows = profile ? profileRows(profile, weightKg, new Date(), (k) => formatShort(k, true)) : [];
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
        gap: 14,
      }}
    >
      <ScreenHeader title="Profile & data" onBack={() => router.back()} />

      <Card>
        <AppText variant="h2">Your plan</AppText>
        {rows.map((r, i) => (
          <ListRow key={r.label} title={r.label} right={r.value} last={i === rows.length - 1} />
        ))}
        <View style={{ marginTop: 8 }}>
          <Button title="Edit profile" variant="secondary" onPress={() => router.push('/onboarding')} />
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <AppText variant="h2">Appearance</AppText>
        <Segmented<ThemePreference>
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          value={preference}
          onChange={setPreference}
        />
        <AppText variant="small" tone="muted">
          System follows your phone's light or dark setting.
        </AppText>
      </Card>

      <Card style={{ gap: 12 }}>
        <AppText variant="h2">Your data</AppText>
        <AppText variant="small" tone="muted">
          Everything lives only on this phone. A backup file lets you restore it after a reset or on a new
          phone.
        </AppText>
        <AppText variant="small">{describeLastBackup(lastBackup, Date.now())}</AppText>
        <Button title="Backup and restore" variant="secondary" onPress={() => router.push('/backup')} />
      </Card>

      <Card style={{ gap: 4 }}>
        <AppText variant="h2">About</AppText>
        <AppText variant="small" tone="muted">
          StepsKcal {version} · Eat smart. Walk it off.
        </AppText>
        <AppText variant="small" tone="muted">
          Developed by Ayoblvck
        </AppText>
        <AppText variant="caption" tone="muted" style={{ marginTop: 6 }}>
          Calorie and step figures are estimates to guide your habits, not medical advice.
        </AppText>
      </Card>
    </ScrollView>
  );
}