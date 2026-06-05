/**
 * VERBUM — app/_layout.tsx  [CORRIGIDO]
 *
 * FIX 1: migrate002 agora roda DENTRO de initDatabase com try-catch.
 *        Se falhar, o app continua funcionando sem as novas features
 *        (melhor do que crashar o app inteiro).
 *
 * FIX 2: initDatabase() deve ser chamado primeiro, e migrate002
 *        deve receber o db já inicializado.
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
        // 1. Inicializa o banco principal (tabelas base: users, plans, etc.)
        await initDatabase();

        // 2. Roda a migration das features avançadas DEPOIS da base
        //    Envolto em try-catch para não quebrar o app se já rodou
        //    ou se houver algum conflito
        try {
          const db = getDb();
          await migrate002(db);
          console.log('[DB] Migration 002 concluída com sucesso.');
        } catch (migrationErr) {
          // Não crasha o app — apenas loga o erro
          console.warn('[DB] Migration 002 falhou (pode já ter rodado):', migrationErr);
        }

        // 3. Limpa cache expirado em background
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
      <View style={{
        flex: 1,
        backgroundColor: tokens.bgPrimary,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ActivityIndicator size="large" color={tokens.actionPrimary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />

      {/* Leitor */}
      <Stack.Screen
        name="(app)/modals/chapter-reader"
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />

      {/* Comparação */}
      <Stack.Screen name="(app)/modals/verse-compare"         options={{ presentation: 'modal' }} />

      {/* Caderno do Pregador */}
      <Stack.Screen name="(app)/modals/sermon-list"           options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="(app)/modals/sermon-editor"
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_right' }}
      />

      {/* Modo Púlpito */}
      <Stack.Screen
        name="(app)/modals/pulpit-mode"
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />

      {/* Mapas Temáticos */}
      <Stack.Screen name="(app)/modals/thematic-maps"         options={{ presentation: 'modal' }} />

      {/* Exposição Guiada */}
      <Stack.Screen name="(app)/modals/study-note"            options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/study-notes-list"      options={{ presentation: 'modal' }} />

      {/* Conexões Proféticas */}
      <Stack.Screen name="(app)/modals/prophetic-connections" options={{ presentation: 'modal' }} />

      {/* Demais modais */}
      <Stack.Screen name="(app)/modals/create-plan"           options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/note-editor"           options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/search"                options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/settings"              options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/achievements"          options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/favorites"             options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/diary-list"            options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/diary-editor"          options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/book-selector"         options={{ presentation: 'modal' }} />
      <Stack.Screen name="(app)/modals/calibrate-speed"       options={{ presentation: 'modal' }} />
    </Stack>
  );
}