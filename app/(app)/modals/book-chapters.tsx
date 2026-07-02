/**
 * VERBUM — app/(app)/modals/book-chapters.tsx
 *
 * Seletor de capítulo com:
 *   - Header com gradiente por categoria, bordas arredondadas embaixo
 *   - Informações do livro bem organizadas em seções
 *   - Grid de capítulos com tamanho FIXO (última linha não estica)
 */

import { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme }       from '../../../src/context/ThemeContext';
import { usePlanContext } from '../../../src/context/PlanContext';
import { findBook }       from '../../../src/constants/bible';

// ─── Paleta por categoria ──────────────────────────────────────────

const CATEGORY_GRADIENT: Record<string, [string, string, string]> = {
  pentateuch:        ['#92400E', '#B45309', '#D97706'],
  historical_ot:     ['#1E3A5F', '#1D4ED8', '#3B82F6'],
  poetic:            ['#4C1D95', '#6D28D9', '#8B5CF6'],
  prophetic_ot:      ['#7F1D1D', '#B91C1C', '#EF4444'],
  major_prophets:    ['#7F1D1D', '#B91C1C', '#EF4444'],
  minor_prophets:    ['#9A3412', '#C2410C', '#F97316'],
  prophetic_major:   ['#7F1D1D', '#B91C1C', '#EF4444'],
  prophetic_minor:   ['#9A3412', '#C2410C', '#F97316'],
  gospels:           ['#14532D', '#15803D', '#22C55E'],
  historical_nt:     ['#0C4A6E', '#0369A1', '#0EA5E9'],
  pauline_epistles:  ['#1E1B4B', '#3730A3', '#6366F1'],
  epistles_paul:     ['#1E1B4B', '#3730A3', '#6366F1'],
  general_epistles:  ['#134E4A', '#0F766E', '#14B8A6'],
  epistles_general:  ['#134E4A', '#0F766E', '#14B8A6'],
  prophetic_nt:      ['#2D1B69', '#5B21B6', '#A855F7'],
};

const DEFAULT_GRADIENT: [string, string, string] = ['#4C1D95', '#6D28D9', '#8B5CF6'];

const CATEGORY_LABEL: Record<string, string> = {
  pentateuch:        'Pentateuco',
  historical_ot:     'Histórico',
  poetic:            'Poético',
  prophetic_ot:      'Profético',
  major_prophets:    'Profetas Maiores',
  minor_prophets:    'Profetas Menores',
  prophetic_major:   'Profetas Maiores',
  prophetic_minor:   'Profetas Menores',
  gospels:           'Evangelho',
  historical_nt:     'Histórico',
  pauline_epistles:  'Epístola Paulina',
  epistles_paul:     'Epístola Paulina',
  general_epistles:  'Epístola Geral',
  epistles_general:  'Epístola Geral',
  prophetic_nt:      'Profético',
};

const CATEGORY_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  pentateuch:        'script-text-outline',
  historical_ot:     'castle',
  poetic:            'music-note',
  prophetic_ot:      'fire',
  major_prophets:    'fire',
  minor_prophets:    'fire',
  prophetic_major:   'fire',
  prophetic_minor:   'fire',
  gospels:           'cross',
  historical_nt:     'account-group-outline',
  pauline_epistles:  'email-outline',
  epistles_paul:     'email-outline',
  general_epistles:  'email-multiple-outline',
  epistles_general:  'email-multiple-outline',
  prophetic_nt:      'eye-outline',
};

// ─── Grid com tamanho fixo ─────────────────────────────────────────
// Usamos ScrollView + flexWrap em vez de FlatList numColumns,
// porque FlatList com numColumns sempre estica os itens da última
// linha para preencher a largura. Com flexWrap, cada item tem
// tamanho fixo e a última linha fica com itens do mesmo tamanho.

const COLS    = 5;
const H_PAD   = 16; // padding horizontal da tela
const GAP     = 8;  // espaço entre itens

// ─── Componente principal ──────────────────────────────────────────

