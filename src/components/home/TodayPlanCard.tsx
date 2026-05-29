import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ProgressBar } from '../ui/ProgressBar';
import type { PlanScheduleEntry } from '../../database/types';

interface TodayPlanCardProps {
  planName: string; schedule: PlanScheduleEntry | null;
  readChapterIds: ReadonlySet<string>; percentComplete: number;
  onChapterPress: (bookSlug: string, bookName: string, chapter: number) => void;
}

export function TodayPlanCard({ planName, schedule, readChapterIds, percentComplete, onChapterPress }: TodayPlanCardProps) {
  const { tokens } = useTheme();

  if (!schedule || !schedule.isActive) {
    return (
      <View style={{ backgroundColor: tokens.bgCard, borderRadius: 16, padding: 20, marginHorizontal: 16, borderWidth: 1, borderColor: tokens.borderLight, alignItems: 'center', gap: 8 }}>
        <MaterialCommunityIcons name="check-circle-outline" size={32} color={tokens.success} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: tokens.textPrimary }}>Dia de descanso</Text>
        <Text style={{ fontSize: 13, color: tokens.textTertiary, textAlign: 'center' }}>Hoje não há leitura prevista no seu plano.</Text>
      </View>
    );
  }

  const chapters = schedule.chapters;
  const allDone = chapters.every(c => readChapterIds.has(c.chapterId));

  return (
    <View style={{ backgroundColor: tokens.bgCard, borderRadius: 16, padding: 20, marginHorizontal: 16, borderWidth: 1, borderColor: tokens.borderLight, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>Leitura de hoje</Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: tokens.textPrimary }} numberOfLines={1}>{planName}</Text>
        </View>
        {allDone && <MaterialCommunityIcons name="check-circle" size={24} color={tokens.success} />}
      </View>
      <ProgressBar value={percentComplete} showLabel />
      <View style={{ gap: 8 }}>
        {chapters.map(ch => {
          const done = readChapterIds.has(ch.chapterId);
          return (
            <TouchableOpacity key={ch.chapterId} onPress={() => onChapterPress(ch.bookSlug, ch.bookName, ch.chapterNumber)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: done ? tokens.successBg : tokens.bgSecondary, borderRadius: 10, borderWidth: 1, borderColor: done ? tokens.success : tokens.borderLight }}>
              <MaterialCommunityIcons name={done ? 'check-circle' : 'book-open-outline'} size={20} color={done ? tokens.success : tokens.iconSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: tokens.textPrimary }}>{ch.bookAbbr} {ch.chapterNumber}</Text>
                <Text style={{ fontSize: 12, color: tokens.textTertiary }}>{ch.bookName}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={tokens.iconMuted} />
            </TouchableOpacity>
          );
        })}
      </View>
      {schedule.estimatedMinutes != null && (
        <Text style={{ fontSize: 12, color: tokens.textTertiary, textAlign: 'right' }}>~{Math.round(schedule.estimatedMinutes)} min estimados</Text>
      )}
    </View>
  );
}
