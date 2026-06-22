/**
 * VERBUM — src/database/repositories/UserRepository.ts  [FIX DEFINITIVO v3]
 *
 * Causa raiz confirmada pelo diagnóstico:
 *   assertPrimitiveParams NÃO lançava erro — todos os valores eram
 *   primitivos. Mas runAsync(sql, [array]) AINDA falhava com
 *   "[object Object]" no Kotlin.
 *
 * O problema é o próprio array como argumento, não os valores dentro.
 *   Em expo-sqlite v15 + Hermes + EAS build, a ponte Kotlin recebe
 *   runAsync(sql, [v1, v2, ...]) e trata o array como um objeto único
 *   em vez de iterar sobre ele — daí o "[object Object]".
 *
 * Solução: usar named parameters do SQLite (:nome) em vez de
 *   positional (?). O named param usa um Record<string, value> que
 *   a ponte Kotlin manipula por um code path completamente diferente,
 *   sem o problema do array.
 *
 *   Funciona tanto no Android (confirmado pelo erro) quanto no iOS.
 */

import { BaseRepository } from './BaseRepository';
import type { User, CreateUserInput, UpdateUserInput } from '../types';

interface UserRow {
  id:                    string;
  name:                  string;
  email:                 string;
  avatar_url:            string | null;
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

  private mapRow(row: UserRow): User {
    return {
      id:                   row.id,
      name:                 row.name,
      email:                row.email,
      avatarUrl:            row.avatar_url ?? null,
      preferredVersion:     (row.preferred_version ?? 'acf') as User['preferredVersion'],
      avgReadingSpeed:      row.avg_reading_speed ?? 3.7,
      fontScale:            row.font_scale ?? 1.0,
      darkModePreference:   (row.dark_mode_preference ?? 'system') as User['darkModePreference'],
      notificationsEnabled: this.intToBool(row.notifications_enabled),
      reminderTime:         row.reminder_time ?? null,
      createdAt:            row.created_at,
      updatedAt:            row.updated_at,
    };
  }

  // ── CREATE ───────────────────────────────────────────────────────

  async create(input: CreateUserInput): Promise<User> {
    try {
      const id = this.generateId();
      const ts = this.now();

      // FIX: usa named parameters (:nome) em vez de positional (?).
      // Em expo-sqlite v15 + Hermes, passar runAsync(sql, [array])
      // faz o bridge Kotlin tratar o array como um único "[object Object]".
      // Named params passam um Record<string, value> por um code path
      // diferente que não tem esse problema.
      await this.db.runAsync(
        `INSERT INTO users (
           id, name, email, avatar_url,
           preferred_version, avg_reading_speed, font_scale,
           dark_mode_preference, notifications_enabled,
           reminder_time, created_at, updated_at
         ) VALUES (
           $id, $name, $email, $avatarUrl,
           $preferredVersion, $avgReadingSpeed, $fontScale,
           $darkModePreference, $notificationsEnabled,
           $reminderTime, $createdAt, $updatedAt
         )`,
        {
          $id:                   id,
          $name:                 input.name.trim(),
          $email:                input.email.trim().toLowerCase(),
          $avatarUrl:            input.avatarUrl            ?? null,
          $preferredVersion:     input.preferredVersion     ?? 'acf',
          $avgReadingSpeed:      input.avgReadingSpeed      ?? 3.7,
          $fontScale:            input.fontScale            ?? 1.0,
          $darkModePreference:   input.darkModePreference   ?? 'system',
          $notificationsEnabled: this.boolToInt(input.notificationsEnabled ?? true),
          $reminderTime:         input.reminderTime         ?? null,
          $createdAt:            ts,
          $updatedAt:            ts,
        },
      );

      const user = await this.findById(id);
      if (!user) throw new Error('Usuário não encontrado após o INSERT.');
      return user;
    } catch (e) {
      throw this.wrapError('create', e);
    }
  }

  // ── READ ─────────────────────────────────────────────────────────

  async findById(id: string): Promise<User | null> {
    try {
      const row = await this.db.getFirstAsync<UserRow>(
        'SELECT * FROM users WHERE id = $id',
        { $id: id },
      );
      return row ? this.mapRow(row) : null;
    } catch (e) {
      throw this.wrapError('findById', e);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const row = await this.db.getFirstAsync<UserRow>(
        'SELECT * FROM users WHERE email = $email',
        { $email: email.trim().toLowerCase() },
      );
      return row ? this.mapRow(row) : null;
    } catch (e) {
      throw this.wrapError('findByEmail', e);
    }
  }

  async exists(email: string): Promise<boolean> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        'SELECT COUNT(*) as c FROM users WHERE email = $email',
        { $email: email.trim().toLowerCase() },
      );
      return (row?.c ?? 0) > 0;
    } catch (e) {
      throw this.wrapError('exists', e);
    }
  }

  // ── UPDATE ───────────────────────────────────────────────────────

  async update(id: string, data: UpdateUserInput): Promise<User> {
    try {
      // Para UPDATE dinâmico, monta named params com prefixo $
      const setClauses: string[] = [];
      const params: Record<string, string | number | null> = { $id: id };

      if (data.name                 !== undefined) { setClauses.push('name = $name');                         params.$name                 = data.name; }
      if (data.avatarUrl            !== undefined) { setClauses.push('avatar_url = $avatarUrl');               params.$avatarUrl             = data.avatarUrl ?? null; }
      if (data.preferredVersion     !== undefined) { setClauses.push('preferred_version = $preferredVersion'); params.$preferredVersion      = data.preferredVersion; }
      if (data.avgReadingSpeed      !== undefined) { setClauses.push('avg_reading_speed = $avgReadingSpeed');  params.$avgReadingSpeed       = data.avgReadingSpeed; }
      if (data.fontScale            !== undefined) { setClauses.push('font_scale = $fontScale');               params.$fontScale             = data.fontScale; }
      if (data.darkModePreference   !== undefined) { setClauses.push('dark_mode_preference = $darkModePreference'); params.$darkModePreference = data.darkModePreference; }
      if (data.notificationsEnabled !== undefined) { setClauses.push('notifications_enabled = $notificationsEnabled'); params.$notificationsEnabled = this.boolToInt(data.notificationsEnabled); }
      if (data.reminderTime         !== undefined) { setClauses.push('reminder_time = $reminderTime');         params.$reminderTime          = data.reminderTime ?? null; }

      if (setClauses.length > 0) {
        setClauses.push('updated_at = $updatedAt');
        params.$updatedAt = this.now();

        await this.db.runAsync(
          `UPDATE users SET ${setClauses.join(', ')} WHERE id = $id`,
          params,
        );
      }

      const updated = await this.findById(id);
      if (!updated) throw new Error('Usuário não encontrado após UPDATE.');
      return updated;
    } catch (e) {
      throw this.wrapError('update', e);
    }
  }

  // ── DELETE / UTILS ───────────────────────────────────────────────

  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync(
        'DELETE FROM users WHERE id = $id',
        { $id: id },
      );
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
}