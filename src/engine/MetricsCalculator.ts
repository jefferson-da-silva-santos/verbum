/**
 * VERBUM — Engine: MetricsCalculator
 *
 * Transforma dados brutos do banco em métricas prontas para exibição.
 *
 * Separação de responsabilidades:
 *   - Repository → dados brutos (Sets, arrays, contagens)
 *   - MetricsCalculator → cálculos e derivações
 *   - UI → renderização
 *
 * Esta classe NÃO acessa banco de dados. Entrada → saída pura.
 */

import {
  BIBLE_BOOKS,
  BIBLE_TOTALS,
  BOOK_MAP,
  OT_BOOKS,
  NT_BOOKS,
  calcProgressPercent,
  isBookCompleted,
  getCompletedBooks,
} from "../constants/bible";
import type { BibleBook } from "../constants/bible";
import type {
  HeatmapEntry,
  ReadingPlan,
  SessionStats,
} from "../database/types";
import {
  todayIso,
  parseIsoDate,
  toIsoDate,
  addDays,
  diffDays,
} from "./dateHelpers";

// ─────────────────────────────────────────────
// TIPOS DE RESULTADO
// ─────────────────────────────────────────────

export interface GlobalMetrics {
  // ── Progresso ──────────────────────────────
  /** Capítulos únicos lidos em qualquer plano */
  chaptersRead: number;
  /** % da Bíblia completa (0–100) */
  globalPercent: number;
  /** Capítulos lidos no AT */
  otChaptersRead: number;
  /** % do AT (0–100) */
  otPercent: number;
  /** Capítulos lidos no NT */
  ntChaptersRead: number;
  /** % do NT (0–100) */
  ntPercent: number;
  /** Livros com 100% dos capítulos lidos */
  completedBooks: BibleBook[];
  completedBooksCount: number;

  // ── Tempo ──────────────────────────────────
  /** Minutos totais de leitura (de reading_sessions) */
  totalReadingMinutes: number;
  /** Formatado: "14h 32min" */
  totalReadingFormatted: string;

  // ── Atividade ──────────────────────────────
  /** Total de dias com pelo menos 1 capítulo lido */
  totalReadDays: number;
  /** Média de capítulos por dia de leitura */
  avgChaptersPerReadDay: number;
}

export interface PlanMetrics {
  planId: string;
  /** Capítulos lidos neste plano */
  chaptersRead: number;
  /** Total de capítulos do plano */
  totalChapters: number;
  /** % do plano concluído (0–100) */
  percentComplete: number;
  /** Capítulos esperados até hoje (seguindo o plano original) */
  expectedByNow: number;
  /** Desvio: positivo = adiantado, negativo = atrasado */
  chaptersDeviation: number;
  /** Se o plano está em dia */
  isOnTrack: boolean;
  /** Data de conclusão projetada com ritmo atual */
  projectedEndDate: string;
  /** Capítulos restantes */
  remainingChapters: number;
}

export interface HeatmapCell {
  date: string;
  chaptersRead: number;
  /** Nível de intensidade 0–4 para seleção de cor */
  intensity: 0 | 1 | 2 | 3 | 4;
  /** ISO date da semana (segunda-feira da semana) para agrupamento */
  weekStart: string;
}

export interface ReadingStats {
  /** Horário UTC de maior frequência de leitura (0–23 | null se sem dados) */
  peakHour: number | null;
  avgSessionMinutes: number;
  totalSessions: number;
  longestSession: number; // em segundos
}

// ─────────────────────────────────────────────
// CLASSE
// ─────────────────────────────────────────────

export class MetricsCalculator {
  // ──────────────────────────────────────────
  // PROGRESSO GLOBAL
  // ──────────────────────────────────────────

