/**
 * VERBUM — Hook: useAuth
 *
 * Consumer do AuthContext com alias mais curto e mensagem de erro clara.
 * Adiciona guards de tipo para o caso autenticado.
 *
 * Uso:
 *   const { user, login, logout } = useAuth();
 *   if (!user) return <LoginScreen />;
 */

import { useAuthContext } from "../context/AuthContext";
import type { AuthContextValue } from "../context/AuthContext";

export function useAuth(): AuthContextValue {
  return useAuthContext();
}

/**
 * Hook que garante que o usuário está autenticado.
 * Lança erro se usado fora do fluxo autenticado.
 * Usar apenas em telas protegidas (dentro do (app) route group).
 */
export function useRequiredUser() {
  const { user, isAuthenticated } = useAuthContext();
  if (!isAuthenticated || !user) {
    throw new Error(
      "useRequiredUser() chamado sem usuário autenticado. " +
        "Verifique se a tela está protegida pelo AuthGuard.",
    );
  }
  return user;
}
