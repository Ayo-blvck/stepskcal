import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  MAX_BACKUP_BYTES,
  backupFileName,
  backupSummary,
  parseBackup,
  type BackupFile,
} from '../core';
import { exportAll, getKv, importAll, setKv } from '../db/repo';
import { PrimaryButton, SecondaryButton } from '../ui/form';
import { colors } from '../ui/theme';

type Message = { kind: 'ok' | 'error'; text: string } | null;

function describeLast(ms: number | null): string {
  if (ms === null) return 'No backup file has been created yet.';
  const when = new Date(ms).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const days = Math.floor((Date.now() - ms) / 86400000);
  return `Last backup file created: ${when} (${days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} ago`}).`;
}

export default function BackupScreen() {
  const router = useRouter();
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
      setMessage({ kind: 'error', text: `Could not read that file: ${e instanceof Error ? e.message : String(e)}` });
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={s.page}>
      <Pressable onPress={() => router.back()}>
        <Text style={s.back}>‹ Back</Text>
      </Pressable>
      <Text style={s.title}>Backup and restore</Text>

      <View style={s.card}>
        <Text style={s.section}>Back up</Text>
        <Text style={s.note}>
          Your data lives only on this phone. A reset, an uninstall or a lost phone would erase it.
          Create a backup file and save it somewhere outside the phone, such as Google Drive or an
          email to yourself.
        </Text>
        <Text style={s.note}>{describeLast(lastAt)}</Text>
        <PrimaryButton title="Create backup file" onPress={onBackup} disabled={busy} />
      </View>

      <View style={s.card}>
        <Text style={s.section}>Restore</Text>
        <Text style={s.note}>
          Pick a backup file to rebuild your data on this phone. It replaces everything currently in
          the app, and you will see what is in the file before anything changes.
        </Text>
        <SecondaryButton title="Restore from a file" onPress={onRestore} />
      </View>

      {message ? (
        <Text style={[s.message, message.kind === 'error' ? s.error : s.ok]}>{message.text}</Text>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 24, paddingTop: 64, paddingBottom: 48, gap: 14 },
  back: { fontSize: 16, color: colors.primary },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: { fontSize: 17, fontWeight: '700', color: colors.text },
  note: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  message: { fontSize: 14, lineHeight: 20 },
  ok: { color: colors.primary },
  error: { color: colors.danger },
});