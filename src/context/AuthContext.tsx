/**
 * VERBUM — AuthContext
 *
 * Gerencia a sessão do usuário autenticado localmente.
 *
 * Fluxo de autenticação (MVP local — sem backend):
 *   register → cria perfil no SQLite → persiste userId no SecureStore
 *   login    → busca por email no SQLite → persiste userId no SecureStore
 *   logout   → remove userId do SecureStore → limpa estado
 *
 * Na abertura do app o contexto lê o userId salvo, carrega o User do SQLite
 * e restaura a sessão automaticamente sem exibir a tela de login.
 *
 * Expansão futura: a interface está desenhada para adicionar autenticação
 * remota (JWT, OAuth) sem alterar os consumers — apenas a implementação
 * interna de login/register muda.
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';

import { userRepo } from '../database/repositories';
import type { User, CreateUserInput, UpdateUserInput } from '../database/types';
import { DEFAULT_MINUTES_PER_CHAPTER, DEFAULT_BIBLE_VERSION } from '../constants/bible';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

const SESSION_KEY = 'verbum_user_id';

export interface RegisterInput {
  name: string;
  email: string;
}

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User };

type AuthAction =
  | { type: 'LOADING' }
  | { type: 'SET_USER'; user: User }
  | { type: 'CLEAR_USER' };

export interface AuthContextValue {
  /** Usuário autenticado — null se não autenticado */
  user: User | null;
  /** true durante o carregamento inicial da sessão */
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Cria um novo perfil e inicia a sessão */
  register: (input: RegisterInput) => Promise<void>;
  /** Autentica com email (MVP local — sem senha) */
  login: (email: string) => Promise<void>;
  /** Encerra a sessão e limpa o SecureStore */
  logout: () => Promise<void>;
  /** Atualiza campos do perfil e refresca o estado */
  updateProfile: (input: UpdateUserInput) => Promise<void>;
  /** Sincroniza o estado local após update externo (ex: settings) */
  refreshUser: () => Promise<void>;
}

// ─────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOADING': return { status: 'loading' };
    case 'SET_USER': return { status: 'authenticated', user: action.user };
    case 'CLEAR_USER': return { status: 'unauthenticated' };
  }
}

// ─────────────────────────────────────────────
// CONTEXTO
// ─────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { status: 'loading' });

  // ── Restaurar sessão na abertura do app ──────

  useEffect(() => {
    (async () => {
      try {
        const savedId = await SecureStore.getItemAsync(SESSION_KEY);
        if (savedId) {
          const user = await userRepo.findById(savedId);
          if (user) {
            dispatch({ type: 'SET_USER', user });
            return;
          }
        }
      } catch (e) {
        console.warn('[AuthContext] Falha ao restaurar sessão:', e);
      }
      dispatch({ type: 'CLEAR_USER' });
    })();
  }, []);

  // ── register ─────────────────────────────────

  const register = useCallback(async (input: RegisterInput) => {
    const already = await userRepo.exists(input.email);
    if (already) {
      throw new Error('Este e-mail já está cadastrado.');
    }

    const newUser = await userRepo.create({
      name: input.name,
      email: input.email,
      avatarUrl: null,
      preferredVersion: DEFAULT_BIBLE_VERSION,
      avgReadingSpeed: DEFAULT_MINUTES_PER_CHAPTER,
      fontScale: 1.0,
      darkModePreference: 'system',
      notificationsEnabled: true,
      reminderTime: null,
    } satisfies CreateUserInput);

    await SecureStore.setItemAsync(SESSION_KEY, newUser.id);
    dispatch({ type: 'SET_USER', user: newUser });
  }, []);

  // ── login ────────────────────────────────────

  const login = useCallback(async (email: string) => {
    const user = await userRepo.findByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new Error('Nenhuma conta encontrada com este e-mail.');
    }
    await SecureStore.setItemAsync(SESSION_KEY, user.id);
    dispatch({ type: 'SET_USER', user });
  }, []);

  // ── logout ───────────────────────────────────

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    dispatch({ type: 'CLEAR_USER' });
  }, []);

  // ── updateProfile ────────────────────────────

  const updateProfile = useCallback(async (input: UpdateUserInput) => {
    if (state.status !== 'authenticated') return;
    const updated = await userRepo.update(state.user.id, input);
    dispatch({ type: 'SET_USER', user: updated });
  }, [state]);

  // ── refreshUser ──────────────────────────────

  const refreshUser = useCallback(async () => {
    if (state.status !== 'authenticated') return;
    const fresh = await userRepo.findById(state.user.id);
    if (fresh) dispatch({ type: 'SET_USER', user: fresh });
  }, [state]);

  // ── Valor do contexto ────────────────────────

  const value: AuthContextValue = {
    user: state.status === 'authenticated' ? state.user : null,
    isLoading: state.status === 'loading',
    isAuthenticated: state.status === 'authenticated',
    register,
    login,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────
// HOOK PÚBLICO
// ─────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext() deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
}