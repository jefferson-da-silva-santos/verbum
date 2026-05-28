/**
 * VERBUM — ProgressRepository
 *
 * Tracking de progresso de leitura: capítulos lidos e sessões.
 * Este é o repository mais consultado pelo Engine (métricas, streak, heatmap).
 *
 * Separação de responsabilidades:
 *   - Repository: fornece dados brutos do banco
 *   - Engine (MetricsCalculator, StreakCalculator): processa os dados
 */

import { BaseRepository } from "./BaseRepository";
import type {
  ChapterProgress,
  ReadingSession,
  CreateChapterProgressInput,
  CreateReadingSessionInput,
  HeatmapEntry,
  StreakData,
  SessionStats,
} from "../types";

// ─────────────────────────────────────────────
// ROW TYPES
// ─────────────────────────────────────────────

interface ChapterProgressRow {
  id: string;
  plan_id: string;
  user_id: string;
  book_slug: string;
  book_name: string;
  chapter_number: number;
  read_at: string;
  reading_duration_seconds: number | null;
  schedule_date: string | null;
  is_on_time: number;
  created_at: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  book_slug: string | null;
  chapter_number: number | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  chapters_read: number;
  created_at: string;
}

export class ProgressRepository extends BaseRepository {
  protected readonly name = "ProgressRepository";

  // ─────────────────────────────────────────
  // MAPEAMENTO
  // ─────────────────────────────────────────

  private mapProgress(row: ChapterProgressRow): ChapterProgress {
    return {
      id: row.id,
      planId: row.plan_id,
      userId: row.user_id,
      bookSlug: row.book_slug,
      bookName: row.book_name,
      chapterNumber: row.chapter_number,
      readAt: row.read_at,
      readingDurationSeconds: row.reading_duration_seconds,
      scheduleDate: row.schedule_date,
      isOnTime: this.intToBool(row.is_on_time),
      createdAt: row.created_at,
    };
  }

  private mapSession(row: SessionRow): ReadingSession {
    return {
      id: row.id,
      userId: row.user_id,
      planId: row.plan_id,
      bookSlug: row.book_slug,
      chapterNumber: row.chapter_number,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationSeconds: row.duration_seconds,
      chaptersRead: row.chapters_read,
      createdAt: row.created_at,
    };
  }

  // ─────────────────────────────────────────
  // CHAPTER PROGRESS — WRITE
  // ─────────────────────────────────────────

