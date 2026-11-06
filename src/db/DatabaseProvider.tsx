import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import migrations from '../../drizzle/migrations';
import { LoadingScreen } from '../ui/LoadingScreen';
import { db } from './client';
import { seedFoods } from './repo';

const MIN_SPLASH_MS = 700;

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!success) return;
    seedFoods()
      .then(() => setSeeded(true))
      .catch((e) => setSeedError(e instanceof Error ? e.message : String(e)));
  }, [success]);

  const problem = error?.message ?? seedError;
  if (problem) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F6F5F0' }}>
        <Text>Database error: {problem}</Text>
      </View>
    );
  }
  if (!success || !seeded || !minElapsed) return <LoadingScreen />;
  return <>{children}</>;
}