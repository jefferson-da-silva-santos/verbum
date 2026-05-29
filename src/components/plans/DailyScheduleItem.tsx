
/**
 * VERBUM — Plans: DailyScheduleItem
 *
 * Item de uma linha no cronograma diário de leitura.
 * Usado na tela de detalhes do plano para mostrar o schedule completo.
 */

import { TouchableOpacity } from 'react-native';
import type { PlanScheduleEntry } from '../../database/types';
import { formatWithWeekday } from '../../utils/dateUtils';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';


interface DailyScheduleItemProps {
  entry: PlanScheduleEntry;
  readChapterIds: ReadonlySet<string>;
  onChapterPress: (bookSlug: string, bookName: string, chapter: number) => void;
  isToday?: boolean;
}

export function DailyScheduleItem({
  entry,
  readChapterIds,
  onChapterPress,
  isToday = false,
}: DailyScheduleItemProps) {
  const { tokens } = useTheme();

  if (!entry.isActive) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, opacity: 0.5 }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: tokens.bgSecondary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <MaterialCommunityIcons name="coffee-outline" size={16} color={tokens.iconMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: tokens.textTertiary }}>{formatWithWeekday(entry.date)}</Text>
          <Text style={{ fontSize: 12, color: tokens.textDisabled }}>Dia de descanso</Text>
        </View>
      </View>
    );
  }

  const chapters = entry.chapters;
  const readCount = chapters.filter(c => readChapterIds.has(c.chapterId)).length;
  const allDone = readCount === chapters.length && chapters.length > 0;
  const partialDone = readCount > 0 && !allDone;

  const dotColor = allDone
    ? tokens.success
    : partialDone
      ? tokens.warning
      : isToday
        ? tokens.actionPrimary
        : tokens.borderMedium;

  return (
    <View style={{
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: isToday ? tokens.bgSecondary : 'transparent',
      borderLeftWidth: isToday ? 3 : 0,
      borderLeftColor: tokens.actionPrimary,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        {/* Indicador de status */}
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dotColor, marginRight: 10 }} />
        <Text style={{ fontSize: 13, fontWeight: isToday ? '700' : '400', color: isToday ? tokens.textPrimary : tokens.textSecondary, flex: 1 }}>
          {formatWithWeekday(entry.date)} {isToday ? '· hoje' : ''}
        </Text>
        {entry.estimatedMinutes && (
          <Text style={{ fontSize: 11, color: tokens.textDisabled }}>~{Math.round(entry.estimatedMinutes)}min</Text>
        )}
      </View>

      {/* Capítulos */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 20 }}>
        {chapters.map(ch => {
          const done = readChapterIds.has(ch.chapterId);
          return (
            <TouchableOpacity
              key={ch.chapterId}
              onPress={() => onChapterPress(ch.bookSlug, ch.bookName, ch.chapterNumber)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 20,
                backgroundColor: done ? tokens.successBg : tokens.bgCard,
                borderWidth: 1,
                borderColor: done ? tokens.success : tokens.borderLight,
              }}
            >
              <MaterialCommunityIcons
                name={done ? 'check' : 'book-open-outline'}
                size={12}
                color={done ? tokens.success : tokens.iconMuted}
              />
              <Text style={{ fontSize: 12, fontWeight: '600', color: done ? tokens.success : tokens.textSecondary }}>
                {ch.bookAbbr} {ch.chapterNumber}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}