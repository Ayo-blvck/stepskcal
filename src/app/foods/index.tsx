import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { searchFoods } from '../../core';
import { listFoods } from '../../db/repo';
import type { Food } from '../../db/schema';
import { PrimaryButton } from '../../ui/form';
import { colors } from '../../ui/theme';

export default function FoodLibrary() {
  const router = useRouter();
  const [all, setAll] = useState<Food[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listFoods().then((rows) => {
        if (active) setAll(rows);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const results = useMemo(() => searchFoods(all, query), [all, query]);

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
          <Text style={s.title}>Food library</Text>
          <Text style={s.note}>
            Calories are rough estimates for typical portions. Tap any food to correct it to match
            what you actually eat.
          </Text>
          <TextInput
            style={s.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search, for example egusi or dodo"
            placeholderTextColor="#999999"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Text style={s.count}>
            {results.length} {results.length === 1 ? 'food' : 'foods'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={s.row}
          onPress={() => router.push({ pathname: '/foods/edit', params: { id: String(item.id) } })}
        >
          <View style={{ flex: 1 }}>
            <Text style={s.name}>
              {item.name}
              {item.isCustom ? '  · custom' : ''}
            </Text>
            <Text style={s.serving}>{item.servingLabel}</Text>
          </View>
          <Text style={s.kcal}>{item.kcal} kcal</Text>
        </Pressable>
      )}
      ListEmptyComponent={
        <Text style={s.empty}>No match. You can add it as your own food below.</Text>
      }
      ListFooterComponent={
        <View style={s.footer}>
          <PrimaryButton
            title="Add a food"
            onPress={() => router.push({ pathname: '/foods/edit', params: { name: query.trim() } })}
          />
        </View>
      }
    />
  );
}

const s = StyleSheet.create({
  page: { padding: 24, paddingTop: 64, paddingBottom: 48 },
  header: { gap: 10, marginBottom: 8 },
  back: { fontSize: 16, color: colors.primary },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  note: { fontSize: 13, color: colors.muted, lineHeight: 19 },
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
  count: { fontSize: 12, color: colors.muted },
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
  empty: { fontSize: 14, color: colors.muted, paddingVertical: 24 },
  footer: { marginTop: 24 },
});