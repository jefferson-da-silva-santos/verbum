/**
 * VERBUM — src/api/cacheManager.ts  [FINAL]
 *
 * Sem mudanças lógicas — apenas alinhado com o BibleApiClient final.
 * getBooks() não recebe version (a BIBLIAAPI retorna os 66 livros sem filtro).
 */

import { BibleApiClient } from './bibliaApi';
import { ApiError }       from './endpoints';
import type { ApiChapterResponse, ApiSearchResponse } from './endpoints';
import { cacheRepo }      from '../database/repositories';

// ─── Tipos normalizados para o app ────────────

export interface VerseData {
  number: number;
  text:   string;
}

export interface ChapterData {
  bookSlug:    string;
  bookName:    string;
  bookAbbrev:  string;
  version:     string;
  chapterNum:  number;
  totalVerses: number;
  verses:      VerseData[];
  fromCache:   boolean;
  isStale:     boolean;
}

export interface SearchResultItem {
  bookName:      string;
  bookAbbrev:    string;
  chapterNumber: number;
  verseNumber:   number;
  text:          string;
  reference:     string;
}

export interface SearchResult {
  items:      SearchResultItem[];
  totalCount: number;
  query:      string;
}

// ─── Normalização ─────────────────────────────

function normalizeChapter(
  bookSlug:  string,
  apiData:   ApiChapterResponse,
  fromCache: boolean,
  isStale:   boolean,
): ChapterData {
  return {
    bookSlug,
    bookName:    apiData.book.name,
    bookAbbrev:  apiData.book.abbrev.pt,
    version:     apiData.book.version,
    chapterNum:  apiData.chapter.number,
    totalVerses: apiData.chapter.verses,
    verses:      apiData.verses.map(v => ({ number: v.number, text: v.text })),
    fromCache,
    isStale,
  };
}

function normalizeSearch(query: string, apiData: ApiSearchResponse): SearchResult {
  return {
    query,
    totalCount: apiData.occurrence,
    items: apiData.verses.map(v => ({
      bookName:      v.book.name,
      bookAbbrev:    v.book.abbrev.pt,
      chapterNumber: v.chapter,
      verseNumber:   v.number,
      text:          v.text,
      reference:     `${v.book.abbrev.pt} ${v.chapter}:${v.number}`,
    })),
  };
}

// ─── Cache Manager ────────────────────────────

export const CacheManager = {

  async initialize(): Promise<void> {
    try {
      const evicted = await cacheRepo.evictExpired();
      if (evicted > 0) console.log(`[CacheManager] ${evicted} entradas expiradas removidas.`);
      const total = await cacheRepo.count();
      if (total > 500) await cacheRepo.evictOldest(500);
    } catch (e) {
      console.warn('[CacheManager] Erro na inicialização:', e);
    }
  },

  /**
   * Retorna o capítulo completo.
   * Estratégia: cache fresco → API → stale → erro.
   */
  async getChapter(
    version:  string,
    bookSlug: string,
    chapter:  number,
  ): Promise<ChapterData> {

    // 1. Cache fresco
    const isFresh = await cacheRepo.isFresh(version, bookSlug, chapter);
    if (isFresh) {
      const cached = await cacheRepo.get(version, bookSlug, chapter);
      if (cached) {
        const parsed = JSON.parse(cached.data) as ApiChapterResponse;
        return normalizeChapter(bookSlug, parsed, true, false);
      }
    }

    // 2. API
    try {
      const apiData = await BibleApiClient.getChapterVerses(version, bookSlug, chapter);

      // Salvar no cache (fire-and-forget)
      cacheRepo.set(version, bookSlug, chapter, JSON.stringify(apiData)).catch(
        e => console.warn('[CacheManager] Falha ao salvar cache:', e),
      );

      return normalizeChapter(bookSlug, apiData, false, false);

    } catch (apiErr) {
      // 3. Stale fallback
      const stale = await cacheRepo.get(version, bookSlug, chapter);
      if (stale) {
        console.warn(`[CacheManager] Usando stale para ${bookSlug} ${chapter}`);
        const parsed = JSON.parse(stale.data) as ApiChapterResponse;
        return normalizeChapter(bookSlug, parsed, true, true);
      }
      throw apiErr;
    }
  },

  async prefetchNext(
    version: string, bookSlug: string, chapter: number, totalChapters: number,
  ): Promise<void> {
    const next = chapter + 1;
    if (next > totalChapters) return;
    if (await cacheRepo.isFresh(version, bookSlug, next)) return;
    try {
      const data = await BibleApiClient.getChapterVerses(version, bookSlug, next);
      await cacheRepo.set(version, bookSlug, next, JSON.stringify(data));
    } catch { /* silencioso */ }
  },

  async prefetchPrev(version: string, bookSlug: string, chapter: number): Promise<void> {
    const prev = chapter - 1;
    if (prev < 1) return;
    if (await cacheRepo.isFresh(version, bookSlug, prev)) return;
    try {
      const data = await BibleApiClient.getChapterVerses(version, bookSlug, prev);
      await cacheRepo.set(version, bookSlug, prev, JSON.stringify(data));
    } catch { /* silencioso */ }
  },

  async search(query: string, version: string): Promise<SearchResult> {
    if (!query.trim()) return { query, items: [], totalCount: 0 };
    const apiData = await BibleApiClient.search(query.trim(), version);
    return normalizeSearch(query, apiData);
  },

  async invalidate(version: string, bookSlug: string, chapter: number): Promise<void> {
    await cacheRepo.delete(version, bookSlug, chapter);
  },

  async cacheSize(): Promise<number> { return cacheRepo.count(); },

  async isChapterCached(version: string, bookSlug: string, chapter: number): Promise<boolean> {
    return cacheRepo.isFresh(version, bookSlug, chapter);
  },

} as const;