  /**
   * Calcula todas as métricas globais do usuário.
   *
   * @param readChapterIds  Set de chapterId únicos lidos (de ProgressRepository.getReadChapterIdsGlobal)
   * @param sessionStats    Estatísticas de sessões (de ProgressRepository.getSessionStats)
   * @param heatmapEntries  Dados de atividade diária (de ProgressRepository.getHeatmapData)
   */
  static global(
    readChapterIds: Set<string>,
    sessionStats: SessionStats,
    heatmapEntries: HeatmapEntry[],
  ): GlobalMetrics {
    const allSlugs = BIBLE_BOOKS.map((b) => b.slug);
    const otSlugs = OT_BOOKS.map((b) => b.slug);
    const ntSlugs = NT_BOOKS.map((b) => b.slug);

    const globalPercent = calcProgressPercent(readChapterIds, allSlugs);
    const otPercent = calcProgressPercent(readChapterIds, otSlugs);
    const ntPercent = calcProgressPercent(readChapterIds, ntSlugs);

    const otChaptersRead = MetricsCalculator.countReadInScope(
      readChapterIds,
      otSlugs,
    );
    const ntChaptersRead = MetricsCalculator.countReadInScope(
      readChapterIds,
      ntSlugs,
    );
    const completedBooks = getCompletedBooks(readChapterIds);

    const totalReadingMinutes = sessionStats.totalDurationSeconds / 60;

    const totalReadDays = heatmapEntries.filter(
      (e) => e.chaptersRead > 0,
    ).length;
    const totalChapsFromHeatmap = heatmapEntries.reduce(
      (s, e) => s + e.chaptersRead,
      0,
    );
    const avgChaptersPerReadDay =
      totalReadDays > 0
        ? parseFloat((totalChapsFromHeatmap / totalReadDays).toFixed(1))
        : 0;

    return {
      chaptersRead: readChapterIds.size,
      globalPercent,
      otChaptersRead,
      otPercent,
      ntChaptersRead,
      ntPercent,
      completedBooks,
      completedBooksCount: completedBooks.length,
      totalReadingMinutes: parseFloat(totalReadingMinutes.toFixed(1)),
      totalReadingFormatted:
        MetricsCalculator.formatDuration(totalReadingMinutes),
      totalReadDays,
      avgChaptersPerReadDay,
    };
  }

  // ──────────────────────────────────────────
  // PROGRESSO DO PLANO
  // ──────────────────────────────────────────

  /**
   * Calcula métricas específicas de um plano de leitura.
   *
   * @param plan           O plano de leitura ativo
   * @param readChapterIds Set de chapterIds lidos NESTE plano
   */
  static plan(plan: ReadingPlan, readChapterIds: Set<string>): PlanMetrics {
    const chaptersRead = readChapterIds.size;
    const total = plan.totalChapters;
    const remaining = total - chaptersRead;
    const percent =
      total > 0 ? parseFloat(((chaptersRead / total) * 100).toFixed(2)) : 0;

    // Quantos capítulos deveriam ter sido lidos até hoje
    const cpd = plan.chaptersPerDay ?? 1;
    const expectedByNow = MetricsCalculator.expectedProgress(plan, todayIso());
    const deviation = chaptersRead - expectedByNow;

    // Projeção de conclusão com ritmo atual
    const projectedEndDate = MetricsCalculator.projectedEnd(
      plan,
      chaptersRead,
      todayIso(),
    );

    return {
      planId: plan.id,
      chaptersRead,
      totalChapters: total,
      percentComplete: percent,
      expectedByNow,
      chaptersDeviation: deviation,
      isOnTrack: deviation >= 0,
      projectedEndDate,
      remainingChapters: remaining,
    };
  }

  // ──────────────────────────────────────────
  // HEATMAP
  // ──────────────────────────────────────────

