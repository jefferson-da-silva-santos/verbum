/**
 * VERBUM — AchievementRepository [named params fix]
 */
import type { AchievementRecord } from "../types";
import { BaseRepository } from "./BaseRepository";

interface AchievementRow {
  id: string; user_id: string; achievement_key: string; unlocked_at: string;
}

export class AchievementRepository extends BaseRepository {
  protected readonly name = "AchievementRepository";

  private mapRow(row: AchievementRow): AchievementRecord {
    return { id: row.id, userId: row.user_id, achievementKey: row.achievement_key, unlockedAt: row.unlocked_at };
  }

  async unlock(userId: string, achievementKey: string): Promise<AchievementRecord | null> {
    try {
      const already = await this.isUnlocked(userId, achievementKey);
      if (already) return null;
      const id = this.generateId();
      const now = this.now();
      await this.db.runAsync(
        `INSERT OR IGNORE INTO achievements (id, user_id, achievement_key, unlocked_at) VALUES ($id, $userId, $key, $now)`,
        { $id: id, $userId: userId, $key: achievementKey, $now: now },
      );
      return await this.findByKey(userId, achievementKey);
    } catch (e) { throw this.wrapError("unlock", e); }
  }

  async isUnlocked(userId: string, achievementKey: string): Promise<boolean> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM achievements WHERE user_id = $userId AND achievement_key = $key`,
        { $userId: userId, $key: achievementKey },
      );
      return (row?.c ?? 0) > 0;
    } catch (e) { throw this.wrapError("isUnlocked", e); }
  }

  async findByKey(userId: string, achievementKey: string): Promise<AchievementRecord | null> {
    try {
      const row = await this.db.getFirstAsync<AchievementRow>(
        `SELECT * FROM achievements WHERE user_id = $userId AND achievement_key = $key`,
        { $userId: userId, $key: achievementKey },
      );
      return row ? this.mapRow(row) : null;
    } catch (e) { throw this.wrapError("findByKey", e); }
  }

  async findAll(userId: string): Promise<AchievementRecord[]> {
    try {
      const rows = await this.db.getAllAsync<AchievementRow>(
        `SELECT * FROM achievements WHERE user_id = $userId ORDER BY unlocked_at ASC`,
        { $userId: userId },
      );
      return rows.map(r => this.mapRow(r));
    } catch (e) { throw this.wrapError("findAll", e); }
  }

  async getUnlockedKeys(userId: string): Promise<Set<string>> {
    try {
      const rows = await this.db.getAllAsync<{ achievement_key: string }>(
        `SELECT achievement_key FROM achievements WHERE user_id = $userId`,
        { $userId: userId },
      );
      return new Set(rows.map(r => r.achievement_key));
    } catch (e) { throw this.wrapError("getUnlockedKeys", e); }
  }

  async count(userId: string): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM achievements WHERE user_id = $userId`,
        { $userId: userId },
      );
      return row?.c ?? 0;
    } catch (e) { throw this.wrapError("count", e); }
  }
}