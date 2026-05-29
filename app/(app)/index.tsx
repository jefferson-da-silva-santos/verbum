/**
 * VERBUM — app/(app)/index.tsx  —  HomeScreen
 */

import { ScrollView, View, Text, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../src/context/ThemeContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { useTodayPlan } from '../../src/hooks/useActivePlan';
import { useStreak } from '../../src/hooks/useStreak';
import { DailyVerseCard } from '../../src/components/home/DailyVerseCard';
import { TodayPlanCard } from '@/src/components/home/TodayPlanCard';
import { QuickMetrics } from '@/src/components/home/QuickMetrics';
import { Button } from '../../src/components/ui/Button';

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
  const { user } = useAuthContext();
  const {
    activePlan, todayChapters, readTodayCount,
    chaptersRead, percentComplete, markChapterRead, isLoading,
  } = useTodayPlan();
  const { streak } = useStreak();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.actionPrimary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 13, color: tokens.textTertiary, letterSpacing: 0.3 }}>{greeting()},</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary }}>
              {user?.name?.split(' ')[0] ?? 'Leitor'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(app)/modals/search')} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: tokens.bgCard, borderWidth: 1, borderColor: tokens.borderLight, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="magnify" size={20} color={tokens.iconPrimary} />
          </TouchableOpacity>
        </View>

        {/* Versículo do dia */}
        <DailyVerseCard
          reference={DAILY_VERSE.reference}
          text={DAILY_VERSE.text}
          onPress={() => router.push('/(app)/reader')}
        />

        {/* Métricas rápidas */}
        <View style={{ marginTop: 16 }}>
          <QuickMetrics streak={streak?.currentStreak ?? 0} chaptersRead={chaptersRead} booksCompleted={0} />
        </View>

        {/* Plano de hoje */}
        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {activePlan ? 'Leitura de hoje' : 'Começar'}
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
              schedule={null}
              readChapterIds={new Set()}
              percentComplete={percentComplete}
              onChapterPress={(slug, name, ch) => {
                router.push(`/(app)/modals/chapter-reader?bookSlug=${slug}&chapter=${ch}`);
              }}
            />
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/(app)/plans')}
              style={{ marginHorizontal: 16, backgroundColor: tokens.bgCard, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: tokens.borderLight, alignItems: 'center', gap: 12 }}
            >
              <MaterialCommunityIcons name="book-plus-outline" size={36} color={tokens.actionPrimary} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: tokens.textPrimary, textAlign: 'center' }}>Criar plano de leitura</Text>
              <Text style={{ fontSize: 13, color: tokens.textSecondary, textAlign: 'center', lineHeight: 20 }}>
                Defina seu ritmo e acompanhe cada capítulo lido.
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}