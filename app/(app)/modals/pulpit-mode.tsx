/**
 * VERBUM — app/(app)/modals/pulpit-mode.tsx  [v2 — apresentação estruturada]
 *
 * MUDANÇA PRINCIPAL: antes só recebia `verseRefs` + `title` pela URL e
 * mostrava apenas os versículos. Agora recebe `sermonId`, busca o
 * sermão completo (SermonRepository.findWithVerses) e monta uma
 * sequência de slides cobrindo TODO o conteúdo:
 *
 *   Capa → Versículos → Contexto → Estrutura → Outline → Exegese → Aplicação
 *
 * (essa é a mesma ordem das abas no editor, para manter consistência
 * entre "como você organiza" e "como você apresenta")
 *
 * Seções vazias são automaticamente puladas — só entram slides com
 * conteúdo real.
 *
 * Mantém 100% das interações já existentes: swipe, toque nas laterais,
 * fonte ajustável, auto-hide dos controles, KeepAwake.
 *
 * NOVO: barra de navegação rápida por seção no topo (quando os
 * controles estão visíveis) — permite saltar direto para "Aplicação"
 * sem precisar passar por todos os versículos, por exemplo.
 *
 * Retrocompatibilidade: se a navegação vier só com `verseRefs`+`title`
 * (sem sermonId), continua funcionando como antes — só com os
 * versículos.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  PanResponder, Dimensions, StatusBar, ScrollView, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets }            from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons }       from '@expo/vector-icons';
import * as KeepAwake                   from 'expo-keep-awake';

import { useAuthContext }   from '../../../src/context/AuthContext';
import { BibleApiClient }   from '../../../src/api/bibliaApi';
import { SermonRepository } from '../../../src/database/repositories/SermonRepository';

// Definido localmente para não importar de outro arquivo de ROTA
// (sermon-editor.tsx) — o Expo Router trata arquivos em app/ como
// páginas, então cruzar imports entre eles não é recomendado.
// Idealmente, mova esta interface para src/database/featureTypes.ts
// e importe dela nos dois arquivos.
export interface SermonOutlineItem {
  id:    string;
  level: 0 | 1;
  text:  string;
}

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

// ─── Tipos de slide ─────────────────────────────────────────────────

type SectionKind = 'cover' | 'verse' | 'context' | 'structure' | 'outline' | 'exegesis' | 'application';

interface BaseSlide { kind: SectionKind; }

interface CoverSlide extends BaseSlide {
  kind: 'cover';
  title: string;
  passageRef: string;
}

interface VerseSlide extends BaseSlide {
  kind: 'verse';
  bookSlug: string;
  chapter: number;
  verse: number;
  reference: string;
  text: string;
  status: 'loading' | 'ready' | 'error';
}

interface TextSectionSlide extends BaseSlide {
  kind: 'context' | 'structure' | 'exegesis' | 'application';
  heading: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  body: string;
}

interface OutlineSlide extends BaseSlide {
  kind: 'outline';
  items: SermonOutlineItem[];
}

type Slide = CoverSlide | VerseSlide | TextSectionSlide | OutlineSlide;

const SECTION_META: Record<Exclude<SectionKind, 'cover' | 'verse'>, { heading: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  context:     { heading: 'Contexto',  icon: 'history' },
  structure:   { heading: 'Estrutura', icon: 'format-list-bulleted' },
  outline:     { heading: 'Outline',   icon: 'format-list-numbered' },
  exegesis:    { heading: 'Exegese',   icon: 'magnify' },
  application: { heading: 'Aplicação', icon: 'heart-outline' },
};

// Ícone usado na barra de navegação rápida por seção
const JUMP_ICON: Record<SectionKind, keyof typeof MaterialCommunityIcons.glyphMap> = {
  cover: 'flag-outline',
  verse: 'book-open-variant',
  context: 'history',
  structure: 'format-list-bulleted',
  outline: 'format-list-numbered',
  exegesis: 'magnify',
  application: 'heart-outline',
};

// ─── Extração defensiva de texto de versículo ────────────────────

function extractVerseText(raw: unknown): string {
  if (!raw || typeof raw !== 'object') return '';
  const r = raw as Record<string, any>;
  const text =
    r.text ?? r.verse?.text ?? r.data?.text ?? r.verses?.[0]?.text ??
    r.chapter?.verses?.[0]?.text ?? '';
  return String(text).trim();
}

function extractReference(raw: unknown, fallback: string): string {
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Record<string, any>;
  const bookName = r.book?.name ?? r.book?.abbrev?.pt ?? (typeof r.book === 'string' ? r.book : null) ?? null;
  if (!bookName) return fallback;
  const chapter = r.chapter?.number ?? r.chapter ?? '';
  const verse   = r.number ?? r.verse?.number ?? r.verse ?? '';
  return `${bookName} ${chapter}${verse ? `:${verse}` : ''}`;
}

// ─── Modal principal ──────────────────────────────────────────────

export default function PulpitModeModal() {
  const insets   = useSafeAreaInsets();
  const { user } = useAuthContext();
  const {
    sermonId  = '',
    verseRefs = '',
    title     = '',
  } = useLocalSearchParams<{ sermonId: string; verseRefs: string; title: string }>();

  const version = ((user?.preferredVersion ?? 'acf') as string).toUpperCase();

  const [slides,      setSlides]      = useState<Slide[]>([]);
  const [isBuilding,  setIsBuilding]  = useState(true);
  const [current,     setCurrent]     = useState(0);
  const [fontSize,    setFontSize]    = useState(26);
  const [ctrlVisible, setCtrl]        = useState(true);
  const [showJumpBar, setShowJumpBar] = useState(false);

  const ctrlTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideAnim   = useRef(new Animated.Value(0)).current;
  const opacityCtrl = useRef(new Animated.Value(1)).current;

  // ── KeepAwake ────────────────────────────────────────────────────
  useEffect(() => {
    KeepAwake.activateKeepAwakeAsync();
    return () => { KeepAwake.deactivateKeepAwake(); };
  }, []);

  // ── Monta os slides ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setIsBuilding(true);
      const built: Slide[] = [];

      if (sermonId) {
        // ── Caminho novo: sermão completo ──
        const sermon = await SermonRepository.findWithVerses(String(sermonId));
        if (!sermon) { setIsBuilding(false); return; }

        built.push({ kind: 'cover', title: sermon.title ?? 'Sermão', passageRef: sermon.passageRef ?? '' });

        // Versículos
        sermon.verses.forEach(v => {
          built.push({
            kind: 'verse',
            bookSlug: v.bookSlug, chapter: v.chapter, verse: v.verse,
            reference: `${v.bookName} ${v.chapter}:${v.verse}`,
            text: v.verseText ?? '',
            status: v.verseText ? 'ready' : 'loading',
          });
        });

        // Seções de texto, na mesma ordem das abas do editor
        const rawOutline = (sermon as any).outline;
        const outlineItems: SermonOutlineItem[] = Array.isArray(rawOutline) ? rawOutline : [];

        if (sermon.contextNotes?.trim())
          built.push({ kind: 'context', ...SECTION_META.context, body: sermon.contextNotes });
        if (sermon.structureNotes?.trim())
          built.push({ kind: 'structure', ...SECTION_META.structure, body: sermon.structureNotes });
        if (sermon.exegesisNotes?.trim())
          built.push({ kind: 'exegesis', ...SECTION_META.exegesis, body: sermon.exegesisNotes });
        if (outlineItems.length > 0)
          built.push({ kind: 'outline', items: outlineItems });
        if (sermon.applicationNotes?.trim())
          built.push({ kind: 'application', ...SECTION_META.application, body: sermon.applicationNotes });

      } else if (verseRefs) {
        // ── Caminho legado: só versículos por query string ──
        const parsed = String(verseRefs).split(',').filter(Boolean).map(r => {
          const parts = r.split(':');
          return { bookSlug: parts[0] ?? 'gn', chapter: parseInt(parts[1] ?? '1', 10), verse: parseInt(parts[2] ?? '1', 10) };
        });
        parsed.forEach(r => {
          built.push({
            kind: 'verse', bookSlug: r.bookSlug, chapter: r.chapter, verse: r.verse,
            reference: `${r.bookSlug.toUpperCase()} ${r.chapter}:${r.verse}`,
            text: '', status: 'loading',
          });
        });
      }

      setSlides(built);
      setIsBuilding(false);
    })();
  }, [sermonId, verseRefs]);

  // ── Carrega o texto dos versículos que ainda estão vazios ─────────
  useEffect(() => {
    slides.forEach((s, i) => {
      if (s.kind !== 'verse' || s.status !== 'loading') return;
      (async () => {
        try {
          const raw = await BibleApiClient.getVerse(version, s.bookSlug, s.chapter, s.verse);
          const text = extractVerseText(raw);
          if (text) {
            const reference = extractReference(raw, s.reference);
            updateSlide(i, { text, reference, status: 'ready' });
            return;
          }
          const chapter = await BibleApiClient.getChapterVerses(version, s.bookSlug, s.chapter);
          const verseObj = chapter.verses.find((v: any) => v.number === s.verse);
          if (verseObj?.text) {
            updateSlide(i, { text: verseObj.text, status: 'ready' });
          } else {
            updateSlide(i, { text: '— versículo não encontrado —', status: 'error' });
          }
        } catch {
          updateSlide(i, { text: '— offline: versículo não disponível —', status: 'error' });
        }
      })();
    });
  }, [slides.length]);

  const updateSlide = (i: number, patch: Partial<VerseSlide>) => {
    setSlides(prev => prev.map((s, idx) => (idx === i && s.kind === 'verse') ? { ...s, ...patch } : s));
  };

  // ── Controles de UI ──────────────────────────────────────────────

  const showControls = useCallback(() => {
    if (!ctrlVisible) {
      setCtrl(true);
      Animated.timing(opacityCtrl, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
    if (ctrlTimer.current) clearTimeout(ctrlTimer.current);
    ctrlTimer.current = setTimeout(() => {
      Animated.timing(opacityCtrl, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => setCtrl(false));
    }, 4500);
  }, [ctrlVisible, opacityCtrl]);

  useEffect(() => { showControls(); }, []);

  // ── Navegação ──────────────────────────────────────────────────────

  const animSlide = (direction: 'left' | 'right', onMid: () => void) => {
    const toVal = direction === 'left' ? -W : W;
    Animated.timing(slideAnim, { toValue: toVal, duration: 220, useNativeDriver: true }).start(() => {
      onMid();
      slideAnim.setValue(-toVal);
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    });
  };

  const goToIndex = useCallback((i: number) => {
    if (i < 0 || i >= slides.length || i === current) return;
    animSlide(i > current ? 'left' : 'right', () => setCurrent(i));
    showControls();
  }, [current, slides.length, showControls]);

  const goNext = useCallback(() => goToIndex(current + 1), [current, goToIndex]);
  const goPrev = useCallback(() => goToIndex(current - 1), [current, goToIndex]);

  // Salta para o primeiro slide de um tipo de seção (navegação rápida)
  const jumpToKind = useCallback((kind: SectionKind) => {
    const idx = slides.findIndex(s => s.kind === kind);
    if (idx >= 0) goToIndex(idx);
  }, [slides, goToIndex]);

  // ── Gestos ───────────────────────────────────────────────────────

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -50 && Math.abs(g.dy) < 80)      goNext();
      else if (g.dx > 50 && Math.abs(g.dy) < 80)  goPrev();
      else                                          showControls();
    },
  });

  const handleTapLeft  = () => { showControls(); if (current > 0) goPrev(); };
  const handleTapRight = () => { showControls(); if (current < slides.length - 1) goNext(); };

  const slide  = slides[current];
  const isLast = current === slides.length - 1;

  // Seções distintas presentes neste sermão (para a barra de navegação rápida)
  const distinctSections = Array.from(new Set(slides.map(s => s.kind))).filter(k => k !== 'verse' || slides.filter(s => s.kind === 'verse').length > 0);

  // ── Estado de carregamento geral (montando slides) ─────────────────

  if (isBuilding) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <StatusBar hidden />
        <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: C.gold, borderTopColor: 'transparent' }} />
        <Text style={{ fontSize: 14, color: C.goldDim, letterSpacing: 1 }}>Preparando apresentação…</Text>
      </View>
    );
  }

  if (slides.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
        <StatusBar hidden />
        <MaterialCommunityIcons name="text-box-remove-outline" size={48} color={C.goldDim} />
        <Text style={{ fontSize: 15, color: C.text, textAlign: 'center' }}>Este sermão ainda não tem conteúdo para apresentar.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 8, backgroundColor: C.bgOverlay, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24 }}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }} {...panResponder.panHandlers}>
      <StatusBar hidden />

      {/* Zonas de toque lateral */}
      <TouchableOpacity onPress={handleTapLeft} activeOpacity={1} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: W * 0.28, zIndex: 1 }} />
      <TouchableOpacity onPress={handleTapRight} activeOpacity={1} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: W * 0.28, zIndex: 1 }} />

      {/* ── CONTEÚDO DO SLIDE ── */}
      <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, transform: [{ translateX: slideAnim }] }}>
        {renderSlide(slide, fontSize, version)}
      </Animated.View>

      {/* ── DOTS DE PROGRESSO ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: insets.bottom + 18, paddingHorizontal: 20, flexWrap: 'wrap' }}>
        {slides.map((s, i) => (
          <TouchableOpacity key={i} onPress={() => goToIndex(i)} hitSlop={{ top: 10, bottom: 10, left: 3, right: 3 }}>
            <View style={{
              width: i === current ? 22 : 7, height: 7, borderRadius: 4,
              backgroundColor: i === current ? C.dotActive : '#3A3A2A',
            }} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── OVERLAY DE CONTROLES ── */}
      {ctrlVisible && (
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: opacityCtrl }]} pointerEvents="box-none">

          {/* Header */}
          <View style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 10, backgroundColor: C.bgOverlay, borderRadius: 20 }}>
              <MaterialCommunityIcons name="close" size={20} color="white" />
            </TouchableOpacity>

            <Text style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' }} numberOfLines={1}>
              {decodeURIComponent(String(title)) || (slide.kind === 'cover' ? slide.title : '')}
            </Text>

            <TouchableOpacity onPress={() => setShowJumpBar(v => !v)} style={{ padding: 10, backgroundColor: showJumpBar ? C.gold : C.bgOverlay, borderRadius: 20 }}>
              <MaterialCommunityIcons name="view-grid-outline" size={18} color={showJumpBar ? '#1A1208' : 'white'} />
            </TouchableOpacity>

            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              {current + 1} / {slides.length}
            </Text>
          </View>

          {/* Barra de navegação rápida por seção */}
          {showJumpBar && (
            <View style={{
              position: 'absolute', top: insets.top + 56, left: 16, right: 16,
              flexDirection: 'row', flexWrap: 'wrap', gap: 8,
              backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 16, padding: 12,
              borderWidth: 1, borderColor: C.btnBorder,
            }}>
              {distinctSections.map(kind => {
                const isActive = slide.kind === kind;
                const label =
                  kind === 'cover' ? 'Capa' :
                  kind === 'verse' ? 'Versículos' :
                  SECTION_META[kind as Exclude<SectionKind, 'cover' | 'verse'>]?.heading ?? kind;
                return (
                  <TouchableOpacity
                    key={kind}
                    onPress={() => { jumpToKind(kind); setShowJumpBar(false); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
                      backgroundColor: isActive ? C.gold : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <MaterialCommunityIcons name={JUMP_ICON[kind]} size={14} color={isActive ? '#1A1208' : C.text} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: isActive ? '#1A1208' : C.text }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Controles inferiores */}
          <View style={{ position: 'absolute', bottom: insets.bottom + 52, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={goPrev} disabled={current === 0} style={{ opacity: current === 0 ? 0.2 : 1, backgroundColor: C.bgOverlay, borderRadius: 24, padding: 12, borderWidth: 1, borderColor: C.btnBorder }}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="white" />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bgOverlay, borderRadius: 24, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: C.btnBorder }}>
              <TouchableOpacity onPress={() => setFontSize(s => Math.max(15, s - 2))} style={{ padding: 4 }}>
                <Text style={{ fontSize: 14, color: 'white', fontWeight: '700' }}>A−</Text>
              </TouchableOpacity>
              <View style={{ width: 1, height: 16, backgroundColor: C.btnBorder, marginHorizontal: 4 }} />
              <TouchableOpacity onPress={() => setFontSize(s => Math.min(40, s + 2))} style={{ padding: 4 }}>
                <Text style={{ fontSize: 18, color: 'white', fontWeight: '700' }}>A+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={goNext} disabled={isLast} style={{ opacity: isLast ? 0.2 : 1, backgroundColor: C.bgOverlay, borderRadius: 24, padding: 12, borderWidth: 1, borderColor: C.btnBorder }}>
              <MaterialCommunityIcons name="chevron-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Renderização por tipo de slide ──────────────────────────────

function renderSlide(slide: Slide, fontSize: number, version: string) {
  switch (slide.kind) {

    case 'cover':
      return (
        <View style={{ alignItems: 'center', gap: 20 }}>
          <View style={{ width: 56, height: 1, backgroundColor: C.divider }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.gold, letterSpacing: 3, textTransform: 'uppercase' }}>
            Pregação
          </Text>
          <Text style={{ fontSize: 30, fontWeight: '700', color: C.text, textAlign: 'center', fontFamily: 'serif', lineHeight: 40 }}>
            {slide.title}
          </Text>
          {slide.passageRef ? (
            <Text style={{ fontSize: 16, color: C.textDim, letterSpacing: 1 }}>{slide.passageRef}</Text>
          ) : null}
          <View style={{ width: 56, height: 1, backgroundColor: C.divider }} />
        </View>
      );

    case 'verse':
      return (
        <View style={{ width: '100%', gap: 28, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.gold, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center' }}>
            {slide.reference}
          </Text>
          <View style={{ width: 48, height: 1, backgroundColor: C.divider }} />
          {slide.status === 'loading' ? (
            <View style={{ alignItems: 'center', gap: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: C.gold, borderTopColor: 'transparent' }} />
              <Text style={{ fontSize: 13, color: C.goldDim }}>Carregando…</Text>
            </View>
          ) : (
            <Text style={{
              fontSize, color: slide.status === 'error' ? C.goldDim : C.text,
              textAlign: 'center', lineHeight: fontSize * 1.7,
              fontFamily: 'serif', fontStyle: 'italic',
            }}>
              {slide.text}
            </Text>
          )}
          <View style={{ width: 48, height: 1, backgroundColor: C.divider }} />
          <Text style={{ fontSize: 11, color: C.goldDim, letterSpacing: 2 }}>{version}</Text>
        </View>
      );

    case 'context':
    case 'structure':
    case 'exegesis':
    case 'application':
      return (
        <View style={{ width: '100%', height: '100%', gap: 20, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name={slide.icon} size={16} color={C.gold} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.gold, letterSpacing: 3, textTransform: 'uppercase' }}>
              {slide.heading}
            </Text>
          </View>
          <View style={{ width: 48, height: 1, backgroundColor: C.divider }} />
          <ScrollView style={{ maxHeight: H * 0.55, width: '100%' }} showsVerticalScrollIndicator={false}>
            <Text style={{
              fontSize: fontSize * 0.72, color: C.text, textAlign: 'center',
              lineHeight: fontSize * 0.72 * 1.6, fontFamily: 'serif',
            }}>
              {slide.body}
            </Text>
          </ScrollView>
        </View>
      );

    case 'outline':
      return (
        <View style={{ width: '100%', height: '100%', gap: 18, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="format-list-numbered" size={16} color={C.gold} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.gold, letterSpacing: 3, textTransform: 'uppercase' }}>
              Outline
            </Text>
          </View>
          <View style={{ width: 48, height: 1, backgroundColor: C.divider }} />
          <ScrollView style={{ maxHeight: H * 0.6, width: '100%' }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 8 }}>
            {(() => {
              let mainCount = 0;
              return slide.items.map(item => {
                if (item.level === 0) mainCount += 1;
                return (
                  <View key={item.id} style={{ flexDirection: 'row', gap: 12, marginLeft: item.level === 1 ? 32 : 0, alignItems: 'flex-start' }}>
                    {item.level === 0 ? (
                      <Text style={{ fontSize: fontSize * 0.62, fontWeight: '800', color: C.gold, fontFamily: 'serif' }}>{mainCount}.</Text>
                    ) : (
                      <Text style={{ fontSize: fontSize * 0.5, color: C.goldDim }}>—</Text>
                    )}
                    <Text style={{
                      flex: 1, fontSize: item.level === 0 ? fontSize * 0.62 : fontSize * 0.5,
                      fontWeight: item.level === 0 ? '700' : '400',
                      color: item.level === 0 ? C.text : C.textDim,
                      fontFamily: 'serif', lineHeight: (item.level === 0 ? fontSize * 0.62 : fontSize * 0.5) * 1.4,
                    }}>
                      {item.text}
                    </Text>
                  </View>
                );
              });
            })()}
          </ScrollView>
        </View>
      );
  }
}