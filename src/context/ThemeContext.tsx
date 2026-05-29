/**
 * VERBUM — ThemeContext
 *
 * Fornece os tokens de cor corretos (light ou dark) para toda a árvore.
 * Persiste a preferência do usuário via SecureStore para sobreviver restarts.
 *
 * Hierarquia de decisão da aparência:
 *   preference === 'system' → segue useColorScheme() do dispositivo
 *   preference === 'light'  → força modo claro independente do sistema
 *   preference === 'dark'   → força modo escuro independente do sistema
 *
 * Uso nos componentes:
 *   const { tokens, isDark, shadows } = useTheme();
 *   <View style={{ backgroundColor: tokens.bgCard }} />
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import {
  LightTokens,
  DarkTokens,
  Shadows,
  DarkShadows,
} from '../constants/colors';
import type { ColorTokens } from '../constants/colors';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  /** Tokens semânticos prontos para uso nos StyleSheets */
  tokens: ColorTokens;
  /** Se o tema escuro está ativo no momento */
  isDark: boolean;
  /** Preferência configurada pelo usuário */
  preference: ThemePreference;
  /** Sombras correspondentes ao tema ativo */
  shadows: typeof Shadows | typeof DarkShadows;
  /**
   * Altera a preferência de tema e persiste via SecureStore.
   * Atualização de estado é síncrona; persistência é assíncrona (fire-and-forget).
   */
  setPreference: (pref: ThemePreference) => void;
}

// ─────────────────────────────────────────────
// CONTEXTO
// ─────────────────────────────────────────────

const THEME_PREF_KEY = 'verbum_theme_preference';

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Carregar preferência salva no primeiro mount
  useEffect(() => {
    SecureStore.getItemAsync(THEME_PREF_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    }).catch(() => { /* usa padrão 'system' se SecureStore falhar */ });
  }, []);

  // Calcular se o dark mode está ativo
  const isDark: boolean =
    preference === 'dark' ||
    (preference === 'system' && systemScheme === 'dark');

  const tokens = isDark ? DarkTokens : LightTokens;
  const shadows = isDark ? DarkShadows : Shadows;

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    // Persiste em background — não bloqueia a UI
    SecureStore.setItemAsync(THEME_PREF_KEY, pref).catch(
      (e) => console.warn('[ThemeContext] Falha ao persistir preferência:', e),
    );
  }, []);

  return (
    <ThemeContext.Provider value={{ tokens, isDark, preference, shadows, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─────────────────────────────────────────────
// HOOK PÚBLICO
// ─────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() deve ser usado dentro de <ThemeProvider>');
  }
  return ctx;
}