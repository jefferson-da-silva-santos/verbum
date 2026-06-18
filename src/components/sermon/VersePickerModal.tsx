/**
 * VERBUM — src/components/sermon/VersePickerModal.tsx  [NOVO]
 *
 * Seletor de versículos focado para uso DENTRO do Caderno do Pregador
 * (aba Passagem do sermon-editor). Deliberadamente mais simples do
 * que a área "Bíblia" principal — sem destaques, sem notas, sem
 * áudio. Só três passos: Livro → Capítulo → Versículo(s).
 *
 * Fluxo:
 *   1. Busca/lista de livros (66 livros, com busca por nome)
 *   2. Grade de capítulos do livro escolhido
 *   3. Lista de versículos do capítulo, com seleção múltipla
 *      (toque para marcar/desmarcar) + botão de confirmar no rodapé
 *
 * Uso:
 *   <VersePickerModal
 *     visible={pickerOpen}
 *     onClose={() => setPickerOpen(false)}
 *     onConfirm={(verses) => { ...adiciona cada um via SermonRepository.addVerse... }}
 *   />
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { BIBLE_BOOKS } from '../../constants/bible';
import type { BibleBook } from '../../constants/bible';
import { BibleApiClient } from '../../api/bibliaApi';

export interface PickedVerse {
  bookSlug:  string;
  bookName:  string;
  chapter:   number;
  verse:     number;
  verseText: string;
}

type Step = 'book' | 'chapter' | 'verses';

interface ChapterVerse { number: number; text: string; }

export function VersePickerModal({
  visible, onClose, onConfirm,
}: {
  visible:   boolean;
  onClose:   () => void;
  onConfirm: (verses: PickedVerse[]) => void;
}) {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  const { user }   = useAuthContext();
  const version    = (user?.preferredVersion ?? 'acf') as string;

  const [step,         setStep]         = useState<Step>('book');
  const [search,        setSearch]       = useState('');
  const [selectedBook,  setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verses,        setVerses]       = useState<ChapterVerse[]>([]);
  const [isLoading,     setIsLoading]    = useState(false);
  const [loadError,     setLoadError]    = useState<string | null>(null);
  const [selectedNums,  setSelectedNums] = useState<Set<number>>(new Set());

  // Reseta tudo quando o modal fecha, para a próxima abertura começar limpa
  useEffect(() => {
    if (!visible) {
      setStep('book'); setSearch(''); setSelectedBook(null);
      setSelectedChapter(null); setVerses([]); setSelectedNums(new Set());
      setLoadError(null);
    }
  }, [visible]);

  const filteredBooks = useMemo(() => {
    if (!search.trim()) return BIBLE_BOOKS;
    const q = search.trim().toLowerCase();
    return BIBLE_BOOKS.filter(b => b.name.toLowerCase().includes(q) || b.abbr.toLowerCase().includes(q));
  }, [search]);

  const otBooks = filteredBooks.filter(b => b.testament === 'OT');
  const ntBooks = filteredBooks.filter(b => b.testament === 'NT');

  const pickBook = (book: BibleBook) => {
    setSelectedBook(book);
    setStep('chapter');
  };

  const pickChapter = useCallback(async (chapter: number) => {
    if (!selectedBook) return;
    setSelectedChapter(chapter);
    setSelectedNums(new Set());
    setStep('verses');
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await BibleApiClient.getChapterVerses(version, selectedBook.slug, chapter);
      setVerses((data.verses ?? []).map((v: any) => ({ number: v.number, text: v.text })));
    } catch (e) {
      setLoadError('Não foi possível carregar este capítulo. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBook, version]);

  const toggleVerse = (num: number) => {
    setSelectedNums(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num); else next.add(num);
      return next;
    });
  };

  const goBack = () => {
    if (step === 'verses') setStep('chapter');
    else if (step === 'chapter') setStep('book');
  };

  const handleConfirm = () => {
    if (!selectedBook || !selectedChapter) return;
    const picked: PickedVerse[] = verses
      .filter(v => selectedNums.has(v.number))
      .map(v => ({
        bookSlug:  selectedBook.slug,
        bookName:  selectedBook.name,
        chapter:   selectedChapter,
        verse:     v.number,
        verseText: v.text,
      }));
    if (picked.length === 0) return;
    onConfirm(picked);
  };

  const headerTitle =
    step === 'book' ? 'Escolher livro' :
    step === 'chapter' ? selectedBook?.name ?? '' :
    `${selectedBook?.name ?? ''} ${selectedChapter ?? ''}`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={{ flex: 1, backgroundColor: tokens.bgPrimary, paddingTop: insets.top }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, gap: 10 }}>
          {step !== 'book' ? (
            <TouchableOpacity onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={tokens.iconPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 22 }} />
          )}
          <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: tokens.textPrimary, textAlign: 'center' }} numberOfLines={1}>
            {headerTitle}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
          </TouchableOpacity>
        </View>

        {/* Passo 1: Livro */}
        {step === 'book' && (
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: tokens.bgCard, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: tokens.borderLight }}>
                <MaterialCommunityIcons name="magnify" size={18} color={tokens.iconMuted} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar livro..."
                  placeholderTextColor={tokens.textDisabled}
                  style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: tokens.textPrimary }}
                />
              </View>
            </View>

            <FlatList
              data={[{ key: 'ot', books: otBooks }, { key: 'nt', books: ntBooks }].filter(s => s.books.length > 0)}
              keyExtractor={s => s.key}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              renderItem={({ item: section }) => (
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
                    {section.key === 'ot' ? 'Antigo Testamento' : 'Novo Testamento'}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 }}>
                    {section.books.map(b => (
                      <TouchableOpacity
                        key={b.slug}
                        onPress={() => pickBook(b)}
                        style={{
                          paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
                          backgroundColor: tokens.bgCard, borderWidth: 1, borderColor: tokens.borderLight,
                        }}
                      >
                        <Text style={{ fontSize: 13.5, fontWeight: '600', color: tokens.textPrimary }}>{b.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              ListEmptyComponent={() => (
                <View style={{ alignItems: 'center', paddingTop: 60, gap: 8 }}>
                  <MaterialCommunityIcons name="book-search-outline" size={32} color={tokens.iconMuted} />
                  <Text style={{ fontSize: 13, color: tokens.textTertiary }}>Nenhum livro encontrado.</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Passo 2: Capítulo */}
        {step === 'chapter' && selectedBook && (
          <FlatList
            data={Array.from({ length: selectedBook.chapters }, (_, i) => i + 1)}
            keyExtractor={n => String(n)}
            numColumns={5}
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
            columnWrapperStyle={{ gap: 10, marginBottom: 10 }}
            renderItem={({ item: n }) => (
              <TouchableOpacity
                onPress={() => pickChapter(n)}
                style={{
                  flex: 1, aspectRatio: 1, borderRadius: 12,
                  backgroundColor: tokens.bgCard, borderWidth: 1, borderColor: tokens.borderLight,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.textPrimary }}>{n}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Passo 3: Versículos */}
        {step === 'verses' && (
          <View style={{ flex: 1 }}>
            {isLoading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <ActivityIndicator size="large" color={tokens.actionPrimary} />
                <Text style={{ fontSize: 13, color: tokens.textTertiary }}>Carregando capítulo…</Text>
              </View>
            ) : loadError ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
                <MaterialCommunityIcons name="wifi-off" size={36} color={tokens.iconMuted} />
                <Text style={{ fontSize: 14, color: tokens.textTertiary, textAlign: 'center' }}>{loadError}</Text>
                <TouchableOpacity onPress={() => selectedChapter && pickChapter(selectedChapter)} style={{ backgroundColor: tokens.actionPrimary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.actionPrimaryText }}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 12, color: tokens.textTertiary, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
                  Toque nos versículos que quer adicionar à passagem.
                </Text>
                <FlatList
                  data={verses}
                  keyExtractor={v => String(v.number)}
                  contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 8 }}
                  renderItem={({ item: v }) => {
                    const isSelected = selectedNums.has(v.number);
                    return (
                      <TouchableOpacity
                        onPress={() => toggleVerse(v.number)}
                        style={{
                          flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                          backgroundColor: isSelected ? tokens.actionPrimary + '12' : tokens.bgCard,
                          borderRadius: 12, padding: 12,
                          borderWidth: 1.5, borderColor: isSelected ? tokens.actionPrimary : tokens.borderLight,
                        }}
                      >
                        <View style={{
                          width: 22, height: 22, borderRadius: 11, marginTop: 1,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: isSelected ? tokens.actionPrimary : 'transparent',
                          borderWidth: isSelected ? 0 : 1.5, borderColor: tokens.borderMedium,
                        }}>
                          {isSelected
                            ? <MaterialCommunityIcons name="check" size={14} color={tokens.actionPrimaryText} />
                            : <Text style={{ fontSize: 10, fontWeight: '700', color: tokens.textTertiary }}>{v.number}</Text>}
                        </View>
                        <Text style={{ flex: 1, fontSize: 14, color: tokens.textSecondary, fontFamily: 'serif', lineHeight: 21 }}>
                          <Text style={{ fontWeight: '700', color: tokens.textPrimary }}>{v.number} </Text>
                          {v.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </>
            )}

            {/* Rodapé com confirmação */}
            {!isLoading && !loadError && (
              <View style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12,
                backgroundColor: tokens.bgPrimary, borderTopWidth: 1, borderTopColor: tokens.borderLight,
              }}>
                <TouchableOpacity
                  onPress={handleConfirm}
                  disabled={selectedNums.size === 0}
                  style={{ borderRadius: 14, overflow: 'hidden', opacity: selectedNums.size === 0 ? 0.4 : 1 }}
                >
                  <LinearGradient
                    colors={['#6D28D9', '#8B5CF6']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 }}
                  >
                    <MaterialCommunityIcons name="plus-circle-outline" size={18} color="white" />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>
                      Adicionar {selectedNums.size > 0 ? `${selectedNums.size} versículo${selectedNums.size > 1 ? 's' : ''}` : 'versículo'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}