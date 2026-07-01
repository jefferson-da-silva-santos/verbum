/**
 * VERBUM — DiaryRepository [named params fix]
 */
import { BaseRepository } from "./BaseRepository";
import type {
  DiaryEntry,
  CreateDiaryEntryInput,
  UpdateDiaryEntryInput,
} from "../types";

interface DiaryRow {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

export class DiaryRepository extends BaseRepository {
  protected readonly name = "DiaryRepository";

  private mapRow(row: DiaryRow): DiaryEntry {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      mood: row.mood as DiaryEntry["mood"],
      entryDate: row.entry_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(input: CreateDiaryEntryInput): Promise<DiaryEntry> {
    try {
      const id = this.generateId();
      const now = this.now();
      await this.db.runAsync(
        `INSERT INTO diary_entries (id, user_id, title, content, mood, entry_date, created_at, updated_at)
         VALUES ($id, $userId, $title, $content, $mood, $entryDate, $now, $now)`,
        {
          $id: id,
          $userId: input.userId,
          $title: input.title ?? null,
          $content: input.content,
          $mood: input.mood ?? null,
          $entryDate: input.entryDate,
          $now: now,
        },
      );
      return (await this.findById(id))!;
    } catch (e) {
      throw this.wrapError("create", e);
    }
  }

  async findById(id: string): Promise<DiaryEntry | null> {
    try {
      const row = await this.db.getFirstAsync<DiaryRow>(
        `SELECT * FROM diary_entries WHERE id = $id`,
        { $id: id },
      );
      return row ? this.mapRow(row) : null;
    } catch (e) {
      throw this.wrapError("findById", e);
    }
  }

  async findAll(
    userId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<DiaryEntry[]> {
    try {
      const { limit = 30, offset = 0 } = opts;
      const rows = await this.db.getAllAsync<DiaryRow>(
        `SELECT * FROM diary_entries WHERE user_id = $userId ORDER BY entry_date DESC, created_at DESC LIMIT $limit OFFSET $offset`,
        { $userId: userId, $limit: limit, $offset: offset },
      );
      return rows.map((r) => this.mapRow(r));
    } catch (e) {
      throw this.wrapError("findAll", e);
    }
  }

  async findByDate(userId: string, date: string): Promise<DiaryEntry[]> {
    try {
      const rows = await this.db.getAllAsync<DiaryRow>(
        `SELECT * FROM diary_entries WHERE user_id = $userId AND entry_date = $date ORDER BY created_at DESC`,
        { $userId: userId, $date: date },
      );
      return rows.map((r) => this.mapRow(r));
    } catch (e) {
      throw this.wrapError("findByDate", e);
    }
  }

  async update(id: string, input: UpdateDiaryEntryInput): Promise<DiaryEntry> {
    try {
      await this.db.runAsync(
        `UPDATE diary_entries SET title = $title, content = $content, mood = $mood, updated_at = $now WHERE id = $id`,
        {
          $title: input.title ?? null,
          $content: input.content,
          $mood: input.mood ?? null,
          $now: this.now(),
          $id: id,
        },
      );
      return (await this.findById(id))!;
    } catch (e) {
      throw this.wrapError("update", e);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync(`DELETE FROM diary_entries WHERE id = $id`, {
        $id: id,
      });
    } catch (e) {
      throw this.wrapError("delete", e);
    }
  }

  async count(userId: string): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM diary_entries WHERE user_id = $userId`,
        { $userId: userId },
      );
      return row?.c ?? 0;
    } catch (e) {
      throw this.wrapError("count", e);
    }
  }
}
