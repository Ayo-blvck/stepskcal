import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { categoriesPresent, filterByCategory, searchFoods } from '../../core';
import { addFoodLog, deleteFoodLog, listFoods, recentFoods } from '../../db/repo';
import type { Food } from '../../db/schema';
import { dateKey } from '../../lib/dates';
import { AppText, Button, Card, Chip, Snackbar } from '../../ui/kit';
import { useTheme } from '../../ui/ThemeProvider';
import { font, radius, type Palette } from '../../ui/tokens';

function rowFrame(t: Palette, first: boolean, last: boolean): ViewStyle {
  return {
    backgroundColor: t.card,
    borderColor: t.border,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: first ? 1 : 0,
    borderBottomWidth: last ? 1 : StyleSheet.hairlineWidth,
    borderTopLeftRadius: first ? radius.card : 0,
    borderTopRightRadius: first ? radius.card : 0,
    borderBottomLeftRadius: last ? radius.card : 0,
    borderBottomRightRadius: last ? radius.card : 0,
  };
}

export default function Foods() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [all, setAll] = useState<Food[]>([]);
  const [recents, setRecents] = useState<Food[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<{ logId: number; message: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const [a, r] = await Promise.all([listFoods(), recentFoods(8)]);
    setAll(a);
    setRecents(r);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => setToast(null);
    }, [load]),
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const categories = useMemo(() => categoriesPresent(all), [all]);
  const filtered = useMemo(
    () => searchFoods(filterByCategory(all, category), query),
    [all, category, query],
  );
  const open = (id: number) => router.push({ pathname: '/log/entry', params: { foodId: String(id) } });

  async function quickAdd(f: Food) {
    const logId = await addFoodLog({
      date: dateKey(),
      name: f.name,
      kcal: f.kcal,
      quantity: 1,
      servingLabel: f.servingLabel,
      foodId: f.id,
    });
    if (timer.current) clearTimeout(timer.current);
    setToast({ logId, message: `Added ${f.name} · ${f.kcal} kcal` });
    timer.current = setTimeout(() => setToast(null), 4500);
    recentFoods(8).then(setRecents);
  }

  async function undo() {
    if (!toast) return;
    const id = toast.logId;
    setToast(null);
    await deleteFoodLog(id);
    recentFoods(8).then(setRecents);
  }

  const browsing = query === '' && category === null;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={filtered}
        keyExtractor={(f) => String(f.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 96 }}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 16 }}>
            <AppText variant="title">Log food</AppText>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search, for example eba or apple"
              placeholderTextColor={t.muted}
              autoCorrect={false}
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: radius.field,
                backgroundColor: t.card,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontFamily: font.medium,
                fontSize: 16,
                color: t.text,
              }}
            />

            <Button
              title="Quick add calories"
              variant="dashed"
              onPress={() => router.push({ pathname: '/log/entry', params: { quick: '1' } })}
            />

            {browsing && recents.length > 0 ? (
              <View style={{ gap: 8 }}>
                <AppText variant="label" tone="muted">
                  Recent
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {recents.map((f) => (
                    <Chip key={f.id} label={f.name} onPress={() => open(f.id)} />
                  ))}
                </View>
              </View>
            ) : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -24 }}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
              {categories.map((c) => (
                <Chip
                  key={c.key}
                  label={c.label}
                  selected={category === c.key}
                  onPress={() => setCategory(category === c.key ? null : c.key)}
                />
              ))}
            </ScrollView>

            {!browsing ? (
              <AppText variant="caption" tone="muted">
                {filtered.length} {filtered.length === 1 ? 'food' : 'foods'}
              </AppText>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => open(item.id)}
            style={[
              rowFrame(t, index === 0, index === filtered.length - 1),
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                paddingLeft: 16,
                paddingRight: 12,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{item.name}</AppText>
              <AppText variant="caption" tone="muted">
                {item.servingLabel}
              </AppText>
            </View>
            <AppText variant="bodyStrong">{item.kcal}</AppText>
            <Pressable
              onPress={() => quickAdd(item)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Add one serving of ${item.name}`}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: radius.icon,
                backgroundColor: t.tint,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Plus size={22} color={t.accent} strokeWidth={2.4} />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <Card style={{ gap: 12 }}>
            <AppText tone="muted">
              {query ? `No match for “${query}”.` : 'No foods in this category yet.'}
            </AppText>
            <Button
              title={query ? 'Add it as a new food' : 'Add a food'}
              variant="dashed"
              onPress={() =>
                router.push({ pathname: '/food-edit', params: { name: query.trim() } })
              }
            />
          </Card>
        }
        ListFooterComponent={
          filtered.length > 0 ? (
            <View style={{ marginTop: 16 }}>
              <Button
                title="Can't find it? Add a food"
                variant="secondary"
                onPress={() => router.push('/food-edit')}
              />
            </View>
          ) : undefined
        }
      />

      {toast ? <Snackbar message={toast.message} actionLabel="Undo" onAction={undo} /> : null}
    </View>
  );
}