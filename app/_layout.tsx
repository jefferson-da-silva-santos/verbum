/**
 * VERBUM — app/_layout.tsx  [ATUALIZADO com rotas legais]
 */

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider }    from 'react-native-safe-area-context';
import { Stack, router }       from 'expo-router';
import * as SplashScreen       from 'expo-splash-screen';

import { ThemeProvider, AuthProvider, PlanProvider, useTheme } from '../src/context';
import { useAuthContext }  from '../src/context/AuthContext';
import { initDatabase, getDb } from '../src/database';
import { CacheManager }   from '../src/api/cacheManager';
import { migrate002 }     from '../src/database/migrations/002_features';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <PlanProvider>
            <RootNavigator />
          </PlanProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { tokens }                     = useTheme();
  const { isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        try {
          const db = getDb();
          await migrate002(db);
          console.log('[DB] Migration 002 concluída com sucesso.');
        } catch (migrationErr) {
          console.warn('[DB] Migration 002 falhou (pode já ter rodado):', migrationErr);
        }
        CacheManager.initialize().catch(() => {});
      } catch (err) {
        console.error('[DB] Erro crítico na inicialização:', err);
      } finally {
        await SplashScreen.hideAsync();
      }
    })();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? '/(app)' : '/(auth)/onboarding');
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

      {/* ── LEITOR ── */}
      <Stack.Screen
        name="(app)/modals/chapter-reader"
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />

      {/* ── COMPARAÇÃO ── */}
      <Stack.Screen name="(app)/modals/verse-compare"         options={{ presentation: 'modal' }} />

      {/* ── CADERNO DO PREGADOR ── */}
      <Stack.Screen name="(app)/modals/sermon-list"           options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="(app)/modals/sermon-editor"
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_right' }}
      />

      {/* ── MODO PÚLPITO ── */}
      <Stack.Screen
        name="(app)/modals/pulpit-mode"
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />

      {/* ── MAPAS TEMÁTICOS ── */}
      <Stack.Screen name="(app)/modals/thematic-maps"         options={{ presentation: 'modal' }} />

      {/* ── EXPOSIÇÃO GUIADA ── */}
      <Stack.Screen name="(app)/modals/study-note"            options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/study-notes-list"      options={{ presentation: 'modal' }} />

      {/* ── CONEXÕES PROFÉTICAS ── */}
      <Stack.Screen name="(app)/modals/prophetic-connections" options={{ presentation: 'modal' }} />

      {/* ── LEGAL (LGPD) ── */}
      <Stack.Screen name="(app)/modals/privacy-policy"        options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/terms"                 options={{ presentation: 'modal' }} />

      {/* ── DEMAIS MODAIS ── */}
      <Stack.Screen name="(app)/modals/create-plan"           options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/note-editor"           options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/search"                options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/settings"              options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/achievements"          options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/favorites"             options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/diary-list"            options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/diary-editor"          options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/book-selector"         options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/calibrate-speed"          options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/plan-detail"             options={{ presentation: 'modal' }} />
    </Stack>
  );
}