  /**
   * Registra um capítulo como lido.
   * O UNIQUE(plan_id, book_slug, chapter_number) previne duplicatas —
   * a operação é silenciosamente ignorada se o capítulo já foi marcado.
   */
  async markChapterRead(
    input: CreateChapterProgressInput,
  ): Promise<ChapterProgress> {
    try {
      const id = this.generateId();
      const now = this.now();

      await this.db.runAsync(
        `INSERT OR IGNORE INTO chapter_progress (
          id, plan_id, user_id, book_slug, book_name,
          chapter_number, read_at, reading_duration_seconds,
          schedule_date, is_on_time, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.planId,
          input.userId,
          input.bookSlug,
          input.bookName,
          input.chapterNumber,
          input.readAt ?? now,
          input.readingDurationSeconds ?? null,
          input.scheduleDate ?? null,
          this.boolToInt(input.isOnTime),
          now,
        ],
      );

      // Retorna o registro inserido ou o existente
      const row = await this.db.getFirstAsync<ChapterProgressRow>(
        "SELECT * FROM chapter_progress WHERE plan_id = ? AND book_slug = ? AND chapter_number = ?",
        [input.planId, input.bookSlug, input.chapterNumber],
      );
      return this.mapProgress(row!);
    } catch (e) {
      throw this.wrapError("markChapterRead", e);
    }
  }

  /**
   * Desfaz a marcação de um capítulo como lido.
   * Usado quando o usuário cancela acidentalmente.
   */
  async unmarkChapterRead(
    planId: string,
    bookSlug: string,
    chapterNumber: number,
  ): Promise<void> {
    try {
      await this.db.runAsync(
        "DELETE FROM chapter_progress WHERE plan_id = ? AND book_slug = ? AND chapter_number = ?",
        [planId, bookSlug, chapterNumber],
      );
    } catch (e) {
      throw this.wrapError("unmarkChapterRead", e);
    }
  }

  // ─────────────────────────────────────────
  // CHAPTER PROGRESS — READ
  // ─────────────────────────────────────────

  async isChapterRead(
    planId: string,
    bookSlug: string,
    chapterNumber: number,
  ): Promise<boolean> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) as c FROM chapter_progress WHERE plan_id = ? AND book_slug = ? AND chapter_number = ?",
        [planId, bookSlug, chapterNumber],
      );
      return (row?.c ?? 0) > 0;
    } catch (e) {
      throw this.wrapError("isChapterRead", e);
    }
  }

  /**
   * Retorna Set de chapterIds lidos em um plano específico.
   * Formato: "gn-1", "jo-3", "ap-22" — compatível com bible.ts.
   * Usado pelo Engine para calcular % de conclusão do plano.
   */
  async getReadChapterIdsForPlan(planId: string): Promise<Set<string>> {
    try {
      const rows = await this.db.getAllAsync<{ chapter_id: string }>(
        `SELECT book_slug || '-' || chapter_number as chapter_id
         FROM chapter_progress
         WHERE plan_id = ?`,
        [planId],
      );
      return new Set(rows.map((r) => r.chapter_id));
    } catch (e) {
      throw this.wrapError("getReadChapterIdsForPlan", e);
    }
  }

  /**
   * Retorna Set de chapterIds lidos globalmente (qualquer plano).
   * Usado para calcular progresso total da Bíblia.
   */
  async getReadChapterIdsGlobal(userId: string): Promise<Set<string>> {
    try {
      const rows = await this.db.getAllAsync<{ chapter_id: string }>(
        `SELECT DISTINCT book_slug || '-' || chapter_number as chapter_id
         FROM chapter_progress
         WHERE user_id = ?`,
        [userId],
      );
      return new Set(rows.map((r) => r.chapter_id));
    } catch (e) {
      throw this.wrapError("getReadChapterIdsGlobal", e);
    }
  }

  /** Contagem de capítulos lidos em um plano */
  async getReadCountForPlan(planId: string): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) as c FROM chapter_progress WHERE plan_id = ?",
        [planId],
      );
      return row?.c ?? 0;
    } catch (e) {
      throw this.wrapError("getReadCountForPlan", e);
    }
  }

  /** Contagem de capítulos lidos de um livro específico em um plano */
  async getReadCountByBook(planId: string, bookSlug: string): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) as c FROM chapter_progress WHERE plan_id = ? AND book_slug = ?",
        [planId, bookSlug],
      );
      return row?.c ?? 0;
    } catch (e) {
      throw this.wrapError("getReadCountByBook", e);
    }
  }

  /**
   * Retorna dados para o heatmap de atividade (N dias passados).
   * Agrupa capítulos únicos lidos por data (ISO date).
   */
  async getHeatmapData(
    userId: string,
    days: number = 365,
  ): Promise<HeatmapEntry[]> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const rows = await this.db.getAllAsync<{
        date: string;
        chapters_read: number;
      }>(
        `SELECT
           substr(read_at, 1, 10) as date,
           COUNT(DISTINCT book_slug || '-' || chapter_number) as chapters_read
         FROM chapter_progress
         WHERE user_id = ? AND substr(read_at, 1, 10) >= ?
         GROUP BY date
         ORDER BY date ASC`,
        [userId, since],
      );

      return rows.map((r) => ({
        date: r.date,
        chaptersRead: r.chapters_read,
      }));
    } catch (e) {
      throw this.wrapError("getHeatmapData", e);
    }
  }

  /**
   * Retorna dados brutos para o StreakCalculator.
   * Lista de datas com leitura (mais recente primeiro) e a última data de leitura.
   */
  async getStreakData(userId: string): Promise<StreakData> {
    try {
      const rows = await this.db.getAllAsync<{ read_date: string }>(
        `SELECT DISTINCT substr(read_at, 1, 10) as read_date
         FROM chapter_progress
         WHERE user_id = ?
         ORDER BY read_date DESC
         LIMIT 400`,
        [userId],
      );

      const lastRow = rows[0] ?? null;

      return {
        readDates: rows.map((r) => r.read_date),
        lastReadAt: lastRow ? lastRow.read_date : null,
      };
    } catch (e) {
      throw this.wrapError("getStreakData", e);
    }
  }

  /** Progresso de leitura por testamento */
  async getCountByTestament(
    userId: string,
  ): Promise<{ OT: number; NT: number }> {
    try {
      // Usa os slugs NT conhecidos para distinguir — evita JOIN com tabela externa
      const NT_SLUGS = [
        "mt",
        "mc",
        "lc",
        "jo",
        "at",
        "rm",
        "1co",
        "2co",
        "gl",
        "ef",
        "fp",
        "cl",
        "1ts",
        "2ts",
        "1tm",
        "2tm",
        "tt",
        "fm",
        "hb",
        "tg",
        "1pe",
        "2pe",
        "1jo",
        "2jo",
        "3jo",
        "jd",
        "ap",
      ];
      const placeholders = NT_SLUGS.map(() => "?").join(",");

      const row = await this.db.getFirstAsync<{ nt: number }>(
        `SELECT COUNT(DISTINCT book_slug || '-' || chapter_number) as nt
         FROM chapter_progress
         WHERE user_id = ? AND book_slug IN (${placeholders})`,
        [userId, ...NT_SLUGS],
      );

      const nt = row?.nt ?? 0;

      const total = await this.db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(DISTINCT book_slug || '-' || chapter_number) as c
         FROM chapter_progress WHERE user_id = ?`,
        [userId],
      );

      return { OT: (total?.c ?? 0) - nt, NT: nt };
    } catch (e) {
      throw this.wrapError("getCountByTestament", e);
    }
  }

