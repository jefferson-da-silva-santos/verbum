/**
 * FIX 2 — app/(app)/modals/achievements.tsx
 *
 * CAUSA: unlockedKeys começa como undefined antes do hook carregar.
 * Chamada de unlockedKeys.has(a.key) crasha imediatamente.
 * CORREÇÃO: optional chaining + fallback para Set vazio.
 */

import { View, Text, SectionList, SafeAreaView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme }        from '../../../src/context/ThemeContext';
import { useAchievements } from '../../../src/hooks/useAchievements';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { RARITY_COLORS }   from '../../../src/constants/achievements';

export default function AchievementsModal() {
  const { tokens }   = useTheme();
  const insets       = useSafeAreaInsets();
  const {
    categoryGroups,
    unlockedCount,
    totalCount,
    progressPercent,
    unlockedKeys,    // pode ser undefined antes de carregar
    isLoading,
  } = useAchievements();

  // FIX: garante que sempre é um Set, mesmo antes de carregar
  const safeUnlockedKeys: ReadonlySet<string> = unlockedKeys ?? new Set<string>();

  const sections = (categoryGroups ?? []).map(g => ({
    title: g.label,
    count: `${g.unlockedCount}/${g.achievements.length}`,
    data:  g.achievements,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        padding: 16, paddingTop: insets.top + 8,
        borderBottomWidth: 1, borderBottomColor: tokens.borderLight,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <Text style={{
          flex: 1, textAlign: 'center', fontSize: 16,
          fontWeight: '700', color: tokens.textPrimary,
        }}>
          Conquistas
        </Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: tokens.actionPrimary }}>
          {unlockedCount}/{totalCount}
        </Text>
      </View>

      {/* Progresso geral */}
      <View style={{ padding: 20, gap: 8 }}>
        <ProgressBar value={progressPercent} showLabel />
        <Text style={{ fontSize: 12, color: tokens.textTertiary, textAlign: 'center' }}>
          {progressPercent.toFixed(0)}% das conquistas desbloqueadas
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: tokens.textTertiary }}>Carregando conquistas…</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.key}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
          renderSectionHeader={({ section }) => (
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between',
              paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
              backgroundColor: tokens.bgPrimary,
            }}>
              <Text style={{
                fontSize: 11, fontWeight: '600', color: tokens.textTertiary,
                textTransform: 'uppercase', letterSpacing: 0.8,
              }}>
                {section.title}
              </Text>
              <Text style={{ fontSize: 11, color: tokens.textDisabled }}>
                {section.count}
              </Text>
            </View>
          )}
          renderItem={({ item: a }) => {
            // FIX: usa safeUnlockedKeys em vez de unlockedKeys direto
            const unlocked = safeUnlockedKeys.has(a.key);
            const rarityColor = RARITY_COLORS[a.rarity] ?? tokens.actionPrimary;

            return (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                paddingVertical: 12, paddingHorizontal: 20,
                borderBottomWidth: 1, borderBottomColor: tokens.borderLight,
                opacity: unlocked ? 1 : 0.45,
              }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: unlocked ? rarityColor + '20' : tokens.bgSecondary,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: unlocked ? 2 : 1,
                  borderColor: unlocked ? rarityColor : tokens.borderLight,
                }}>
                  <MaterialCommunityIcons
                    name={a.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={22}
                    color={unlocked ? a.colorHex : tokens.iconMuted}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{
                      fontSize: 14, fontWeight: '700', color: tokens.textPrimary,
                    }}>
                      {a.title}
                    </Text>
                    {a.rarity >= 4 && (
                      <View style={{
                        backgroundColor: rarityColor + '20',
                        borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
                      }}>
                        <Text style={{
                          fontSize: 9, fontWeight: '700', color: rarityColor,
                          textTransform: 'uppercase', letterSpacing: 0.4,
                        }}>
                          {a.rarity === 5 ? 'Lendária' : 'Épica'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: tokens.textTertiary, lineHeight: 18 }}>
                    {a.description}
                  </Text>
                  {a.keyVerse && unlocked && (
                    <Text style={{
                      fontSize: 11, color: tokens.actionPrimary,
                      marginTop: 2, fontStyle: 'italic',
                    }}>
                      {a.keyVerse}
                    </Text>
                  )}
                </View>

                {unlocked && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={tokens.success}
                  />
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}