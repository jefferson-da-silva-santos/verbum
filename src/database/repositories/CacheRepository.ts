/**
 * VERBUM — CacheRepository
 *
 * Cache local de respostas da BIBLIAAPI v2.
 * Estratégia: offline-first com TTL de 30 dias.
 *
 * Fluxo de leitura recomendado:
 *   1. isFresh() → true  → usar cache
 *   2. isFresh() → false + rede OK → buscar API → set() → usar
 *   3. isFresh() → false + sem rede → get() (stale) → usar como fallback
 */

import { BaseRepository } from "./BaseRepository";
import type { ApiCacheEntry } from "../types";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const MAX_CACHE_ENTRIES = 500;

interface CacheRow {
  cache_key: string;
  bible_version: string;
  book_slug: string;
  chapter_number: number;
  data: string;
  cached_at: string;
  expires_at: string;
}

export class CacheRepository extends BaseRepository {
  protected readonly name = "CacheRepository";

  private static buildKey(
    version: string,
    bookSlug: string,
    chapter: number,
  ): string {
    return `${version}:${bookSlug}:${chapter}:verses`;
  }

  private mapRow(row: CacheRow): ApiCacheEntry {
    return {
      cacheKey: row.cache_key,
      bibleVersion: row.bible_version,
      bookSlug: row.book_slug,
      chapterNumber: row.chapter_number,
      data: row.data,
      cachedAt: row.cached_at,
      expiresAt: row.expires_at,
    };
  }

  /**
   * Busca entrada de cache — retorna mesmo que expirada (fallback offline).
   * Use isFresh() para verificar validade antes de decidir buscar da API.
   */
  async get(
    version: string,
    bookSlug: string,
    chapter: number,
  ): Promise<ApiCacheEntry | null> {
    try {
      const key = CacheRepository.buildKey(version, bookSlug, chapter);
      const row = await this.db.getFirstAsync<CacheRow>(
        "SELECT * FROM api_cache WHERE cache_key = ?",
        [key],
      );
      return row ? this.mapRow(row) : null;
    } catch (e) {
      throw this.wrapError("get", e);
    }
  }

  async isFresh(
    version: string,
    bookSlug: string,
    chapter: number,
  ): Promise<boolean> {
    try {
      const key = CacheRepository.buildKey(version, bookSlug, chapter);
      const now = new Date().toISOString();
      const row = await this.db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) as c FROM api_cache WHERE cache_key = ? AND expires_at > ?",
        [key, now],
      );
      return (row?.c ?? 0) > 0;
    } catch (e) {
      throw this.wrapError("isFresh", e);
    }
  }

  /** Armazena (ou renova) a resposta de um capítulo */
  async set(
    version: string,
    bookSlug: string,
    chapter: number,
    data: string,
  ): Promise<void> {
    try {
      const key = CacheRepository.buildKey(version, bookSlug, chapter);
      const now = new Date();
      const cachedAt = now.toISOString();
      const expiresAt = new Date(now.getTime() + CACHE_TTL_MS).toISOString();

      await this.db.runAsync(
        `INSERT OR REPLACE INTO api_cache
          (cache_key, bible_version, book_slug, chapter_number, data, cached_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [key, version, bookSlug, chapter, data, cachedAt, expiresAt],
      );
    } catch (e) {
      throw this.wrapError("set", e);
    }
  }

  async delete(
    version: string,
    bookSlug: string,
    chapter: number,
  ): Promise<void> {
    try {
      const key = CacheRepository.buildKey(version, bookSlug, chapter);
      await this.db.runAsync("DELETE FROM api_cache WHERE cache_key = ?", [
        key,
      ]);
    } catch (e) {
      throw this.wrapError("delete", e);
    }
  }

  /** Remove entradas expiradas — chamar em background na inicialização */
  async evictExpired(): Promise<number> {
    try {
      const result = await this.db.runAsync(
        "DELETE FROM api_cache WHERE expires_at < ?",
        [new Date().toISOString()],
      );
      return result.changes;
    } catch (e) {
      throw this.wrapError("evictExpired", e);
    }
  }

  /** Mantém apenas as N entradas mais recentes */
  async evictOldest(keepCount: number = MAX_CACHE_ENTRIES): Promise<void> {
    try {
      await this.db.runAsync(
        `DELETE FROM api_cache WHERE cache_key NOT IN (
           SELECT cache_key FROM api_cache ORDER BY cached_at DESC LIMIT ?
         )`,
        [keepCount],
      );
    } catch (e) {
      throw this.wrapError("evictOldest", e);
    }
  }

  async count(): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) as c FROM api_cache",
      );
      return row?.c ?? 0;
    } catch (e) {
      throw this.wrapError("count", e);
    }
  }
}
