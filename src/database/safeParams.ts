/**
 * VERBUM — src/database/repositories/safeParams.ts
 *
 * Utilitário compartilhado para garantir que todos os parâmetros
 * passados ao SQLite sejam tipos seguros no Android/Hermes.
 *
 * REGRA DO expo-sqlite v15 + Hermes:
 *   SQLiteBindValue = string | number | null   (SEM boolean, SEM object)
 *
 * COMO USAR:
 *   import { b, j } from './safeParams';
 *
 *   await db.runAsync(sql, [
 *     b(user.notificationsEnabled),  // boolean → 0 ou 1
 *     j(user.preferences),           // object  → JSON string
 *     user.name,                     // string  → string (direto)
 *     user.age,                      // number  → number (direto)
 *   ]);
 */

/** Converte boolean para integer SQLite-safe: true→1, false→0 */
export function b(value: boolean | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return value ? 1 : 0;
}

/** Converte object/array para JSON string SQLite-safe */
export function j(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

/** Converte qualquer valor para um tipo SQLite-safe */
export function safe(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean')  return value ? 1 : 0;
  if (typeof value === 'number')   return isFinite(value) ? value : null;
  if (typeof value === 'string')   return value;
  if (typeof value === 'object')   return JSON.stringify(value);
  return String(value);
}

/**
 * Valida um array de parâmetros antes de passar ao SQLite.
 * Lança erro descritivo se encontrar um tipo inválido.
 * Útil para debugar em desenvolvimento.
 */
export function validateParams(
  params: unknown[],
  context: string = 'SQLite',
): (string | number | null)[] {
  return params.map((p, i) => {
    if (p === null || p === undefined)      return null;
    if (typeof p === 'string')              return p;
    if (typeof p === 'number' && isFinite(p)) return p;
    if (typeof p === 'boolean')             return p ? 1 : 0;

    // Qualquer outro tipo: logar e converter para evitar crash em produção
    console.warn(
      `[${context}] Parâmetro inválido no índice ${i}:`,
      typeof p,
      JSON.stringify(p)?.slice(0, 100),
    );
    return JSON.stringify(p) ?? null;
  });
}