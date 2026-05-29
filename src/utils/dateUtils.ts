/**
 * VERBUM — Utils: dateUtils
 *
 * Funções utilitárias de datas para a camada de UI e formatação.
 * Funções de cálculo puro (engine) ficam em src/engine/dateHelpers.ts.
 * Aqui ficam as funções de APRESENTAÇÃO das datas ao usuário.
 */

// ─────────────────────────────────────────────
// FORMATAÇÃO PARA EXIBIÇÃO
// ─────────────────────────────────────────────

const MONTHS_SHORT = [
  "jan.",
  "fev.",
  "mar.",
  "abr.",
  "mai.",
  "jun.",
  "jul.",
  "ago.",
  "set.",
  "out.",
  "nov.",
  "dez.",
];

const MONTHS_FULL = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const DAYS_FULL = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

/**
 * Converte ISO date "2025-01-15" para Date em UTC midnight.
 * Evita bugs de fuso horário ao parsear datas sem horário.
 */
export function parseIsoDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00.000Z");
}

/**
 * Formata ISO date em formato curto legível.
 * "2025-01-15" → "15 jan. 2025"
 */
export function formatShortDate(isoDate: string): string {
  try {
    const d = parseIsoDate(isoDate);
    const day = d.getUTCDate();
    const month = MONTHS_SHORT[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return isoDate;
  }
}

/**
 * Formata ISO date em formato longo.
 * "2025-01-15" → "15 de janeiro de 2025"
 */
export function formatLongDate(isoDate: string): string {
  try {
    const d = parseIsoDate(isoDate);
    const day = d.getUTCDate();
    const month = MONTHS_FULL[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day} de ${month} de ${year}`;
  } catch {
    return isoDate;
  }
}

/**
 * Formata ISO date com dia da semana.
 * "2025-01-15" → "quarta-feira, 15 jan."
 */
export function formatWithWeekday(isoDate: string): string {
  try {
    const d = parseIsoDate(isoDate);
    const weekday = DAYS_FULL[d.getUTCDay()];
    const day = d.getUTCDate();
    const month = MONTHS_SHORT[d.getUTCMonth()];
    return `${weekday}, ${day} ${month}`;
  } catch {
    return isoDate;
  }
}

/**
 * Retorna a data relativa ao dia atual (para exibição de listas e histórico).
 * "hoje", "ontem", "há 3 dias", "15 jan. 2025"
 *
 * @param isoDate ISO date ou ISO datetime
 */
export function relativeDate(isoDate: string): string {
  try {
    const input = new Date(
      isoDate.length === 10 ? isoDate + "T00:00:00.000Z" : isoDate,
    );
    const now = new Date();

    const inputDay = new Date(
      Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()),
    );
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const diffDays = Math.round(
      (today.getTime() - inputDay.getTime()) / (24 * 60 * 60 * 1000),
    );

    if (diffDays === 0) return "hoje";
    if (diffDays === 1) return "ontem";
    if (diffDays <= 6) return `há ${diffDays} dias`;
    if (diffDays <= 13) return "há uma semana";
    if (diffDays <= 29) return `há ${Math.round(diffDays / 7)} semanas`;
    if (diffDays <= 59) return "há um mês";
    if (diffDays <= 364) return `há ${Math.round(diffDays / 30)} meses`;
    return `há ${Math.round(diffDays / 365)} ano${Math.round(diffDays / 365) > 1 ? "s" : ""}`;
  } catch {
    return isoDate;
  }
}

/**
 * Formata horário de um ISO datetime.
 * "2025-01-15T10:30:00.000Z" → "10:30"
 */
export function formatTime(isoDatetime: string): string {
  try {
    const d = new Date(isoDatetime);
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${mins}`;
  } catch {
    return "";
  }
}

/**
 * Retorna o ISO date de hoje no formato "2025-01-15".
 */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Calcula o total de dias entre duas ISO dates (endDate - startDate).
 * Resultado positivo = endDate é mais recente.
 */
export function daysBetween(startIso: string, endIso: string): number {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Verifica se uma ISO date está no passado.
 */
export function isPast(isoDate: string): boolean {
  return daysBetween(isoDate, todayIsoDate()) < 0;
}

/**
 * Verifica se uma ISO date está no futuro.
 */
export function isFuture(isoDate: string): boolean {
  return daysBetween(isoDate, todayIsoDate()) > 0;
}

/**
 * Retorna o ISO date da data de hoje mais N dias.
 * addDaysToToday(7) → "2025-01-22"
 */
export function addDaysToToday(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Formata o mês/ano de um ISO date para exibição em headers de calendário.
 * "2025-01-15" → "Janeiro 2025"
 */
export function formatMonthYear(isoDate: string): string {
  try {
    const d = parseIsoDate(isoDate);
    const month = MONTHS_FULL[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  } catch {
    return isoDate;
  }
}
