/**
 * VERBUM — Engine: PlanCalculator
 *
 * Núcleo de lógica de negócio do app. Calcula o ritmo de leitura
 * necessário para cumprir um plano a partir de três modos de entrada.
 *
 * Responsabilidades:
 *   - Receber os parâmetros do usuário
 *   - Validar viabilidade do plano
 *   - Retornar todos os valores derivados prontos para persistência
 *
 * Esta classe NÃO acessa banco de dados. Entrada → saída pura.
 */

import {
  sumChapters,
  estimatedReadingMinutes,
  DEFAULT_MINUTES_PER_CHAPTER,
  AGGRESSIVE_CHAPTERS_THRESHOLD,
  MAX_CHAPTERS_PER_DAY,
  MIN_MINUTES_PER_DAY,
} from "../constants/bible";

import {
  parseIsoDate,
  toIsoDate,
  addActiveDays,
  countActiveDays,
  activeDaysPerWeek,
} from "./dateHelpers";

// ─────────────────────────────────────────────
// ERROS
// ─────────────────────────────────────────────

export type PlanErrorCode =
  | "EMPTY_SCOPE" // nenhum livro selecionado
  | "ZERO_CHAPTERS" // scope selecionado não tem capítulos
  | "NO_ACTIVE_DAYS" // todos os dias da semana são de descanso
  | "DEADLINE_IN_PAST" // data-alvo <= data de início
  | "PACE_EXCEEDS_MAX"; // > MAX_CHAPTERS_PER_DAY cap/dia (prazo impossível)

export class PlanCalculationError extends Error {
  constructor(
    public readonly code: PlanErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PlanCalculationError";
  }
}

// ─────────────────────────────────────────────
// AVISOS (não impedem o plano, apenas alertam)
// ─────────────────────────────────────────────

export type PlanWarning =
  | "time_below_minimum" // minutos/dia insuficientes para 1 cap completo
  | "adjusted_to_one_chapter" // time mode: resultado < 1, ajustado para 1
  | "aggressive_pace" // >10 caps/dia — difícil mas viável
  | "very_aggressive_pace" // >20 caps/dia — muito exigente
  | "deadline_very_soon"; // < 7 dias para o prazo

// ─────────────────────────────────────────────
// TIPOS DE ENTRADA
// ─────────────────────────────────────────────

export interface BasePlanInput {
  /** Slugs dos livros na ordem de leitura do plano */
  bookSlugs: readonly string[];
  /** Data de início do plano (ISO date "2025-01-15") */
  startDate: string;
  /** Dias da semana para descanso: 0=Dom, 1=Seg … 6=Sáb */
  skipWeekdays: readonly number[];
  /**
   * Minutos por capítulo calibrados pelo usuário.
   * Padrão: DEFAULT_MINUTES_PER_CHAPTER (3.7)
   */
  avgMinutesPerChapter?: number;
}

export interface ChaptersModeInput extends BasePlanInput {
  mode: "chapters";
  /** Número de capítulos que o usuário quer ler por dia ativo */
  chaptersPerDay: number;
}

export interface TimeModeInput extends BasePlanInput {
  mode: "time";
  /** Minutos que o usuário quer dedicar por dia ativo */
  minutesPerDay: number;
}

export interface DeadlineModeInput extends BasePlanInput {
  mode: "deadline";
  /** Data-alvo de conclusão (ISO date) */
  targetDate: string;
}

export type PlanInput = ChaptersModeInput | TimeModeInput | DeadlineModeInput;

// ─────────────────────────────────────────────
// RESULTADO DO CÁLCULO
// ─────────────────────────────────────────────

export interface PlanCalculationResult {
  // ── Ritmo ──────────────────────────────────
  chaptersPerDay: number;
  minutesPerDay: number;

  // ── Volume ─────────────────────────────────
  totalChapters: number;
  totalReadingMinutes: number;

  // ── Prazo ──────────────────────────────────
  /** ISO date da data estimada de conclusão */
  estimatedEndDate: string;
  /** Dias corridos do início ao fim (incluindo descanso) */
  totalCalendarDays: number;
  /** Dias com leitura efetiva */
  totalActiveDays: number;

  // ── Diagnóstico ────────────────────────────
  warnings: PlanWarning[];
  isAggressive: boolean; // chaptersPerDay > AGGRESSIVE_CHAPTERS_THRESHOLD
  isVeryAggressive: boolean; // chaptersPerDay > 20

  // ── Metadados do input ─────────────────────
  mode: PlanInput["mode"];
  startDate: string;
  targetDate: string | null;
  skipWeekdays: readonly number[];
  avgMinutesPerChapter: number;
}

