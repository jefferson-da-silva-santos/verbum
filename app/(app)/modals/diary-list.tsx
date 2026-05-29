/**
 * VERBUM — Modal: DiaryList
 * Lista de entradas do diário espiritual.
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { diaryRepo } from '../../../src/database/repositories';
import type { DiaryEntry } from '../../../src/database/types';
import { relativeDate, formatLongDate } from '../../../src/utils/dateUtils';
import { DIARY_MOOD_LABELS } from '../../../src/utils/formatters';

export default function DiaryListModal() {
  const { tokens } = useTheme();
  const { user } = useAuthContext();

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 20;

  const load = useCallback(async (reset = false) => {
    if (!user) return;
    const off = reset ? 0 : offset;
    setIsLoading(true);
    const items = await diaryRepo.findAll(user.id, { limit: LIMIT, offset: off });
    if (reset) {
      setEntries(items);
      setOffset(LIMIT);
    } else {
      setEntries(prev => [...prev, ...items]);
      setOffset(off + LIMIT);
    }
    setHasMore(items.length === LIMIT);
    setIsLoading(false);
  }, [user?.id, offset]);

  useEffect(() => { load(true); }, [user?.id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>
          Diário Espiritual
        </Text>
        <TouchableOpacity onPress={() => router.push('/(app)/modals/diary-editor')}>
          <MaterialCommunityIcons name="plus" size={24} color={tokens.actionPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        onEndReached={() => hasMore && load(false)}
        onEndReachedThreshold={0.2}
        renderItem={({ item: entry }) => {
          const mood = entry.mood ? DIARY_MOOD_LABELS[entry.mood] : null;
          return (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/modals/diary-editor?entryId=${entry.id}`)}
              style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, gap: 6 }}
            >
              {/* Data e humor */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: tokens.actionPrimary }}>
                  {formatLongDate(entry.entryDate)}
                </Text>
                {mood && <Text style={{ fontSize: 12, color: tokens.textTertiary }}>{mood}</Text>}
              </View>

              {/* Título */}
              {entry.title && (
                <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.textPrimary }}>
                  {entry.title}
                </Text>
              )}

              {/* Preview do conteúdo */}
              <Text numberOfLines={2} style={{ fontSize: 14, color: tokens.textSecondary, lineHeight: 22 }}>
                {entry.content}
              </Text>

              <Text style={{ fontSize: 11, color: tokens.textDisabled }}>
                {relativeDate(entry.createdAt)}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ padding: 48, alignItems: 'center', gap: 16 }}>
              <MaterialCommunityIcons name="book-heart-outline" size={52} color={tokens.iconMuted} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: tokens.textPrimary, textAlign: 'center' }}>
                Seu diário está vazio
              </Text>
              <Text style={{ fontSize: 14, color: tokens.textSecondary, textAlign: 'center', lineHeight: 22 }}>
                Registre orações, reflexões e testemunhos aqui.
              </Text>
              <TouchableOpacity onPress={() => router.push('/(app)/modals/diary-editor')} style={{ backgroundColor: tokens.actionPrimary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.actionPrimaryText }}>Nova Entrada</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}