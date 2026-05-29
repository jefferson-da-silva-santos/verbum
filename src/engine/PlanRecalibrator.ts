/**
 * VERBUM — Engine: PlanRecalibrator
 *
 * Quando o usuário perde dias ou lê mais do que o previsto,
 * o plano fica desalinhado com o cronograma original.
 *
 * Este módulo detecta o desvio e calcula um novo ritmo
 * para que o usuário ainda consiga cumprir a meta original (se houver)
 * ou ajusta a data de conclusão (se não houver deadline).
 *
 * Chamado pelo PlanContext após cada marcação de capítulo
 * quando a data de leitura difere da data prevista.
 *
 * Esta classe NÃO acessa banco de dados. Entrada → saída pura.
 */

import {
  buildChapterQueue,
  DEFAULT_MINUTES_PER_CHAPTER,
  MAX_CHAPTERS_PER_DAY,
} from "../constants/bible";
import type { ChapterRef } from "../constants/bible";
import type { ReadingPlan } from "../database/types";
import { PlanCalculator, PlanCalculationError } from "./PlanCalculator";
import { ScheduleGenerator } from "./ScheduleGenerator";
import type { GeneratedDailyEntry } from "./ScheduleGenerator";
import {
  parseIsoDate,
  toIsoDate,
  countActiveDays,
  addActiveDays,
  todayIso,
} from "./dateHelpers";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface RecalibrationInput {
  plan: ReadingPlan;
  /** IDs dos capítulos já lidos neste plano: Set<"gn-1"> */
  readChapterIds: Set<string>;
  /** Slugs dos livros do plano, na ordem de leitura */
  bookSlugs: readonly string[];
  /** Data a partir da qual regenerar (padrão: amanhã) */
  fromDate?: string;
  /** Velocidade de leitura calibrada do usuário */
  avgMinutesPerChapter?: number;
}

export type RecalibrationReason =
  | "behind_schedule" // usuário está atrasado
  | "ahead_of_schedule" // usuário está adiantado
  | "on_track" // plano OK, sem necessidade de recalibrar
  | "plan_complete"; // todos os capítulos já foram lidos

export interface RecalibrationResult {
  reason: RecalibrationReason;
  /** Novo ritmo calculado */
  newChaptersPerDay: number;
  newMinutesPerDay: number;
  /** Nova data de conclusão estimada */
  newEstimatedEndDate: string;
  /** Cronograma futuro regenerado (a partir de fromDate) */
  newScheduleEntries: GeneratedDailyEntry[];
  /** Capítulos restantes para conclusão do plano */
  remainingChapters: number;
  /** Dias ativos restantes até o targetDate (ou até nova estimatedEndDate) */
  remainingActiveDays: number;
  /** Quantos dias o usuário está à frente (+) ou atrás (-) */
  daysDeviation: number;
  /** Ritmo anterior (para comparação na UI) */
  previousChaptersPerDay: number;
}

// ─────────────────────────────────────────────
// CLASSE
// ─────────────────────────────────────────────

