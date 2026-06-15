/**
 * VERBUM — src/context/AuthContext.tsx  [CORRIGIDO]
 *
 * Fix 1: register não passa avatarUrl/preferredVersion para userRepo.create()
 *         pois create() só aceita { name, email } — defaults são internos ao repo.
 *
 * Fix 2: updateProfile não usa o retorno de userRepo.update() (que é void).
 *         Em vez disso, recarrega o usuário com findById após o update.
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

import { userRepo }      from '../database/repositories';
import type { User, UpdateUserInput } from '../database/types';

// ─── Constantes ─────────────────────────────────────────────────────

const SESSION_KEY = 'verbum_user_id';

// ─── Tipos ──────────────────────────────────────────────────────────

export interface RegisterInput {
  name:  string;
  email: string;
}

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User };

type AuthAction =
  | { type: 'LOADING'   }
  | { type: 'SET_USER';  user: User }
  | { type: 'CLEAR_USER' };

export interface AuthContextValue {
  user:            User | null;
  isLoading:       boolean;
  isAuthenticated: boolean;
  register:        (input: RegisterInput)    => Promise<void>;
  login:           (email: string)           => Promise<void>;
  logout:          ()                        => Promise<void>;
  updateProfile:   (input: UpdateUserInput)  => Promise<void>;
  refreshUser:     ()                        => Promise<void>;
}

// ─── Reducer ────────────────────────────────────────────────────────

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOADING':    return { status: 'loading' };
    case 'SET_USER':   return { status: 'authenticated', user: action.user };
    case 'CLEAR_USER': return { status: 'unauthenticated' };
  }
}

// ─── Context ────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext() deve ser usado dentro de <AuthProvider>');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { status: 'loading' });

  // ── Restaurar sessão na inicialização ───────────────────────────

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

  // ── register ────────────────────────────────────────────────────

  const register = useCallback(async (input: RegisterInput) => {
    const already = await userRepo.exists(input.email);
    if (already) throw new Error('Este e-mail já está cadastrado neste dispositivo.');

    // FIX 1: apenas name e email — todos os outros campos têm default no repo
    const newUser = await userRepo.create({
      name:  input.name.trim(),
      email: input.email.trim().toLowerCase(),
    });

    await SecureStore.setItemAsync(SESSION_KEY, newUser.id);
    dispatch({ type: 'SET_USER', user: newUser });
  }, []);

  // ── login ───────────────────────────────────────────────────────

  const login = useCallback(async (email: string) => {
    const user = await userRepo.findByEmail(email.trim().toLowerCase());
    if (!user) throw new Error('Nenhuma conta encontrada com este e-mail.');
    await SecureStore.setItemAsync(SESSION_KEY, user.id);
    dispatch({ type: 'SET_USER', user });
  }, []);

  // ── logout ──────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    dispatch({ type: 'CLEAR_USER' });
  }, []);

  // ── updateProfile ────────────────────────────────────────────────

  const updateProfile = useCallback(async (input: UpdateUserInput) => {
    if (state.status !== 'authenticated') {
      console.warn('[AuthContext] updateProfile chamado sem usuário autenticado.');
      return;
    }

    // FIX 2: update retorna void — recarrega o usuário depois
    await userRepo.update(state.user.id, input);

    const fresh = await userRepo.findById(state.user.id);
    if (fresh) dispatch({ type: 'SET_USER', user: fresh });
  }, [state]);

  // ── refreshUser ─────────────────────────────────────────────────

  const refreshUser = useCallback(async () => {
    if (state.status !== 'authenticated') return;
    const fresh = await userRepo.findById(state.user.id);
    if (fresh) dispatch({ type: 'SET_USER', user: fresh });
  }, [state]);

  // ── Value ────────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user:            state.status === 'authenticated' ? state.user : null,
    isLoading:       state.status === 'loading',
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