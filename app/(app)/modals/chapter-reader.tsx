/**
 * VERBUM — app/(app)/modals/chapter-reader.tsx
 *
 * COLE ESTE ARQUIVO EM:
 *   app/(app)/modals/chapter-reader.tsx
 *
 * Mudanças em relação à versão anterior:
 *   + handleCompare: navega para /(app)/modals/verse-compare com os params do versículo
 *   + onCompare={handleCompare} passado para o VerseActionSheet
 *   + prop reference calculada e passada para o VerseActionSheet
 */

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets }            from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons }       from '@expo/vector-icons';

import { useTheme }         from '../../../src/context/ThemeContext';
import { useAuthContext }   from '../../../src/context/AuthContext';
import { useActivePlan }    from '../../../src/hooks/useActivePlan';
import { useBibleChapter }  from '../../../src/hooks/useBibleChapter';
import { VerseItem }        from '../../../src/components/bible/VerseItem';
import { ChapterHeader, VerseActionSheet } from '../../../src/components/bible/ChapterHeader';
import { findBook }         from '../../../src/constants/bible';
import { highlightRepo, favoriteRepo } from '../../../src/database/repositories';
import type { Highlight }   from '../../../src/database/types';
import type { HighlightColor } from '../../../src/constants/bible';
import { HIGHLIGHT_DEFINITIONS } from '../../../src/constants/bible';