// ─────────────────────────────────────────────
// CLASSE PRINCIPAL
// ─────────────────────────────────────────────

export class PlanCalculator {
  /**
   * Ponto de entrada unificado — despacha para o modo correto.
   * Lança PlanCalculationError para entradas inviáveis.
   */
  static calculate(input: PlanInput): PlanCalculationResult {
    switch (input.mode) {
      case "chapters":
        return PlanCalculator.byChapters(input);
      case "time":
        return PlanCalculator.byTime(input);
      case "deadline":
        return PlanCalculator.byDeadline(input);
    }
  }

  // ──────────────────────────────────────────
  // MODO 1 — Por Capítulos por Dia
  // Entrada: chaptersPerDay → calcula data de conclusão
  // ──────────────────────────────────────────

  static byChapters(input: ChaptersModeInput): PlanCalculationResult {
    const avg = input.avgMinutesPerChapter ?? DEFAULT_MINUTES_PER_CHAPTER;
    const total = PlanCalculator.validateScope(input.bookSlugs);
    PlanCalculator.validateActiveDays(input.skipWeekdays);

    const cpd = Math.max(1, Math.floor(input.chaptersPerDay));

    const activeDaysNeeded = Math.ceil(total / cpd);
    const startDate = parseIsoDate(input.startDate);
    const endDate = addActiveDays(
      startDate,
      activeDaysNeeded,
      input.skipWeekdays,
    );

    const warnings: PlanWarning[] = [];
    if (cpd > 20) warnings.push("very_aggressive_pace");
    else if (cpd > AGGRESSIVE_CHAPTERS_THRESHOLD)
      warnings.push("aggressive_pace");

    return {
      chaptersPerDay: cpd,
      minutesPerDay: parseFloat((cpd * avg).toFixed(1)),
      totalChapters: total,
      totalReadingMinutes: parseFloat((total * avg).toFixed(1)),
      estimatedEndDate: toIsoDate(endDate),
      totalCalendarDays:
        Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1,
      totalActiveDays: activeDaysNeeded,
      warnings,
      isAggressive: cpd > AGGRESSIVE_CHAPTERS_THRESHOLD,
      isVeryAggressive: cpd > 20,
      mode: "chapters",
      startDate: input.startDate,
      targetDate: null,
      skipWeekdays: input.skipWeekdays,
      avgMinutesPerChapter: avg,
    };
  }

  // ──────────────────────────────────────────
  // MODO 2 — Por Tempo Diário
  // Entrada: minutesPerDay → calcula caps/dia e data de conclusão
  // ──────────────────────────────────────────

  static byTime(input: TimeModeInput): PlanCalculationResult {
    const avg = input.avgMinutesPerChapter ?? DEFAULT_MINUTES_PER_CHAPTER;
    const total = PlanCalculator.validateScope(input.bookSlugs);
    PlanCalculator.validateActiveDays(input.skipWeekdays);

    const warnings: PlanWarning[] = [];
    let rawCpd = input.minutesPerDay / avg;

    if (input.minutesPerDay < MIN_MINUTES_PER_DAY) {
      warnings.push("time_below_minimum");
    }

    if (rawCpd < 1) {
      warnings.push("adjusted_to_one_chapter");
      rawCpd = 1;
    }

    const cpd = Math.floor(rawCpd);
    if (cpd > 20) warnings.push("very_aggressive_pace");
    else if (cpd > AGGRESSIVE_CHAPTERS_THRESHOLD)
      warnings.push("aggressive_pace");

    const activeDaysNeeded = Math.ceil(total / cpd);
    const startDate = parseIsoDate(input.startDate);
    const endDate = addActiveDays(
      startDate,
      activeDaysNeeded,
      input.skipWeekdays,
    );

    return {
      chaptersPerDay: cpd,
      minutesPerDay: parseFloat(input.minutesPerDay.toFixed(1)),
      totalChapters: total,
      totalReadingMinutes: parseFloat((total * avg).toFixed(1)),
      estimatedEndDate: toIsoDate(endDate),
      totalCalendarDays:
        Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1,
      totalActiveDays: activeDaysNeeded,
      warnings,
      isAggressive: cpd > AGGRESSIVE_CHAPTERS_THRESHOLD,
      isVeryAggressive: cpd > 20,
      mode: "time",
      startDate: input.startDate,
      targetDate: null,
      skipWeekdays: input.skipWeekdays,
      avgMinutesPerChapter: avg,
    };
  }

  // ──────────────────────────────────────────
  // MODO 3 — Por Prazo (Deadline)
  // Entrada: targetDate → calcula caps/dia necessários
  // ──────────────────────────────────────────

