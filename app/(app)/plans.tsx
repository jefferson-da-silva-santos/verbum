/**
 * VERBUM — app/(app)/plans.tsx  [REFINADO]
 *
 * Fix: botão "Criar plano de estudo" centralizado e estado vazio polido.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router }            from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme }       from '../../src/context/ThemeContext';
import { usePlanContext } from '../../src/context/PlanContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { planRepo }       from '../../src/database/repositories';
import type { ReadingPlan } from '../../src/database/types';
import { relativeDate }   from '../../src/utils/dateUtils';

export default function PlansScreen() {
  const { tokens }    = useTheme();
  const insets        = useSafeAreaInsets();
  const { user }      = useAuthContext();
  const { activePlan, percentComplete } = usePlanContext();

  const [allPlans,  setAllPlans]  = useState<ReadingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const plans = await planRepo.findAll(user.id);
      setAllPlans(plans);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const completedPlans = allPlans.filter(p => p.isCompleted);
  const hasPlans       = allPlans.length > 0;

  // ── Render ────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={tokens.actionPrimary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <FlatList
        data={allPlans}
        keyExtractor={p => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom:     insets.bottom + 40,
          flexGrow:          1,        // ← garante que o empty state preenche a tela
        }}

        // ── HEADER ──────────────────────────────────────────────
        ListHeaderComponent={() => (
          <View style={{ paddingTop: 12, paddingBottom: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: tokens.textPrimary, letterSpacing: -0.5 }}>
              Planos de Leitura
            </Text>
            <Text style={{ fontSize: 14, color: tokens.textTertiary, marginTop: 4 }}>
              {hasPlans
                ? `${allPlans.length} plano${allPlans.length > 1 ? 's' : ''} · ${completedPlans.length} concluído${completedPlans.length !== 1 ? 's' : ''}`
                : 'Organize sua leitura da Bíblia'}
            </Text>
          </View>
        )}

        // ── PLANO ATIVO (card de destaque) ──────────────────────
        ListHeaderComponentStyle={{ marginBottom: 0 }}

        renderItem={({ item: plan }) => {
          const isActive   = plan.id === activePlan?.id;
          const progress   = isActive ? percentComplete : 0;
          const statusColor = plan.isCompleted
            ? tokens.success
            : isActive
            ? tokens.actionPrimary
            : tokens.textTertiary;

          return (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(app)/modals/plan-detail' as any, params: { planId: plan.id } })}
              style={{
                backgroundColor: isActive ? tokens.actionPrimary : tokens.bgCard,
                borderRadius:    16,
                padding:         18,
                marginBottom:    12,
                borderWidth:     1,
                borderColor:     isActive ? 'transparent' : tokens.borderLight,
              }}
            >
              {/* Cabeçalho do card */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 15, fontWeight: '700',
                    color: isActive ? tokens.actionPrimaryText : tokens.textPrimary,
                    lineHeight: 22,
                  }}>
                    {plan.name}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: isActive ? tokens.actionPrimaryText + 'AA' : tokens.textTertiary,
                    marginTop: 2,
                  }}>
                    {plan.isCompleted
                      ? `Concluído ${relativeDate(plan.completedAt ?? plan.updatedAt)}`
                      : isActive
                      ? `Iniciado ${relativeDate(plan.createdAt)}`
                      : `Criado ${relativeDate(plan.createdAt)}`}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
                  backgroundColor: plan.isCompleted
                    ? tokens.successBg
                    : isActive
                    ? 'rgba(255,255,255,0.2)'
                    : tokens.bgSecondary,
                }}>
                  <Text style={{
                    fontSize: 11, fontWeight: '700',
                    color: plan.isCompleted ? tokens.success : isActive ? 'white' : tokens.textTertiary,
                  }}>
                    {plan.isCompleted ? 'Concluído' : isActive ? 'Ativo' : 'Pausado'}
                  </Text>
                </View>
              </View>

              {/* Barra de progresso */}
              <View style={{ gap: 6 }}>
                <View style={{
                  height: 6, borderRadius: 3,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : tokens.progressBg,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    height: '100%',
                    width: `${Math.min(100, isActive ? progress : (plan.isCompleted ? 100 : 0))}%`,
                    borderRadius: 3,
                    backgroundColor: isActive ? 'white' : statusColor,
                  }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: isActive ? tokens.actionPrimaryText + 'AA' : tokens.textTertiary }}>
                    {plan.totalChapters} capítulos · {plan.bibleVersion.toUpperCase()}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: isActive ? 'white' : statusColor }}>
                    {isActive ? `${Math.round(progress)}%` : plan.isCompleted ? '100%' : '—'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}

        // ── ESTADO VAZIO ────────────────────────────────────────
        ListEmptyComponent={() => (
          <View style={{
            flex:            1,
            alignItems:      'center',
            justifyContent:  'center',
            paddingVertical: 60,
            gap:             20,
          }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: tokens.actionPrimary + '15',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={38} color={tokens.actionPrimary} />
            </View>

            <View style={{ alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.textPrimary, textAlign: 'center' }}>
                Nenhum plano ainda
              </Text>
              <Text style={{ fontSize: 14, color: tokens.textTertiary, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
                Crie um plano de leitura e acompanhe seu progresso pela Bíblia dia a dia.
              </Text>
            </View>

            {/* ← BOTÃO CENTRALIZADO */}
            <TouchableOpacity
              onPress={() => router.push('/(app)/modals/create-plan')}
              style={{
                backgroundColor:  tokens.actionPrimary,
                borderRadius:     14,
                paddingVertical:  14,
                paddingHorizontal: 32,
                alignSelf:        'center',     // ← garante centralização
                flexDirection:    'row',
                alignItems:       'center',
                gap:              8,
                marginTop:        4,
              }}
            >
              <MaterialCommunityIcons name="plus" size={20} color={tokens.actionPrimaryText} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.actionPrimaryText }}>
                Criar plano de leitura
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* FAB — quando já existem planos */}
      {hasPlans && (
        <TouchableOpacity
          onPress={() => router.push('/(app)/modals/create-plan')}
          style={{
            position:        'absolute',
            bottom:          insets.bottom + 20,
            right:           20,
            backgroundColor: tokens.actionPrimary,
            borderRadius:    28,
            paddingVertical: 14,
            paddingHorizontal: 22,
            flexDirection:   'row',
            alignItems:      'center',
            gap:             8,
            shadowColor:     tokens.shadow,
            shadowOffset:    { width: 0, height: 4 },
            shadowOpacity:   0.25,
            shadowRadius:    8,
            elevation:       8,
          }}
        >
          <MaterialCommunityIcons name="plus" size={20} color={tokens.actionPrimaryText} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.actionPrimaryText }}>Novo plano</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}