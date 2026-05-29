/**
 * VERBUM — Charts: ReadingBarChart
 *
 * Gráfico de barras verticais mostrando capítulos lidos por dia
 * nos últimos N dias. Implementado com Views puras (sem SVG).
 * Adequado para a ProgressScreen e HomeScreen.
 */

import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { HeatmapEntry } from '@/src/database/types';

interface ReadingBarChartProps {
  /** Dados de atividade diária */
  entries: HeatmapEntry[];
  /** Número de dias a exibir (padrão: 14) */
  days?: number;
  /** Altura máxima das barras em pixels (padrão: 80) */
  maxBarHeight?: number;
  /** Mostrar labels de data abaixo (padrão: true) */
  showLabels?: boolean;
}

export function ReadingBarChart({
  entries,
  days = 14,
  maxBarHeight = 80,
  showLabels = true,
}: ReadingBarChartProps) {
  const { tokens } = useTheme();

  // Tomar os últimos N dias
  const slice = entries.slice(-days);
  if (slice.length === 0) {
    return (
      <View style={{ height: maxBarHeight + 40, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, color: tokens.textDisabled }}>Sem dados de leitura ainda.</Text>
      </View>
    );
  }

  const maxValue = Math.max(...slice.map(e => e.chaptersRead), 1);
  const barWidth = 20;
  const gap = 6;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap }}>
        {slice.map((entry, i) => {
          const height = Math.max(4, Math.round((entry.chaptersRead / maxValue) * maxBarHeight));
          const isToday = entry.date === new Date().toISOString().slice(0, 10);
          const isEmpty = entry.chaptersRead === 0;

          // Label da data: mostrar apenas a cada 3 barras + primeira + última
          const showDate = showLabels && (i === 0 || i === slice.length - 1 || i % 3 === 0);
          const dayNum = parseInt(entry.date.slice(8), 10);

          return (
            <View key={entry.date} style={{ alignItems: 'center', gap: 4, width: barWidth }}>
              {/* Valor acima da barra */}
              {entry.chaptersRead > 0 && (
                <Text style={{ fontSize: 9, color: tokens.textTertiary, fontWeight: '600' }}>
                  {entry.chaptersRead}
                </Text>
              )}

              {/* Barra */}
              <View style={{ width: barWidth, height: maxBarHeight, justifyContent: 'flex-end' }}>
                <View style={{
                  width: barWidth,
                  height: isEmpty ? 3 : height,
                  borderRadius: 4,
                  backgroundColor: isEmpty
                    ? tokens.heatmap0
                    : isToday
                      ? tokens.actionPrimary
                      : tokens.heatmap3,
                }} />
              </View>

              {/* Label de data */}
              {showLabels && (
                <Text style={{
                  fontSize: 9,
                  color: isToday ? tokens.actionPrimary : tokens.textDisabled,
                  fontWeight: isToday ? '700' : '400',
                  textAlign: 'center',
                }}>
                  {showDate ? String(dayNum) : ''}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}