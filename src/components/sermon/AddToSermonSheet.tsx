/**
 * VERBUM — src/components/sermon/AddToSermonSheet.tsx  [NOVO]
 *
 * Substitui a cadeia de Alert.alert() nativos usados antes para
 * "Adicionar ao sermão" — eram diálogos do sistema, sem nenhum
 * controle visual (fonte, cor, espaçamento do SO).
 *
 * Agora é um bottom sheet customizado, com:
 *   - Preview do versículo selecionado no topo
 *   - Lista dos sermões do usuário (com status colorido + contagem)
 *   - Estado "já adicionado" para sermões que já têm esse versículo
 *   - Atalho para criar um sermão novo direto da lista
 *   - Feedback de sucesso inline (sem Alert.alert de confirmação)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Modal, View, Text, TouchableOpacity, FlatList,
  ActivityIndicator, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { SermonRepository } from '../../database/repositories/SermonRepository';
import { SERMON_STATUS_COLORS, SERMON_STATUS_LABELS } from '../../database/types';
import type { Sermon } from '../../database/types';

export interface VerseToAdd {
  bookSlug:  string;
  bookName:  string;
  chapter:   number;
  verse:     number;
  verseText: string;
  reference: string;
}

type RowState = 'idle' | 'adding' | 'added' | 'already';

export function AddToSermonSheet({
  visible, verse, onClose,
}: {
  visible: boolean;
  verse:   VerseToAdd | null;
  onClose: () => void;
}) {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  const { user }   = useAuthContext();

  const [sermons,   setSermons]   = useState<Sermon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rowState,  setRowState]  = useState<Record<string, RowState>>({});
  const [alreadyIn, setAlreadyIn] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user || !verse) return;
    setIsLoading(true);
    try {
      const all = await SermonRepository.findAll(user.id);
      setSermons(all);
      const checks = await Promise.all(
        all.map(s => SermonRepository.isVerseInSermon(s.id, verse.bookSlug, verse.chapter, verse.verse)),
      );
      setAlreadyIn(new Set(all.filter((_, i) => checks[i]).map(s => s.id)));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, verse]);

  useEffect(() => {
    if (visible) { setRowState({}); load(); }
  }, [visible, load]);

  const handleAdd = async (sermon: Sermon) => {
    if (!verse) return;
    if (alreadyIn.has(sermon.id)) {
      setRowState(prev => ({ ...prev, [sermon.id]: 'already' }));
      setTimeout(() => onClose(), 700);
      return;
    }
    setRowState(prev => ({ ...prev, [sermon.id]: 'adding' }));
    try {
      await SermonRepository.addVerse({
        sermonId: sermon.id, bookSlug: verse.bookSlug, bookName: verse.bookName,
        chapter: verse.chapter, verse: verse.verse, verseText: verse.verseText,
      });
      setRowState(prev => ({ ...prev, [sermon.id]: 'added' }));
      setTimeout(() => onClose(), 800);
    } catch {
      setRowState(prev => ({ ...prev, [sermon.id]: 'idle' }));
    }
  };

  const handleCreateNew = async () => {
    if (!user || !verse) return;
    try {
      const sermon = await SermonRepository.create({
        userId: user.id,
        title: verse.reference,
        bookSlug: verse.bookSlug,
        chapterStart: verse.chapter, verseStart: verse.verse,
      });
      await SermonRepository.addVerse({
        sermonId: sermon.id, bookSlug: verse.bookSlug, bookName: verse.bookName,
        chapter: verse.chapter, verse: verse.verse, verseText: verse.verseText,
      });
      onClose();
      setTimeout(() => router.push(`/(app)/modals/sermon-editor?sermonId=${sermon.id}`), 300);
    } catch { /* silencioso */ }
  };

  if (!verse) return null;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <View style={{
        backgroundColor: tokens.bgModal, borderTopLeftRadius: 22, borderTopRightRadius: 22,
        paddingBottom: insets.bottom + 16, maxHeight: '80%',
      }}>
        <View style={{ width: 40, height: 4, backgroundColor: tokens.borderMedium, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 14 }} />

        {/* Título */}
        <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.textPrimary }}>Adicionar ao sermão</Text>
          <Text style={{ fontSize: 12, color: tokens.textTertiary, marginTop: 2 }}>Escolha onde vincular este versículo</Text>
        </View>

        {/* Preview do versículo — gradiente sutil, mesma linguagem visual do resto do app */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <LinearGradient
            colors={[tokens.actionPrimary + '18', tokens.actionPrimary + '08']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 14, padding: 14, borderWidth: 1, borderColor: tokens.actionPrimary + '25' }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: tokens.actionPrimary, letterSpacing: 0.5, marginBottom: 4 }}>
              {verse.reference}
            </Text>
            <Text numberOfLines={2} style={{ fontSize: 13.5, color: tokens.textSecondary, fontFamily: 'serif', fontStyle: 'italic', lineHeight: 19 }}>
              {`"${verse.verseText}"`}
            </Text>
          </LinearGradient>
        </View>

        {/* Lista de sermões */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={tokens.actionPrimary} />
          </View>
        ) : (
          <FlatList
            data={sermons}
            keyExtractor={s => s.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8, gap: 8 }}
            ListHeaderComponent={
              sermons.length > 0 ? (
                <TouchableOpacity
                  onPress={handleCreateNew}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    borderRadius: 14, padding: 14, marginBottom: 8,
                    borderWidth: 1.5, borderColor: tokens.actionPrimary + '40', borderStyle: 'dashed',
                  }}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: tokens.actionPrimary + '15', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="plus" size={20} color={tokens.actionPrimary} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.actionPrimary }}>Criar novo sermão com este versículo</Text>
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={() => (
              <View style={{ alignItems: 'center', paddingVertical: 32, gap: 14 }}>
                <MaterialCommunityIcons name="notebook-outline" size={36} color={tokens.iconMuted} />
                <Text style={{ fontSize: 14, color: tokens.textTertiary, textAlign: 'center' }}>
                  Você ainda não tem nenhum sermão.
                </Text>
                <TouchableOpacity onPress={handleCreateNew} style={{ borderRadius: 12, overflow: 'hidden' }}>
                  <LinearGradient colors={['#6D28D9', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 12, paddingHorizontal: 28 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>Criar meu primeiro sermão</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
            renderItem={({ item: sermon }) => {
              const state  = rowState[sermon.id] ?? (alreadyIn.has(sermon.id) ? 'already' : 'idle');
              const status = sermon.status ?? 'draft';
              const statusColor = SERMON_STATUS_COLORS[status];

              return (
                <TouchableOpacity
                  onPress={() => handleAdd(sermon)}
                  disabled={state === 'adding'}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    backgroundColor: tokens.bgCard, borderRadius: 14, padding: 14,
                    borderWidth: 1, borderColor: tokens.borderLight,
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor }} />

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.textPrimary }} numberOfLines={1}>
                      {sermon.title}
                    </Text>
                    <Text style={{ fontSize: 11.5, color: tokens.textTertiary }}>
                      {SERMON_STATUS_LABELS[status]}
                    </Text>
                  </View>

                  {state === 'adding' && <ActivityIndicator size="small" color={tokens.actionPrimary} />}
                  {state === 'added' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <MaterialCommunityIcons name="check-circle" size={18} color={tokens.success} />
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: tokens.success }}>Adicionado</Text>
                    </View>
                  )}
                  {state === 'already' && (
                    <Text style={{ fontSize: 12, color: tokens.textTertiary }}>Já incluído</Text>
                  )}
                  {state === 'idle' && (
                    <MaterialCommunityIcons name="plus-circle-outline" size={22} color={tokens.actionPrimary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}