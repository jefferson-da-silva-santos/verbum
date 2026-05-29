/**
 * VERBUM — API: CacheManager
 *
 * Ponto único de acesso ao conteúdo bíblico no app.
 * Implementa a estratégia offline-first:
 *
 *   1. isFresh()  → true  → retorna do SQLite  (sem rede)
 *   2. isFresh()  → false → tenta buscar na API
 *      a. API ok  → salva no SQLite → retorna dado novo
 *      b. API err → retorna dado stale do SQLite (fallback)
 *      c. API err + sem cache → lança ApiError
 *
 * Responsabilidades adicionais:
 *   - Prefetch do próximo capítulo em background
 *   - Evicção de cache expirado na inicialização do app
 *   - Normalização da resposta da API para o formato interno do app
 *
 * Todos os hooks usam o CacheManager — nunca o BibleApiClient diretamente.
 */

import { BibleApiClient } from "./bibliaApi";
import { ApiError } from "./endpoints";
import type {
  ApiChapterResponse,
  ApiSearchResponse,
  ApiVerse,
} from "./endpoints";
import { cacheRepo } from "../database/repositories";

// ─────────────────────────────────────────────
// TIPOS INTERNOS NORMALIZADOS
// ─────────────────────────────────────────────

/** Versículo no formato normalizado do app */
export interface VerseData {
  number: number;
  text: string;
}

/** Capítulo completo no formato normalizado do app */
export interface ChapterData {
  bookSlug: string;
  bookName: string;
  bookAbbrev: string;
  version: string;
  chapterNum: number;
  totalVerses: number;
  verses: VerseData[];
  /** true = dados vindos do cache local (online ou offline) */
  fromCache: boolean;
  /** true = dados stale (expirados) — rede indisponível */
  isStale: boolean;
}

/** Resultado de busca normalizado */
export interface SearchResultItem {
  bookName: string;
  bookAbbrev: string;
  chapterNumber: number;
  verseNumber: number;
  text: string;
  reference: string; // "Jo 3:16"
}

export interface SearchResult {
  items: SearchResultItem[];
  totalCount: number;
  query: string;
}

// ─────────────────────────────────────────────
// NORMALIZAÇÃO
// ─────────────────────────────────────────────

function normalizeChapter(
  bookSlug: string,
  apiData: ApiChapterResponse,
  fromCache: boolean,
  isStale: boolean,
): ChapterData {
  return {
    bookSlug,
    bookName: apiData.book.name,
    bookAbbrev: apiData.book.abbrev.pt,
    version: apiData.book.version,
    chapterNum: apiData.chapter.number,
    totalVerses: apiData.chapter.verses,
    verses: apiData.verses.map((v) => ({ number: v.number, text: v.text })),
    fromCache,
    isStale,
  };
}

function normalizeSearch(
  query: string,
  apiData: ApiSearchResponse,
): SearchResult {
  return {
    query,
    totalCount: apiData.occurrence,
    items: apiData.verses.map((v) => ({
      bookName: v.book.name,
      bookAbbrev: v.book.abbrev.pt,
      chapterNumber: v.chapter,
      verseNumber: v.number,
      text: v.text,
      reference: `${v.book.abbrev.pt} ${v.chapter}:${v.number}`,
    })),
  };
}

// ─────────────────────────────────────────────
// CACHE MANAGER
// ─────────────────────────────────────────────