export default function ChapterReaderModal() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  const { user }   = useAuthContext();
  const {
    markChapterRead,
    readChapterIds,
    startSession,
    endSession,
  } = useActivePlan();

  const {
    bookSlug = 'gn',
    chapter: chapterParam = '1',
  } = useLocalSearchParams<{ bookSlug: string; chapter: string }>();

  const chapterNum = parseInt(String(chapterParam), 10) || 1;
  const book       = findBook(String(bookSlug));

  const { data, isLoading, error, isStale, reload } =
    useBibleChapter(String(bookSlug), chapterNum);

  const [highlights, setHighlights] =
    useState<Record<number, Highlight>>({});
  const [selected, setSelected] =
    useState<{ number: number; text: string } | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const sessionStart = useRef<number>(0);

  const chapterId = `${bookSlug}-${chapterNum}`;
  const isRead    = readChapterIds.has(chapterId);

  // Referência formatada do versículo selecionado, ex: "Jo 3:16"
  const reference = book && selected
    ? `${book.abbr ?? book.slug.toUpperCase()} ${chapterNum}:${selected.number}`
    : '';

  // ── Highlights ──────────────────────────────
  useEffect(() => {
    if (!user) return;
    highlightRepo
      .findByChapter(user.id, String(bookSlug), chapterNum)
      .then(hs => {
        const map: Record<number, Highlight> = {};
        hs.forEach(h => { map[h.verseNumber] = h; });
        setHighlights(map);
      });
  }, [user?.id, bookSlug, chapterNum]);

  // ── Sessão de leitura ────────────────────────
  useEffect(() => {
    if (!user) return;
    sessionStart.current = Date.now();
    startSession(String(bookSlug), chapterNum).then(id => {
      sessionIdRef.current = id;
    });
    return () => {
      if (sessionIdRef.current) {
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        endSession(sessionIdRef.current, dur);
      }
    };
  }, []);

  // ── Handlers ─────────────────────────────────

  const handleMarkRead = async () => {
    if (!book) return;
    await markChapterRead(book.slug, book.name, chapterNum);
  };

  const handleHighlight = async (color: HighlightColor) => {
    if (!user || !selected) return;
    const def = HIGHLIGHT_DEFINITIONS[color];
    const hl: Highlight = {
      id: '',
      userId: user.id,
      bookSlug: String(bookSlug),
      chapterNumber: chapterNum,
      verseNumber: selected.number,
      color,
      tag: def.label,
      verseText: selected.text,
      bibleVersion: user.preferredVersion,
      createdAt: new Date().toISOString(),
    };
    await highlightRepo.upsert(hl);
    setHighlights(prev => ({ ...prev, [selected.number]: hl }));
  };

  const handleFavorite = async () => {
    if (!user || !selected || !book) return;
    await favoriteRepo.add({
      userId: user.id,
      bookSlug: book.slug,
      bookName: book.name,
      chapterNumber: chapterNum,
      verseNumber: selected.number,
      verseText: selected.text,
      bibleVersion: user.preferredVersion,
    });
  };

  const handleShare = () => {
    // TODO: implementar Share.share
  };

  /**
   * Abre o modal de comparação de versões para o versículo selecionado.
   * Fecha o action sheet antes de navegar para evitar conflito de modais.
   */
  const handleCompare = () => {
    if (!selected || !book) return;

    const ref = `${book.abbr ?? book.slug.toUpperCase()} ${chapterNum}:${selected.number}`;

    // 1. Fecha o action sheet
    setSelected(null);

    // 2. Aguarda o sheet fechar antes de abrir o próximo modal
    setTimeout(() => {
      router.push(
        `/(app)/modals/verse-compare` +
        `?bookSlug=${encodeURIComponent(book.slug)}` +
        `&bookName=${encodeURIComponent(book.name)}` +
        `&chapter=${chapterNum}` +
        `&verse=${selected.number}` +
        `&reference=${encodeURIComponent(ref)}`,
      );
    }, 250);
  };

  const goToPrev = () => {
    if (chapterNum > 1) {
      router.replace(
        `/(app)/modals/chapter-reader?bookSlug=${bookSlug}&chapter=${chapterNum - 1}`,
      );
    }
  };

  const goToNext = () => {
    if (book && chapterNum < book.chapters) {
      router.replace(
        `/(app)/modals/chapter-reader?bookSlug=${bookSlug}&chapter=${chapterNum + 1}`,
      );
    }
  };

  // ── Render ───────────────────────────────────

  return (
    <View style={{
      flex: 1,
      backgroundColor: tokens.bgPrimary,
      paddingTop: insets.top,
    }}>
      <StatusBar barStyle="dark-content" backgroundColor={tokens.bgPrimary} />

      {/* Navbar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: tokens.borderLight,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.textPrimary }}>
            {book?.name ?? String(bookSlug)} — Capítulo {chapterNum}
          </Text>
          {isStale && (
            <Text style={{ fontSize: 10, color: tokens.warning }}>
              ⚠ Cache desatualizado
            </Text>
          )}
        </View>

        <View style={{ width: 30 }} />
      </View>

      {/* Conteúdo */}
      {isLoading ? (
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}>
          <ActivityIndicator size="large" color={tokens.actionPrimary} />
          <Text style={{ fontSize: 14, color: tokens.textTertiary }}>
            Carregando {book?.abbr} {chapterNum}…
          </Text>
        </View>

      ) : error ? (
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 28,
          gap: 16,
        }}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={52}
            color={tokens.warning}
          />
          <Text style={{
            fontSize: 17,
            fontWeight: '700',
            color: tokens.textPrimary,
            textAlign: 'center',
          }}>
            Não foi possível carregar
          </Text>
          <View style={{
            backgroundColor: tokens.bgCard,
            borderRadius: 10,
            padding: 14,
            borderWidth: 1,
            borderColor: tokens.borderLight,
            width: '100%',
          }}>
            <Text style={{ fontSize: 12, color: tokens.error }}>
              {error.message}
            </Text>
          </View>
          <TouchableOpacity
            onPress={reload}
            style={{
              backgroundColor: tokens.actionPrimary,
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 28,
            }}
          >
            <Text style={{
              fontSize: 15,
              fontWeight: '700',
              color: tokens.actionPrimaryText,
            }}>
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </View>

      ) : (
        <FlatList
          data={data?.verses ?? []}
          keyExtractor={v => String(v.number)}
          ListHeaderComponent={
            book && data
              ? (
                <ChapterHeader
                  bookName={book.name}
                  chapterNum={chapterNum}
                  totalVerses={data.totalVerses}
                />
              )
              : null
          }
          renderItem={({ item: verse }) => (
            <VerseItem
              number={verse.number}
              text={verse.text}
              highlight={highlights[verse.number] ?? null}
              onLongPress={(num, text) => setSelected({ number: num, text })}
            />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Footer */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: insets.bottom + 12,
        borderTopWidth: 1,
        borderTopColor: tokens.borderLight,
        backgroundColor: tokens.bgCard,
        gap: 8,
      }}>
        <TouchableOpacity
          onPress={goToPrev}
          disabled={chapterNum <= 1}
          style={{ padding: 10, opacity: chapterNum <= 1 ? 0.3 : 1 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={tokens.iconPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleMarkRead}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isRead ? tokens.successBg : tokens.actionPrimary,
            borderRadius: 14,
            paddingVertical: 13,
            gap: 8,
          }}
        >
          <MaterialCommunityIcons
            name={isRead ? 'check-circle' : 'check-circle-outline'}
            size={20}
            color={isRead ? tokens.success : tokens.actionPrimaryText}
          />
          <Text style={{
            fontSize: 15,
            fontWeight: '700',
            color: isRead ? tokens.success : tokens.actionPrimaryText,
          }}>
            {isRead ? 'Lido ✓' : 'Marcar como lido'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToNext}
          disabled={!book || chapterNum >= book.chapters}
          style={{
            padding: 10,
            opacity: (!book || chapterNum >= book.chapters) ? 0.3 : 1,
          }}
        >
          <MaterialCommunityIcons name="chevron-right" size={28} color={tokens.iconPrimary} />
        </TouchableOpacity>
      </View>

      {/* VerseActionSheet — com onCompare */}
      {selected && (
        <VerseActionSheet
          visible={!!selected}
          verseNumber={selected.number}
          verseText={selected.text}
          reference={reference}
          onClose={() => setSelected(null)}
          onHighlight={handleHighlight}
          onNote={() => {
            setSelected(null);
            setTimeout(() => {
              router.push(
                `/(app)/modals/note-editor` +
                `?bookSlug=${bookSlug}` +
                `&chapter=${chapterNum}` +
                `&verse=${selected.number}`,
              );
            }, 200);
          }}
          onFavorite={handleFavorite}
          onShare={handleShare}
          onCompare={handleCompare}
          isFavorited={false}
        />
      )}
    </View>
  );
}