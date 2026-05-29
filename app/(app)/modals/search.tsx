/**
 * VERBUM — app/(app)/modals/search.tsx
 */

import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { CacheManager } from '../../../src/api/cacheManager';
import type { SearchResultItem } from '../../../src/api/cacheManager';
import { DEFAULT_BIBLE_VERSION } from '../../../src/constants/bible';

export default function SearchModal() {
  const { tokens } = useTheme();
  const { user } = useAuthContext();
  const version = user?.preferredVersion ?? DEFAULT_BIBLE_VERSION;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setTotal(0); return; }
    setLoading(true);
    try {
      const r = await CacheManager.search(q, version);
      setResults(r.items);
      setTotal(r.totalCount);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [version]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.bgCard, borderRadius: 12, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: tokens.borderLight, gap: 8 }}>
          <MaterialCommunityIcons name="magnify" size={18} color={tokens.iconMuted} />
          <TextInput
            placeholder="Buscar palavra, tema, versículo..."
            placeholderTextColor={tokens.textDisabled}
            value={query}
            onChangeText={q => { setQuery(q); if (q.length > 2) search(q); }}
            style={{ flex: 1, fontSize: 15, color: tokens.textPrimary }}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => search(query)}
          />
          {loading && <ActivityIndicator size="small" color={tokens.actionPrimary} />}
        </View>
      </View>

      {total > 0 && (
        <Text style={{ fontSize: 12, color: tokens.textTertiary, paddingHorizontal: 20, marginBottom: 8 }}>
          {total} resultado{total !== 1 ? 's' : ''}
        </Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/modals/chapter-reader?bookSlug=${item.bookAbbrev.toLowerCase()}&chapter=${item.chapterNumber}`)}
            style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, gap: 4 }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: tokens.actionPrimary, letterSpacing: 0.4 }}>{item.reference}</Text>
            <Text style={{ fontSize: 14, color: tokens.textPrimary, lineHeight: 22, fontFamily: 'serif' }}>{item.text}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.length > 2 && !loading ? (
            <View style={{ padding: 40, alignItems: 'center', gap: 12 }}>
              <MaterialCommunityIcons name="book-search-outline" size={48} color={tokens.iconMuted} />
              <Text style={{ fontSize: 15, color: tokens.textTertiary, textAlign: 'center' }}>Nenhum resultado para "{query}"</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}