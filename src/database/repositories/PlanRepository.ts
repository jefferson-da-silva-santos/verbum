/**
 * VERBUM — PlanRepository
 *
 * Gerencia planos de leitura e seus cronogramas.
 * A criação de um plano é sempre atômica — plan + schedule entries
 * são inseridos dentro de uma única transação.
 */

import { BaseRepository } from "./BaseRepository";
import type {
  ReadingPlan,
  PlanScheduleEntry,
  CreatePlanInput,
  CreateScheduleEntryInput,
  ScopeData,
} from "../../types";
import type { ChapterRef } from "../../constants";

// ─────────────────────────────────────────────
// ROW TYPES
// ─────────────────────────────────────────────

interface PlanRow {
  id: string;
  user_id: string;
  name: string;
  scope_type: string;
  scope_data: string;
  mode: string;
  chapters_per_day: number | null;
  minutes_per_day: number | null;
  target_date: string | null;
  start_date: string;
  estimated_end_date: string | null;
  skip_weekdays: string;
  total_chapters: number;
  bible_version: string;
  is_active: number;
  is_completed: number;
  completed_at: string | null;
  recalibration_count: number;
  created_at: string;
  updated_at: string;
}

interface ScheduleRow {
  id: string;
  plan_id: string;
  date: string;
  is_active: number;
  chapters: string;
  estimated_minutes: number | null;
  created_at: string;
}

export class PlanRepository extends BaseRepository {
  protected readonly name = "PlanRepository";

  // ─────────────────────────────────────────
  // MAPEAMENTO
  // ─────────────────────────────────────────

