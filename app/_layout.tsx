/**
 * VERBUM — app/_layout.tsx
 * Root layout: providers, inicialização do banco e AuthGuard.
 */

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider, AuthProvider, PlanProvider, useTheme } from '../src/context';
import { useAuthContext } from '../src/context/AuthContext';
import { initDatabase } from '../src/database';
import { CacheManager } from '../src/api/cacheManager';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlanProvider>
          <RootNavigator />
        </PlanProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { tokens } = useTheme();
  const { isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        CacheManager.initialize().catch(() => { });
      } finally {
        await SplashScreen.hideAsync();
      }
    })();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/(app)');
    } else {
      router.replace('/(auth)/onboarding');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={tokens.actionPrimary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen
        name="(app)/modals/chapter-reader"
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="(app)/modals/create-plan" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/note-editor" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/search" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/achievements" options={{ presentation: 'modal' }} />
    </Stack>
  );
}