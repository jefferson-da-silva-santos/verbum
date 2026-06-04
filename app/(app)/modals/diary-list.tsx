/**
 * FIX 7 — app/(app)/modals/diary-list.tsx
 *
 * CAUSA: O UUID das entradas pode colidir quando há paginação (items
 * sendo adicionados múltiplas vezes). Também, o offset não era resetado
 * corretamente no reload.
 * CORREÇÃO:
 *   - keyExtractor usa `${item.id}-${index}` para garantir unicidade
 *   - Deduplicação por ID antes de setar estado
 *   - offset gerenciado via ref para evitar stale closure
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme }       from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { diaryRepo }      from '../../../src/database/repositories';
import type { DiaryEntry } from '../../../src/database/types';
import { relativeDate, formatLongDate } from '../../../src/utils/dateUtils';
import { DIARY_MOOD_LABELS } from '../../../src/utils/formatters';

const LIMIT = 20;

export default function DiaryListModal() {
  const { tokens }  = useTheme();
  const { user }    = useAuthContext();
  const insets      = useSafeAreaInsets();

  const [entries,   setEntries]   = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore,   setHasMore]   = useState(true);

  // FIX: offset via ref evita stale closure no useCallback
  const offsetRef = useRef(0);

  const load = useCallback(async (reset = false) => {
    if (!user) return;

    if (reset) offsetRef.current = 0;
    const off = offsetRef.current;

    setIsLoading(true);
    try {
      const items = await diaryRepo.findAll(user.id, { limit: LIMIT, offset: off });

      setEntries(prev => {
        const merged = reset ? items : [...prev, ...items];
        // FIX: deduplicar por ID para evitar chaves duplicadas
        const seen = new Set<string>();
        return merged.filter(e => {
          if (seen.has(e.id)) return false;
          seen.add(e.id);
          return true;
        });
      });

      offsetRef.current = off + items.length;
      setHasMore(items.length === LIMIT);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(true); }, [load]);

  const loadMore = () => { if (hasMore && !isLoading) load(false); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        paddingTop: insets.top + 8,
        borderBottomWidth: 1, borderBottomColor: tokens.borderLight,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <Text style={{
          flex: 1, textAlign: 'center', fontSize: 16,
          fontWeight: '700', color: tokens.textPrimary,
        }}>
          Diário Espiritual
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/modals/diary-editor')}
        >
          <MaterialCommunityIcons name="plus" size={24} color={tokens.actionPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        // FIX: chave composta para garantir unicidade mesmo com paginação
        keyExtractor={(item, index) => `${item.id ?? 'entry'}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        renderItem={({ item: entry }) => {
          const mood = entry.mood ? DIARY_MOOD_LABELS[entry.mood] : null;
          return (
            <TouchableOpacity
              onPress={() =>
                router.push(`/(app)/modals/diary-editor?entryId=${entry.id}`)
              }
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: tokens.borderLight,
                gap: 6,
              }}
            >
              <View style={{
                flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: tokens.actionPrimary }}>
                  {formatLongDate(entry.entryDate)}
                </Text>
                {mood && (
                  <Text style={{ fontSize: 12, color: tokens.textTertiary }}>{mood}</Text>
                )}
              </View>

              {entry.title && (
                <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.textPrimary }}>
                  {entry.title}
                </Text>
              )}

              <Text
                numberOfLines={2}
                style={{ fontSize: 14, color: tokens.textSecondary, lineHeight: 22 }}
              >
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
              <MaterialCommunityIcons
                name="book-open-variant"
                size={52}
                color={tokens.iconMuted}
              />
              <Text style={{
                fontSize: 16, fontWeight: '600', color: tokens.textPrimary,
                textAlign: 'center',
              }}>
                Seu diário está vazio
              </Text>
              <Text style={{
                fontSize: 14, color: tokens.textSecondary,
                textAlign: 'center', lineHeight: 22,
              }}>
                Registre orações, reflexões e testemunhos aqui.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(app)/modals/diary-editor')}
                style={{
                  backgroundColor: tokens.actionPrimary,
                  borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24,
                }}
              >
                <Text style={{
                  fontSize: 15, fontWeight: '700', color: tokens.actionPrimaryText,
                }}>
                  Nova Entrada
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}