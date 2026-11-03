import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import migrations from '../../drizzle/migrations';
import { db } from './client';
import { seedFoods } from './repo';

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    seedFoods()
      .then(() => setSeeded(true))
      .catch((e) => setSeedError(e instanceof Error ? e.message : String(e)));
  }, [success]);

  const problem = error?.message ?? seedError;
  if (problem) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text>Database error: {problem}</Text>
      </View>
    );
  }
  if (!success || !seeded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Preparing database…</Text>
      </View>
    );
  }
  return <>{children}</>;
}