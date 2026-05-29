/**
 * VERBUM — Engine: StreakCalculator
 *
 * Calcula a sequência de dias consecutivos de leitura (streak).
 *
 * Regras de negócio:
 *   - Um "dia de leitura" = qualquer dia com ≥1 capítulo marcado como lido
 *   - Streak "ativo" hoje: o usuário leu hoje OU leu ontem (ainda tem até 23:59)
 *   - Streak quebrado: último dia de leitura foi há 2+ dias
 *   - Streak máximo: o maior streak histórico registrado
 *
 * Esta classe NÃO acessa banco de dados. Recebe as datas brutas
 * vindas do ProgressRepository.getStreakData().
 */

import type { StreakData } from "../database/types";
import {
  todayIso,
  yesterdayIso,
  addDays,
  parseIsoDate,
  toIsoDate,
} from "./dateHelpers";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface StreakResult {
  /** Dias consecutivos atuais (0 se streak foi quebrado) */
  currentStreak: number;
  /** Maior streak já alcançado (histórico) */
  longestStreak: number;
  /** ISO date do último dia com leitura (null se nunca leu) */
  lastReadDate: string | null;
  /** Se já houve leitura hoje */
  isActiveToday: boolean;
  /** Se leu ontem mas ainda não hoje (streak ainda válido) */
  readYesterdayOnly: boolean;
  /** Total de dias únicos com leitura (não precisa ser consecutivo) */
  totalReadDays: number;
}

// ─────────────────────────────────────────────
// CLASSE
// ─────────────────────────────────────────────

export class StreakCalculator {
  /**
   * Calcula o streak a partir dos dados brutos do banco.
   * Recebe o retorno direto de ProgressRepository.getStreakData().
   *
   * @param data    StreakData com readDates (sorted DESC) e lastReadAt
   * @param today   ISO date de hoje (padrão: todayIso())
   */
  static calculate(data: StreakData, today: string = todayIso()): StreakResult {
    const { readDates } = data;

    if (readDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: null,
        isActiveToday: false,
        readYesterdayOnly: false,
        totalReadDays: 0,
      };
    }

    // De-duplicar e ordenar DESC (mais recente primeiro)
    const unique = [...new Set(readDates)].sort((a, b) => b.localeCompare(a));

    const yesterday = yesterdayIso();
    const lastReadDate = unique[0];
    const isActiveToday = lastReadDate === today;
    const readYesterdayOnly = !isActiveToday && lastReadDate === yesterday;

    // ── Current streak ────────────────────────
    // Só conta se houve leitura hoje OU ontem (streak ainda vivo)
    const streakAnchor = isActiveToday
      ? today
      : readYesterdayOnly
        ? yesterday
        : null;

    const currentStreak = streakAnchor
      ? StreakCalculator.countConsecutiveFrom(unique, streakAnchor)
      : 0;

    // ── Longest streak ────────────────────────
    const longestStreak = StreakCalculator.calcLongestStreak(unique);

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      lastReadDate,
      isActiveToday,
      readYesterdayOnly,
      totalReadDays: unique.length,
    };
  }

  /**
   * Versão simplificada — recebe diretamente uma lista de datas ISO.
   * Útil para testes unitários.
   */
  static calculateFromDates(dates: string[], today?: string): StreakResult {
    return StreakCalculator.calculate(
      { readDates: dates, lastReadAt: dates[0] ?? null },
      today,
    );
  }

  // ──────────────────────────────────────────
  // HELPERS PRIVADOS
  // ──────────────────────────────────────────

  /**
   * Conta quantos dias consecutivos existem a partir de `anchor` (inclusive),
   * percorrendo o array de datas (sorted DESC) para trás no tempo.
   */
  private static countConsecutiveFrom(
    sortedDatesDesc: string[],
    anchor: string,
  ): number {
    let streak = 0;
    let checkDate = anchor;

    for (const date of sortedDatesDesc) {
      if (date === checkDate) {
        streak++;
        // Avança para o dia anterior
        checkDate = toIsoDate(addDays(parseIsoDate(checkDate), -1));
      } else if (date < checkDate) {
        // Gap encontrado — streak terminou
        break;
      }
      // date > checkDate: ainda não chegamos na data esperada — continuar
    }

    return streak;
  }

  /**
   * Calcula o maior streak histórico varrendo todas as datas.
   * Complexidade: O(n) onde n = número de datas únicas.
   */
  private static calcLongestStreak(sortedDatesDesc: string[]): number {
    if (sortedDatesDesc.length === 0) return 0;

    let longest = 1;
    let current = 1;

    for (let i = 1; i < sortedDatesDesc.length; i++) {
      const prev = sortedDatesDesc[i - 1]; // mais recente
      const curr = sortedDatesDesc[i]; // mais antigo

      // prev e curr são consecutivos se prev = curr + 1 dia
      const expectedPrev = toIsoDate(addDays(parseIsoDate(curr), 1));

      if (prev === expectedPrev) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 1;
      }
    }

    return longest;
  }

  // ──────────────────────────────────────────
  // UTILITÁRIOS PÚBLICOS
  // ──────────────────────────────────────────

  /**
   * Verifica se o streak foi quebrado comparando a data atual com o lastReadDate.
   * Útil para notificações e alertas de streak em risco.
   */
  static isStreakAtRisk(
    lastReadDate: string | null,
    today: string = todayIso(),
  ): boolean {
    if (!lastReadDate) return false;
    return lastReadDate === yesterdayIso() && today !== lastReadDate;
  }

  /**
   * Formata o streak para exibição.
   * Ex: 0 → "—" · 1 → "1 dia" · 30 → "30 dias"
   */
  static format(streak: number): string {
    if (streak === 0) return "—";
    return streak === 1 ? "1 dia" : `${streak} dias`;
  }
}
