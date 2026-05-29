/**
 * VERBUM — app/(auth)/onboarding.tsx
 */

import { useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/ui/Button';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'book-open-variant' as const,
    title: 'Leia com propósito',
    body: 'Crie planos de leitura personalizados e acompanhe seu progresso dia a dia, do Gênesis ao Apocalipse.',
  },
  {
    icon: 'chart-timeline-variant' as const,
    title: 'Acompanhe seu crescimento',
    body: 'Visualize sua jornada com métricas de consistência, streak de dias e o heatmap da sua fidelidade.',
  },
  {
    icon: 'pencil-outline' as const,
    title: 'Estude com profundidade',
    body: 'Anote reflexões, destaque versículos e registre seu diário espiritual — tudo em um só lugar, sem anúncios.',
  },
];

export default function OnboardingScreen() {
  const { tokens } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * W, animated: true });
    setCurrent(index);
  };

  const isLast = current === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      {/* Logo */}
      <View style={{ alignItems: 'center', paddingTop: 64, paddingBottom: 20 }}>
        <Text style={{ fontSize: 30, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary, letterSpacing: -0.5 }}>
          Verbum
        </Text>
        <Text style={{ fontSize: 12, color: tokens.textTertiary, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
          a Palavra
        </Text>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          setCurrent(Math.round(e.nativeEvent.contentOffset.x / W));
        }}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={{ width: W, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 24 }}>
            <View style={{
              width: 100, height: 100, borderRadius: 50,
              backgroundColor: tokens.bgCard,
              borderWidth: 2, borderColor: tokens.borderMedium,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <MaterialCommunityIcons name={slide.icon} size={48} color={tokens.actionPrimary} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: tokens.textPrimary, textAlign: 'center', fontFamily: 'serif' }}>
              {slide.title}
            </Text>
            <Text style={{ fontSize: 15, color: tokens.textSecondary, textAlign: 'center', lineHeight: 24 }}>
              {slide.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Indicadores */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 24 }}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={{
              width: i === current ? 24 : 8, height: 8, borderRadius: 4,
              backgroundColor: i === current ? tokens.actionPrimary : tokens.borderMedium,
            }} />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTAs */}
      <View style={{ padding: 24, gap: 12 }}>
        {isLast ? (
          <>
            <Button label="Criar conta" onPress={() => router.push('/(auth)/register')} fullWidth />
            <Button label="Já tenho conta" variant="ghost" onPress={() => router.push('/(auth)/login')} fullWidth />
          </>
        ) : (
          <Button label="Continuar" onPress={() => goTo(current + 1)} fullWidth />
        )}
      </View>
    </View>
  );
}