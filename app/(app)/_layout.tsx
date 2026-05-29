/**
 * VERBUM — app/(app)/_layout.tsx
 * Bottom Tab Navigator com paleta marrom/pergaminho.
 */

import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function AppLayout() {
  const { tokens } = useTheme();

  function icon(name: IconName, activeName?: IconName) {
    return ({ color, focused }: { color: string; focused: boolean }) => (
      <MaterialCommunityIcons
        name={focused && activeName ? activeName : name}
        size={24}
        color={color}
      />
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tokens.tabBarActive,
        tabBarInactiveTintColor: tokens.tabBarInactive,
        tabBarStyle: {
          backgroundColor: tokens.tabBarBg,
          borderTopColor: tokens.tabBarBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="reader" options={{ title: 'Bíblia', tabBarIcon: icon('book-open-outline', 'book-open-variant') }} />
      <Tabs.Screen name="plans" options={{ title: 'Planos', tabBarIcon: icon('calendar-outline', 'calendar') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progresso', tabBarIcon: icon('chart-line', 'chart-line') }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icon('account-outline', 'account') }} />
      <Tabs.Screen name="modals" options={{ href: null }} />
    </Tabs>
  );
}