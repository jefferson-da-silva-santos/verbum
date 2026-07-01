/**
 * VERBUM — CacheRepository [named params fix]
 */
import { BaseRepository } from "./BaseRepository";
import type { ApiCacheEntry } from "../types";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

interface CacheRow {
  cache_key: string; bible_version: string; book_slug: string;
  chapter_number: number; data: string; cached_at: string; expires_at: string;
}

export class CacheRepository extends BaseRepository {
  protected readonly name = "CacheRepository";

  private static buildKey(version: string, bookSlug: string, chapter: number): string {
    return `${version}:${bookSlug}:${chapter}:verses`;
  }

  private mapRow(row: CacheRow): ApiCacheEntry {
    return { cacheKey: row.cache_key, bibleVersion: row.bible_version, bookSlug: row.book_slug, chapterNumber: row.chapter_number, data: row.data, cachedAt: row.cached_at, expiresAt: row.expires_at };
  }

  async get(version: string, bookSlug: string, chapter: number): Promise<ApiCacheEntry | null> {
    try {
      const key = CacheRepository.buildKey(version, bookSlug, chapter);
      const row = await this.db.getFirstAsync<CacheRow>(
        `SELECT * FROM api_cache WHERE cache_key = $key`, { $key: key },
      );
      return row ? this.mapRow(row) : null;
    } catch (e) { throw this.wrapError("get", e); }
  }

  async isFresh(version: string, bookSlug: string, chapter: number): Promise<boolean> {
    try {
      const key = CacheRepository.buildKey(version, bookSlug, chapter);
      const now = new Date().toISOString();
      const row = await this.db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM api_cache WHERE cache_key = $key AND expires_at > $now`,
        { $key: key, $now: now },
      );
      return (row?.c ?? 0) > 0;
    } catch (e) { throw this.wrapError("isFresh", e); }
  }

  async set(version: string, bookSlug: string, chapter: number, data: string): Promise<void> {
    try {
      const key = CacheRepository.buildKey(version, bookSlug, chapter);
      const now = new Date();
      const cachedAt = now.toISOString();
      const expiresAt = new Date(now.getTime() + CACHE_TTL_MS).toISOString();
      await this.db.runAsync(
        `INSERT OR REPLACE INTO api_cache (cache_key, bible_version, book_slug, chapter_number, data, cached_at, expires_at)
         VALUES ($key, $version, $bookSlug, $chapter, $data, $cachedAt, $expiresAt)`,
        { $key: key, $version: version, $bookSlug: bookSlug, $chapter: chapter, $data: data, $cachedAt: cachedAt, $expiresAt: expiresAt },
      );
    } catch (e) { throw this.wrapError("set", e); }
  }

  async delete(version: string, bookSlug: string, chapter: number): Promise<void> {
    try {
      const key = CacheRepository.buildKey(version, bookSlug, chapter);
      await this.db.runAsync(`DELETE FROM api_cache WHERE cache_key = $key`, { $key: key });
    } catch (e) { throw this.wrapError("delete", e); }
  }

  async evictExpired(): Promise<number> {
    try {
      const result = await this.db.runAsync(
        `DELETE FROM api_cache WHERE expires_at < $now`, { $now: new Date().toISOString() },
      );
      return result.changes;
    } catch (e) { throw this.wrapError("evictExpired", e); }
  }

  async evictOldest(keepCount: number = MAX_CACHE_ENTRIES): Promise<void> {
    try {
      await this.db.runAsync(
        `DELETE FROM api_cache WHERE cache_key NOT IN (SELECT cache_key FROM api_cache ORDER BY cached_at DESC LIMIT $keepCount)`,
        { $keepCount: keepCount },
      );
    } catch (e) { throw this.wrapError("evictOldest", e); }
  }

  async count(): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM api_cache`);
      return row?.c ?? 0;
    } catch (e) { throw this.wrapError("count", e); }
  }
}