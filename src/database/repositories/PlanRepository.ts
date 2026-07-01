/**
 * VERBUM — PlanRepository [named params fix]
 */

import type { ChapterRef } from "../../constants";
import type { CreatePlanInput, CreateScheduleEntryInput, PlanScheduleEntry, ReadingPlan, ScopeData } from "../types";
import { BaseRepository } from "./BaseRepository";

interface PlanRow {
  id: string; user_id: string; name: string; scope_type: string; scope_data: string;
  mode: string; chapters_per_day: number | null; minutes_per_day: number | null;
  target_date: string | null; start_date: string; estimated_end_date: string | null;
  skip_weekdays: string; total_chapters: number; bible_version: string;
  is_active: number; is_completed: number; completed_at: string | null;
  recalibration_count: number; created_at: string; updated_at: string;
}

interface ScheduleRow {
  id: string; plan_id: string; date: string; is_active: number;
  chapters: string; estimated_minutes: number | null; created_at: string;
}

export class PlanRepository extends BaseRepository {
  protected readonly name = "PlanRepository";

  private mapPlan(row: PlanRow): ReadingPlan {
    return {
      id: row.id, userId: row.user_id, name: row.name,
      scopeType: row.scope_type as ReadingPlan["scopeType"],
      scopeData: this.fromJson<ScopeData>(row.scope_data, { type: "full_bible" }),
      mode: row.mode as ReadingPlan["mode"],
      chaptersPerDay: row.chapters_per_day, minutesPerDay: row.minutes_per_day,
      targetDate: row.target_date, startDate: row.start_date,
      estimatedEndDate: row.estimated_end_date,
      skipWeekdays: this.fromJson<number[]>(row.skip_weekdays, []),
      totalChapters: row.total_chapters,
      bibleVersion: row.bible_version as ReadingPlan["bibleVersion"],
      isActive: this.intToBool(row.is_active), isCompleted: this.intToBool(row.is_completed),
      completedAt: row.completed_at, recalibrationCount: row.recalibration_count,
      createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }

  private mapSchedule(row: ScheduleRow): PlanScheduleEntry {
    return {
      id: row.id, planId: row.plan_id, date: row.date,
      isActive: this.intToBool(row.is_active),
      chapters: this.fromJson<ChapterRef[]>(row.chapters, []),
      estimatedMinutes: row.estimated_minutes, createdAt: row.created_at,
    };
  }

  async create(input: CreatePlanInput, scheduleEntries: CreateScheduleEntryInput[]): Promise<ReadingPlan> {
    const planId = this.generateId();
    const now = this.now();
    try {
      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync(
          `UPDATE reading_plans SET is_active = 0, updated_at = $now WHERE user_id = $userId AND is_active = 1`,
          { $now: now, $userId: input.userId },
        );
        await this.db.runAsync(
          `INSERT INTO reading_plans (
            id, user_id, name, scope_type, scope_data, mode,
            chapters_per_day, minutes_per_day, target_date,
            start_date, estimated_end_date, skip_weekdays,
            total_chapters, bible_version, is_active, is_completed,
            completed_at, recalibration_count, created_at, updated_at
          ) VALUES (
            $id, $userId, $name, $scopeType, $scopeData, $mode,
            $chaptersPerDay, $minutesPerDay, $targetDate,
            $startDate, $estimatedEndDate, $skipWeekdays,
            $totalChapters, $bibleVersion, $isActive, 0,
            NULL, 0, $createdAt, $updatedAt
          )`,
          {
            $id: planId, $userId: input.userId, $name: input.name,
            $scopeType: input.scopeType, $scopeData: this.toJson(input.scopeData),
            $mode: input.mode, $chaptersPerDay: input.chaptersPerDay ?? null,
            $minutesPerDay: input.minutesPerDay ?? null, $targetDate: input.targetDate ?? null,
            $startDate: input.startDate, $estimatedEndDate: input.estimatedEndDate ?? null,
            $skipWeekdays: this.toJson(input.skipWeekdays), $totalChapters: input.totalChapters,
            $bibleVersion: input.bibleVersion, $isActive: this.boolToInt(input.isActive),
            $createdAt: now, $updatedAt: now,
          },
        );
        for (const entry of scheduleEntries) {
          await this.db.runAsync(
            `INSERT INTO plan_schedule (id, plan_id, date, is_active, chapters, estimated_minutes, created_at)
             VALUES ($id, $planId, $date, $isActive, $chapters, $estimatedMinutes, $createdAt)`,
            {
              $id: this.generateId(), $planId: planId, $date: entry.date,
              $isActive: this.boolToInt(entry.isActive), $chapters: this.toJson(entry.chapters),
              $estimatedMinutes: entry.estimatedMinutes ?? null, $createdAt: now,
            },
          );
        }
      });
      return (await this.findById(planId))!;
    } catch (e) { throw this.wrapError("create", e); }
  }

  async findById(id: string): Promise<ReadingPlan | null> {
    try {
      const row = await this.db.getFirstAsync<PlanRow>(
        `SELECT * FROM reading_plans WHERE id = $id`, { $id: id },
      );
      return row ? this.mapPlan(row) : null;
    } catch (e) { throw this.wrapError("findById", e); }
  }

  async findActive(userId: string): Promise<ReadingPlan | null> {
    try {
      const row = await this.db.getFirstAsync<PlanRow>(
        `SELECT * FROM reading_plans WHERE user_id = $userId AND is_active = 1 AND is_completed = 0 ORDER BY created_at DESC LIMIT 1`,
        { $userId: userId },
      );
      return row ? this.mapPlan(row) : null;
    } catch (e) { throw this.wrapError("findActive", e); }
  }

  async findAll(userId: string): Promise<ReadingPlan[]> {
    try {
      const rows = await this.db.getAllAsync<PlanRow>(
        `SELECT * FROM reading_plans WHERE user_id = $userId ORDER BY created_at DESC`,
        { $userId: userId },
      );
      return rows.map(r => this.mapPlan(r));
    } catch (e) { throw this.wrapError("findAll", e); }
  }

  async findCompleted(userId: string): Promise<ReadingPlan[]> {
    try {
      const rows = await this.db.getAllAsync<PlanRow>(
        `SELECT * FROM reading_plans WHERE user_id = $userId AND is_completed = 1 ORDER BY completed_at DESC`,
        { $userId: userId },
      );
      return rows.map(r => this.mapPlan(r));
    } catch (e) { throw this.wrapError("findCompleted", e); }
  }

  async getScheduleForDate(planId: string, date: string): Promise<PlanScheduleEntry | null> {
    try {
      const row = await this.db.getFirstAsync<ScheduleRow>(
        `SELECT * FROM plan_schedule WHERE plan_id = $planId AND date = $date`,
        { $planId: planId, $date: date },
      );
      return row ? this.mapSchedule(row) : null;
    } catch (e) { throw this.wrapError("getScheduleForDate", e); }
  }

  async getScheduleRange(planId: string, startDate: string, endDate: string): Promise<PlanScheduleEntry[]> {
    try {
      const rows = await this.db.getAllAsync<ScheduleRow>(
        `SELECT * FROM plan_schedule WHERE plan_id = $planId AND date BETWEEN $startDate AND $endDate ORDER BY date ASC`,
        { $planId: planId, $startDate: startDate, $endDate: endDate },
      );
      return rows.map(r => this.mapSchedule(r));
    } catch (e) { throw this.wrapError("getScheduleRange", e); }
  }

  async getUpcomingSchedule(planId: string, fromDate: string, limit: number = 7): Promise<PlanScheduleEntry[]> {
    try {
      const rows = await this.db.getAllAsync<ScheduleRow>(
        `SELECT * FROM plan_schedule WHERE plan_id = $planId AND date >= $fromDate AND is_active = 1 ORDER BY date ASC LIMIT $limit`,
        { $planId: planId, $fromDate: fromDate, $limit: limit },
      );
      return rows.map(r => this.mapSchedule(r));
    } catch (e) { throw this.wrapError("getUpcomingSchedule", e); }
  }

  async markCompleted(id: string): Promise<void> {
    try {
      const now = this.now();
      await this.db.runAsync(
        `UPDATE reading_plans SET is_completed = 1, is_active = 0, completed_at = $now, updated_at = $now WHERE id = $id`,
        { $now: now, $id: id },
      );
    } catch (e) { throw this.wrapError("markCompleted", e); }
  }

  async recalibrate(id: string, newChaptersPerDay: number, newEstimatedEndDate: string, newScheduleEntries: CreateScheduleEntryInput[], fromDate: string): Promise<void> {
    const now = this.now();
    try {
      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync(
          `UPDATE reading_plans SET chapters_per_day = $cpd, estimated_end_date = $eed, recalibration_count = recalibration_count + 1, updated_at = $now WHERE id = $id`,
          { $cpd: newChaptersPerDay, $eed: newEstimatedEndDate, $now: now, $id: id },
        );
        await this.db.runAsync(
          `DELETE FROM plan_schedule WHERE plan_id = $planId AND date >= $fromDate`,
          { $planId: id, $fromDate: fromDate },
        );
        for (const entry of newScheduleEntries) {
          await this.db.runAsync(
            `INSERT INTO plan_schedule (id, plan_id, date, is_active, chapters, estimated_minutes, created_at) VALUES ($id, $planId, $date, $isActive, $chapters, $estimatedMinutes, $createdAt)`,
            { $id: this.generateId(), $planId: id, $date: entry.date, $isActive: this.boolToInt(entry.isActive), $chapters: this.toJson(entry.chapters), $estimatedMinutes: entry.estimatedMinutes ?? null, $createdAt: now },
          );
        }
      });
    } catch (e) { throw this.wrapError("recalibrate", e); }
  }

  async setActive(id: string, userId: string): Promise<void> {
    const now = this.now();
    try {
      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync(
          `UPDATE reading_plans SET is_active = 0, updated_at = $now WHERE user_id = $userId AND is_active = 1`,
          { $now: now, $userId: userId },
        );
        await this.db.runAsync(
          `UPDATE reading_plans SET is_active = 1, updated_at = $now WHERE id = $id`,
          { $now: now, $id: id },
        );
      });
    } catch (e) { throw this.wrapError("setActive", e); }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync(`DELETE FROM reading_plans WHERE id = $id`, { $id: id });
    } catch (e) { throw this.wrapError("delete", e); }
  }

  async countCompleted(userId: string): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM reading_plans WHERE user_id = $userId AND is_completed = 1`,
        { $userId: userId },
      );
      return row?.c ?? 0;
    } catch (e) { throw this.wrapError("countCompleted", e); }
  }
}