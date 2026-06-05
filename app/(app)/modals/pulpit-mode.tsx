/**
 * VERBUM — app/(app)/modals/pulpit-mode.tsx  [REDESENHADO]
 *
 * Modo Púlpito para pregadores.
 *
 * Melhorias nesta versão:
 *   1. AppHeader oculto via detecção de rota no _layout.tsx
 *   2. Extração defensiva do texto — trata TODOS os formatos da API
 *   3. Fallback: se o versículo individual falhar, busca pelo capítulo
 *   4. UI profissional: fundo escuro, fonte grande, animações suaves
 *   5. Gestos de swipe + toque nas metades esquerda/direita da tela
 *   6. Auto-hide dos controles após 4s de inatividade
 *   7. Fonte ajustável (A- / A+) pelo pregador durante a apresentação
 *   8. KeepAwake para a tela não apagar durante a pregação
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  PanResponder, Dimensions, StatusBar, ScrollView,
} from 'react-native';
import { useSafeAreaInsets }            from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons }       from '@expo/vector-icons';
import * as KeepAwake                   from 'expo-keep-awake';

import { useAuthContext } from '../../../src/context/AuthContext';
import { BibleApiClient } from '../../../src/api/bibliaApi';

const { width: W, height: H } = Dimensions.get('window');

// ─── Cores do tema escuro do púlpito ──────────────────────────────

const C = {
  bg:         '#0A0A0A',
  bgOverlay:  'rgba(0,0,0,0.7)',
  gold:       '#C4975A',
  goldDim:    '#7A5A30',
  text:       '#F0EAD6',
  textDim:    'rgba(240,234,214,0.55)',
  divider:    'rgba(196,151,90,0.20)',
  dot:        '#2A2A2A',
  dotActive:  '#C4975A',
  btn:        'rgba(255,255,255,0.08)',
  btnBorder:  'rgba(255,255,255,0.12)',
};

// ─── Tipos ────────────────────────────────────────────────────────

interface Slide {
  bookSlug:  string;
  chapter:   number;
  verse:     number;
  reference: string;
  text:      string;
  status:    'loading' | 'ready' | 'error';
}

// ─── Extração defensiva de texto ──────────────────────────────────
// A BIBLIAAPI retorna o versículo em vários formatos possíveis.

function extractVerseText(raw: unknown): string {
  if (!raw || typeof raw !== 'object') return '';
  const r = raw as Record<string, any>;

  // Formatos possíveis (mais comuns primeiro):
  const text =
    r.text               ??  // { text: "..." }
    r.verse?.text        ??  // { verse: { text: "..." } }
    r.data?.text         ??  // { data: { text: "..." } }
    r.verses?.[0]?.text  ??  // { verses: [{ text: "..." }] }
    r.chapter?.verses?.[0]?.text ?? // { chapter: { verses: [...] } }
    '';

  return String(text).trim();
}

function extractReference(raw: unknown, fallback: string): string {
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Record<string, any>;

  const bookName =
    r.book?.name              ??
    r.book?.abbrev?.pt        ??
    (typeof r.book === 'string' ? r.book : null) ??
    null;

  if (!bookName) return fallback;

  const chapter = r.chapter?.number ?? r.chapter ?? '';
  const verse   = r.number ?? r.verse?.number ?? r.verse ?? '';

  return `${bookName} ${chapter}${verse ? `:${verse}` : ''}`;
}

// ─── Modal principal ──────────────────────────────────────────────

export default function PulpitModeModal() {
  const insets  = useSafeAreaInsets();
  const { user } = useAuthContext();
  const {
    verseRefs = '',
    title     = '',
  } = useLocalSearchParams<{ verseRefs: string; title: string }>();

  const version = ((user?.preferredVersion ?? 'acf') as string).toUpperCase();

  // Parse dos refs: "bookSlug:chapter:verse,..."
  const parsedRefs = verseRefs
    .split(',')
    .filter(Boolean)
    .map(r => {
      const parts = r.split(':');
      return {
        bookSlug: parts[0] ?? 'gn',
        chapter:  parseInt(parts[1] ?? '1', 10),
        verse:    parseInt(parts[2] ?? '1', 10),
      };
    });

  // Estado dos slides
  const [slides, setSlides] = useState<Slide[]>(
    parsedRefs.map(r => ({
      ...r,
      reference: `${r.bookSlug.toUpperCase()} ${r.chapter}:${r.verse}`,
      text:      '',
      status:    'loading',
    })),
  );

  const [current,  setCurrent]  = useState(0);
  const [fontSize, setFontSize] = useState(26);
  const [ctrlVisible, setCtrl]  = useState(true);

  const ctrlTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideAnim  = useRef(new Animated.Value(0)).current;
  const opacityCtrl = useRef(new Animated.Value(1)).current;

  // ── KeepAwake ────────────────────────────────────────────────────
  useEffect(() => {
    KeepAwake.activateKeepAwakeAsync();
    return () => { KeepAwake.deactivateKeepAwake(); };
  }, []);

  // ── Carregar versículos ──────────────────────────────────────────
  useEffect(() => {
    parsedRefs.forEach(async (ref, i) => {
      try {
        // Tenta primeiro o endpoint de versículo individual
        const raw = await BibleApiClient.getVerse(version, ref.bookSlug, ref.chapter, ref.verse);
        const text = extractVerseText(raw);

        if (text) {
          const reference = extractReference(raw, `${ref.bookSlug.toUpperCase()} ${ref.chapter}:${ref.verse}`);
          updateSlide(i, { text, reference, status: 'ready' });
          return;
        }

        // Fallback: busca o capítulo inteiro e extrai o versículo
        const chapter = await BibleApiClient.getChapterVerses(version, ref.bookSlug, ref.chapter);
        const verseObj = chapter.verses.find(v => v.number === ref.verse);

        if (verseObj?.text) {
          const refStr = `${chapter.book?.name ?? ref.bookSlug} ${ref.chapter}:${ref.verse}`;
          updateSlide(i, { text: verseObj.text, reference: refStr, status: 'ready' });
        } else {
          updateSlide(i, { text: '— versículo não encontrado —', status: 'error' });
        }
      } catch {
        updateSlide(i, { text: '— offline: versículo não disponível —', status: 'error' });
      }
    });
  }, []);

  const updateSlide = (i: number, patch: Partial<Slide>) => {
    setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  };

  // ── Controles de UI ──────────────────────────────────────────────

  const showControls = useCallback(() => {
    if (!ctrlVisible) {
      setCtrl(true);
      Animated.timing(opacityCtrl, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
    if (ctrlTimer.current) clearTimeout(ctrlTimer.current);
    ctrlTimer.current = setTimeout(() => {
      Animated.timing(opacityCtrl, { toValue: 0, duration: 400, useNativeDriver: true }).start(
        () => setCtrl(false),
      );
    }, 4000);
  }, [ctrlVisible, opacityCtrl]);

  useEffect(() => { showControls(); }, []);

  // ── Navegação entre slides ────────────────────────────────────────

  const animSlide = (direction: 'left' | 'right', onMid: () => void) => {
    const toVal = direction === 'left' ? -W : W;
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: toVal, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      onMid();
      slideAnim.setValue(-toVal);
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    });
  };

  const goNext = useCallback(() => {
    if (current >= slides.length - 1) return;
    animSlide('left', () => setCurrent(c => c + 1));
    showControls();
  }, [current, slides.length, showControls]);

  const goPrev = useCallback(() => {
    if (current <= 0) return;
    animSlide('right', () => setCurrent(c => c - 1));
    showControls();
  }, [current, showControls]);

  // ── Gestos de swipe ───────────────────────────────────────────────

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -50 && Math.abs(g.dy) < 80)       goNext();
      else if (g.dx > 50 && Math.abs(g.dy) < 80)   goPrev();
      else                                           showControls();
    },
  });

  // ── Toque nas metades esquerda/direita ────────────────────────────

  const handleTapLeft  = () => { showControls(); if (current > 0) goPrev(); };
  const handleTapRight = () => { showControls(); if (current < slides.length - 1) goNext(); };

  const slide  = slides[current];
  const isLast = current === slides.length - 1;

  // ─────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }} {...panResponder.panHandlers}>
      <StatusBar hidden />

      {/* Zonas de toque lateral (nav sem UI) */}
      <TouchableOpacity
        onPress={handleTapLeft}
        activeOpacity={1}
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: W * 0.3, zIndex: 1 }}
      />
      <TouchableOpacity
        onPress={handleTapRight}
        activeOpacity={1}
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: W * 0.3, zIndex: 1 }}
      />

      {/* ── CONTEÚDO DO SLIDE ── */}
      <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, transform: [{ translateX: slideAnim }] }}>

        {slide.status === 'loading' ? (
          <View style={{ alignItems: 'center', gap: 16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: C.gold, borderTopColor: 'transparent' }} />
            <Text style={{ fontSize: 14, color: C.goldDim, letterSpacing: 1 }}>
              Carregando…
            </Text>
          </View>
        ) : (
          <View style={{ width: '100%', gap: 28, alignItems: 'center' }}>
            {/* Referência */}
            <Text style={{
              fontSize:      13,
              fontWeight:    '700',
              color:         C.gold,
              letterSpacing: 3,
              textTransform: 'uppercase',
              textAlign:     'center',
            }}>
              {slide.reference}
            </Text>

            {/* Linha decorativa */}
            <View style={{ width: 48, height: 1, backgroundColor: C.divider }} />

            {/* Texto do versículo */}
            <Text style={{
              fontSize:   fontSize,
              color:      slide.status === 'error' ? C.goldDim : C.text,
              textAlign:  'center',
              lineHeight: fontSize * 1.7,
              fontFamily: 'serif',
              fontStyle:  'italic',
            }}>
              {slide.text}
            </Text>

            {/* Linha decorativa inferior */}
            <View style={{ width: 48, height: 1, backgroundColor: C.divider }} />

            {/* Versão */}
            <Text style={{ fontSize: 11, color: C.goldDim, letterSpacing: 2 }}>
              {version}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* ── INDICADORES DE PROGRESSO ── */}
      <View style={{
        flexDirection:  'row',
        justifyContent: 'center',
        gap:            8,
        paddingBottom:  insets.bottom + 20,
      }}>
        {slides.map((s, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              const dir = i > current ? 'left' : 'right';
              animSlide(dir, () => setCurrent(i));
              showControls();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
          >
            <View style={{
              width:           i === current ? 28 : 8,
              height:          8,
              borderRadius:    4,
              backgroundColor: i === current
                ? C.dotActive
                : s.status === 'ready'
                  ? '#3A3A2A'
                  : C.dot,
            }} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── OVERLAY DE CONTROLES (auto-hide) ── */}
      {ctrlVisible && (
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: opacityCtrl }]} pointerEvents="box-none">

          {/* Header */}
          <View style={{
            position:        'absolute',
            top:             insets.top + 8,
            left:            0,
            right:           0,
            flexDirection:   'row',
            alignItems:      'center',
            paddingHorizontal: 16,
            gap:             12,
          }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 10, backgroundColor: C.bgOverlay, borderRadius: 20 }}
            >
              <MaterialCommunityIcons name="close" size={20} color="white" />
            </TouchableOpacity>

            <Text style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' }} numberOfLines={1}>
              {decodeURIComponent(String(title))}
            </Text>

            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              {current + 1} / {slides.length}
            </Text>
          </View>

          {/* Controles de fonte e navegação — barra inferior */}
          <View style={{
            position:        'absolute',
            bottom:          insets.bottom + 52,
            left:            0,
            right:           0,
            flexDirection:   'row',
            justifyContent:  'center',
            alignItems:      'center',
            gap:             12,
          }}>
            {/* Prev */}
            <TouchableOpacity
              onPress={goPrev}
              disabled={current === 0}
              style={{ opacity: current === 0 ? 0.2 : 1, backgroundColor: C.bgOverlay, borderRadius: 24, padding: 12, borderWidth: 1, borderColor: C.btnBorder }}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color="white" />
            </TouchableOpacity>

            {/* Tamanho da fonte */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bgOverlay, borderRadius: 24, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: C.btnBorder }}>
              <TouchableOpacity onPress={() => setFontSize(s => Math.max(16, s - 2))} style={{ padding: 4 }}>
                <Text style={{ fontSize: 14, color: 'white', fontWeight: '700', lineHeight: 18 }}>A−</Text>
              </TouchableOpacity>
              <View style={{ width: 1, height: 16, backgroundColor: C.btnBorder, marginHorizontal: 4 }} />
              <TouchableOpacity onPress={() => setFontSize(s => Math.min(48, s + 2))} style={{ padding: 4 }}>
                <Text style={{ fontSize: 18, color: 'white', fontWeight: '700', lineHeight: 22 }}>A+</Text>
              </TouchableOpacity>
            </View>

            {/* Next */}
            <TouchableOpacity
              onPress={goNext}
              disabled={isLast}
              style={{ opacity: isLast ? 0.2 : 1, backgroundColor: C.bgOverlay, borderRadius: 24, padding: 12, borderWidth: 1, borderColor: C.btnBorder }}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color="white" />
            </TouchableOpacity>
          </View>

        </Animated.View>
      )}
    </View>
  );
}

// ─── Fix de import de StyleSheet ─────────────────────────────────

import { StyleSheet } from 'react-native';