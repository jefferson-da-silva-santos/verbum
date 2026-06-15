/**
 * VERBUM — app/(app)/index.tsx  [REDESENHADO]
 *
 * Hierarquia visual:
 *   1. Hero: saudação + data + streak
 *   2. Versículo do dia — destaque total
 *   3. Leitura de hoje / Empty state
 *   4. Acesso rápido às ferramentas
 *   5. Métricas resumidas
 */

import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { router }                from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme }       from '../../src/context/ThemeContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { usePlanContext } from '../../src/context/PlanContext';
import { useStreak }      from '../../src/hooks/useStreak';
import { TodayPlanCard }  from '../../src/components/home/TodayPlanCard';

// ─── Versículo do dia (fixo por enquanto — pode vir de uma API futuramente) ──
const DAILY_VERSE = {
  reference: 'Josué 1:8',
  text: 'Não se aparte da tua boca o livro desta lei; antes medita nele dia e noite, para que guardes e cumpras tudo o que nele está escrito.',
  bookSlug: 'js',
  chapter: 1,
};

// ─── Helpers ─────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function todayFormatted() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ─── Acesso rápido ───────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Bíblia',    icon: 'book-open-outline'          as const, href: '/(app)/reader'                      as const, color: '#6366F1' },
  { label: 'Sermões',   icon: 'notebook-outline'            as const, href: '/(app)/modals/sermon-list'          as const, color: '#8B5CF6' },
  { label: 'Pesquisar', icon: 'magnify'                     as const, href: '/(app)/modals/search'               as const, color: '#06B6D4' },
  { label: 'Profecias', icon: 'arrow-collapse-right'        as const, href: '/(app)/modals/prophetic-connections' as const, color: '#10B981' },
];

// ─── Componente principal ────────────────────────────────────────
export default function HomeScreen() {
  const { tokens, isDark } = useTheme();
  const { user }           = useAuthContext();
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

  const currentStreak = streak?.currentStreak ?? 0;
  const firstName     = user?.name?.split(' ')[0] ?? 'Leitor';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bgPrimary }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={tokens.actionPrimary}
        />
      }
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
    >

      {/* ── 1. HERO ────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {/* Avatar */}
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: tokens.actionPrimary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: tokens.actionPrimaryText }}>
            {firstName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Saudação + data */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: tokens.textTertiary, textTransform: 'capitalize' }}>
            {todayFormatted()}
          </Text>
          <Text style={{ fontSize: 19, fontWeight: '700', color: tokens.textPrimary, letterSpacing: -0.3 }}>
            {greeting()}, {firstName} 👋
          </Text>
        </View>

        {/* Streak badge */}
        {currentStreak > 0 && (
          <View style={{ alignItems: 'center', backgroundColor: tokens.warningBg, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12, gap: 2 }}>
            <Text style={{ fontSize: 18 }}>🔥</Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: tokens.warningText }}>
              {currentStreak}
            </Text>
          </View>
        )}
      </View>

      {/* ── 2. VERSÍCULO DO DIA ────────────────────────────────── */}
      <TouchableOpacity
        onPress={() => router.push(`/(app)/modals/chapter-reader?bookSlug=${DAILY_VERSE.bookSlug}&chapter=${DAILY_VERSE.chapter}`)}
        activeOpacity={0.88}
        style={{
          marginHorizontal: 16,
          marginBottom: 20,
          backgroundColor: tokens.actionPrimary,
          borderRadius: 20,
          padding: 22,
          gap: 14,
        }}
      >
        {/* Label */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Versículo do dia
          </Text>
        </View>

        {/* Texto */}
        <Text style={{ fontSize: 17, color: 'white', lineHeight: 28, fontFamily: 'serif', fontStyle: 'italic', letterSpacing: 0.1 }}>
         {`"${DAILY_VERSE.text}"`}
        </Text>

        {/* Referência + ação */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>
            {DAILY_VERSE.reference}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 }}>
            <Text style={{ fontSize: 12, color: 'white', fontWeight: '600' }}>Ler capítulo</Text>
            <MaterialCommunityIcons name="arrow-right" size={14} color="white" />
          </View>
        </View>
      </TouchableOpacity>

      {/* ── 3. LEITURA DE HOJE ─────────────────────────────────── */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>
            {activePlan ? 'Leitura de hoje' : 'Sem plano ativo'}
          </Text>
          {activePlan && (
            <TouchableOpacity onPress={() => router.push('/(app)/plans')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 13, color: tokens.actionPrimary, fontWeight: '600' }}>Ver plano</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={tokens.actionPrimary} />
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
          /* Empty state elegante */
          <TouchableOpacity
            onPress={() => router.push('/(app)/modals/create-plan')}
            activeOpacity={0.85}
            style={{
              marginHorizontal: 16,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: tokens.borderMedium,
              borderStyle: 'dashed',
              padding: 28,
              alignItems: 'center',
              gap: 10,
            }}
          >
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: tokens.actionPrimary + '15', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="calendar-plus" size={26} color={tokens.actionPrimary} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.textPrimary }}>Criar plano de leitura</Text>
            <Text style={{ fontSize: 13, color: tokens.textTertiary, textAlign: 'center', lineHeight: 20 }}>
              Organize sua leitura da Bíblia e acompanhe seu progresso dia a dia.
            </Text>
            <View style={{ backgroundColor: tokens.actionPrimary, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 28, marginTop: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.actionPrimaryText }}>Criar meu plano</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* ── 4. ACESSO RÁPIDO ───────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary, marginBottom: 12 }}>
          Ferramentas
        </Text>
        {/* Grid 2x2 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.label}
              onPress={() => router.push(action.href as any)}
              activeOpacity={0.8}
              style={{
                width: '47.5%',          // ← duas colunas com gap de 10
                backgroundColor: tokens.bgCard,
                borderRadius: 16,
                padding: 18,
                alignItems: 'flex-start',
                gap: 10,
                borderWidth: 1,
                borderColor: tokens.borderLight,
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 14,
                backgroundColor: action.color + '18',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.textPrimary }}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── 5. MÉTRICAS ────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary, marginBottom: 12 }}>
          Seu progresso
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { value: String(currentStreak), label: 'dias seguidos', icon: '🔥', color: tokens.warningText },
            { value: String(chaptersRead),  label: 'capítulos lidos', icon: '📖', color: tokens.actionPrimary },
            { value: `${Math.round(percentComplete)}%`, label: 'do plano', icon: '🎯', color: tokens.success },
          ].map(m => (
            <View key={m.label} style={{ flex: 1, backgroundColor: tokens.bgCard, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: tokens.borderLight }}>
              <Text style={{ fontSize: 22 }}>{m.icon}</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: m.color }}>{m.value}</Text>
              <Text style={{ fontSize: 11, color: tokens.textTertiary, textAlign: 'center', lineHeight: 16 }}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>

    </ScrollView>
  );
}