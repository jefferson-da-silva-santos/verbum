/**
 * VERBUM — app/(app)/plans.tsx  —  PlansScreen
 */

import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { useActivePlan } from '../../src/hooks/useActivePlan';
import { planRepo } from '../../src/database/repositories';
import { PlanCard } from '@/src/components/plans/PlanCard';
import type { ReadingPlan } from '../../src/database/types';
import { FEATURED_PLANS } from '../../src/constants/presetPlans';
import { Button } from '../../src/components/ui/Button';

export default function PlansScreen() {
  const { tokens } = useTheme();
  const { user } = useAuthContext();
  const { activePlan, chaptersRead } = useActivePlan();
  const [allPlans, setAllPlans] = useState<ReadingPlan[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setAllPlans(await planRepo.findAll(user.id));
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.actionPrimary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 26, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary }}>Planos</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/modals/create-plan')}>
            <MaterialCommunityIcons name="plus-circle" size={28} color={tokens.actionPrimary} />
          </TouchableOpacity>
        </View>

        {/* Plano ativo */}
        {activePlan && (
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Plano Ativo
            </Text>
            <PlanCard plan={activePlan} chaptersRead={chaptersRead} isActive />
          </View>
        )}

        {/* Planos sugeridos */}
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Planos Sugeridos
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 4 }}>
          {FEATURED_PLANS.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => router.push(`/(app)/modals/create-plan?presetId=${p.id}`)}
              style={{ width: 200, backgroundColor: tokens.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: tokens.borderLight, gap: 8 }}
            >
              <MaterialCommunityIcons name={p.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={28} color={tokens.actionPrimary} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.textPrimary }}>{p.name}</Text>
              <Text style={{ fontSize: 12, color: tokens.textTertiary, lineHeight: 18 }} numberOfLines={2}>{p.description}</Text>
              <Text style={{ fontSize: 11, color: tokens.textDisabled }}>{p.totalChapters} caps</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Concluídos */}
        {allPlans.filter(p => p.isCompleted).length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 24, gap: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>Concluídos</Text>
            {allPlans.filter(p => p.isCompleted).map(p => (
              <PlanCard key={p.id} plan={p} chaptersRead={p.totalChapters} />
            ))}
          </View>
        )}

        {!activePlan && allPlans.length === 0 && (
          <View style={{ alignItems: 'center', gap: 16, padding: 40 }}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={tokens.iconMuted} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: tokens.textPrimary, textAlign: 'center' }}>
              Nenhum plano criado ainda
            </Text>
            <Button label="Criar meu primeiro plano" onPress={() => router.push('/(app)/modals/create-plan')} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}