export class PlanRecalibrator {
  /**
   * Avalia o desvio do plano e calcula o novo cronograma.
   *
   * Fluxo:
   *   1. Monta a fila completa de capítulos do plano
   *   2. Filtra os capítulos ainda não lidos (remaining queue)
   *   3. Se não há remaining: plano completo
   *   4. Com deadline: calcula novo cpd para caber no prazo restante
   *   5. Sem deadline: mantém cpd original, recalcula data final
   *   6. Gera novo cronograma a partir de fromDate
   */
  static recalibrate(input: RecalibrationInput): RecalibrationResult {
    const {
      plan,
      readChapterIds,
      bookSlugs,
      fromDate = toIsoDate(
        addActiveDays(parseIsoDate(todayIso()), 1, plan.skipWeekdays),
      ),
      avgMinutesPerChapter = plan.isActive
        ? DEFAULT_MINUTES_PER_CHAPTER
        : DEFAULT_MINUTES_PER_CHAPTER,
    } = input;

    // ── 1. Fila completa e restante ───────────

    const fullQueue = buildChapterQueue(bookSlugs);
    const remainingQueue = fullQueue.filter(
      (ref) => !readChapterIds.has(ref.chapterId),
    );

    // ── 2. Plano concluído ────────────────────

    if (remainingQueue.length === 0) {
      return {
        reason: "plan_complete",
        newChaptersPerDay: 0,
        newMinutesPerDay: 0,
        newEstimatedEndDate: todayIso(),
        newScheduleEntries: [],
        remainingChapters: 0,
        remainingActiveDays: 0,
        daysDeviation: 0,
        previousChaptersPerDay: plan.chaptersPerDay ?? 0,
      };
    }

    const remaining = remainingQueue.length;
    const fromDateParsed = parseIsoDate(fromDate);
    const prevCpd = plan.chaptersPerDay ?? 1;

    // ── 3. Calcular desvio ────────────────────

    const readCount = fullQueue.length - remaining;
    const expectedByNow = PlanRecalibrator.expectedReadByDate(
      fullQueue,
      plan.startDate,
      prevCpd,
      plan.skipWeekdays,
      todayIso(),
    );
    const daysDeviation = PlanRecalibrator.daysAheadOrBehind(
      readCount,
      expectedByNow,
      prevCpd,
    );

    // ── 4. Novo ritmo ─────────────────────────

    let newCpd: number;
    let newEndDate: string;
    let remainingActiveDays: number;

    if (plan.targetDate) {
      // COM DEADLINE: recalcula cpd para caber no prazo restante
      const targetDateParsed = parseIsoDate(plan.targetDate);
      const activeDaysRemaining = countActiveDays(
        fromDateParsed,
        targetDateParsed,
        plan.skipWeekdays,
      );

      remainingActiveDays = Math.max(1, activeDaysRemaining);
      newCpd = Math.min(
        Math.ceil(remaining / remainingActiveDays),
        MAX_CHAPTERS_PER_DAY,
      );
      newEndDate = plan.targetDate;
    } else {
      // SEM DEADLINE: mantém ritmo, recalcula data final
      newCpd = prevCpd;
      const activeDaysNeeded = Math.ceil(remaining / newCpd);
      const newEnd = addActiveDays(
        fromDateParsed,
        activeDaysNeeded,
        plan.skipWeekdays,
      );
      newEndDate = toIsoDate(newEnd);
      remainingActiveDays = activeDaysNeeded;
    }

    const reason: RecalibrationReason =
      daysDeviation < 0
        ? "behind_schedule"
        : daysDeviation > 0
          ? "ahead_of_schedule"
          : "on_track";

    // ── 5. Gerar novo cronograma ──────────────

    const newScheduleEntries = ScheduleGenerator.regenerateFromDate(
      fromDate,
      remainingQueue,
      newCpd,
      plan.skipWeekdays,
      avgMinutesPerChapter,
    );

    return {
      reason,
      newChaptersPerDay: newCpd,
      newMinutesPerDay: parseFloat((newCpd * avgMinutesPerChapter).toFixed(1)),
      newEstimatedEndDate: newEndDate,
      newScheduleEntries,
      remainingChapters: remaining,
      remainingActiveDays,
      daysDeviation,
      previousChaptersPerDay: prevCpd,
    };
  }

  // ──────────────────────────────────────────
  // HELPERS INTERNOS
  // ──────────────────────────────────────────

  /**
   * Quantos capítulos deveriam ter sido lidos até `untilDate`
   * seguindo o plano original sem desvios.
   */
  private static expectedReadByDate(
    fullQueue: ChapterRef[],
    startDate: string,
    chaptersPerDay: number,
    skipWeekdays: readonly number[],
    untilDate: string,
  ): number {
    const start = parseIsoDate(startDate);
    const until = parseIsoDate(untilDate);
    const active = countActiveDays(start, until, skipWeekdays);
    return Math.min(active * chaptersPerDay, fullQueue.length);
  }

  /**
   * Dias de desvio: positivo = adiantado, negativo = atrasado.
   * Baseado na diferença entre lido real e esperado em ritmo normal.
   */
  private static daysAheadOrBehind(
    readActual: number,
    readExpected: number,
    chaptersPerDay: number,
  ): number {
    if (chaptersPerDay === 0) return 0;
    return Math.round((readActual - readExpected) / chaptersPerDay);
  }

  /**
   * Verifica se a recalibração é necessária.
   * Dispara quando o desvio é >= 1 dia (para frente ou para trás).
   */
  static needsRecalibration(
    plan: ReadingPlan,
    readCount: number,
    bookSlugs: readonly string[],
  ): boolean {
    const fullQueue = buildChapterQueue(bookSlugs);
    const expected = PlanRecalibrator.expectedReadByDate(
      fullQueue,
      plan.startDate,
      plan.chaptersPerDay ?? 1,
      plan.skipWeekdays,
      todayIso(),
    );
    const deviation = PlanRecalibrator.daysAheadOrBehind(
      readCount,
      expected,
      plan.chaptersPerDay ?? 1,
    );
    return Math.abs(deviation) >= 1;
  }
}
