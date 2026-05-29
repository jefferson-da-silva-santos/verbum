/**
 * VERBUM — Engine: AchievementChecker
 *
 * Avalia o catálogo de conquistas contra o estado atual do usuário
 * e retorna APENAS as que foram desbloqueadas nesta chamada
 * (não estavam em unlockedKeys mas agora satisfazem a condição).
 *
 * Design:
 *   - Totalmente declarativo: as condições vivem em achievements.ts
 *   - O checker apenas mapeia tipos de condição para funções de avaliação
 *   - Nenhuma lógica de negócio bíblico aqui — tudo via constantes
 *
 * Chamada recomendada:
 *   Após cada evento relevante (marcar capítulo, criar nota, etc.)
 *   o PlanContext chama AchievementChecker.check(input) e persiste
 *   os novos desbloqueios via AchievementRepository.unlock().
 *
 * Esta classe NÃO acessa banco de dados. Entrada → saída pura.
 */

import { ACHIEVEMENTS } from "../constants/achievements";
import type {
  Achievement,
  AchievementCondition,
} from "../constants/achievements";
import { BOOK_MAP, BOOKS_BY_CATEGORY } from "../constants/bible";
import type { BookCategory } from "../constants/bible";

// ─────────────────────────────────────────────
// TIPO DE ENTRADA
// ─────────────────────────────────────────────

export interface AchievementCheckInput {
  // ── Progresso de leitura ───────────────────
  /** Total de capítulos únicos lidos (qualquer plano) */
  totalChaptersRead: number;
  /** Set de chapterIds únicos lidos: "gn-1", "jo-3" */
  readChapterIds: ReadonlySet<string>;
  /** Slugs dos livros com 100% dos capítulos lidos */
  completedBookSlugs: readonly string[];
  /** Se todos os 929 caps do AT foram lidos */
  otCompleted: boolean;
  /** Se todos os 260 caps do NT foram lidos */
  ntCompleted: boolean;
  /** Se todos os 1189 caps foram lidos */
  bibleCompleted: boolean;

  // ── Streak ────────────────────────────────
  /** Streak atual (pode ser 0 se quebrado) */
  currentStreak: number;
  /** Maior streak já alcançado (histórico) */
  longestStreak: number;

  // ── Planos ───────────────────────────────
  completedPlansCount: number;

  // ── Anotações e Destaques ─────────────────
  notesCount: number;
  highlightsCount: number;

  // ── Diário ───────────────────────────────
  diaryEntriesCount: number;

  // ── Sessões ──────────────────────────────
  sessionCount: number;

  // ── Diversidade ──────────────────────────
  /**
   * Número de categorias de livros com pelo menos 1 capítulo lido.
   * Calculado externamente: new Set(readBookSlugs.map(s => getBook(s).category)).size
   */
  categoriesReadCount: number;

  // ── Estado atual de conquistas ────────────
  /** Keys das conquistas JÁ desbloqueadas (para evitar re-desbloquear) */
  unlockedKeys: ReadonlySet<string>;
}

// ─────────────────────────────────────────────
// CLASSE
// ─────────────────────────────────────────────

export class AchievementChecker {
  /**
   * Avalia todas as conquistas e retorna as novas.
   *
   * @returns Array de Achievement recém-desbloqueadas (pode ser vazio)
   */
  static check(input: AchievementCheckInput): Achievement[] {
    return ACHIEVEMENTS.filter((achievement) => {
      // Já desbloqueada — pular
      if (input.unlockedKeys.has(achievement.key)) return false;
      // Avaliar condição
      return AchievementChecker.evaluate(achievement.condition, input);
    });
  }

  /**
   * Verifica uma conquista específica por key.
   * Útil para checar um marco específico sem rodar o catálogo completo.
   */
  static checkOne(key: string, input: AchievementCheckInput): boolean {
    const achievement = ACHIEVEMENTS.find((a) => a.key === key);
    if (!achievement) return false;
    if (input.unlockedKeys.has(key)) return false;
    return AchievementChecker.evaluate(achievement.condition, input);
  }

  // ──────────────────────────────────────────
  // AVALIAÇÃO DE CONDIÇÕES
  // ──────────────────────────────────────────

