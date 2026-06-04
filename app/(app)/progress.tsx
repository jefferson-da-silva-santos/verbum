/**
 * VERBUM — app/(app)/progress.tsx  [POLISH]
 * Remove paddingTop: 60 → paddingTop: 12
 */

import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme }     from '../../src/context/ThemeContext';
import { useProgress }  from '../../src/hooks/useProgress';
import { useStreak }    from '../../src/hooks/useStreak';
import { ActivityHeatmap } from '../../src/components/charts/ActivityHeatmap';
import { ProgressDonut } from '@/src/components/charts/ProgressDonut';
import { ProgressBar } from '@/src/components/ui/ProgressBar';

export default function ProgressScreen() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  const { global: metrics, heatmap, planMetrics, refresh } = useProgress();
  const { streak } = useStreak();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refresh(); setRefreshing(false);
  }, [refresh]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bgPrimary }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.actionPrimary} />}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 48 }}
    >
      {/* Título */}
      <Text style={{ fontSize: 22, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary, paddingHorizontal: 20, marginBottom: 20 }}>
        Progresso
      </Text>

      {/* Donut */}
      <View style={{ alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <ProgressDonut percent={metrics?.globalPercent ?? 0} size={130} label="da Bíblia" />
        <Text style={{ fontSize: 13, color: tokens.textTertiary }}>
          {metrics?.chaptersRead ?? 0} de 1.189 capítulos lidos
        </Text>
      </View>

      {/* Streak */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 20 }}>
        {[
          { label: 'Streak atual', value: String(streak?.currentStreak ?? 0), unit: 'dias',       icon: 'fire',           color: tokens.streakIcon },
          { label: 'Maior streak', value: String(streak?.longestStreak  ?? 0), unit: 'dias',       icon: 'trophy-outline', color: tokens.warning },
          { label: 'Dias ativos',  value: String(metrics?.totalReadDays  ?? 0), unit: 'dias lidos', icon: 'calendar-check', color: tokens.success },
        ].map(m => (
          <View key={m.label} style={{ flex: 1, backgroundColor: tokens.bgCard, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: tokens.borderLight, gap: 4, alignItems: 'center' }}>
            <MaterialCommunityIcons name={m.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={m.color} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: tokens.textPrimary }}>{m.value}</Text>
            <Text style={{ fontSize: 10, color: tokens.textTertiary, textAlign: 'center' }}>{m.unit}</Text>
          </View>
        ))}
      </View>

      {/* AT/NT */}
      <View style={{ paddingHorizontal: 16, marginBottom: 20, gap: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>Por Testamento</Text>
        {[
          { label: 'Antigo Testamento', value: metrics?.otPercent ?? 0, total: 929,  read: metrics?.otChaptersRead ?? 0 },
          { label: 'Novo Testamento',   value: metrics?.ntPercent ?? 0, total: 260,  read: metrics?.ntChaptersRead ?? 0 },
        ].map(t => (
          <View key={t.label} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: tokens.textPrimary }}>{t.label}</Text>
              <Text style={{ fontSize: 13, color: tokens.textTertiary }}>{t.read}/{t.total}</Text>
            </View>
            <ProgressBar value={t.value} />
          </View>
        ))}
      </View>

      {/* Heatmap */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, marginBottom: 10 }}>
          Atividade — últimos 365 dias
        </Text>
        <ActivityHeatmap cells={heatmap} cellSize={11} />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4, paddingHorizontal: 20, marginTop: 6 }}>
          <Text style={{ fontSize: 10, color: tokens.textDisabled }}>menos</Text>
          {[tokens.heatmap0, tokens.heatmap1, tokens.heatmap2, tokens.heatmap3, tokens.heatmap4].map((c, i) => (
            <View key={i} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }} />
          ))}
          <Text style={{ fontSize: 10, color: tokens.textDisabled }}>mais</Text>
        </View>
      </View>

      {/* Plano ativo */}
      {planMetrics && (
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>Plano Ativo</Text>
          <View style={{ backgroundColor: tokens.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: tokens.borderLight, gap: 10 }}>
            <ProgressBar value={planMetrics.percentComplete} showLabel />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: tokens.textTertiary }}>{planMetrics.chaptersRead} / {planMetrics.totalChapters} capítulos</Text>
              <Text style={{ fontSize: 13, color: planMetrics.isOnTrack ? tokens.success : tokens.warning }}>
                {planMetrics.isOnTrack ? '✓ Em dia' : '⚠ Atrasado'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}