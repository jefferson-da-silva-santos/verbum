/**
 * VERBUM — src/context/ThemeContext.tsx  [FIX DEFINITIVO]
 *
 * Problemas anteriores:
 *   1. `if (!isLoaded) return null` desmontava toda a árvore → comportamento errático
 *   2. Quando o usuário mudava o tema, o estado local atualizava mas o SecureStore
 *      podia falhar silenciosamente, e no próximo boot voltava ao 'system'
 *   3. Possível problema de key no SecureStore (caracteres especiais)
 *
 * Solução:
 *   - Nunca retorna null — renderiza com 'system' imediatamente
 *   - Aplica a preferência salva assim que carrega (sem bloquear)
 *   - setTheme: atualiza estado E persiste, logando qualquer erro
 *   - Key do SecureStore: apenas letras e underscore (seguro em todos SDKs)
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
import * as SecureStore   from 'expo-secure-store';

import { LightTokens, DarkTokens } from '../constants/colors';

// ─── Tipos ───────────────────────────────────────────────────────

export type ThemePreference = 'light' | 'dark' | 'system';

export type ColorTokens = {
  readonly [K in keyof typeof LightTokens]: string;
};

interface ThemeContextValue {
  tokens:     ColorTokens;
  isDark:     boolean;
  preference: ThemePreference;
  setTheme:   (pref: ThemePreference) => Promise<void>;
}

// Chave sem caracteres especiais — compatível com todos os SDKs do Expo
const THEME_KEY = 'verbum_theme';

// ─── Context ─────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme() deve ser usado dentro de <ThemeProvider>');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme                = useColorScheme(); // 'dark' | 'light' | null
  const [preference, setPreference] = useState<ThemePreference>('system');

  // Carrega preferência salva SEM bloquear a renderização
  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY)
      .then((saved: string | null) => {
        console.log('[ThemeContext] Preferência carregada do storage:', saved);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setPreference(saved);
        }
      })
      .catch(e => {
        console.warn('[ThemeContext] Erro ao carregar preferência:', e);
      });
  }, []);

  // Calcula isDark baseado na preferência ativa
  const isDark: boolean =
    preference === 'dark'  ? true  :
    preference === 'light' ? false :
    systemScheme === 'dark';        // 'system' → segue o SO

  // Cast necessário pois LightTokens e DarkTokens têm literals diferentes
  const tokens = (isDark ? DarkTokens : LightTokens) as ColorTokens;

  // Muda o tema: atualiza estado imediatamente E persiste
  const setTheme = useCallback(async (pref: ThemePreference) => {
    console.log('[ThemeContext] Mudando tema para:', pref);
    setPreference(pref);
    try {
      await SecureStore.setItemAsync(THEME_KEY, pref);
      console.log('[ThemeContext] Tema persistido com sucesso:', pref);
    } catch (e) {
      console.error('[ThemeContext] ERRO ao persistir tema:', e);
    }
  }, []);

  // Log para debug (remover em produção)
  console.log(`[ThemeContext] preference=${preference} | systemScheme=${systemScheme} | isDark=${isDark}`);

  return (
    <ThemeContext.Provider value={{ tokens, isDark, preference, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}