/**
 * VERBUM — Utils: formatters
 *
 * Funções de formatação de dados para exibição na UI.
 * Todas são funções puras sem efeitos colaterais.
 */

// ─────────────────────────────────────────────
// REFERÊNCIAS BÍBLICAS
// ─────────────────────────────────────────────

/**
 * Formata referência de capítulo.
 * ("gn", 1) → já disponível em bible.ts como formatChapterRef
 * Esta versão aceita nome abreviado diretamente.
 * Ex: ("Gn", 1) → "Gn 1"
 */
export function formatChapterRef(abbr: string, chapter: number): string {
  return `${abbr} ${chapter}`;
}

/**
 * Formata referência de versículo.
 * ("Gn", 1, 1) → "Gn 1:1"
 */
export function formatVerseRef(
  abbr: string,
  chapter: number,
  verse: number,
): string {
  return `${abbr} ${chapter}:${verse}`;
}

/**
 * Formata referência de intervalo de capítulos.
 * ("Gn", 1, 3) → "Gn 1–3"
 */
export function formatChapterRange(
  abbr: string,
  from: number,
  to: number,
): string {
  if (from === to) return formatChapterRef(abbr, from);
  return `${abbr} ${from}–${to}`;
}

// ─────────────────────────────────────────────
// DURAÇÃO E TEMPO
// ─────────────────────────────────────────────

/**
 * Formata segundos em string de duração legível.
 * 90   → "1min 30s"
 * 3660 → "1h 1min"
 * 86400 → "24h"
 */
export function formatDurationSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}min ${s}s` : `${m}min`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/**
 * Formata minutos em string de duração.
 * 90  → "1h 30min"
 * 30  → "30min"
 * 3.7 → "~4min"
 */
export function formatMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded}min`;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/**
 * Formata minutos com prefixo "~" para estimativas.
 * 3.7 → "~4min"
 */
export function formatEstimatedTime(minutes: number): string {
  return `~${formatMinutes(minutes)}`;
}

// ─────────────────────────────────────────────
// NÚMEROS E PROGRESSO
// ─────────────────────────────────────────────

/**
 * Formata um número com separador de milhar no padrão pt-BR.
 * 1189 → "1.189"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString("pt-BR");
}

/**
 * Formata porcentagem com precisão configurável.
 * (47.3478, 1) → "47.3%"
 * (100, 0)     → "100%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  const clamped = Math.min(100, Math.max(0, value));
  return `${clamped.toFixed(decimals)}%`;
}

/**
 * Formata a contagem de capítulos com singular/plural.
 * 1 → "1 capítulo"
 * 3 → "3 capítulos"
 */
export function formatChapterCount(n: number): string {
  return `${formatNumber(n)} capítulo${n !== 1 ? "s" : ""}`;
}

/**
 * Formata streak de dias.
 * 0 → "—"
 * 1 → "1 dia"
 * 7 → "7 dias"
 */
export function formatStreak(days: number): string {
  if (days === 0) return "—";
  return `${days} dia${days !== 1 ? "s" : ""}`;
}

/**
 * Formata ritmo de leitura de um plano.
 * ("chapters", 3) → "3 caps/dia"
 * ("time", 20)    → "20 min/dia"
 */
export function formatPlanPace(
  mode: "chapters" | "time" | "deadline",
  value: number | null,
): string {
  if (value === null) return "—";
  if (mode === "chapters") return `${value} cap${value !== 1 ? "s" : ""}/dia`;
  if (mode === "time") return `${Math.round(value)} min/dia`;
  return `${value} caps/dia`;
}

/**
 * Formata total de livros com singular/plural.
 * 1 → "1 livro"
 * 66 → "66 livros"
 */
export function formatBookCount(n: number): string {
  return `${n} livro${n !== 1 ? "s" : ""}`;
}

// ─────────────────────────────────────────────
// TEXTO E TRUNCAMENTO
// ─────────────────────────────────────────────

/**
 * Trunca texto com reticências.
 * ("Este é um texto longo", 15) → "Este é um text…"
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trim() + "…";
}

/**
 * Capitaliza a primeira letra de uma string.
 * "gênesis" → "Gênesis"
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Remove acentos de uma string (para busca).
 * "Gênesis" → "Genesis"
 */
export function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Prepara uma string para comparação de busca (lowercase + sem acentos).
 */
export function normalizeForSearch(str: string): string {
  return removeAccents(str.toLowerCase().trim());
}

// ─────────────────────────────────────────────
// NOTAS E DIÁRIO
// ─────────────────────────────────────────────

/**
 * Rótulo do tipo de nota para exibição.
 */
export const NOTE_TYPE_LABELS = {
  reflexao: "Reflexão",
  interpretacao: "Interpretação",
  revelacao: "Revelação",
  aplicacao: "Aplicação",
} as const;

/**
 * Rótulos do humor do diário.
 */
export const DIARY_MOOD_LABELS = {
  gratidao: "🙏 Gratidão",
  oracao: "✨ Oração",
  reflexao: "💭 Reflexão",
  testemunho: "📖 Testemunho",
  pedido: "🕊️ Pedido",
} as const;
