/**
 * VERBUM — app/(app)/plans.tsx  [POLISH — mesmo padrão visual da home]
 *
 * Aplica o mesmo princípio usado no redesign da home:
 *   - Card de destaque (plano ativo) com gradiente, não cor chapada
 *   - Ícones com fundo em gradiente sutil, não cor sólida flat
 *   - Estatísticas agrupadas num único card com divisores,
 *     em vez de blocos soltos
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router }            from 'expo-router';
import { LinearGradient }    from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme }       from '../../src/context/ThemeContext';
import { usePlanContext } from '../../src/context/PlanContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { planRepo }       from '../../src/database/repositories';
import type { ReadingPlan } from '../../src/database/types';
import { relativeDate }   from '../../src/utils/dateUtils';

// ─── Skeleton da tela de planos ──────────────────────────────────
// Imita a estrutura real: card de plano ativo (maior) + 2 cards menores

function PlansSkeleton() {
  const { tokens, isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.85] });
  const bg      = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const bgDeep  = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary, padding: 20, gap: 14 }}>

      {/* Header stats — 3 pills */}
      <Animated.View style={{ flexDirection: 'row', backgroundColor: tokens.bgCard, borderRadius: 16, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden', opacity }}>
        {[0, 1, 2].map(i => (
          <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 16, gap: 6, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: tokens.borderLight }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: bg }} />
            <View style={{ width: 28, height: 16, borderRadius: 5, backgroundColor: bgDeep }} />
            <View style={{ width: 44, height: 10, borderRadius: 4, backgroundColor: bg }} />
          </View>
        ))}
      </Animated.View>

      {/* Card do plano ativo — maior, com gradiente simulado */}
      <Animated.View style={{ borderRadius: 20, backgroundColor: tokens.actionPrimary + '20', borderWidth: 1, borderColor: tokens.actionPrimary + '30', padding: 20, gap: 14, opacity }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ gap: 8, flex: 1 }}>
            <View style={{ width: 64, height: 10, borderRadius: 4, backgroundColor: tokens.actionPrimary + '50' }} />
            <View style={{ width: '75%', height: 17, borderRadius: 5, backgroundColor: tokens.actionPrimary + '40' }} />
            <View style={{ width: 100, height: 10, borderRadius: 4, backgroundColor: tokens.actionPrimary + '30' }} />
          </View>
          <View style={{ width: 36, height: 26, borderRadius: 8, backgroundColor: tokens.actionPrimary + '30' }} />
        </View>
        {/* Barra de progresso */}
        <View style={{ height: 7, borderRadius: 4, backgroundColor: tokens.actionPrimary + '25' }}>
          <View style={{ height: '100%', width: '40%', borderRadius: 4, backgroundColor: tokens.actionPrimary + '50' }} />
        </View>
        <View style={{ width: 130, height: 10, borderRadius: 4, backgroundColor: tokens.actionPrimary + '25' }} />
      </Animated.View>

      {/* Rótulo "Todos os planos" */}
      <Animated.View style={{ width: 100, height: 10, borderRadius: 4, backgroundColor: bg, opacity }} />

      {/* Cards secundários */}
      {[0, 1].map(i => (
        <Animated.View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: tokens.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: tokens.borderLight, opacity }}>
          <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: bg }} />
          <View style={{ flex: 1, gap: 7 }}>
            <View style={{ width: '70%', height: 14, borderRadius: 5, backgroundColor: bgDeep }} />
            <View style={{ width: '45%', height: 11, borderRadius: 4, backgroundColor: bg }} />
          </View>
          <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: bg }} />
        </Animated.View>
      ))}
    </View>
  );
}

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
  const pausedPlans    = allPlans.filter(p => !p.isCompleted && p.id !== activePlan?.id);
  const hasPlans       = allPlans.length > 0;

  // ── Render ────────────────────────────────────────────────────

  if (isLoading) {
    return <PlansSkeleton />;
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
          flexGrow:          1,
        }}

        // ── HEADER ──────────────────────────────────────────────
        ListHeaderComponent={() => (
          <View style={{ paddingTop: 12, paddingBottom: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: tokens.textPrimary, letterSpacing: -0.5 }}>
              Planos de Leitura
            </Text>

            {hasPlans ? (
              // Stats com divisores — mesmo padrão do card "Seu progresso" da home
              <View style={{
                flexDirection: 'row', marginTop: 16,
                backgroundColor: tokens.bgCard, borderRadius: 16,
                borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden',
              }}>
                {[
                  { icon: 'calendar-multiple' as const, value: String(allPlans.length),      label: 'planos',     color: tokens.actionPrimary },
                  { icon: 'check-circle-outline' as const, value: String(completedPlans.length), label: 'concluídos', color: '#10B981' },
                  { icon: 'pause-circle-outline' as const, value: String(pausedPlans.length),    label: 'pausados',   color: '#F59E0B' },
                ].map((s, i) => (
                  <View key={s.label} style={{
                    flex: 1, alignItems: 'center', gap: 5, paddingVertical: 16,
                    borderRightWidth: i < 2 ? 1 : 0, borderRightColor: tokens.borderLight,
                  }}>
                    <MaterialCommunityIcons name={s.icon} size={18} color={s.color} />
                    <Text style={{ fontSize: 17, fontWeight: '800', color: tokens.textPrimary }}>{s.value}</Text>
                    <Text style={{ fontSize: 10.5, color: tokens.textTertiary }}>{s.label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ fontSize: 14, color: tokens.textTertiary, marginTop: 4 }}>
                Organize sua leitura da Bíblia
              </Text>
            )}

            {hasPlans && (
              <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 24, marginBottom: 4 }}>
                Todos os planos
              </Text>
            )}
          </View>
        )}

        renderItem={({ item: plan }) => {
          const isActive = plan.id === activePlan?.id;
          const progress = isActive ? percentComplete : plan.isCompleted ? 100 : 0;

          // ── Card do plano ATIVO — gradiente, igual ao hero da home ──
          if (isActive) {
            return (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(app)/modals/plan-detail' as any, params: { planId: plan.id } })}
                activeOpacity={0.92}
                style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}
              >
                <LinearGradient
                  colors={['#4C1D95', '#6D28D9', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 20 }}
                >
                  {/* Luzes decorativas — mesmo efeito do card de versículo */}
                  <View pointerEvents="none" style={{ position: 'absolute', top: -40, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                  <MaterialCommunityIcons name="calendar-check" size={100} color="rgba(255,255,255,0.07)" style={{ position: 'absolute', bottom: -10, right: -6 }} />

                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.7)' }} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase' }}>
                          Plano ativo
                        </Text>
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: 'white', lineHeight: 22 }}>
                        {plan.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                        Iniciado {relativeDate(plan.createdAt)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 26, fontWeight: '800', color: 'white' }}>
                      {Math.round(progress)}%
                    </Text>
                  </View>

                  <View style={{ height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden', marginBottom: 10 }}>
                    <View style={{ height: '100%', width: `${Math.min(100, progress)}%`, borderRadius: 4, backgroundColor: 'white' }} />
                  </View>

                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                    {plan.totalChapters} capítulos · {plan.bibleVersion.toUpperCase()}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          // ── Demais cards — clean, com ícone em gradiente sutil ──
          const statusColor = plan.isCompleted ? '#10B981' : '#F59E0B';
          const statusIcon  = plan.isCompleted ? 'check-circle' as const : 'pause-circle-outline' as const;
          const statusLabel = plan.isCompleted ? 'Concluído' : 'Pausado';

          return (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(app)/modals/plan-detail' as any, params: { planId: plan.id } })}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                backgroundColor: tokens.bgCard, borderRadius: 16, padding: 16,
                marginBottom: 12, borderWidth: 1, borderColor: tokens.borderLight,
              }}
            >
              <LinearGradient
                colors={[statusColor + '30', statusColor + '12']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}
              >
                <MaterialCommunityIcons name={statusIcon} size={20} color={statusColor} />
              </LinearGradient>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.textPrimary }} numberOfLines={1}>
                  {plan.name}
                </Text>
                <Text style={{ fontSize: 11, color: tokens.textTertiary, marginTop: 2 }}>
                  {statusLabel} · {plan.totalChapters} capítulos
                </Text>
              </View>

              <MaterialCommunityIcons name="chevron-right" size={18} color={tokens.iconMuted} />
            </TouchableOpacity>
          );
        }}

        // ── ESTADO VAZIO ────────────────────────────────────────
        ListEmptyComponent={() => (
          <View style={{
            flex: 1, alignItems: 'center', justifyContent: 'center',
            paddingVertical: 60, gap: 20,
          }}>
            <LinearGradient
              colors={[tokens.actionPrimary + '30', tokens.actionPrimary + '10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialCommunityIcons name="calendar-blank-outline" size={38} color={tokens.actionPrimary} />
            </LinearGradient>

            <View style={{ alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.textPrimary, textAlign: 'center' }}>
                Nenhum plano ainda
              </Text>
              <Text style={{ fontSize: 14, color: tokens.textTertiary, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
                Crie um plano de leitura e acompanhe seu progresso pela Bíblia dia a dia.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(app)/modals/create-plan')}
              style={{
                backgroundColor: tokens.actionPrimary, borderRadius: 14,
                paddingVertical: 14, paddingHorizontal: 32, alignSelf: 'center',
                flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4,
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

      {/* FAB */}
      {hasPlans && (
        <TouchableOpacity
          onPress={() => router.push('/(app)/modals/create-plan')}
          style={{
            position: 'absolute', bottom: insets.bottom + 20, right: 20,
            backgroundColor: tokens.actionPrimary, borderRadius: 28,
            paddingVertical: 14, paddingHorizontal: 22,
            flexDirection: 'row', alignItems: 'center', gap: 8,
            shadowColor: tokens.shadow, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
          }}
        >
          <MaterialCommunityIcons name="plus" size={20} color={tokens.actionPrimaryText} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.actionPrimaryText }}>Novo plano</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}