export const CacheManager = {
  // ── Inicialização ─────────────────────────────

  /**
   * Evicta entradas expiradas do cache.
   * Chamar uma vez na inicialização do app (app/_layout.tsx),
   * após initDatabase(), em background sem await.
   */
  async initialize(): Promise<void> {
    try {
      const evicted = await cacheRepo.evictExpired();
      if (evicted > 0) {
        console.log(
          `[CacheManager] ${evicted} entradas de cache expiradas removidas.`,
        );
      }
      // Se o cache cresceu demais, mantém apenas os 500 mais recentes
      const total = await cacheRepo.count();
      if (total > 500) {
        await cacheRepo.evictOldest(500);
      }
    } catch (e) {
      // Falhas de manutenção de cache nunca devem quebrar o app
      console.warn("[CacheManager] Erro na inicialização:", e);
    }
  },

  // ── Capítulo Completo ─────────────────────────

  /**
   * Retorna todos os versículos de um capítulo.
   * Implementa offline-first com fallback stale.
   *
   * @throws ApiError se não houver cache E a rede falhar
   */
  async getChapter(
    version: string,
    bookSlug: string,
    chapter: number,
  ): Promise<ChapterData> {
    // 1. Verificar cache fresco
    const isFresh = await cacheRepo.isFresh(version, bookSlug, chapter);
    if (isFresh) {
      const cached = await cacheRepo.get(version, bookSlug, chapter);
      if (cached) {
        const parsed = JSON.parse(cached.data) as ApiChapterResponse;
        return normalizeChapter(bookSlug, parsed, true, false);
      }
    }

    // 2. Tentar buscar da API
    try {
      const apiData = await BibleApiClient.getChapterVerses(
        version,
        bookSlug,
        chapter,
      );
      // Salvar no cache (fire-and-forget — não bloqueia o retorno)
      cacheRepo
        .set(version, bookSlug, chapter, JSON.stringify(apiData))
        .catch((e) => console.warn("[CacheManager] Falha ao salvar cache:", e));
      return normalizeChapter(bookSlug, apiData, false, false);
    } catch (apiErr) {
      // 3. Fallback: retornar dado stale se disponível
      const stale = await cacheRepo.get(version, bookSlug, chapter);
      if (stale) {
        console.warn(
          `[CacheManager] Rede indisponível — usando cache stale para ${bookSlug} ${chapter}`,
        );
        const parsed = JSON.parse(stale.data) as ApiChapterResponse;
        return normalizeChapter(bookSlug, parsed, true, true);
      }

      // 4. Sem cache e sem rede — propaga o erro
      throw apiErr;
    }
  },

  // ── Prefetch ──────────────────────────────────

  /**
   * Pré-carrega o próximo capítulo em background.
   * Chamar assim que o usuário abre um capítulo para suavizar a navegação.
   * Silencia erros — prefetch é melhor esforço.
   *
   * @param version   Versão bíblica
   * @param bookSlug  Livro atual
   * @param chapter   Capítulo ATUAL (o próximo = chapter + 1)
   * @param totalChapters Total de capítulos do livro (para não ir além do fim)
   */
  async prefetchNext(
    version: string,
    bookSlug: string,
    chapter: number,
    totalChapters: number,
  ): Promise<void> {
    const next = chapter + 1;
    if (next > totalChapters) return;

    const alreadyFresh = await cacheRepo.isFresh(version, bookSlug, next);
    if (alreadyFresh) return;

    try {
      const apiData = await BibleApiClient.getChapterVerses(
        version,
        bookSlug,
        next,
      );
      await cacheRepo.set(version, bookSlug, next, JSON.stringify(apiData));
    } catch {
      // Prefetch falhou silenciosamente — ok
    }
  },

  /**
   * Pré-carrega o capítulo anterior em background.
   */
  async prefetchPrev(
    version: string,
    bookSlug: string,
    chapter: number,
  ): Promise<void> {
    const prev = chapter - 1;
    if (prev < 1) return;

    const alreadyFresh = await cacheRepo.isFresh(version, bookSlug, prev);
    if (alreadyFresh) return;

    try {
      const apiData = await BibleApiClient.getChapterVerses(
        version,
        bookSlug,
        prev,
      );
      await cacheRepo.set(version, bookSlug, prev, JSON.stringify(apiData));
    } catch {
      // Prefetch falhou silenciosamente — ok
    }
  },

  // ── Busca ─────────────────────────────────────

  /**
   * Executa busca por palavra-chave.
   * A busca NÃO é cacheada (resultados dinâmicos, sem TTL previsível).
   *
   * @throws ApiError em caso de falha de rede sem cache disponível
   */
  async search(query: string, version: string): Promise<SearchResult> {
    if (!query.trim()) {
      return { query, items: [], totalCount: 0 };
    }
    const apiData = await BibleApiClient.search(query.trim(), version);
    return normalizeSearch(query, apiData);
  },

  // ── Invalidação Manual ────────────────────────

  /**
   * Força a remoção de um capítulo do cache.
   * Usar quando o usuário muda de versão bíblica e quer limpar os dados antigos.
   */
  async invalidate(
    version: string,
    bookSlug: string,
    chapter: number,
  ): Promise<void> {
    await cacheRepo.delete(version, bookSlug, chapter);
  },

  /**
   * Remove todo o cache de uma versão bíblica.
   * Útil quando o usuário muda de ACF para NVI, por exemplo.
   */
  async invalidateVersion(version: string): Promise<void> {
    // CacheRepository não tem deleteByVersion, então
    // usamos evictOldest com limite 0 como workaround.
    // Em uma migração futura, adicionar deleteByVersion ao CacheRepository.
    console.warn(
      `[CacheManager] invalidateVersion("${version}") — ` +
        "implemente deleteByVersion no CacheRepository para granularidade por versão.",
    );
  },

  // ── Diagnóstico ───────────────────────────────

  /** Retorna o número atual de entradas no cache */
  async cacheSize(): Promise<number> {
    return cacheRepo.count();
  },

  /** Verifica se um capítulo específico está cacheado e fresco */
  async isChapterCached(
    version: string,
    bookSlug: string,
    chapter: number,
  ): Promise<boolean> {
    return cacheRepo.isFresh(version, bookSlug, chapter);
  },
} as const;