  private static evaluate(
    cond: AchievementCondition,
    s: AchievementCheckInput,
  ): boolean {
    switch (cond.type) {
      case "first_chapter_read":
        return s.totalChaptersRead >= 1;

      case "chapters_read_gte":
        return s.totalChaptersRead >= (cond.value ?? 0);

      case "streak_days_gte":
        // Usa o longestStreak para que conquistas não se percam após streak quebrado
        return s.longestStreak >= (cond.value ?? 0);

      case "book_completed":
        return cond.bookSlug
          ? s.completedBookSlugs.includes(cond.bookSlug)
          : false;

      case "books_completed_gte":
        return s.completedBookSlugs.length >= (cond.value ?? 0);

      case "testament_completed":
        return cond.testament === "OT" ? s.otCompleted : s.ntCompleted;

      case "bible_completed":
        return s.bibleCompleted;

      case "plan_completed":
        return s.completedPlansCount >= 1;

      case "plans_completed_gte":
        return s.completedPlansCount >= (cond.value ?? 0);

      case "notes_created_gte":
        return s.notesCount >= (cond.value ?? 0);

      case "highlights_created_gte":
        return s.highlightsCount >= (cond.value ?? 0);

      case "categories_read_gte":
        return s.categoriesReadCount >= (cond.value ?? 0);

      case "reading_sessions_gte":
        return s.sessionCount >= (cond.value ?? 0);

      case "diary_entries_gte":
        return s.diaryEntriesCount >= (cond.value ?? 0);

      default:
        console.warn(
          `[AchievementChecker] Tipo de condição desconhecido: ${(cond as AchievementCondition).type}`,
        );
        return false;
    }
  }

  // ──────────────────────────────────────────
  // BUILDER — constrói o AchievementCheckInput
  // ──────────────────────────────────────────

  /**
   * Constrói o AchievementCheckInput a partir dos dados brutos
   * vindos dos repositories. Centraliza a lógica de derivação:
   *   - Calcula completedBookSlugs a partir de readChapterIds
   *   - Calcula otCompleted, ntCompleted, bibleCompleted
   *   - Calcula categoriesReadCount
   *
   * Chamar no PlanContext antes de invocar check().
   */
  static buildInput(params: {
    readChapterIds: ReadonlySet<string>;
    longestStreak: number;
    currentStreak: number;
    completedPlansCount: number;
    notesCount: number;
    highlightsCount: number;
    diaryEntriesCount: number;
    sessionCount: number;
    unlockedKeys: ReadonlySet<string>;
  }): AchievementCheckInput {
    const {
      readChapterIds,
      longestStreak,
      currentStreak,
      completedPlansCount,
      notesCount,
      highlightsCount,
      diaryEntriesCount,
      sessionCount,
      unlockedKeys,
    } = params;

    // Quais livros estão 100% lidos
    const completedBookSlugs =
      AchievementChecker.calcCompletedBooks(readChapterIds);

    // Progresso de testamentos
    const otCompleted = AchievementChecker.isTestamentComplete(
      readChapterIds,
      "OT",
    );
    const ntCompleted = AchievementChecker.isTestamentComplete(
      readChapterIds,
      "NT",
    );
    const bibleCompleted = otCompleted && ntCompleted;

    // Categorias com pelo menos 1 capítulo lido
    const categoriesReadCount =
      AchievementChecker.calcCategoriesCount(readChapterIds);

    return {
      totalChaptersRead: readChapterIds.size,
      readChapterIds,
      completedBookSlugs,
      otCompleted,
      ntCompleted,
      bibleCompleted,
      currentStreak,
      longestStreak,
      completedPlansCount,
      notesCount,
      highlightsCount,
      diaryEntriesCount,
      sessionCount,
      categoriesReadCount,
      unlockedKeys,
    };
  }

  // ──────────────────────────────────────────
  // DERIVAÇÕES INTERNAS
  // ──────────────────────────────────────────

  private static calcCompletedBooks(
    readChapterIds: ReadonlySet<string>,
  ): string[] {
    return Object.values(BOOK_MAP)
      .filter((book) => {
        for (let ch = 1; ch <= book.chapters; ch++) {
          if (!readChapterIds.has(`${book.slug}-${ch}`)) return false;
        }
        return true;
      })
      .map((book) => book.slug);
  }

  private static isTestamentComplete(
    readChapterIds: ReadonlySet<string>,
    testament: "OT" | "NT",
  ): boolean {
    const books = Object.values(BOOK_MAP).filter(
      (b) => b.testament === testament,
    );
    return books.every((book) => {
      for (let ch = 1; ch <= book.chapters; ch++) {
        if (!readChapterIds.has(`${book.slug}-${ch}`)) return false;
      }
      return true;
    });
  }

  private static calcCategoriesCount(
    readChapterIds: ReadonlySet<string>,
  ): number {
    const categories = new Set<BookCategory>();
    for (const [slug, book] of Object.entries(BOOK_MAP)) {
      for (let ch = 1; ch <= book.chapters; ch++) {
        if (readChapterIds.has(`${slug}-${ch}`)) {
          categories.add(book.category);
          break; // basta 1 capítulo desta categoria — passa para o próximo livro
        }
      }
    }
    return categories.size;
  }
}
