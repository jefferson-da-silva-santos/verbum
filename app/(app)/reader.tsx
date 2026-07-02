/**
 * VERBUM — app/(app)/reader.tsx  [POLISH]
 * Remove paddingTop: 60 → paddingTop: 12
 */

import { useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme }   from '../../src/context/ThemeContext';
import { BIBLE_BOOKS, BOOKS_BY_CATEGORY, CATEGORY_LABELS } from '../../src/constants/bible';
import type { BibleBook, BookCategory } from '../../src/constants/bible';

const CATEGORIES: BookCategory[] = [
  'pentateuch','historical_ot','poetic','major_prophets','minor_prophets',
  'gospels','historical_nt','pauline','general_epistles','prophetic_nt',
];

export default function ReaderScreen() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? BIBLE_BOOKS.filter(b =>
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.abbr.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  const sections = filtered
    ? [{ title: 'Resultados', data: filtered }]
    : CATEGORIES
        .filter(cat => BOOKS_BY_CATEGORY[cat].length > 0)
        .map(cat => ({ title: CATEGORY_LABELS[cat], data: BOOKS_BY_CATEGORY[cat] as BibleBook[] }));

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      {/* Título + busca */}
      <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary, marginBottom: 12 }}>
          Bíblia
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: tokens.bgCard, borderRadius: 12, paddingHorizontal: 14, height: 42, borderWidth: 1, borderColor: tokens.borderLight }}>
          <MaterialCommunityIcons name="magnify" size={18} color={tokens.iconMuted} />
          <TextInput
            placeholder="Buscar livro…"
            placeholderTextColor={tokens.textDisabled}
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, fontSize: 15, color: tokens.textPrimary }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={tokens.iconMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.slug}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        renderSectionHeader={({ section }) => (
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6, backgroundColor: tokens.bgPrimary }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item: book }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(app)/modals/book-chapters' as any, params: { bookSlug: book.slug } })}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: book.testament === 'OT' ? tokens.warningBg : tokens.infoBg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: book.testament === 'OT' ? tokens.warningText : tokens.infoText }}>
                {book.abbr}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: tokens.textPrimary }}>{book.name}</Text>
              <Text style={{ fontSize: 12, color: tokens.textTertiary }}>{book.chapters} capítulos</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={tokens.iconMuted} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}