/**
 * VERBUM — app/(app)/plans.tsx  [POLISH]
 * Remove paddingTop: 60. Usa paddingTop: 12.
 */

import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme }       from '../../src/context/ThemeContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { useActivePlan }  from '../../src/hooks/useActivePlan';
import { planRepo }       from '../../src/database/repositories';
import { PlanCard } from '@/src/components/plans/PlanCard';
import type { ReadingPlan } from '../../src/database/types';
import { FEATURED_PLANS } from '../../src/constants/presetPlans';
import { Button }         from '../../src/components/ui/Button';

export default function PlansScreen() {
  const { tokens }    = useTheme();
  const insets        = useSafeAreaInsets();
  const { user }      = useAuthContext();
  const { activePlan, chaptersRead } = useActivePlan();
  const [allPlans,   setAllPlans]   = useState<ReadingPlan[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setAllPlans(await planRepo.findAll(user.id));
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bgPrimary }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.actionPrimary} />}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 32 }}
    >
      {/* Título + botão novo plano */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary }}>Planos</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/modals/create-plan')}>
          <MaterialCommunityIcons name="plus-circle" size={28} color={tokens.actionPrimary} />
        </TouchableOpacity>
      </View>

      {/* Plano ativo */}
      {activePlan && (
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Plano Ativo</Text>
          <PlanCard plan={activePlan} chaptersRead={chaptersRead} isActive />
        </View>
      )}

      {/* Planos sugeridos */}
      <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, marginBottom: 10 }}>
        Planos Sugeridos
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 4 }}>
        {FEATURED_PLANS.map(p => (
          <TouchableOpacity
            key={p.id}
            onPress={() => router.push(`/(app)/modals/create-plan?presetId=${p.id}`)}
            style={{ width: 190, backgroundColor: tokens.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: tokens.borderLight, gap: 8 }}
          >
            <MaterialCommunityIcons name={p.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={26} color={tokens.actionPrimary} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.textPrimary }}>{p.name}</Text>
            <Text style={{ fontSize: 12, color: tokens.textTertiary, lineHeight: 18 }} numberOfLines={2}>{p.description}</Text>
            <Text style={{ fontSize: 11, color: tokens.textDisabled }}>{p.totalChapters} caps</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Concluídos */}
      {allPlans.filter(p => p.isCompleted).length > 0 && (
        <View style={{ paddingHorizontal: 16, marginTop: 20, gap: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>Concluídos</Text>
          {allPlans.filter(p => p.isCompleted).map(p => (
            <PlanCard key={p.id} plan={p} chaptersRead={p.totalChapters} />
          ))}
        </View>
      )}

      {!activePlan && allPlans.length === 0 && (
        <View style={{ alignItems: 'center', gap: 16, padding: 40 }}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={tokens.iconMuted} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: tokens.textPrimary, textAlign: 'center' }}>Nenhum plano criado ainda</Text>
          <Button label="Criar meu primeiro plano" onPress={() => router.push('/(app)/modals/create-plan')} />
        </View>
      )}
    </ScrollView>
  );
}