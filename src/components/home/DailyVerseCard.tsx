/**
 * VERBUM — src/components/home/DailyVerseCard.tsx
 * Contém: DailyVerseCard, TodayPlanCard, QuickMetrics
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

// ─── DailyVerseCard ───────────────────────────

interface DailyVerseCardProps { reference: string; text: string; onPress?: () => void; }

export function DailyVerseCard({ reference, text, onPress }: DailyVerseCardProps) {
  const { tokens } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ backgroundColor: tokens.actionPrimary, borderRadius: 16, padding: 20, marginHorizontal: 16, marginTop: 8, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MaterialCommunityIcons name="star-four-points" size={14} color={tokens.streakIcon} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: tokens.actionPrimaryText, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.8 }}>Versículo do Dia</Text>
      </View>
      <Text style={{ fontSize: 17, lineHeight: 30, color: tokens.actionPrimaryText, fontFamily: 'serif', fontStyle: 'italic' }}>"{text}"</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: tokens.actionPrimaryText, opacity: 0.75, letterSpacing: 0.3 }}>— {reference}</Text>
    </TouchableOpacity>
  );
}