  static byDeadline(input: DeadlineModeInput): PlanCalculationResult {
    const avg = input.avgMinutesPerChapter ?? DEFAULT_MINUTES_PER_CHAPTER;
    const total = PlanCalculator.validateScope(input.bookSlugs);
    PlanCalculator.validateActiveDays(input.skipWeekdays);

    const startDate = parseIsoDate(input.startDate);
    const targetDate = parseIsoDate(input.targetDate);

    if (targetDate <= startDate) {
      throw new PlanCalculationError(
        "DEADLINE_IN_PAST",
        `A data-alvo (${input.targetDate}) deve ser posterior à data de início (${input.startDate}).`,
      );
    }

    const activeDaysAvailable = countActiveDays(
      startDate,
      targetDate,
      input.skipWeekdays,
    );
    if (activeDaysAvailable === 0) {
      throw new PlanCalculationError(
        "NO_ACTIVE_DAYS",
        "Nenhum dia ativo disponível no período selecionado com os dias de descanso configurados.",
      );
    }

    const cpd = Math.ceil(total / activeDaysAvailable);

    if (cpd > MAX_CHAPTERS_PER_DAY) {
      throw new PlanCalculationError(
        "PACE_EXCEEDS_MAX",
        `O prazo exige ${cpd} capítulos/dia, acima do máximo suportado (${MAX_CHAPTERS_PER_DAY}). ` +
          `Amplie o prazo ou reduza o escopo de leitura.`,
      );
    }

    const warnings: PlanWarning[] = [];
    const calendarDays =
      Math.round((targetDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
    if (calendarDays < 7) warnings.push("deadline_very_soon");
    if (cpd > 20) warnings.push("very_aggressive_pace");
    else if (cpd > AGGRESSIVE_CHAPTERS_THRESHOLD)
      warnings.push("aggressive_pace");

    return {
      chaptersPerDay: cpd,
      minutesPerDay: parseFloat((cpd * avg).toFixed(1)),
      totalChapters: total,
      totalReadingMinutes: parseFloat((total * avg).toFixed(1)),
      estimatedEndDate: input.targetDate,
      totalCalendarDays: calendarDays,
      totalActiveDays: activeDaysAvailable,
      warnings,
      isAggressive: cpd > AGGRESSIVE_CHAPTERS_THRESHOLD,
      isVeryAggressive: cpd > 20,
      mode: "deadline",
      startDate: input.startDate,
      targetDate: input.targetDate,
      skipWeekdays: input.skipWeekdays,
      avgMinutesPerChapter: avg,
    };
  }

  // ──────────────────────────────────────────
  // VALIDAÇÕES INTERNAS
  // ──────────────────────────────────────────

  private static validateScope(bookSlugs: readonly string[]): number {
    if (bookSlugs.length === 0) {
      throw new PlanCalculationError(
        "EMPTY_SCOPE",
        "Nenhum livro foi selecionado para o plano.",
      );
    }
    const total = sumChapters(bookSlugs);
    if (total === 0) {
      throw new PlanCalculationError(
        "ZERO_CHAPTERS",
        "O escopo selecionado não contém capítulos válidos.",
      );
    }
    return total;
  }

  private static validateActiveDays(skipWeekdays: readonly number[]): void {
    if (new Set(skipWeekdays).size >= 7) {
      throw new PlanCalculationError(
        "NO_ACTIVE_DAYS",
        "Todos os dias da semana estão marcados como descanso. Pelo menos um dia deve ser ativo.",
      );
    }
  }

  // ──────────────────────────────────────────
  // UTILITÁRIO PÚBLICO
  // ──────────────────────────────────────────

  /**
   * Estimativa rápida sem lançar erros — para preview em tempo real
   * no formulário de criação enquanto o usuário digita.
   * Retorna null se os inputs forem inválidos.
   */
  static preview(
    input: Partial<PlanInput>,
  ): Partial<PlanCalculationResult> | null {
    try {
      if (!input.mode || !input.bookSlugs || !input.startDate) return null;
      return PlanCalculator.calculate(input as PlanInput);
    } catch {
      return null;
    }
  }

  /**
   * Rótulo de warning para exibição na UI.
   */
  static warningLabel(warning: PlanWarning): string {
    const labels: Record<PlanWarning, string> = {
      time_below_minimum: "Tempo diário muito baixo para uma leitura completa.",
      adjusted_to_one_chapter:
        "Tempo ajustado para o mínimo de 1 capítulo por dia.",
      aggressive_pace:
        "Ritmo acelerado. Exige comprometimento diário consistente.",
      very_aggressive_pace: "Ritmo muito intenso. Avalie ampliar o prazo.",
      deadline_very_soon: "Prazo em menos de 7 dias.",
    };
    return labels[warning] ?? warning;
  }
}