  private mapPlan(row: PlanRow): ReadingPlan {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      scopeType: row.scope_type as ReadingPlan["scopeType"],
      scopeData: this.fromJson<ScopeData>(row.scope_data, {
        type: "full_bible",
      }),
      mode: row.mode as ReadingPlan["mode"],
      chaptersPerDay: row.chapters_per_day,
      minutesPerDay: row.minutes_per_day,
      targetDate: row.target_date,
      startDate: row.start_date,
      estimatedEndDate: row.estimated_end_date,
      skipWeekdays: this.fromJson<number[]>(row.skip_weekdays, []),
      totalChapters: row.total_chapters,
      bibleVersion: row.bible_version as ReadingPlan["bibleVersion"],
      isActive: this.intToBool(row.is_active),
      isCompleted: this.intToBool(row.is_completed),
      completedAt: row.completed_at,
      recalibrationCount: row.recalibration_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapSchedule(row: ScheduleRow): PlanScheduleEntry {
    return {
      id: row.id,
      planId: row.plan_id,
      date: row.date,
      isActive: this.intToBool(row.is_active),
      chapters: this.fromJson<ChapterRef[]>(row.chapters, []),
      estimatedMinutes: row.estimated_minutes,
      createdAt: row.created_at,
    };
  }

  // ─────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────

  /**
   * Cria um plano de leitura e insere todas as entradas do cronograma
   * em uma única transação — garantia de consistência.
   */
  async create(
    input: CreatePlanInput,
    scheduleEntries: CreateScheduleEntryInput[],
  ): Promise<ReadingPlan> {
    const planId = this.generateId();
    const now = this.now();

    try {
      await this.db.withTransactionAsync(async () => {
        // Desativar qualquer plano ativo anterior do usuário
        await this.db.runAsync(
          "UPDATE reading_plans SET is_active = 0, updated_at = ? WHERE user_id = ? AND is_active = 1",
          [now, input.userId],
        );

        // Inserir o novo plano
        await this.db.runAsync(
          `INSERT INTO reading_plans (
            id, user_id, name, scope_type, scope_data, mode,
            chapters_per_day, minutes_per_day, target_date,
            start_date, estimated_end_date, skip_weekdays,
            total_chapters, bible_version, is_active, is_completed,
            completed_at, recalibration_count, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            planId,
            input.userId,
            input.name,
            input.scopeType,
            this.toJson(input.scopeData),
            input.mode,
            input.chaptersPerDay ?? null,
            input.minutesPerDay ?? null,
            input.targetDate ?? null,
            input.startDate,
            input.estimatedEndDate ?? null,
            this.toJson(input.skipWeekdays),
            input.totalChapters,
            input.bibleVersion,
            this.boolToInt(input.isActive),
            0, // is_completed
            null,
            0, // recalibration_count
            now,
            now,
          ],
        );

        // Inserir cronograma em lotes de 50 para evitar statements gigantes
        const BATCH_SIZE = 50;
        for (let i = 0; i < scheduleEntries.length; i += BATCH_SIZE) {
          const batch = scheduleEntries.slice(i, i + BATCH_SIZE);
          for (const entry of batch) {
            await this.db.runAsync(
              `INSERT INTO plan_schedule
                (id, plan_id, date, is_active, chapters, estimated_minutes, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                this.generateId(),
                planId,
                entry.date,
                this.boolToInt(entry.isActive),
                this.toJson(entry.chapters),
                entry.estimatedMinutes ?? null,
                now,
              ],
            );
          }
        }
      });

      return (await this.findById(planId))!;
    } catch (e) {
      throw this.wrapError("create", e);
    }
  }

  // ─────────────────────────────────────────
  // READ — PLANOS
  // ─────────────────────────────────────────

  async findById(id: string): Promise<ReadingPlan | null> {
    try {
      const row = await this.db.getFirstAsync<PlanRow>(
        "SELECT * FROM reading_plans WHERE id = ?",
        [id],
      );
      return row ? this.mapPlan(row) : null;
    } catch (e) {
      throw this.wrapError("findById", e);
    }
  }

  /** Retorna o plano ativo do usuário (pode ser null se não há plano ativo) */
  async findActive(userId: string): Promise<ReadingPlan | null> {
    try {
      const row = await this.db.getFirstAsync<PlanRow>(
        "SELECT * FROM reading_plans WHERE user_id = ? AND is_active = 1 AND is_completed = 0 ORDER BY created_at DESC LIMIT 1",
        [userId],
      );
      return row ? this.mapPlan(row) : null;
    } catch (e) {
      throw this.wrapError("findActive", e);
    }
  }

  /** Retorna todos os planos do usuário (mais recente primeiro) */
  async findAll(userId: string): Promise<ReadingPlan[]> {
    try {
      const rows = await this.db.getAllAsync<PlanRow>(
        "SELECT * FROM reading_plans WHERE user_id = ? ORDER BY created_at DESC",
        [userId],
      );
      return rows.map((r) => this.mapPlan(r));
    } catch (e) {
      throw this.wrapError("findAll", e);
    }
  }

  /** Retorna planos já concluídos */
  async findCompleted(userId: string): Promise<ReadingPlan[]> {
    try {
      const rows = await this.db.getAllAsync<PlanRow>(
        "SELECT * FROM reading_plans WHERE user_id = ? AND is_completed = 1 ORDER BY completed_at DESC",
        [userId],
      );
      return rows.map((r) => this.mapPlan(r));
    } catch (e) {
      throw this.wrapError("findCompleted", e);
    }
  }

  // ─────────────────────────────────────────
  // READ — CRONOGRAMA
  // ─────────────────────────────────────────

  /** Retorna a entrada do cronograma para uma data específica */
  async getScheduleForDate(
    planId: string,
    date: string,
  ): Promise<PlanScheduleEntry | null> {
    try {
      const row = await this.db.getFirstAsync<ScheduleRow>(
        "SELECT * FROM plan_schedule WHERE plan_id = ? AND date = ?",
        [planId, date],
      );
      return row ? this.mapSchedule(row) : null;
    } catch (e) {
      throw this.wrapError("getScheduleForDate", e);
    }
  }

  /** Retorna entradas do cronograma em um intervalo de datas (inclusive) */
  async getScheduleRange(
    planId: string,
    startDate: string,
    endDate: string,
  ): Promise<PlanScheduleEntry[]> {
    try {
      const rows = await this.db.getAllAsync<ScheduleRow>(
        "SELECT * FROM plan_schedule WHERE plan_id = ? AND date BETWEEN ? AND ? ORDER BY date ASC",
        [planId, startDate, endDate],
      );
      return rows.map((r) => this.mapSchedule(r));
    } catch (e) {
      throw this.wrapError("getScheduleRange", e);
    }
  }

  /** Retorna as próximas N entradas ativas do cronograma a partir de uma data */
  async getUpcomingSchedule(
    planId: string,
    fromDate: string,
    limit: number = 7,
  ): Promise<PlanScheduleEntry[]> {
    try {
      const rows = await this.db.getAllAsync<ScheduleRow>(
        "SELECT * FROM plan_schedule WHERE plan_id = ? AND date >= ? AND is_active = 1 ORDER BY date ASC LIMIT ?",
        [planId, fromDate, limit],
      );
      return rows.map((r) => this.mapSchedule(r));
    } catch (e) {
      throw this.wrapError("getUpcomingSchedule", e);
    }
  }

  // ─────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────

  /** Marca um plano como concluído */
  async markCompleted(id: string): Promise<void> {
    try {
      const now = this.now();
      await this.db.runAsync(
        "UPDATE reading_plans SET is_completed = 1, is_active = 0, completed_at = ?, updated_at = ? WHERE id = ?",
        [now, now, id],
      );
    } catch (e) {
      throw this.wrapError("markCompleted", e);
    }
  }

  /** Incrementa o contador de recalibrações e atualiza caps/dia */
  async recalibrate(
    id: string,
    newChaptersPerDay: number,
    newEstimatedEndDate: string,
    newScheduleEntries: CreateScheduleEntryInput[],
    fromDate: string,
  ): Promise<void> {
    const now = this.now();
    try {
      await this.db.withTransactionAsync(async () => {
        // Atualizar os dados do plano
        await this.db.runAsync(
          `UPDATE reading_plans SET
            chapters_per_day = ?,
            estimated_end_date = ?,
            recalibration_count = recalibration_count + 1,
            updated_at = ?
           WHERE id = ?`,
          [newChaptersPerDay, newEstimatedEndDate, now, id],
        );

        // Remover entradas futuras do cronograma (a partir de fromDate)
        await this.db.runAsync(
          "DELETE FROM plan_schedule WHERE plan_id = ? AND date >= ?",
          [id, fromDate],
        );

        // Inserir o novo cronograma recalibrado
        for (const entry of newScheduleEntries) {
          await this.db.runAsync(
            `INSERT INTO plan_schedule
              (id, plan_id, date, is_active, chapters, estimated_minutes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              this.generateId(),
              id,
              entry.date,
              this.boolToInt(entry.isActive),
              this.toJson(entry.chapters),
              entry.estimatedMinutes ?? null,
              now,
            ],
          );
        }
      });
    } catch (e) {
      throw this.wrapError("recalibrate", e);
    }
  }

  async setActive(id: string, userId: string): Promise<void> {
    const now = this.now();
    try {
      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync(
          "UPDATE reading_plans SET is_active = 0, updated_at = ? WHERE user_id = ? AND is_active = 1",
          [now, userId],
        );
        await this.db.runAsync(
          "UPDATE reading_plans SET is_active = 1, updated_at = ? WHERE id = ?",
          [now, id],
        );
      });
    } catch (e) {
      throw this.wrapError("setActive", e);
    }
  }

  // ─────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────

  /** Remove o plano e todos os dados em cascata (schedule, progress) */
  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync("DELETE FROM reading_plans WHERE id = ?", [id]);
    } catch (e) {
      throw this.wrapError("delete", e);
    }
  }

  // ─────────────────────────────────────────
  // CONTAGENS
  // ─────────────────────────────────────────

  async countCompleted(userId: string): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) as c FROM reading_plans WHERE user_id = ? AND is_completed = 1",
        [userId],
      );
      return row?.c ?? 0;
    } catch (e) {
      throw this.wrapError("countCompleted", e);
    }
  }
}
