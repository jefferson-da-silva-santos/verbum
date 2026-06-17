/**
 * VERBUM — app/(app)/index.tsx  [REDESIGN — inspirado no YouVersion]
 *
 * Referência de pesquisa: o "Bible App" (YouVersion), o app bíblico mais
 * usado do mundo, usa um card de "Versículo do Dia" grande e fotográfico
 * como elemento central da home — tipografia serifada, texto branco,
 * fundo com profundidade visual. É o que dá a sensação de calma e
 * cuidado no primeiro contato, em vez de parecer um dashboard técnico.
 *
 * Adaptação para o Verbum:
 *   Em vez de uma foto do Unsplash (que quebraria a promessa de
 *   funcionar 100% offline), usamos um gradiente premium com leves
 *   "luzes" decorativas — mesmo efeito de profundidade, sem dependência
 *   de rede.
 *
 * Resultado: 1 elemento central bonito + no máximo 1 decisão por tela.
 *
 * Requer: expo-linear-gradient
 *   npx expo install expo-linear-gradient   (caso ainda não esteja instalado)
 */

import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { router }                from 'expo-router';
import { LinearGradient }        from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme }       from '../../src/context/ThemeContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { usePlanContext } from '../../src/context/PlanContext';
import { useStreak }      from '../../src/hooks/useStreak';
import { TodayPlanCard }  from '../../src/components/home/TodayPlanCard';

