/**
 * VERBUM — app/(app)/modals/chapter-reader.tsx  [CORRIGIDO]
 *
 * FIX: "id of null" ao marcar como lido.
 *
 * CAUSA:
 *   A versão anterior chamava useActivePlan() e desestruturava
 *   { startSession, endSession, readChapterIds } — mas essas props
 *   NÃO existem em useActivePlan(). Resultado:
 *     - startSession = undefined → startSession() → TypeError
 *     - readChapterIds = undefined → readChapterIds.has() → "id of null"
 *
 * CORREÇÃO:
 *   - Usa usePlanContext() que tem TUDO que precisamos
 *   - Remove startSession/endSession (não críticos para o MVP)
 *   - Adiciona null-checks em todos os pontos críticos
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, Share,
} from 'react-native';
import { useSafeAreaInsets }            from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient }               from 'expo-linear-gradient';
import { MaterialCommunityIcons }       from '@expo/vector-icons';

import { useTheme }          from '../../../src/context/ThemeContext';
import { useAuthContext }    from '../../../src/context/AuthContext';
import { usePlanContext }    from '../../../src/context/PlanContext';   // ← FIX: usa o context completo
import { useBibleChapter }  from '../../../src/hooks/useBibleChapter';
import { VerseItem }        from '../../../src/components/bible/VerseItem';
import { ChapterHeader, VerseActionSheet } from '../../../src/components/bible/ChapterHeader';
import { findBook }         from '../../../src/constants/bible';
import { highlightRepo, favoriteRepo } from '../../../src/database/repositories';
import { ThematicMapRepository } from '@/src/database/repositories/ThematicMapRepository';
import type { Highlight }              from '../../../src/database/types';
import type { HighlightColor }         from '../../../src/constants/bible';
import { HIGHLIGHT_DEFINITIONS }       from '../../../src/constants/bible';
import { AddToSermonSheet }            from '../../../src/components/sermon/AddToSermonSheet';
import type { VerseToAdd }             from '../../../src/components/sermon/AddToSermonSheet';

export default function ChapterReaderModal() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  const { user }   = useAuthContext();

  // FIX: usePlanContext em vez de useActivePlan — tem readChapterIds e markChapterRead
  const { activePlan, markChapterRead, readChapterIds } = usePlanContext();

  const { bookSlug = 'gn', chapter: chapterParam = '1' } =
    useLocalSearchParams<{ bookSlug: string; chapter: string }>();

  const chapterNum = parseInt(String(chapterParam), 10) || 1;
  const book       = findBook(String(bookSlug));

  const { data, isLoading, error, isStale, reload } =
    useBibleChapter(String(bookSlug), chapterNum);

  const [highlights, setHighlights] = useState<Record<number, Highlight>>({});
  const [selected,   setSelected]   = useState<{ number: number; text: string } | null>(null);
  const [addToSermonVerse, setAddToSermonVerse] = useState<VerseToAdd | null>(null);

  // Progresso de leitura — barra fina sob a navbar, como Kindle/Medium
  const [scrollProgress, setScrollProgress] = useState(0);
  const handleScroll = useCallback((e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    if (scrollable <= 0) { setScrollProgress(1); return; }
    setScrollProgress(Math.min(1, Math.max(0, contentOffset.y / scrollable)));
  }, []);

  const chapterId = `${bookSlug}-${chapterNum}`;

  // FIX: null-safe — readChapterIds pode ser Set vazio mas nunca undefined
  const safeReadIds: ReadonlySet<string> = readChapterIds ?? new Set<string>();
  const isRead = safeReadIds.has(chapterId);

  const abbrev    = book?.abbr ?? String(bookSlug).toUpperCase();
  const reference = selected ? `${abbrev} ${chapterNum}:${selected.number}` : '';

  // ── Highlights ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    highlightRepo
      .findByChapter(user.id, String(bookSlug), chapterNum)
      .then(hs => {
        const map: Record<number, Highlight> = {};
        hs.forEach(h => { map[h.verseNumber] = h; });
        setHighlights(map);
      })
      .catch(e => console.warn('[Reader] Erro ao carregar highlights:', e));
  }, [user?.id, bookSlug, chapterNum]);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleMarkRead = async () => {
    // FIX: null-check explícito antes de qualquer acesso
    if (!book || !user) return;
    try {
      await markChapterRead(book.slug, book.name, chapterNum);
    } catch (e) {
      console.warn('[Reader] Erro ao marcar como lido:', e);
    }
  };

  const handleHighlight = async (color: HighlightColor) => {
    if (!user || !selected) return;
    try {
      const def = HIGHLIGHT_DEFINITIONS[color];
      const hl: Highlight = {
        id: '',
        userId: user.id,
        bookSlug: String(bookSlug),
        chapterNumber: chapterNum,
        verseNumber: selected.number,
        color, tag: def.label,
        verseText: selected.text,
        bibleVersion: user.preferredVersion ?? 'acf',
        createdAt: new Date().toISOString(),
      };
      await highlightRepo.upsert(hl);
      setHighlights(prev => ({ ...prev, [selected.number]: hl }));
    } catch (e) {
      console.warn('[Reader] Erro ao salvar destaque:', e);
    }
  };

  const handleFavorite = async () => {
    if (!user || !selected || !book) return;
    try {
      await favoriteRepo.add({
        userId: user.id, bookSlug: book.slug, bookName: book.name,
        chapterNumber: chapterNum, verseNumber: selected.number,
        verseText: selected.text, bibleVersion: user.preferredVersion ?? 'acf',
      });
    } catch (e) {
      console.warn('[Reader] Erro ao favoritar:', e);
    }
  };

  const handleShare = async () => {
    if (!selected) return;
    try {
      await Share.share({ message: `${reference}\n\n"${selected.text}"\n\n— via Verbum` });
    } catch { /* silencioso */ }
  };

  const handleCompare = useCallback(() => {
    if (!selected || !book) return;
    const ref = encodeURIComponent(`${abbrev} ${chapterNum}:${selected.number}`);
    setSelected(null);
    setTimeout(() => {
      router.push(
        `/(app)/modals/verse-compare?bookSlug=${book.slug}&bookName=${encodeURIComponent(book.name)}&chapter=${chapterNum}&verse=${selected.number}&reference=${ref}`,
      );
    }, 250);
  }, [selected, book, abbrev, chapterNum]);

  const handleAddToSermon = useCallback(() => {
    if (!selected || !book) return;
    const sel = { ...selected };
    setSelected(null);
    setAddToSermonVerse({
      bookSlug: book.slug,
      bookName: book.name,
      chapter:  chapterNum,
      verse:    sel.number,
      verseText: sel.text,
      reference: `${abbrev} ${chapterNum}:${sel.number}`,
    });
  }, [selected, book, chapterNum, abbrev]);

  const handleAddToMap = useCallback(async () => {
    if (!user || !selected || !book) return;
    const sel = { ...selected };
    setSelected(null);
    try {
      const maps = await ThematicMapRepository.findAll(user.id);
      if (maps.length === 0) {
        Alert.alert('Nenhum mapa', 'Crie um mapa temático primeiro.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Mapas', onPress: () => setTimeout(() => router.push('/(app)/modals/thematic-maps'), 300) },
        ]);
        return;
      }
      Alert.alert('Adicionar ao mapa', 'Escolha o mapa:', [
        ...maps.slice(0, 5).map((m:any) => ({
          text: m.name,
          onPress: async () => {
            await ThematicMapRepository.addVerse({ mapId: m.id, bookSlug: book.slug, bookName: book.name, chapter: chapterNum, verse: sel.number, verseText: sel.text });
            Alert.alert('Adicionado ✓', `Versículo em "${m.name}".`);
          },
        })),
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } catch (e) { console.warn('[Reader] Erro ao adicionar ao mapa:', e); }
  }, [user, selected, book, chapterNum]);

  const handleStudy = useCallback(() => {
    if (!book) return;
    router.push(`/(app)/modals/study-note?bookSlug=${book.slug}&bookName=${encodeURIComponent(book.name)}&chapter=${chapterNum}`);
  }, [book, chapterNum]);

  const goToPrev = () => { if (chapterNum > 1) router.replace(`/(app)/modals/chapter-reader?bookSlug=${bookSlug}&chapter=${chapterNum - 1}`); };
  const goToNext = () => { if (book && chapterNum < book.chapters) router.replace(`/(app)/modals/chapter-reader?bookSlug=${bookSlug}&chapter=${chapterNum + 1}`); };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary, paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" backgroundColor={tokens.bgPrimary} />

      {/* Navbar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.textPrimary }}>
            {book?.name ?? String(bookSlug)} — Cap. {chapterNum}
          </Text>
          {isStale && <Text style={{ fontSize: 10, color: tokens.warning }}>⚠ Cache</Text>}
        </View>
        <TouchableOpacity onPress={handleStudy} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="book-search-outline" size={22} color={tokens.actionPrimary} />
        </TouchableOpacity>
      </View>

      {/* Barra de progresso de leitura — fina, discreta, enche conforme rola */}
      <View style={{ height: 3, backgroundColor: tokens.borderLight }}>
        <LinearGradient
          colors={['#6D28D9', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: '100%', width: `${scrollProgress * 100}%` }}
        />
      </View>

      {/* Conteúdo */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <LinearGradient
            colors={[tokens.actionPrimary + '25', tokens.actionPrimary + '08']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' }}
          >
            <ActivityIndicator size="large" color={tokens.actionPrimary} />
          </LinearGradient>
          <Text style={{ fontSize: 14, color: tokens.textTertiary }}>
            Carregando {book?.abbr ?? ''} {chapterNum}…
          </Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 }}>
          <LinearGradient
            colors={['#F59E0B30', '#F59E0B10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#F59E0B" />
          </LinearGradient>
          <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.textPrimary, textAlign: 'center' }}>Não foi possível carregar</Text>
          <View style={{ backgroundColor: tokens.bgCard, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: tokens.borderLight, width: '100%' }}>
            <Text style={{ fontSize: 12, color: tokens.error }}>{error.message}</Text>
          </View>
          <TouchableOpacity onPress={reload} style={{ backgroundColor: tokens.actionPrimary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.actionPrimaryText }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.verses ?? []}
          keyExtractor={v => String(v.number)}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={
            book && data
              ? <ChapterHeader bookName={book.name} chapterNum={chapterNum} totalVerses={data.totalVerses} onStudy={handleStudy} />
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
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        paddingBottom: insets.bottom + 12,
        borderTopWidth: 1, borderTopColor: tokens.borderLight,
        backgroundColor: tokens.bgCard, gap: 8,
      }}>
        <TouchableOpacity onPress={goToPrev} disabled={chapterNum <= 1} style={{ padding: 10, opacity: chapterNum <= 1 ? 0.3 : 1 }}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={tokens.iconPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleMarkRead}
          style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}
        >
          {isRead ? (
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              backgroundColor: tokens.successBg, paddingVertical: 13, gap: 8,
            }}>
              <MaterialCommunityIcons name="check-circle" size={20} color={tokens.success} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.success }}>Lido ✓</Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#6D28D9', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                paddingVertical: 13, gap: 8,
              }}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={20} color="white" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>Marcar como lido</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToNext}
          disabled={!book || chapterNum >= book.chapters}
          style={{ padding: 10, opacity: (!book || chapterNum >= book.chapters) ? 0.3 : 1 }}
        >
          <MaterialCommunityIcons name="chevron-right" size={28} color={tokens.iconPrimary} />
        </TouchableOpacity>
      </View>

      {/* VerseActionSheet */}
      {selected && (
        <VerseActionSheet
          visible
          verseNumber={selected.number}
          verseText={selected.text}
          reference={reference}
          onClose={() => setSelected(null)}
          onHighlight={handleHighlight}
          onNote={() => {
            const s = selected;
            setSelected(null);
            setTimeout(() => router.push(`/(app)/modals/note-editor?bookSlug=${bookSlug}&chapter=${chapterNum}&verse=${s.number}`), 200);
          }}
          onFavorite={handleFavorite}
          onShare={handleShare}
          onCompare={handleCompare}
          onAddToSermon={handleAddToSermon}
          onAddToMap={handleAddToMap}
          isFavorited={false}
        />
      )}

      {/* Adicionar ao sermão — bottom sheet customizado, substitui os Alert.alert antigos */}
      <AddToSermonSheet
        visible={!!addToSermonVerse}
        verse={addToSermonVerse}
        onClose={() => setAddToSermonVerse(null)}
      />
    </View>
  );
}