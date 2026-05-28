/**
 * VERBUM — BaseRepository
 *
 * Classe base para todos os repositories. Fornece:
 *   - Acesso lazy ao db via getDb()
 *   - Geração de UUID v4
 *   - Helpers de timestamp ISO
 *   - Serialização/desserialização de JSON e booleans
 *   - Log padronizado de erros
 *
 * Convenção de erro:
 *   Todos os métodos lançam errors descritivos com prefixo "[NomeRepository]".
 *   A camada de UI/Context é responsável por tratar os erros.
 */

import type { SQLiteDatabase } from "expo-sqlite";
import { getDb } from "../index";

export abstract class BaseRepository {
  /** Nome do repository — usado em logs de erro */
  protected abstract readonly name: string;

  // ───────────────────────────────────────
  // DB ACCESS
  // ───────────────────────────────────────

  protected get db(): SQLiteDatabase {
    return getDb();
  }

  // ───────────────────────────────────────
  // UUID
  // ───────────────────────────────────────

  /**
   * Gera um UUID v4.
   * Usa crypto.randomUUID() quando disponível (React Native Hermes + RN 0.73+),
   * com fallback baseado em Math.random() para ambientes sem suporte.
   */
  protected generateId(): string {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
    // Fallback RFC 4122 v4
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // ───────────────────────────────────────
  // TIMESTAMPS
  // ───────────────────────────────────────

  /** Retorna o timestamp atual em ISO 8601 */
  protected now(): string {
    return new Date().toISOString();
  }

  /** Retorna a data atual no formato ISO date "2025-01-15" */
  protected today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // ───────────────────────────────────────
  // JSON HELPERS
  // ───────────────────────────────────────

  /** Serializa um valor para string JSON armazenada no SQLite */
  protected toJson<T>(value: T): string {
    return JSON.stringify(value);
  }

  /**
   * Desserializa uma string JSON vinda do SQLite.
   * Retorna o fallback em caso de JSON inválido (dados corrompidos).
   */
  protected fromJson<T>(raw: string | null | undefined, fallback: T): T {
    if (raw === null || raw === undefined || raw === "") return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      console.warn(
        `[${this.name}] JSON inválido no banco, usando fallback:`,
        raw,
      );
      return fallback;
    }
  }

  // ───────────────────────────────────────
  // BOOLEAN HELPERS
  // SQLite não tem BOOLEAN — usa INTEGER 0|1
  // ───────────────────────────────────────

  /** Converte boolean para INTEGER (0 | 1) */
  protected boolToInt(value: boolean): number {
    return value ? 1 : 0;
  }

  /** Converte INTEGER (0 | 1 | null) para boolean */
  protected intToBool(value: number | null | undefined): boolean {
    return value === 1;
  }

  // ───────────────────────────────────────
  // ERROR HELPER
  // ───────────────────────────────────────

  /**
   * Envolve um erro genérico em um erro descritivo com contexto do repository.
   * Útil para identificar a origem do erro em logs de produção.
   */
  protected wrapError(method: string, error: unknown): Error {
    const message = error instanceof Error ? error.message : String(error);
    return new Error(`[${this.name}::${method}] ${message}`);
  }
}
