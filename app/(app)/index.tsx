/**
 * VERBUM — app/(app)/index.tsx  [POLISH]
 * paddingTop: 12 apenas — insets já consumidos pelo AppHeader
 */

import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme }       from '../../src/context/ThemeContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { usePlanContext } from '../../src/context/PlanContext';
import { useStreak }      from '../../src/hooks/useStreak';
import { DailyVerseCard } from '../../src/components/home/DailyVerseCard';
import { TodayPlanCard } from '@/src/components/home/TodayPlanCard';
import { QuickMetrics } from '@/src/components/home/QuickMetrics';
import { Button }         from '../../src/components/ui/Button';

const DAILY_VERSE = {
  reference: 'Josué 1:8',
  text: 'Não se aparte da tua boca o livro desta lei; antes medita nele dia e noite.',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomeScreen() {
  const { tokens } = useTheme();
  const { user }   = useAuthContext();
  const {
    activePlan, todaySchedule, readChapterIds,
    chaptersRead, percentComplete,
  } = usePlanContext();
  const { streak } = useStreak();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bgPrimary }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.actionPrimary} />
      }
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 32, gap: 14 }}
    >
      {/* Saudação */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 13, color: tokens.textTertiary }}>{greeting()},</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary }}>
          {user?.name?.split(' ')[0] ?? 'Leitor'}
        </Text>
      </View>

      <DailyVerseCard
        reference={DAILY_VERSE.reference}
        text={DAILY_VERSE.text}
        onPress={() => router.push('/(app)/modals/chapter-reader?bookSlug=js&chapter=1')}
      />

      <QuickMetrics streak={streak?.currentStreak ?? 0} chaptersRead={chaptersRead} booksCompleted={0} />

      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {activePlan ? 'Leitura de hoje' : 'Comece agora'}
          </Text>
          {activePlan && (
            <TouchableOpacity onPress={() => router.push('/(app)/plans')}>
              <Text style={{ fontSize: 13, color: tokens.textLink }}>ver plano</Text>
            </TouchableOpacity>
          )}
        </View>

        {activePlan ? (
          <TodayPlanCard
            planName={activePlan.name}
            schedule={todaySchedule}
            readChapterIds={readChapterIds}
            percentComplete={percentComplete}
            onChapterPress={(slug, _, ch) =>
              router.push(`/(app)/modals/chapter-reader?bookSlug=${slug}&chapter=${ch}`)
            }
          />
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/(app)/plans')}
            style={{ marginHorizontal: 16, backgroundColor: tokens.bgCard, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: tokens.borderLight, alignItems: 'center', gap: 12 }}
          >
            <MaterialCommunityIcons name="book-plus-outline" size={40} color={tokens.actionPrimary} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: tokens.textPrimary, textAlign: 'center' }}>Criar plano de leitura</Text>
            <Button label="Criar meu plano" onPress={() => router.push('/(app)/plans')} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}