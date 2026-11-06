import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MAX_BACKUP_BYTES,
  backupFileName,
  backupSummary,
  describeLastBackup,
  parseBackup,
  type BackupFile,
} from '../core';
import { exportAll, getKv, importAll, setKv } from '../db/repo';
import { AppText, Button, Card, ScreenHeader } from '../ui/kit';
import { useTheme } from '../ui/ThemeProvider';

type Message = { kind: 'ok' | 'error'; text: string } | null;

export default function BackupScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [lastAt, setLastAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useFocusEffect(
    useCallback(() => {
      getKv('lastBackupAt').then((v) => setLastAt(v ? Number(v) : null));
    }, []),
  );

  async function onBackup() {
    setBusy(true);
    setMessage(null);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        setMessage({ kind: 'error', text: 'Sharing is not available on this device.' });
        return;
      }
      const backup = await exportAll();
      const file = new File(Paths.cache, backupFileName(new Date()));
      file.create();
      await file.write(JSON.stringify(backup, null, 1));
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Save your backup somewhere safe',
        UTI: 'public.json',
      });
      const now = Date.now();
      await setKv('lastBackupAt', String(now));
      setLastAt(now);
      setMessage({
        kind: 'ok',
        text: 'Backup file created. Check that it actually reached Google Drive, your email or your Files app. A copy that only exists on this phone will not survive losing it.',
      });
    } catch (e) {
      setMessage({ kind: 'error', text: `Backup failed: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  }

  async function doImport(b: BackupFile) {
    setBusy(true);
    try {
      await importAll(b);
      Alert.alert('Restored', 'Your data has been restored from the backup.', [
        { text: 'OK', onPress: () => router.dismissTo('/') },
      ]);
    } catch (e) {
      setMessage({
        kind: 'error',
        text: `Restore failed and nothing was changed: ${e instanceof Error ? e.message : String(e)}`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function onRestore() {
    setMessage(null);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled) return;

      const file = new File(res.assets[0].uri);
      if ((file.size ?? 0) > MAX_BACKUP_BYTES) {
        setMessage({ kind: 'error', text: 'That file is too large to be a backup from this app.' });
        return;
      }
      const parsed = parseBackup(await file.text());
      if (!parsed.ok) {
        setMessage({ kind: 'error', text: parsed.error });
        return;
      }

      Alert.alert(
        'Replace everything with this backup?',
        `${backupSummary(parsed.backup)}\n\nThis replaces ALL data currently in the app. If you are not sure, create a backup of your current data first.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', style: 'destructive', onPress: () => doImport(parsed.backup) },
        ],
      );
    } catch (e) {
      setMessage({
        kind: 'error',
        text: `Could not read that file: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

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
      <ScreenHeader title="Backup and restore" onBack={() => router.back()} />

      <Card style={{ gap: 12 }}>
        <AppText variant="h2">Back up</AppText>
        <AppText variant="small" tone="muted">
          Your data lives only on this phone. A reset, an uninstall or a lost phone would erase it. Create
          a backup file and save it somewhere outside the phone, such as Google Drive or an email to
          yourself.
        </AppText>
        <AppText variant="small">{describeLastBackup(lastAt, Date.now())}</AppText>
        <Button title="Create backup file" onPress={onBackup} disabled={busy} />
      </Card>

      <Card style={{ gap: 12 }}>
        <AppText variant="h2">Restore</AppText>
        <AppText variant="small" tone="muted">
          Pick a backup file to rebuild your data on this phone. It replaces everything currently in the
          app, and you will see what is in the file before anything changes.
        </AppText>
        <Button title="Restore from a file" variant="secondary" onPress={onRestore} disabled={busy} />
      </Card>

      {message ? (
        <AppText variant="small" tone={message.kind === 'ok' ? 'accent' : 'danger'}>
          {message.text}
        </AppText>
      ) : null}
    </ScrollView>
  );
}