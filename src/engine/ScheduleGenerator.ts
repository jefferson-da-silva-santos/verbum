/**
 * VERBUM — Engine: ScheduleGenerator
 *
 * Pega o resultado do PlanCalculator e distribui os capítulos
 * pelos dias do calendário, respeitando dias de descanso.
 *
 * Saída: array de GeneratedDailyEntry pronto para persistência
 * no PlanRepository via CreateScheduleEntryInput.
 *
 * Esta classe NÃO acessa banco de dados. Entrada → saída pura.
 */

import { buildChapterQueue } from "../constants/bible";
import type { ChapterRef } from "../constants/bible";
import type { PlanCalculationResult } from "./PlanCalculator";
import { parseIsoDate, toIsoDate, addDays, isActiveDay } from "./dateHelpers";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface GeneratedDailyEntry {
  /** ISO date "2025-01-15" */
  date: string;
  /** false = dia de descanso (sem capítulos) */
  isActive: boolean;
  /** Capítulos a ler neste dia (vazio se isActive=false) */
  chapters: ChapterRef[];
  /** Tempo estimado em minutos (0 se isActive=false) */
  estimatedMinutes: number;
}

export interface GenerateScheduleInput {
  /** Slugs dos livros na ordem de leitura */
  bookSlugs: readonly string[];
  /** Data de início (ISO date) */
  startDate: string;
  /** Capítulos por dia ativo */
  chaptersPerDay: number;
  /** Dias de descanso (0=Dom…6=Sáb) */
  skipWeekdays: readonly number[];
  /** Minutos por capítulo para calcular estimatedMinutes */
  avgMinutesPerChapter: number;
}

export interface GeneratedSchedule {
  entries: GeneratedDailyEntry[];
  /** Resumo para validação e exibição */
  summary: ScheduleSummary;
}

export interface ScheduleSummary {
  totalDays: number; // dias corridos (ativos + descanso)
  totalActiveDays: number; // dias com leitura
  totalRestDays: number; // dias de descanso
  totalChapters: number; // soma de todos os capítulos distribuídos
  firstDate: string; // ISO date do primeiro dia
  lastActiveDate: string; // ISO date do último dia com leitura
}

// ─────────────────────────────────────────────
// CLASSE
// ─────────────────────────────────────────────

export class ScheduleGenerator {
  /**
   * Gera o cronograma completo a partir dos parâmetros de entrada.
   *
   * Algoritmo:
   *   1. Monta a fila ordenada de ChapterRef (buildChapterQueue)
   *   2. Itera pelos dias a partir de startDate
   *   3. Dias ativos: consome N capítulos da fila
   *   4. Dias de descanso: registra entrada inativa
   *   5. Para quando a fila estiver vazia
   */
  static generate(input: GenerateScheduleInput): GeneratedSchedule {
    const {
      bookSlugs,
      startDate,
      chaptersPerDay,
      skipWeekdays,
      avgMinutesPerChapter,
    } = input;

    // Fila ordenada de todos os capítulos do escopo
    const queue = buildChapterQueue(bookSlugs);

    const entries: GeneratedDailyEntry[] = [];
    let queueIndex = 0;
    let currentDate = parseIsoDate(startDate);
    let activeDaysCount = 0;
    let restDaysCount = 0;

    // Itera dia a dia até que todos os capítulos sejam distribuídos
    while (queueIndex < queue.length) {
      const dateStr = toIsoDate(currentDate);
      const isActive = isActiveDay(currentDate, skipWeekdays);

      if (isActive) {
        // Capítulos para este dia: próximos N da fila (ou os restantes)
        const remaining = queue.length - queueIndex;
        const count = Math.min(chaptersPerDay, remaining);
        const dayChaps = queue.slice(queueIndex, queueIndex + count);
        queueIndex += count;

        entries.push({
          date: dateStr,
          isActive: true,
          chapters: dayChaps,
          estimatedMinutes: parseFloat(
            (count * avgMinutesPerChapter).toFixed(1),
          ),
        });
        activeDaysCount++;
      } else {
        entries.push({
          date: dateStr,
          isActive: false,
          chapters: [],
          estimatedMinutes: 0,
        });
        restDaysCount++;
      }

      currentDate = addDays(currentDate, 1);
    }

    // Encontra o último dia ativo
    const lastActiveEntry = [...entries].reverse().find((e) => e.isActive);

    return {
      entries,
      summary: {
        totalDays: entries.length,
        totalActiveDays: activeDaysCount,
        totalRestDays: restDaysCount,
        totalChapters: queue.length,
        firstDate: entries[0]?.date ?? startDate,
        lastActiveDate: lastActiveEntry?.date ?? startDate,
      },
    };
  }

  /**
   * Gera o cronograma diretamente a partir do resultado do PlanCalculator.
   * Atalho conveniente para o fluxo principal de criação de plano.
   */
  static fromCalculation(
    calc: PlanCalculationResult,
    bookSlugs: readonly string[],
  ): GeneratedSchedule {
    return ScheduleGenerator.generate({
      bookSlugs,
      startDate: calc.startDate,
      chaptersPerDay: calc.chaptersPerDay,
      skipWeekdays: calc.skipWeekdays,
      avgMinutesPerChapter: calc.avgMinutesPerChapter,
    });
  }

  /**
   * Regera o cronograma a partir de uma data específica
   * com novos parâmetros de ritmo — usado pela recalibração.
   *
   * @param fromDate   Data de início do novo cronograma (ISO date)
   * @param remainingQueue Capítulos que ainda não foram lidos (em ordem)
   * @param chaptersPerDay Novo ritmo (pós-recalibração)
   * @param skipWeekdays  Dias de descanso
   * @param avgMinutesPerChapter Velocidade de leitura
   */
  static regenerateFromDate(
    fromDate: string,
    remainingQueue: ChapterRef[],
    chaptersPerDay: number,
    skipWeekdays: readonly number[],
    avgMinutesPerChapter: number,
  ): GeneratedDailyEntry[] {
    const entries: GeneratedDailyEntry[] = [];
    let queueIndex = 0;
    let currentDate = parseIsoDate(fromDate);

    while (queueIndex < remainingQueue.length) {
      const dateStr = toIsoDate(currentDate);
      const isActive = isActiveDay(currentDate, skipWeekdays);

      if (isActive) {
        const remaining = remainingQueue.length - queueIndex;
        const count = Math.min(chaptersPerDay, remaining);
        const dayChaps = remainingQueue.slice(queueIndex, queueIndex + count);
        queueIndex += count;

        entries.push({
          date: dateStr,
          isActive: true,
          chapters: dayChaps,
          estimatedMinutes: parseFloat(
            (count * avgMinutesPerChapter).toFixed(1),
          ),
        });
      } else {
        entries.push({
          date: dateStr,
          isActive: false,
          chapters: [],
          estimatedMinutes: 0,
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    return entries;
  }
}
