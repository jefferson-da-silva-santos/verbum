/**
 * VERBUM — app/(app)/modals/chapter-reader.tsx
 * Leitor de capítulo em tela cheia.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { useActivePlan } from '../../../src/hooks/useActivePlan';
import { useBibleChapter } from '../../../src/hooks/useBibleChapter';
import { VerseItem } from '../../../src/components/bible/VerseItem';
import { ChapterHeader } from '../../../src/components/bible/ChapterHeader';
import { VerseActionSheet } from '../../../src/components/bible/ChapterHeader';
import { findBook } from '../../../src/constants/bible';
import { highlightRepo, favoriteRepo } from '../../../src/database/repositories';
import type { Highlight } from '../../../src/database/types';
import type { HighlightColor } from '../../../src/constants/bible';
import { HIGHLIGHT_DEFINITIONS } from '../../../src/constants/bible';

export default function ChapterReaderModal() {
  const { tokens } = useTheme();
  const { user } = useAuthContext();
  const { markChapterRead, readChapterIds, startSession, endSession } = useActivePlan();
  const { bookSlug = 'gn', chapter: chapterParam = '1' } = useLocalSearchParams<{ bookSlug: string; chapter: string }>();

  const chapterNum = parseInt(String(chapterParam), 10) || 1;
  const book = findBook(String(bookSlug));
  const { data, isLoading, error, isStale } = useBibleChapter(String(bookSlug), chapterNum);

  const [highlights, setHighlights] = useState<Record<number, Highlight>>({});
  const [selected, setSelected] = useState<{ number: number; text: string } | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionStart = useRef<number>(0);
  const chapterId = `${bookSlug}-${chapterNum}`;
  const isRead = readChapterIds.has(chapterId);

  useEffect(() => {
    if (!user) return;
    highlightRepo.findByChapter(user.id, String(bookSlug), chapterNum).then(hs => {
      const map: Record<number, Highlight> = {};
      hs.forEach(h => { map[h.verseNumber] = h; });
      setHighlights(map);
    });
  }, [user?.id, bookSlug, chapterNum]);

  useEffect(() => {
    if (!user) return;
    sessionStart.current = Date.now();
    startSession(String(bookSlug), chapterNum).then(id => { sessionIdRef.current = id; });
    return () => {
      if (sessionIdRef.current) {
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        endSession(sessionIdRef.current, dur);
      }
    };
  }, []);

  const handleMarkRead = async () => {
    if (!book) return;
    await markChapterRead(book.slug, book.name, chapterNum);
  };

  const handleHighlight = async (color: HighlightColor) => {
    if (!user || !selected) return;
    await highlightRepo.upsert({
      userId: user.id, bookSlug: String(bookSlug), chapterNumber: chapterNum,
      verseNumber: selected.number, color, tag: HIGHLIGHT_DEFINITIONS[color].label,
      verseText: selected.text, bibleVersion: user.preferredVersion,
    });
    setHighlights(prev => ({
      ...prev,
      [selected.number]: {
        id: '', userId: user.id, bookSlug: String(bookSlug), chapterNumber: chapterNum,
        verseNumber: selected.number, color, tag: HIGHLIGHT_DEFINITIONS[color].label,
        verseText: selected.text, bibleVersion: user.preferredVersion, createdAt: new Date().toISOString(),
      },
    }));
  };

  const handleFavorite = async () => {
    if (!user || !selected || !book) return;
    await favoriteRepo.add({
      userId: user.id, bookSlug: book.slug, bookName: book.name,
      chapterNumber: chapterNum, verseNumber: selected.number,
      verseText: selected.text, bibleVersion: user.preferredVersion,
    });
  };

  const goToPrev = () => { if (chapterNum > 1) router.replace(`/(app)/modals/chapter-reader?bookSlug=${bookSlug}&chapter=${chapterNum - 1}`); };
  const goToNext = () => { if (book && chapterNum < book.chapters) router.replace(`/(app)/modals/chapter-reader?bookSlug=${bookSlug}&chapter=${chapterNum + 1}`); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.cultoBg }}>
      <StatusBar barStyle="dark-content" />

      {/* Navbar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.textPrimary }}>{book?.abbr} {chapterNum}</Text>
          {isStale && <Text style={{ fontSize: 10, color: tokens.warning }}>Cache desatualizado</Text>}
        </View>
        <View style={{ width: 30 }} />
      </View>

      {/* Conteúdo */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: tokens.textTertiary }}>Carregando...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <MaterialCommunityIcons name="wifi-off" size={48} color={tokens.iconMuted} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: tokens.textPrimary, marginTop: 16, textAlign: 'center' }}>Sem conexão</Text>
          <Text style={{ fontSize: 14, color: tokens.textTertiary, textAlign: 'center', marginTop: 8 }}>{error.userMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={data?.verses ?? []}
          keyExtractor={v => String(v.number)}
          ListHeaderComponent={book && data ? <ChapterHeader bookName={book.name} chapterNum={chapterNum} totalVerses={data.totalVerses} /> : null}
          renderItem={({ item: verse }) => (
            <VerseItem
              number={verse.number}
              text={verse.text}
              highlight={highlights[verse.number] ?? null}
              onLongPress={(num, text) => setSelected({ number: num, text })}
            />
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Footer */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: tokens.borderLight, backgroundColor: tokens.bgCard, gap: 8 }}>
        <TouchableOpacity onPress={goToPrev} disabled={chapterNum <= 1} style={{ padding: 10, opacity: chapterNum <= 1 ? 0.35 : 1 }}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleMarkRead} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: isRead ? tokens.successBg : tokens.actionPrimary, borderRadius: 12, paddingVertical: 12, gap: 8 }}>
          <MaterialCommunityIcons name={isRead ? 'check-circle' : 'check-circle-outline'} size={20} color={isRead ? tokens.success : tokens.actionPrimaryText} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: isRead ? tokens.success : tokens.actionPrimaryText }}>
            {isRead ? 'Lido' : 'Marcar como lido'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNext} disabled={!book || chapterNum >= book.chapters} style={{ padding: 10, opacity: (!book || chapterNum >= book.chapters) ? 0.35 : 1 }}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={tokens.iconPrimary} />
        </TouchableOpacity>
      </View>

      {/* Action Sheet */}
      {selected && (
        <VerseActionSheet
          visible={!!selected}
          verseNumber={selected.number}
          verseText={selected.text}
          onClose={() => setSelected(null)}
          onHighlight={handleHighlight}
          onNote={() => router.push(`/(app)/modals/note-editor?bookSlug=${bookSlug}&chapter=${chapterNum}&verse=${selected.number}`)}
          onFavorite={handleFavorite}
          onShare={() => { }}
          isFavorited={false}
        />
      )}
    </SafeAreaView>
  );
}