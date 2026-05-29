import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import type { ReadingPlan } from '../../database/types';

interface PlanCardProps { plan: ReadingPlan; chaptersRead: number; onPress?: () => void; isActive?: boolean; }

export function PlanCard({ plan, chaptersRead, onPress, isActive = false }: PlanCardProps) {
  const { tokens } = useTheme();
  const percent = plan.totalChapters > 0 ? parseFloat(((chaptersRead / plan.totalChapters) * 100).toFixed(1)) : 0;
  const modeLabel = plan.mode === 'chapters' ? `${plan.chaptersPerDay} cap/dia` : plan.mode === 'time' ? `${plan.minutesPerDay} min/dia` : plan.targetDate ? `Meta: ${plan.targetDate.slice(0, 10)}` : '';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.84} style={{ backgroundColor: isActive ? tokens.actionPrimary : tokens.bgCard, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: isActive ? 'transparent' : tokens.borderLight, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: isActive ? tokens.actionPrimaryText : tokens.textPrimary }} numberOfLines={1}>{plan.name}</Text>
          <Text style={{ fontSize: 12, color: isActive ? tokens.actionPrimaryText : tokens.textTertiary, opacity: isActive ? 0.8 : 1 }}>{modeLabel} · {plan.totalChapters} capítulos</Text>
        </View>
        {isActive && (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: tokens.actionPrimaryText, textTransform: 'uppercase', letterSpacing: 0.8 }}>Ativo</Text>
          </View>
        )}
      </View>

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: isActive ? tokens.actionPrimaryText : tokens.textTertiary, opacity: isActive ? 0.8 : 1 }}>{chaptersRead} de {plan.totalChapters} capítulos</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? tokens.actionPrimaryText : tokens.progressText }}>{percent}%</Text>
        </View>
        <View style={{ height: 6, backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : tokens.progressBg, borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ height: 6, width: `${percent}%`, backgroundColor: isActive ? tokens.actionPrimaryText : tokens.progressFill, borderRadius: 3 }} />
        </View>
      </View>

      {plan.estimatedEndDate && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="calendar-outline" size={14} color={isActive ? tokens.actionPrimaryText : tokens.iconMuted} />
          <Text style={{ fontSize: 12, color: isActive ? tokens.actionPrimaryText : tokens.textTertiary, opacity: isActive ? 0.8 : 1 }}>Previsto: {plan.estimatedEndDate.slice(0, 10)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}