  /**
   * Transforma HeatmapEntry[] em HeatmapCell[] com intensidade calculada.
   * Preenche dias sem leitura para garantir o grid contínuo (52 semanas × 7).
   *
   * @param entries    Dados brutos do banco (apenas dias com leitura)
   * @param days       Janela de tempo em dias (padrão: 365)
   */
  static heatmap(entries: HeatmapEntry[], days: number = 365): HeatmapCell[] {
    // Indexar entradas por data para lookup O(1)
    const byDate = new Map<string, number>();
    for (const e of entries) byDate.set(e.date, e.chaptersRead);

    // Valor máximo para normalização de intensidade
    const maxValue = Math.max(...entries.map((e) => e.chaptersRead), 1);

    const cells: HeatmapCell[] = [];
    const today = parseIsoDate(todayIso());
    const startDate = addDays(today, -(days - 1));

    for (let i = 0; i < days; i++) {
      const d = addDays(startDate, i);
      const dateStr = toIsoDate(d);
      const chaptersRead = byDate.get(dateStr) ?? 0;

      cells.push({
        date: dateStr,
        chaptersRead,
        intensity: MetricsCalculator.intensityLevel(chaptersRead, maxValue),
        weekStart: MetricsCalculator.getWeekStart(d),
      });
    }

    return cells;
  }

  // ──────────────────────────────────────────
  // HELPERS INTERNOS
  // ──────────────────────────────────────────

  private static countReadInScope(
    readChapterIds: Set<string>,
    bookSlugs: string[],
  ): number {
    let count = 0;
    for (const slug of bookSlugs) {
      const book = BOOK_MAP[slug];
      if (!book) continue;
      for (let ch = 1; ch <= book.chapters; ch++) {
        if (readChapterIds.has(`${slug}-${ch}`)) count++;
      }
    }
    return count;
  }

  private static expectedProgress(
    plan: ReadingPlan,
    untilDate: string,
  ): number {
    const {
      addActiveDays: add,
      countActiveDays: count,
    } = require("./dateHelpers");
    const start = parseIsoDate(plan.startDate);
    const until = parseIsoDate(untilDate);
    if (until < start) return 0;

    const { countActiveDays } = require("./dateHelpers");
    const activeDays = countActiveDays(start, until, plan.skipWeekdays);
    return Math.min(
      activeDays * (plan.chaptersPerDay ?? 1),
      plan.totalChapters,
    );
  }

  private static projectedEnd(
    plan: ReadingPlan,
    chaptersRead: number,
    fromDate: string,
  ): string {
    const { addActiveDays } = require("./dateHelpers");
    const remaining = plan.totalChapters - chaptersRead;
    if (remaining <= 0) return fromDate;

    const cpd = plan.chaptersPerDay ?? 1;
    const activesNeeded = Math.ceil(remaining / cpd);
    const end = addActiveDays(
      parseIsoDate(fromDate),
      activesNeeded,
      plan.skipWeekdays,
    );
    return toIsoDate(end);
  }

  private static intensityLevel(value: number, max: number): 0 | 1 | 2 | 3 | 4 {
    if (value === 0) return 0;
    if (value <= max * 0.25) return 1;
    if (value <= max * 0.5) return 2;
    if (value <= max * 0.75) return 3;
    return 4;
  }

  private static getWeekStart(date: Date): string {
    const d = new Date(date);
    const dow = d.getUTCDay(); // 0=Dom
    d.setUTCDate(d.getUTCDate() - dow); // recua para domingo
    return toIsoDate(d);
  }

  // ──────────────────────────────────────────
  // FORMATADORES PÚBLICOS
  // ──────────────────────────────────────────

  /**
   * Formata minutos em string legível.
   * Ex: 95 → "1h 35min" · 3650 → "60h 50min"
   */
  static formatDuration(minutes: number): string {
    if (minutes < 1) return "< 1min";
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h === 0) return `${m}min`;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  /**
   * Formata percentual com 1 casa decimal.
   * Ex: 2.947 → "2.9%"
   */
  static formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Formata número de capítulos com separador de milhar.
   * Ex: 1189 → "1.189"
   */
  static formatChapters(count: number): string {
    return count.toLocaleString("pt-BR");
  }
}
