/**
 * VERBUM — src/database/repositories/UserRepository.ts  [FIX DEFINITIVO]
 *
 * Causa raiz do erro de cadastro:
 *   O AuthContext.register() já chama userRepo.create() passando o
 *   CreateUserInput COMPLETO (name, email, avatarUrl, preferredVersion,
 *   avgReadingSpeed, fontScale, darkModePreference, notificationsEnabled,
 *   reminderTime) — usando `satisfies CreateUserInput`.
 *
 *   Mas o UserRepository.create() estava tipado para aceitar apenas
 *   { name, email } — incompatibilidade de contrato que gerava o erro
 *   de tipo no TypeScript E, em runtime, fazia o método ignorar/perder
 *   campos, deixando notificationsEnabled como boolean solto indo
 *   direto pro SQLite.
 *
 * Por que afeta Android E iOS:
 *   Hermes é o motor JS padrão em builds de produção do EAS nas DUAS
 *   plataformas desde o SDK 50+. A ponte JSI entre Hermes e o módulo
 *   nativo do SQLite não aceita booleans brutos como parâmetro de bind
 *   — isso é uma restrição do bridge, não do sistema operacional.
 *
 * Correções aplicadas:
 *   1. create() agora aceita o CreateUserInput completo.
 *   2. notificationsEnabled é convertido via this.boolToInt() ANTES
 *      de chegar no runAsync — nunca um boolean puro no array de params.
 *   3. avatar_url incluído no INSERT.
 *   4. update() retorna Promise<User> (re-fetch após o UPDATE),
 *      compatível com o AuthContext que faz
 *      `const updated = await userRepo.update(...); dispatch(...)`.
 */

import { BaseRepository } from './BaseRepository';
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
} from '../types';

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

  // ── Mapeamento de linha → User ────────────────────────────────

  private mapRow(row: UserRow): User {
    return {
      id:                   row.id,
      name:                 row.name,
      email:                row.email,
      avatarUrl:            row.avatar_url ?? null,
      preferredVersion:     (row.preferred_version ?? 'acf')    as User['preferredVersion'],
      avgReadingSpeed:      row.avg_reading_speed   ?? 3.7,
      fontScale:            row.font_scale          ?? 1.0,
      darkModePreference:   (row.dark_mode_preference ?? 'system') as User['darkModePreference'],
      notificationsEnabled: this.intToBool(row.notifications_enabled),
      reminderTime:         row.reminder_time ?? null,
      createdAt:            row.created_at,
      updatedAt:            row.updated_at,
    };
  }

  // ── CREATE ───────────────────────────────────────────────────

  async create(input: CreateUserInput): Promise<User> {
    try {
      const id = this.generateId();
      const ts = this.now();

      // Todos os valores são primitivos seguros para SQLite:
      // string | number | null — NUNCA boolean direto.
      await this.db.runAsync(
        `INSERT INTO users (
          id, name, email, avatar_url,
          preferred_version, avg_reading_speed, font_scale,
          dark_mode_preference, notifications_enabled,
          reminder_time, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name.trim(),
          input.email.trim().toLowerCase(),
          input.avatarUrl ?? null,
          input.preferredVersion ?? 'acf',
          input.avgReadingSpeed ?? 3.7,
          input.fontScale ?? 1.0,
          input.darkModePreference ?? 'system',
          this.boolToInt(input.notificationsEnabled ?? true),  // ← fix central
          input.reminderTime ?? null,
          ts,
          ts,
        ],
      );

      const user = await this.findById(id);
      if (!user) throw new Error('Usuário não encontrado imediatamente após o INSERT.');
      return user;

    } catch (e) {
      throw this.wrapError('create', e);
    }
  }

  // ── READ ─────────────────────────────────────────────────────

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

  // ── UPDATE — retorna Promise<User>, não void ────────────────────

  async update(id: string, data: UpdateUserInput): Promise<User> {
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
        values.push(this.boolToInt(data.notificationsEnabled));   // ← fix central também aqui
      }
      if (data.reminderTime !== undefined) { fields.push('reminder_time = ?'); values.push(data.reminderTime ?? null); }

      if (fields.length > 0) {
        fields.push('updated_at = ?');
        values.push(this.now());
        values.push(id);

        await this.db.runAsync(
          `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
          values,
        );
      }

      // AuthContext espera o User atualizado de volta, não void
      const updated = await this.findById(id);
      if (!updated) throw new Error('Usuário não encontrado após UPDATE.');
      return updated;

    } catch (e) {
      throw this.wrapError('update', e);
    }
  }

  // ── DELETE / UTILS ───────────────────────────────────────────

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
}