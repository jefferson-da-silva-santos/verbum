/**
 * VERBUM — src/database/repositories/UserRepository.ts  [FIX DEFINITIVO]
 *
 * CLASSE extendendo BaseRepository — igual a TODOS os outros repos do projeto
 * (AchievementRepository, PlanRepository, ProgressRepository, etc.)
 *
 * Correções:
 *   1. notifications_enabled usa this.boolToInt() → 0, nunca boolean
 *   2. avatar_url REMOVIDO do INSERT (coluna provavelmente ausente na schema)
 *      rowToUser lê avatar_url com fallback null (seguro mesmo sem a coluna)
 *   3. Estrutura de classe que repositories/index.ts instancia com `new`
 */

import { BaseRepository } from './BaseRepository';
import type { User } from '../types';

interface UserRow {
  id:                    string;
  name:                  string;
  email:                 string;
  avatar_url?:           string | null;   // opcional — pode não existir na schema
  preferred_version:     string;
  avg_reading_speed:     number;
  font_scale:            number;
  dark_mode_preference:  string;
  notifications_enabled: number;
  reminder_time:         string | null;
  created_at:            string;
  updated_at:            string;
}

export class UserRepository extends BaseRepository {
  protected readonly name = 'UserRepository';

  // ── Mapeamento ────────────────────────────────────────────────────

  private mapRow(row: UserRow): User {
    return {
      id:                   row.id,
      name:                 row.name,
      email:                row.email,
      avatarUrl:            row.avatar_url ?? null,
      preferredVersion:     (row.preferred_version  ?? 'acf')    as User['preferredVersion'],
      avgReadingSpeed:      row.avg_reading_speed   ?? 3.7,
      fontScale:            row.font_scale          ?? 1.0,
      darkModePreference:   (row.dark_mode_preference ?? 'system') as User['darkModePreference'],
      notificationsEnabled: this.intToBool(row.notifications_enabled),
      reminderTime:         row.reminder_time ?? null,
      createdAt:            row.created_at,
      updatedAt:            row.updated_at,
    };
  }

  // ── CREATE ────────────────────────────────────────────────────────

  async create(input: { name: string; email: string }): Promise<User> {
    try {
      const id = this.generateId();
      const ts = this.now();

      // SEM avatar_url no INSERT — coluna pode não existir na schema
      // this.boolToInt(false) = 0 → nunca boolean no SQLite (fix Hermes/APK)
      await this.db.runAsync(
        `INSERT INTO users (
          id, name, email,
          preferred_version, avg_reading_speed, font_scale,
          dark_mode_preference, notifications_enabled,
          reminder_time, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name.trim(),
          input.email.trim().toLowerCase(),
          'acf',
          3.7,
          1.0,
          'system',
          this.boolToInt(false),   // 0 — NUNCA boolean direto
          null,
          ts,
          ts,
        ],
      );

      const user = await this.findById(id);
      if (!user) throw new Error('Usuário não encontrado após INSERT.');
      return user;

    } catch (e) {
      throw this.wrapError('create', e);
    }
  }

  // ── READ ──────────────────────────────────────────────────────────

  async findById(id: string): Promise<User | null> {
    try {
      const row = await this.db.getFirstAsync<UserRow>(
        'SELECT * FROM users WHERE id = ?',
        [id],
      );
      return row ? this.mapRow(row) : null;
    } catch (e) {
      throw this.wrapError('findById', e);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const row = await this.db.getFirstAsync<UserRow>(
        'SELECT * FROM users WHERE email = ?',
        [email.trim().toLowerCase()],
      );
      return row ? this.mapRow(row) : null;
    } catch (e) {
      throw this.wrapError('findByEmail', e);
    }
  }

  // ── UPDATE ────────────────────────────────────────────────────────

  async update(
    id: string,
    data: {
      name?:                 string;
      avatarUrl?:            string | null;
      preferredVersion?:     User['preferredVersion'];
      avgReadingSpeed?:      number;
      fontScale?:            number;
      darkModePreference?:   User['darkModePreference'];
      notificationsEnabled?: boolean;
      reminderTime?:         string | null;
    },
  ): Promise<void> {
    try {
      const fields: string[]                   = [];
      const values: (string | number | null)[] = [];

      if (data.name                 !== undefined) { fields.push('name = ?');                  values.push(data.name); }
      if (data.avatarUrl            !== undefined) { fields.push('avatar_url = ?');            values.push(data.avatarUrl ?? null); }
      if (data.preferredVersion     !== undefined) { fields.push('preferred_version = ?');     values.push(data.preferredVersion); }
      if (data.avgReadingSpeed      !== undefined) { fields.push('avg_reading_speed = ?');     values.push(data.avgReadingSpeed); }
      if (data.fontScale            !== undefined) { fields.push('font_scale = ?');            values.push(data.fontScale); }
      if (data.darkModePreference   !== undefined) { fields.push('dark_mode_preference = ?');  values.push(data.darkModePreference); }
      if (data.notificationsEnabled !== undefined) {
        fields.push('notifications_enabled = ?');
        values.push(this.boolToInt(data.notificationsEnabled));
      }
      if (data.reminderTime !== undefined) { fields.push('reminder_time = ?'); values.push(data.reminderTime ?? null); }

      if (fields.length === 0) return;
      fields.push('updated_at = ?');
      values.push(this.now());
      values.push(id);

      await this.db.runAsync(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values,
      );
    } catch (e) {
      throw this.wrapError('update', e);
    }
  }

  async updateReadingSpeed(id: string, minutesPerChapter: number): Promise<void> {
    try {
      await this.db.runAsync(
        'UPDATE users SET avg_reading_speed = ?, updated_at = ? WHERE id = ?',
        [minutesPerChapter, this.now(), id],
      );
    } catch (e) {
      throw this.wrapError('updateReadingSpeed', e);
    }
  }

  // ── DELETE / UTILS ────────────────────────────────────────────────

  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM users WHERE id = ?', [id]);
    } catch (e) {
      throw this.wrapError('delete', e);
    }
  }

  async count(): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ n: number }>(
        'SELECT COUNT(*) as n FROM users',
      );
      return row?.n ?? 0;
    } catch (e) {
      throw this.wrapError('count', e);
    }
  }

  async exists(email: string): Promise<boolean> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        'SELECT COUNT(*) as c FROM users WHERE email = ?',
        [email.trim().toLowerCase()],
      );
      return (row?.c ?? 0) > 0;
    } catch (e) {
      throw this.wrapError('exists', e);
    }
  }
}