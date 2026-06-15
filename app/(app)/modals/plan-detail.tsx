/**
 * VERBUM — app/(app)/modals/plan-detail.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets }            from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons }       from '@expo/vector-icons';

import { useTheme }       from '../../../src/context/ThemeContext';
import { usePlanContext } from '../../../src/context/PlanContext';
import { planRepo }       from '../../../src/database/repositories';
import type { ReadingPlan, PlanScheduleEntry } from '../../../src/database/types';

function relDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PlanDetailModal() {
  const { tokens }  = useTheme();
  const insets      = useSafeAreaInsets();
  const { activePlan, percentComplete, readChapterIds } = usePlanContext();
  const { planId }  = useLocalSearchParams<{ planId: string }>();

  const [plan,      setPlan]      = useState<ReadingPlan | null>(null);
  const [schedule,  setSchedule]  = useState<PlanScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!planId) return;
    setIsLoading(true);
    try {
      const p = await planRepo.findById(planId);
      if (!p) return;
      setPlan(p);

      const today = new Date().toISOString().slice(0, 10);
      const end   = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
      const s     = await planRepo.getScheduleRange(planId, today, end);
      setSchedule(s.slice(0, 7));
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => { load(); }, [load]);

  const isActive  = plan?.id === activePlan?.id;
  const progress  = isActive ? percentComplete : plan?.isCompleted ? 100 : 0;
  const safeIds   = readChapterIds ?? new Set<string>();

  const handleDelete = () => {
    if (!plan) return;
    Alert.alert('Excluir plano', `Excluir "${plan.name}"? Todo progresso será perdido.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        await planRepo.delete(plan.id);
        router.back();
      }},
    ]);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={tokens.actionPrimary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: tokens.textTertiary }}>Plano não encontrado.</Text>
      </View>
    );
  }

  const statusLabel = plan.isCompleted ? 'Concluído' : isActive ? 'Ativo' : 'Pausado';
  const statusColor = plan.isCompleted ? tokens.success : isActive ? tokens.actionPrimary : tokens.textTertiary;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>

      {/* Header */}
      <View style={{
        paddingTop: 8, paddingHorizontal: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: tokens.borderLight,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: tokens.textPrimary }} numberOfLines={1}>
          {plan.name}
        </Text>
        <TouchableOpacity onPress={handleDelete} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={tokens.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>

        {/* Card de progresso */}
        <View style={{
          margin: 20, padding: 20,
          backgroundColor: isActive ? tokens.actionPrimary : tokens.bgCard,
          borderRadius: 18, borderWidth: 1,
          borderColor: isActive ? 'transparent' : tokens.borderLight,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
              backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : statusColor + '20',
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? 'white' : statusColor }}>
                {statusLabel}
              </Text>
            </View>
            <Text style={{ fontSize: 32, fontWeight: '800', color: isActive ? 'white' : tokens.actionPrimary }}>
              {Math.round(progress)}%
            </Text>
          </View>

          {/* Barra de progresso */}
          <View style={{ height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12, backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : tokens.borderLight }}>
            <View style={{ height: '100%', width: `${Math.min(100, progress)}%`, backgroundColor: isActive ? 'white' : tokens.actionPrimary, borderRadius: 4 }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: isActive ? 'rgba(255,255,255,0.7)' : tokens.textTertiary }}>
              {plan.totalChapters} capítulos · {plan.bibleVersion?.toUpperCase()}
            </Text>
            {plan.estimatedEndDate && (
              <Text style={{ fontSize: 12, color: isActive ? 'rgba(255,255,255,0.7)' : tokens.textTertiary }}>
                Conclusão: {relDate(plan.estimatedEndDate)}
              </Text>
            )}
          </View>
        </View>

        {/* Estatísticas */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 24 }}>
          {[
            { label: 'Início',      value: relDate(plan.startDate),                           icon: 'calendar-start'   as const },
            { label: 'Cap./dia',    value: plan.chaptersPerDay ? `${plan.chaptersPerDay}` : '—', icon: 'book-open-variant' as const },
            { label: 'Recalibrações', value: String(plan.recalibrationCount ?? 0),            icon: 'refresh'           as const },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: tokens.bgCard, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: tokens.borderLight }}>
              <MaterialCommunityIcons name={s.icon} size={20} color={tokens.actionPrimary} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.textPrimary }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: tokens.textTertiary, textAlign: 'center' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Próximas leituras */}
        {schedule.length > 0 && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
              Próximas leituras
            </Text>
            <View style={{ gap: 8 }}>
              {schedule.map(entry => {
                const allRead  = entry.chapters.every(ch => safeIds.has(`${ch.bookSlug}-${ch.chapterNumber}`));
                const isToday  = entry.date === new Date().toISOString().slice(0, 10);
                const dateStr  = new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

                return (
                  <View key={entry.id} style={{
                    backgroundColor: isToday ? tokens.actionPrimary + '12' : tokens.bgCard,
                    borderRadius: 12, padding: 14,
                    borderWidth: 1, borderColor: isToday ? tokens.actionPrimary + '40' : tokens.borderLight,
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                  }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: allRead ? tokens.successBg : isToday ? tokens.actionPrimary : tokens.bgSecondary,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MaterialCommunityIcons
                        name={allRead ? 'check' : isToday ? 'book-open-variant' : 'calendar-blank'}
                        size={18}
                        color={allRead ? tokens.success : isToday ? tokens.actionPrimaryText : tokens.iconMuted}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: isToday ? tokens.actionPrimary : tokens.textPrimary, textTransform: 'capitalize' }}>
                          {dateStr}
                        </Text>
                        {isToday && (
                          <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: tokens.actionPrimary }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: 'white' }}>HOJE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, color: tokens.textTertiary, marginTop: 2 }}>
                        {entry.chapters.map(ch => `${ch.bookName ?? ch.bookSlug} ${ch.chapterNumber}`).join(' · ')}
                      </Text>
                    </View>

                    {entry.estimatedMinutes != null && (
                      <Text style={{ fontSize: 11, color: tokens.textDisabled }}>{entry.estimatedMinutes}min</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}