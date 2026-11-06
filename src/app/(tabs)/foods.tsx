import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { searchFoods } from '../../core';
import { listFoods, recentFoods } from '../../db/repo';
import type { Food } from '../../db/schema';
import { SecondaryButton } from '../../ui/form';
import { colors } from '../../ui/theme';

export default function LogPicker() {
  const router = useRouter();
  const [all, setAll] = useState<Food[]>([]);
  const [recents, setRecents] = useState<Food[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([listFoods(), recentFoods(8)]).then(([a, r]) => {
        if (active) {
          setAll(a);
          setRecents(r);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const results = useMemo(() => searchFoods(all, query), [all, query]);
  const pick = (id: number) =>
    router.push({ pathname: '/log/entry', params: { foodId: String(id) } });

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={s.page}
      data={results}
      keyExtractor={(f) => String(f.id)}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={s.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={s.back}>‹ Back</Text>
          </Pressable>
          <Text style={s.title}>Log food</Text>
          <SecondaryButton
            title="Quick add calories"
            onPress={() => router.push({ pathname: '/log/entry', params: { quick: '1' } })}
          />
          <TextInput
            style={s.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search, for example eba or apple"
            placeholderTextColor="#999999"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query === '' && recents.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={s.label}>Recent</Text>
              <View style={s.chips}>
                {recents.map((f) => (
                  <Pressable key={f.id} style={s.chip} onPress={() => pick(f.id)}>
                    <Text style={s.chipText}>{f.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <Text style={s.label}>
            {query === '' ? 'All foods' : `${results.length} found`}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={s.row} onPress={() => pick(item.id)}>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.serving}>{item.servingLabel}</Text>
          </View>
          <Text style={s.kcal}>{item.kcal} kcal</Text>
        </Pressable>
      )}
      ListEmptyComponent={
        <View style={{ gap: 12, paddingVertical: 16 }}>
          <Text style={s.empty}>No match in your library.</Text>
          <SecondaryButton
            title="Add it as a new food"
            onPress={() =>
              router.push({ pathname: '/library/edit', params: { name: query.trim() } })
            }
          />
        </View>
      }
    />
  );
}

const s = StyleSheet.create({
  page: { padding: 24, paddingTop: 64, paddingBottom: 48 },
  header: { gap: 12, marginBottom: 8 },
  back: { fontSize: 16, color: colors.primary },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipText: { fontSize: 14, color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: { fontSize: 16, color: colors.text },
  serving: { fontSize: 12, color: colors.muted, marginTop: 2 },
  kcal: { fontSize: 15, fontWeight: '600', color: colors.text },
  empty: { fontSize: 14, color: colors.muted },
});