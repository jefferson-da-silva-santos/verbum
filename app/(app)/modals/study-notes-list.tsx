/**
 * VERBUM — app/(app)/modals/study-notes-list.tsx
 * Lista de todas as notas de estudo (Exposição Guiada).
 */

import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme }       from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { StudyNoteRepository } from '@/src/database/repositories/ThematicMapRepository';
import type { StudyNote } from '../../../src/database/types';
import { relativeDate } from '../../../src/utils/dateUtils';

export default function StudyNotesListModal() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  const { user }   = useAuthContext();
  const [notes, setNotes] = useState<StudyNote[]>([]);

  useEffect(() => {
    if (!user) return;
    StudyNoteRepository.findAll(user.id).then(setNotes);
  }, [user?.id]);

  // Progresso COIA de cada nota
  const getProgress = (n: StudyNote) => {
    let done = 0;
    if (n.context?.trim())        done++;
    if (n.observation?.trim())    done++;
    if (n.interpretation?.trim()) done++;
    if (n.application?.trim())    done++;
    return done;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>Exposições Guiadas</Text>
        <Text style={{ fontSize: 13, color: tokens.textTertiary }}>{notes.length}</Text>
      </View>

      <FlatList
        data={notes}
        keyExtractor={n => n.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        renderItem={({ item: n }) => {
          const progress = getProgress(n);
          return (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/modals/study-note?bookSlug=${n.bookSlug}&bookName=${encodeURIComponent(n.bookName)}&chapter=${n.chapter}`)}
              style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, gap: 8 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.actionPrimary }}>{n.passageRef}</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {['C','O','I','A'].map((l, i) => {
                    const filled = i < progress;
                    const sectionColors = ['#8B6340','#4A5C8B','#4A7C59','#7A4A8B'];
                    return (
                      <View key={l} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: filled ? sectionColors[i] : tokens.bgSecondary, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: filled ? 'white' : tokens.textDisabled }}>{l}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Preview do conteúdo mais rico */}
              {(n.observation || n.context) && (
                <Text numberOfLines={2} style={{ fontSize: 13, color: tokens.textSecondary, lineHeight: 20, fontFamily: 'serif' }}>
                  {n.observation || n.context}
                </Text>
              )}

              <Text style={{ fontSize: 11, color: tokens.textDisabled }}>
                {progress}/4 seções · {relativeDate(n.updatedAt)}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ padding: 48, alignItems: 'center', gap: 16 }}>
            <MaterialCommunityIcons name="book-search-outline" size={52} color={tokens.iconMuted} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: tokens.textPrimary, textAlign: 'center' }}>Nenhuma exposição ainda</Text>
            <Text style={{ fontSize: 14, color: tokens.textSecondary, textAlign: 'center', lineHeight: 22 }}>Abra qualquer capítulo no leitor e acesse a Exposição Guiada (COIA).</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}