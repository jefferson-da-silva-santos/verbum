/**
 * VERBUM — Context Layer (Barrel Export)
 *
 * Exporta providers e hooks de contexto.
 *
 * Ordem obrigatória de aninhamento em app/_layout.tsx:
 *
 *   <ThemeProvider>       ← sem dependências
 *     <AuthProvider>      ← sem dependências de contexto
 *       <PlanProvider>    ← depende de AuthContext
 *         {children}
 *       </PlanProvider>
 *     </AuthProvider>
 *   </ThemeProvider>
 */

export { ThemeProvider, useTheme } from "./ThemeContext";
export type { ThemePreference, ThemeContextValue } from "./ThemeContext";

export { AuthProvider, useAuthContext } from "./AuthContext";
export type { AuthContextValue, RegisterInput } from "./AuthContext";

export { PlanProvider, usePlanContext } from "./PlanContext";
export type { PlanContextValue } from "./PlanContext";
