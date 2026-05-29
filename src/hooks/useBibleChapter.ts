/**
 * VERBUM — Hook: useBibleChapter
 *
 * Carrega o conteúdo de um capítulo via CacheManager (offline-first).
 * Dispara prefetch dos capítulos adjacentes automaticamente para
 * tornar a navegação anterior/próximo instantânea.
 *
 * Uso:
 *   const { data, isLoading, error, isStale } = useBibleChapter('gn', 1);
 *
 * isStale=true indica que os dados vêm do cache expirado (usuário offline).
 * A UI deve exibir um indicador sutil neste caso.
 */

import { useState, useEffect, useCallback } from "react";
import { CacheManager } from "../api/cacheManager";
import type { ChapterData } from "../api/cacheManager";
import { ApiError } from "../api/endpoints";
import { findBook, DEFAULT_BIBLE_VERSION } from "../constants/bible";
import { useAuth } from "./useAuth";

export interface UseBibleChapterReturn {
  data: ChapterData | null;
  isLoading: boolean;
  error: ApiError | null;
  /** true = dados do cache expirado (offline) */
  isStale: boolean;
  /** Força nova busca da API ignorando o cache */
  reload: () => void;
}

export function useBibleChapter(
  bookSlug: string,
  chapter: number,
): UseBibleChapterReturn {
  const { user } = useAuth();
  const version = user?.preferredVersion ?? DEFAULT_BIBLE_VERSION;
  const book = findBook(bookSlug);

  const [data, setData] = useState<ChapterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!bookSlug || chapter < 1) return;

    let cancelled = false;

    setIsLoading(true);
    setError(null);

    CacheManager.getChapter(version, bookSlug, chapter)
      .then((chapterData) => {
        if (cancelled) return;
        setData(chapterData);
        setError(null);

        // Prefetch adjacentes em background
        if (book) {
          CacheManager.prefetchNext(version, bookSlug, chapter, book.chapters);
          CacheManager.prefetchPrev(version, bookSlug, chapter);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err
            : new ApiError("NETWORK_ERROR", 0, String(err)),
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [version, bookSlug, chapter, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return {
    data,
    isLoading,
    error,
    isStale: data?.isStale ?? false,
    reload,
  };
}
