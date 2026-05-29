/**
 * VERBUM — Engine: Date Helpers
 *
 * Funções puras de manipulação de data para toda a Engine.
 * Todas operam em UTC para evitar bugs de DST (horário de verão).
 *
 * Convenção de formato:
 *   ISO date  → "2025-01-15"           (sem horário)
 *   ISO datetime → "2025-01-15T10:30:00.000Z"
 */

// ─────────────────────────────────────────────
// PARSING E FORMATAÇÃO
// ─────────────────────────────────────────────

/**
 * Converte ISO date string para Date UTC midnight.
 * Usar SEMPRE este método para evitar problemas de fuso horário.
 * Ex: "2025-01-15" → Date(2025-01-15T00:00:00.000Z)
 */
export function parseIsoDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00.000Z");
}

/**
 * Converte um Date para ISO date string (apenas data, sem horário).
 * Ex: Date(2025-01-15T10:30:00.000Z) → "2025-01-15"
 */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Data de hoje em ISO date string (UTC) */
export function todayIso(): string {
  return toIsoDate(new Date());
}

// ─────────────────────────────────────────────
// ARITMÉTICA DE DATAS
// ─────────────────────────────────────────────

/**
 * Retorna um novo Date somando N dias (pode ser negativo).
 * Usa setUTCDate para evitar bugs de DST.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Diferença em dias entre duas datas (endDate − startDate).
 * Resultado positivo se endDate > startDate.
 */
export function diffDays(startDate: Date, endDate: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
}

/** Dia da semana em UTC: 0 = domingo, 6 = sábado */
export function getDayOfWeek(date: Date): number {
  return date.getUTCDay();
}

// ─────────────────────────────────────────────
// CÁLCULO DE DIAS ATIVOS
// ─────────────────────────────────────────────

/**
 * Conta quantos "dias ativos" existem entre startDate e endDate (inclusive).
 * Dias ativos = dias que NÃO estão em skipWeekdays.
 *
 * Algoritmo O(1): usa divisão inteira de semanas completas + iteração
 * apenas sobre os dias restantes (máx. 6 iterações).
 */
export function countActiveDays(
  startDate: Date,
  endDate: Date,
  skipWeekdays: readonly number[],
): number {
  const totalDays = diffDays(startDate, endDate) + 1;
  if (totalDays <= 0) return 0;

  const skipSet = new Set(skipWeekdays);
  const activePerWeek = 7 - skipSet.size;
  if (activePerWeek === 0) return 0;

  const fullWeeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;

  let activeInRemainder = 0;
  const startDow = getDayOfWeek(startDate);
  for (let i = 0; i < remainingDays; i++) {
    if (!skipSet.has((startDow + i) % 7)) activeInRemainder++;
  }

  return fullWeeks * activePerWeek + activeInRemainder;
}

/**
 * Avança uma data até que N dias ativos tenham sido contados.
 * Retorna a data do N-ésimo dia ativo a partir de startDate (inclusive).
 *
 * Ex: startDate = segunda, skipWeekdays = [0,6], activeDays = 5
 *     → retorna sexta (5 dias úteis)
 */
export function addActiveDays(
  startDate: Date,
  activeDays: number,
  skipWeekdays: readonly number[],
): Date {
  if (activeDays <= 0) return new Date(startDate);

  const skipSet = new Set(skipWeekdays);
  const result = new Date(startDate);
  let counted = 0;

  while (counted < activeDays) {
    if (!skipSet.has(getDayOfWeek(result))) {
      counted++;
    }
    if (counted < activeDays) {
      result.setUTCDate(result.getUTCDate() + 1);
    }
  }

  return result;
}

/**
 * Verifica se um dia específico é ativo (não está em skipWeekdays).
 */
export function isActiveDay(
  date: Date,
  skipWeekdays: readonly number[],
): boolean {
  return !skipWeekdays.includes(getDayOfWeek(date));
}

/**
 * Retorna a próxima data ativa a partir de uma data (inclusive a própria data).
 */
export function nextActiveDay(
  date: Date,
  skipWeekdays: readonly number[],
): Date {
  const result = new Date(date);
  while (!isActiveDay(result, skipWeekdays)) {
    result.setUTCDate(result.getUTCDate() + 1);
  }
  return result;
}

/**
 * Número de dias ativos por semana dado o conjunto de dias de descanso.
 */
export function activeDaysPerWeek(skipWeekdays: readonly number[]): number {
  return 7 - new Set(skipWeekdays).size;
}

// ─────────────────────────────────────────────
// COMPARAÇÃO
// ─────────────────────────────────────────────

export function isoDateBefore(a: string, b: string): boolean {
  return a < b;
}

export function isoDateAfter(a: string, b: string): boolean {
  return a > b;
}

export function isoDateEqual(a: string, b: string): boolean {
  return a === b;
}

/** ISO date de ontem */
export function yesterdayIso(): string {
  return toIsoDate(addDays(new Date(), -1));
}