export default function BookChaptersModal() {
  const { tokens }   = useTheme();
  const insets       = useSafeAreaInsets();
  const { width }    = useWindowDimensions();
  const { bookSlug } = useLocalSearchParams<{ bookSlug: string }>();

  const { activePlan, readChapterIds, todaySchedule } = usePlanContext();

  const book = findBook(String(bookSlug));

  const safeReadIds: ReadonlySet<string> = readChapterIds ?? new Set();

  // Tamanho fixo de cada botão — todos exatamente iguais
  const itemSize = Math.floor(
    (width - H_PAD * 2 - GAP * (COLS - 1)) / COLS,
  );

  const todayChapterNums = useMemo(() => {
    if (!todaySchedule?.chapters) return new Set<number>();
    return new Set(
      todaySchedule.chapters
        .filter(c => c.bookSlug === String(bookSlug))
        .map(c => c.chapterNumber),
    );
  }, [todaySchedule, bookSlug]);

  if (!book) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: tokens.textTertiary }}>Livro não encontrado.</Text>
      </View>
    );
  }

  const gradient = CATEGORY_GRADIENT[book.category] ?? DEFAULT_GRADIENT;
  const label    = CATEGORY_LABEL[book.category]    ?? 'Bíblico';
  const icon     = (CATEGORY_ICON[book.category]    ?? 'book-open-outline') as keyof typeof MaterialCommunityIcons.glyphMap;
  const isOT     = book.testament === 'OT';

  const chapters  = Array.from({ length: book.chapters }, (_, i) => i + 1);
  const readCount = chapters.filter(n => safeReadIds.has(`${book.slug}-${n}`)).length;
  const pct       = book.chapters > 0 ? Math.round((readCount / book.chapters) * 100) : 0;

  const openChapter = (chapter: number) => {
    router.back();
    setTimeout(() => {
      router.push({
        pathname: '/(app)/modals/chapter-reader' as any,
        params: { bookSlug: book.slug, chapter: String(chapter) },
      });
    }, 150);
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <StatusBar barStyle="light-content" />

      {/* ═══════════════════════════════════════════════════════════
          HEADER — gradiente por categoria, bordas arredondadas embaixo
      ══════════════════════════════════════════════════════════════ */}
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 4,
          paddingHorizontal: 20,
          paddingBottom: 28,
          borderRadius: 28,
          overflow: 'hidden',
          marginHorizontal: 12,
          marginTop: 12,
        }}
      >
        {/* Luzes decorativas */}
        <View pointerEvents="none" style={{ position: 'absolute', top: -30, right: -20, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', bottom: -50, left: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.05)' }} />

        {/* ── Navbar ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
          </TouchableOpacity>

          <Text style={{
            flex: 1, textAlign: 'center',
            fontSize: 13, fontWeight: '600',
            color: 'rgba(255,255,255,0.75)',
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}>
            Escolher capítulo
          </Text>

          {/* Badge AT / NT alinhado à direita */}
          <View style={{
            paddingHorizontal: 10, paddingVertical: 5,
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.22)',
          }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: 'white' }}>
              {isOT ? 'AT' : 'NT'}
            </Text>
          </View>
        </View>

        {/* ── Corpo: ícone + identidade do livro ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          {/* Ícone da categoria em caixa com vidro */}
          <View style={{
            width: 60, height: 60, borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <MaterialCommunityIcons name={icon} size={28} color="white" />
          </View>

          <View style={{ flex: 1 }}>
            {/* Abreviação discreta */}
            <Text style={{
              fontSize: 10, fontWeight: '800',
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: 2.5, textTransform: 'uppercase',
              marginBottom: 2,
            }}>
              {book.abbr}
            </Text>

            {/* Nome principal — protagonista do header */}
            <Text style={{
              fontSize: 28, fontWeight: '800', color: 'white',
              letterSpacing: -0.8, lineHeight: 32,
            }}>
              {book.name}
            </Text>

            {/* Categoria */}
            <Text style={{
              fontSize: 12, color: 'rgba(255,255,255,0.65)',
              marginTop: 3, fontWeight: '500',
            }}>
              {label}
            </Text>
          </View>
        </View>

        {/* ── Linha de stats ── */}
        <View style={{
          flexDirection: 'row', gap: 8,
          backgroundColor: 'rgba(0,0,0,0.15)',
          borderRadius: 14, padding: 12,
        }}>
          <StatPill
            icon="book-open-page-variant-outline"
            label={`${book.chapters} ${book.chapters === 1 ? 'capítulo' : 'capítulos'}`}
          />
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 2 }} />
          {activePlan && readCount > 0 ? (
            <StatPill icon="check-circle-outline" label={`${readCount} lidos · ${pct}%`} />
          ) : (
            <StatPill
              icon={isOT ? 'star-david' : 'cross-outline'}
              label={isOT ? 'Antigo Testamento' : 'Novo Testamento'}
            />
          )}
        </View>
      </LinearGradient>

      {/* ═══════════════════════════════════════════════════════════
          LEGENDA (só com plano ativo)
      ══════════════════════════════════════════════════════════════ */}
      {activePlan && (readCount > 0 || todayChapterNums.size > 0) && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 16,
          paddingHorizontal: 20, paddingVertical: 10,
          borderBottomWidth: 1, borderBottomColor: tokens.borderLight,
        }}>
          {readCount > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{
                width: 14, height: 14, borderRadius: 4,
                backgroundColor: gradient[1] + '40',
                borderWidth: 1.5, borderColor: gradient[1] + '90',
              }} />
              <Text style={{ fontSize: 12, color: tokens.textTertiary }}>Lido</Text>
            </View>
          )}
          {todayChapterNums.size > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{
                width: 14, height: 14, borderRadius: 4,
                borderWidth: 2, borderColor: '#F59E0B',
              }} />
              <Text style={{ fontSize: 12, color: tokens.textTertiary }}>Para hoje</Text>
            </View>
          )}
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════
          GRID — tamanho FIXO por item via ScrollView + flexWrap
          A última linha não estica, todos os quadradinhos têm
          exatamente itemSize × itemSize pixels.
      ══════════════════════════════════════════════════════════════ */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: H_PAD,
          paddingTop: 16,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{
          fontSize: 11, fontWeight: '700',
          color: tokens.textTertiary,
          textTransform: 'uppercase', letterSpacing: 1,
          marginBottom: 10,
        }}>
          Capítulos
        </Text>

        {/* Linha de chips: flexWrap alinha à esquerda sem esticar */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
          {chapters.map(n => {
            const chapterId = `${book.slug}-${n}`;
            const isRead    = safeReadIds.has(chapterId);
            const isToday   = todayChapterNums.has(n);

            return (
              <TouchableOpacity
                key={n}
                onPress={() => openChapter(n)}
                activeOpacity={0.75}
                style={{
                  width:  itemSize,
                  height: itemSize,
                  borderRadius: 14,
                  overflow: 'hidden',
                  borderWidth:  isToday ? 2   : 1,
                  borderColor:  isToday
                    ? '#F59E0B'
                    : isRead
                    ? gradient[1] + '70'
                    : tokens.borderLight,
                }}
              >
                {isRead ? (
                  <LinearGradient
                    colors={[gradient[1] + '35', gradient[2] + '18']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: gradient[1] }}>{n}</Text>
                    <MaterialCommunityIcons name="check" size={11} color={gradient[1]} />
                  </LinearGradient>
                ) : (
                  <View style={{
                    flex: 1,
                    backgroundColor: tokens.bgCard,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isToday && (
                      <View style={{
                        position: 'absolute', top: 5, right: 5,
                        width: 6, height: 6, borderRadius: 3,
                        backgroundColor: '#F59E0B',
                      }} />
                    )}
                    <Text style={{
                      fontSize: 14,
                      fontWeight: isToday ? '800' : '500',
                      color: isToday ? '#F59E0B' : tokens.textSecondary,
                    }}>
                      {n}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── StatPill — pill de estatística dentro do header ──────────────

function StatPill({ icon, label }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <MaterialCommunityIcons name={icon} size={13} color="rgba(255,255,255,0.75)" />
      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600', flexShrink: 1 }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}