  /** Número de categorias de livros com pelo menos 1 capítulo lido */
  async getReadCategoriesCount(userId: string): Promise<number> {
    // A categorização é feita no código, não no banco.
    // Este método delega ao caller o cruzamento com os metadados de bible.ts.
    // Retorna os slugs únicos de livros lidos para que o caller categorize.
    try {
      const rows = await this.db.getAllAsync<{ book_slug: string }>(
        "SELECT DISTINCT book_slug FROM chapter_progress WHERE user_id = ?",
        [userId],
      );
      return rows.length; // caller usa getBook(slug).category para contar categorias únicas
    } catch (e) {
      throw this.wrapError("getReadCategoriesCount", e);
    }
  }

  /** Slugs únicos de livros com pelo menos 1 capítulo lido */
  async getReadBookSlugs(userId: string): Promise<string[]> {
    try {
      const rows = await this.db.getAllAsync<{ book_slug: string }>(
        "SELECT DISTINCT book_slug FROM chapter_progress WHERE user_id = ?",
        [userId],
      );
      return rows.map((r) => r.book_slug);
    } catch (e) {
      throw this.wrapError("getReadBookSlugs", e);
    }
  }

  // ─────────────────────────────────────────
  // READING SESSIONS — WRITE
  // ─────────────────────────────────────────

  /** Inicia uma nova sessão de leitura */
  async startSession(
    input: CreateReadingSessionInput,
  ): Promise<ReadingSession> {
    try {
      const id = this.generateId();
      const now = this.now();

      await this.db.runAsync(
        `INSERT INTO reading_sessions
          (id, user_id, plan_id, book_slug, chapter_number, started_at,
           ended_at, duration_seconds, chapters_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, 0, ?)`,
        [
          id,
          input.userId,
          input.planId ?? null,
          input.bookSlug ?? null,
          input.chapterNumber ?? null,
          input.startedAt,
          now,
        ],
      );

      return (await this.findSessionById(id))!;
    } catch (e) {
      throw this.wrapError("startSession", e);
    }
  }

  /** Finaliza uma sessão em andamento */
  async endSession(
    sessionId: string,
    durationSeconds: number,
    chaptersRead: number,
  ): Promise<void> {
    try {
      await this.db.runAsync(
        "UPDATE reading_sessions SET ended_at = ?, duration_seconds = ?, chapters_read = ? WHERE id = ?",
        [this.now(), durationSeconds, chaptersRead, sessionId],
      );
    } catch (e) {
      throw this.wrapError("endSession", e);
    }
  }

  // ─────────────────────────────────────────
  // READING SESSIONS — READ
  // ─────────────────────────────────────────

  async findSessionById(id: string): Promise<ReadingSession | null> {
    try {
      const row = await this.db.getFirstAsync<SessionRow>(
        "SELECT * FROM reading_sessions WHERE id = ?",
        [id],
      );
      return row ? this.mapSession(row) : null;
    } catch (e) {
      throw this.wrapError("findSessionById", e);
    }
  }

  /** Estatísticas agregadas de sessões do usuário */
  async getSessionStats(userId: string): Promise<SessionStats> {
    try {
      const row = await this.db.getFirstAsync<{
        total: number;
        total_duration: number | null;
        avg_duration: number | null;
        total_chapters: number;
      }>(
        `SELECT
           COUNT(*) as total,
           SUM(duration_seconds) as total_duration,
           AVG(duration_seconds) as avg_duration,
           SUM(chapters_read) as total_chapters
         FROM reading_sessions
         WHERE user_id = ? AND ended_at IS NOT NULL`,
        [userId],
      );

      return {
        totalSessions: row?.total ?? 0,
        totalDurationSeconds: row?.total_duration ?? 0,
        avgDurationSeconds: Math.round(row?.avg_duration ?? 0),
        totalChaptersRead: row?.total_chapters ?? 0,
      };
    } catch (e) {
      throw this.wrapError("getSessionStats", e);
    }
  }

  async countSessions(userId: string): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) as c FROM reading_sessions WHERE user_id = ? AND ended_at IS NOT NULL",
        [userId],
      );
      return row?.c ?? 0;
    } catch (e) {
      throw this.wrapError("countSessions", e);
    }
  }
}
