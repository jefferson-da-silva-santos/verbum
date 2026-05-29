/**
 * VERBUM — src/components/charts/ActivityHeatmap.tsx
 * Contém: ActivityHeatmap, ProgressDonut, PlanCard
 */

import { View, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { HeatmapCell } from '../../engine/MetricsCalculator';
// ─── ActivityHeatmap ──────────────────────────

interface ActivityHeatmapProps { cells: HeatmapCell[]; cellSize?: number; }

export function ActivityHeatmap({ cells, cellSize = 12 }: ActivityHeatmapProps) {
  const { tokens } = useTheme();
  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const gap = 2;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', gap }}>
        {weeks.map((week, wi) => (
          <View key={wi} style={{ flexDirection: 'column', gap }}>
            {week.map(cell => (
              <View key={cell.date} style={{
                width: cellSize, height: cellSize, borderRadius: 2,
                backgroundColor:
                  cell.intensity === 0 ? tokens.heatmap0 :
                    cell.intensity === 1 ? tokens.heatmap1 :
                      cell.intensity === 2 ? tokens.heatmap2 :
                        cell.intensity === 3 ? tokens.heatmap3 : tokens.heatmap4,
              }} />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}