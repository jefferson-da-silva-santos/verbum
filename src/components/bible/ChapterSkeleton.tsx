/**
 * VERBUM — src/components/bible/ChapterSkeleton.tsx
 *
 * Skeleton loader profissional para o leitor de capítulos.
 * Substitui o ActivityIndicator centralizado por uma estrutura
 * que imita os versículos reais — número + linhas de texto —
 * com animação de pulse (respira entre opacidade alta e baixa).
 *
 * Uso:
 *   import { ChapterSkeleton } from '../../../src/components/bible/ChapterSkeleton';
 *   {isLoading && <ChapterSkeleton bookAbbr="Jo" chapterNum={3} />}
 */

import { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// Linhas por versículo simulado: cada sub-array é uma linha,
// o número é a largura em % da linha (para variar naturalmente).
const VERSE_LINES: number[][] = [
  [0.95, 0.88],
  [0.92, 0.75, 0.60],
  [0.98, 0.83],
  [0.70, 0.91, 0.50],
  [0.96, 0.78],
  [0.88, 0.65, 0.80],
  [0.93, 0.72],
  [0.85, 0.90, 0.40],
  [0.97, 0.68],
  [0.80, 0.55],
];

interface ChapterSkeletonProps {
  bookAbbr?: string;
  bookName?: string;
  chapterNum?: number;
}

export function ChapterSkeleton({ bookAbbr, bookName, chapterNum }: ChapterSkeletonProps) {
  const { tokens, isDark } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  // Cor base dos placeholders
  const skeletonBase = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const skeletonHigh = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.13)';

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  // FIX: Animated.View não aceita width como string genérica.
  // Solução: View normal para forma/tamanho, um único Animated.View
  // externo aplica opacity em tudo de uma vez.
  const SkeletonLine = ({ width, height = 13 }: { width: number | `${number}%`; height?: number }) => (
    <View
      style={{
        height,
        width,
        borderRadius: 6,
        backgroundColor: skeletonBase,
      }}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>

      {/* ── Header do capítulo — skeleton ── */}
      <View style={{
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: tokens.borderLight,
        gap: 10,
        alignItems: 'center',
      }}>
        {bookName ? (
          <Text style={{ fontSize: 22, fontWeight: '700', color: tokens.textPrimary, fontFamily: 'serif' }}>
            {bookName}
          </Text>
        ) : (
          <SkeletonLine width={160} height={22} />
        )}

        {bookAbbr && chapterNum ? (
          <Text style={{ fontSize: 14, fontWeight: '600', color: tokens.actionPrimary, letterSpacing: 1 }}>
            {bookAbbr} {chapterNum}
          </Text>
        ) : (
          <SkeletonLine width={80} height={14} />
        )}

        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: tokens.actionPrimary + '12',
          paddingHorizontal: 12, paddingVertical: 5,
          borderRadius: 20,
        }}>
          <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tokens.actionPrimary, opacity }} />
          <Text style={{ fontSize: 12, color: tokens.actionPrimary, fontWeight: '600' }}>
            Carregando versículos…
          </Text>
        </View>
      </View>

      {/* ── Versículos simulados — único Animated.View para opacity ── */}
      <Animated.View style={{ paddingHorizontal: 24, paddingTop: 20, gap: 20, opacity }}>
        {VERSE_LINES.map((lines, vIdx) => (
          <View key={vIdx} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
            <SkeletonLine width={20} height={13} />
            <View style={{ flex: 1, gap: 7 }}>
              {lines.map((w, lIdx) => (
                <SkeletonLine
                  key={lIdx}
                  width={`${Math.round(w * 100)}%`}
                  height={lIdx === lines.length - 1 && w < 0.75 ? 13 : 14}
                />
              ))}
            </View>
          </View>
        ))}
      </Animated.View>

    </View>
  );
}