const DAILY_VERSE = {
  reference: 'Josué 1:8',
  text: 'Não se aparte da tua boca o livro desta lei; antes medita nele dia e noite.',
  bookSlug: 'js',
  chapter: 1,
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function todayLabel() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const TOOLS = [
  { label: 'Bíblia',    icon: 'book-open-page-variant-outline' as const, href: '/(app)/modals/chapter-reader?bookSlug=gn&chapter=1' as const, color: '#6366F1' },
  { label: 'Sermões',   icon: 'notebook-outline'                as const, href: '/(app)/modals/sermon-list'                          as const, color: '#8B5CF6' },
  { label: 'Buscar',    icon: 'magnify'                         as const, href: '/(app)/modals/search'                                as const, color: '#06B6D4' },
  { label: 'Profecias', icon: 'arrow-collapse-right'            as const, href: '/(app)/modals/prophetic-connections'                  as const, color: '#10B981' },
];

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

  const currentStreak = streak?.currentStreak ?? 0;
  const firstName     = user?.name?.split(' ')[0] ?? 'Leitor';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bgPrimary }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.actionPrimary} />
      }
      contentContainerStyle={{ paddingBottom: 48 }}
    >

      {/* ── Header minimalista — fica por cima do card, discreto ── */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
      }}>
        <View>
          <Text style={{ fontSize: 13, color: tokens.textTertiary, textTransform: 'capitalize' }}>
            {todayLabel()}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.textPrimary }}>
            {greeting()}, {firstName}
          </Text>
        </View>

        {currentStreak > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: tokens.warningBg, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 }}>
            <Text style={{ fontSize: 14 }}>🔥</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.warningText }}>{currentStreak}</Text>
          </View>
        )}
      </View>

      {/* ── HERO: Versículo do Dia — card central, estilo editorial ── */}
      <TouchableOpacity
        onPress={() => router.push(`/(app)/modals/chapter-reader?bookSlug=${DAILY_VERSE.bookSlug}&chapter=${DAILY_VERSE.chapter}`)}
        activeOpacity={0.92}
        style={{ marginHorizontal: 16, marginBottom: 28, borderRadius: 28, overflow: 'hidden' }}
      >
        <LinearGradient
          colors={['#4C1D95', '#6D28D9', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ minHeight: 280, padding: 28, justifyContent: 'space-between' }}
        >
          {/* Luzes decorativas — simulam profundidade sem precisar de foto */}
          <View pointerEvents="none" style={{
            position: 'absolute', top: -60, right: -50,
            width: 220, height: 220, borderRadius: 110,
            backgroundColor: 'rgba(255,255,255,0.08)',
          }} />
          <View pointerEvents="none" style={{
            position: 'absolute', bottom: -80, left: -40,
            width: 200, height: 200, borderRadius: 100,
            backgroundColor: 'rgba(255,255,255,0.06)',
          }} />
          <MaterialCommunityIcons
            name="format-quote-open"
            size={140}
            color="rgba(255,255,255,0.07)"
            style={{ position: 'absolute', top: 8, left: 8 }}
          />

          {/* Label superior */}
          <Text style={{
            fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.65)',
            letterSpacing: 2, textTransform: 'uppercase',
          }}>
            Versículo do dia
          </Text>

          {/* Texto — tipografia editorial, centro visual do card */}
          <Text style={{
            fontSize: 21, color: 'white', lineHeight: 32,
            fontFamily: 'serif', fontStyle: 'italic', fontWeight: '500',
            textAlign: 'center', marginVertical: 12,
          }}>
            "{DAILY_VERSE.text}"
          </Text>

          {/* Rodapé do card */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 }}>
              {DAILY_VERSE.reference}
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
              paddingVertical: 7, paddingHorizontal: 14,
            }}>
              <Text style={{ fontSize: 12, color: 'white', fontWeight: '600' }}>Ler capítulo</Text>
              <MaterialCommunityIcons name="arrow-right" size={13} color="white" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Conteúdo abaixo: uma única decisão por vez ── */}
      {activePlan ? (
        <View style={{ marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>
              Leitura de hoje
            </Text>
            <TouchableOpacity onPress={() => router.push('/(app)/plans')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 13, color: tokens.actionPrimary, fontWeight: '600' }}>Ver plano</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={tokens.actionPrimary} />
            </TouchableOpacity>
          </View>

          <TodayPlanCard
            planName={activePlan.name}
            schedule={todaySchedule}
            readChapterIds={readChapterIds}
            percentComplete={percentComplete}
            onChapterPress={(slug, _, ch) =>
              router.push(`/(app)/modals/chapter-reader?bookSlug=${slug}&chapter=${ch}`)
            }
          />
        </View>
      ) : (
        <View style={{ marginHorizontal: 16, marginBottom: 28 }}>
          <TouchableOpacity
            onPress={() => router.push('/(app)/modals/create-plan')}
            activeOpacity={0.85}
            style={{
              backgroundColor: tokens.bgCard,
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: tokens.borderLight,
            }}
          >
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: tokens.actionPrimary + '15', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="calendar-heart" size={24} color={tokens.actionPrimary} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.textPrimary }}>
              Comece sua leitura hoje
            </Text>
            <Text style={{ fontSize: 13, color: tokens.textTertiary, textAlign: 'center', lineHeight: 19, maxWidth: 260 }}>
              Crie um plano simples e leia a Bíblia no seu ritmo, com lembretes gentis.
            </Text>
            <View style={{ backgroundColor: tokens.actionPrimary, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 26, marginTop: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.actionPrimaryText }}>Criar meu plano</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── FERRAMENTAS — grid com profundidade visual ── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary, marginBottom: 14 }}>
          Ferramentas
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {TOOLS.map(tool => (
            <TouchableOpacity
              key={tool.label}
              onPress={() => router.push(tool.href as any)}
              activeOpacity={0.85}
              style={{
                width: '47%',
                backgroundColor: tokens.bgCard,
                borderRadius: 18,
                padding: 16,
                gap: 12,
                borderWidth: 1,
                borderColor: tokens.borderLight,
              }}
            >
              <LinearGradient
                colors={[tool.color + '30', tool.color + '12']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 46, height: 46, borderRadius: 14,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name={tool.icon} size={22} color={tool.color} />
              </LinearGradient>
              <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.textPrimary }}>
                {tool.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── PROGRESSO — card único com divisores, em vez de 3 caixas soltas ── */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary, marginBottom: 14 }}>
          Seu progresso
        </Text>
        <View style={{
          flexDirection: 'row',
          backgroundColor: tokens.bgCard,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: tokens.borderLight,
          overflow: 'hidden',
        }}>
          {[
            { icon: 'fire'          as const, value: String(currentStreak), label: 'dias seguidos',  color: '#F59E0B' },
            { icon: 'book-open-page-variant' as const, value: String(chaptersRead), label: 'capítulos lidos', color: tokens.actionPrimary },
            { icon: 'target'        as const, value: `${Math.round(percentComplete)}%`, label: 'do plano', color: '#10B981' },
          ].map((m, i) => (
            <View key={m.label} style={{
              flex: 1, alignItems: 'center', gap: 6, paddingVertical: 20,
              borderRightWidth: i < 2 ? 1 : 0, borderRightColor: tokens.borderLight,
            }}>
              <MaterialCommunityIcons name={m.icon} size={20} color={m.color} />
              <Text style={{ fontSize: 19, fontWeight: '800', color: tokens.textPrimary }}>{m.value}</Text>
              <Text style={{ fontSize: 10.5, color: tokens.textTertiary, textAlign: 'center', lineHeight: 14 }}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>

    </ScrollView>
  );
}