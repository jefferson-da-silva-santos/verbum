/**
 * VERBUM — UserRepository
 *
 * Gerencia o perfil do usuário autenticado.
 * O app opera com um único usuário por dispositivo — a tabela users
 * pode ter múltiplos registros apenas em cenários de troca de conta.
 */

import { BaseRepository } from "./BaseRepository";
import type { User, CreateUserInput, UpdateUserInput } from "../types";

// Estrutura bruta como vem do SQLite (snake_case + inteiros para booleanos)
interface UserRow {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  preferred_version: string;
  avg_reading_speed: number;
  font_scale: number;
  dark_mode_preference: string;
  notifications_enabled: number;
  reminder_time: string | null;
  created_at: string;
  updated_at: string;
}

export class UserRepository extends BaseRepository {
  protected readonly name = "UserRepository";

  // ─────────────────────────────────────────
  // MAPEAMENTO ROW → ENTIDADE
  // ─────────────────────────────────────────

  private mapRow(row: UserRow): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      avatarUrl: row.avatar_url,
      preferredVersion: row.preferred_version as User["preferredVersion"],
      avgReadingSpeed: row.avg_reading_speed,
      fontScale: row.font_scale,
      darkModePreference: row.dark_mode_preference,
      notificationsEnabled: this.intToBool(row.notifications_enabled),
      reminderTime: row.reminder_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ─────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────

  async create(input: CreateUserInput): Promise<User> {
    try {
      const id = this.generateId();
      const now = this.now();

      await this.db.runAsync(
        `INSERT INTO users (
          id, name, email, avatar_url, preferred_version,
          avg_reading_speed, font_scale, dark_mode_preference,
          notifications_enabled, reminder_time, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name,
          input.email,
          input.avatarUrl ?? null,
          input.preferredVersion,
          input.avgReadingSpeed,
          input.fontScale,
          input.darkModePreference,
          this.boolToInt(input.notificationsEnabled),
          input.reminderTime ?? null,
          now,
          now,
        ],
      );

      return (await this.findById(id))!;
    } catch (e) {
      throw this.wrapError("create", e);
    }
  }

  // ─────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────

  async findById(id: string): Promise<User | null> {
    try {
      const row = await this.db.getFirstAsync<UserRow>(
        "SELECT * FROM users WHERE id = ?",
        [id],
      );
      return row ? this.mapRow(row) : null;
    } catch (e) {
      throw this.wrapError("findById", e);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const row = await this.db.getFirstAsync<UserRow>(
        "SELECT * FROM users WHERE email = ? COLLATE NOCASE",
        [email],
      );
      return row ? this.mapRow(row) : null;
    } catch (e) {
      throw this.wrapError("findByEmail", e);
    }
  }

  /** Retorna o primeiro usuário — útil para apps single-user */
  async findFirst(): Promise<User | null> {
    try {
      const row = await this.db.getFirstAsync<UserRow>(
        "SELECT * FROM users ORDER BY created_at ASC LIMIT 1",
      );
      return row ? this.mapRow(row) : null;
    } catch (e) {
      throw this.wrapError("findFirst", e);
    }
  }

  // ─────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────

  async update(id: string, input: UpdateUserInput): Promise<User> {
    try {
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      if (input.name !== undefined) {
        fields.push("name = ?");
        values.push(input.name);
      }
      if (input.avatarUrl !== undefined) {
        fields.push("avatar_url = ?");
        values.push(input.avatarUrl);
      }
      if (input.preferredVersion !== undefined) {
        fields.push("preferred_version = ?");
        values.push(input.preferredVersion);
      }
      if (input.avgReadingSpeed !== undefined) {
        fields.push("avg_reading_speed = ?");
        values.push(input.avgReadingSpeed);
      }
      if (input.fontScale !== undefined) {
        fields.push("font_scale = ?");
        values.push(input.fontScale);
      }
      if (input.darkModePreference !== undefined) {
        fields.push("dark_mode_preference = ?");
        values.push(input.darkModePreference);
      }
      if (input.notificationsEnabled !== undefined) {
        fields.push("notifications_enabled = ?");
        values.push(this.boolToInt(input.notificationsEnabled));
      }
      if (input.reminderTime !== undefined) {
        fields.push("reminder_time = ?");
        values.push(input.reminderTime);
      }

      if (fields.length === 0) return (await this.findById(id))!;

      fields.push("updated_at = ?");
      values.push(this.now());
      values.push(id);

      await this.db.runAsync(
        `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
        values,
      );

      const updated = await this.findById(id);
      if (!updated) throw new Error(`Usuário ${id} não encontrado após update`);
      return updated;
    } catch (e) {
      throw this.wrapError("update", e);
    }
  }

  /** Atalho para atualizar apenas a velocidade de leitura calibrada */
  async updateReadingSpeed(
    id: string,
    minutesPerChapter: number,
  ): Promise<void> {
    try {
      await this.db.runAsync(
        "UPDATE users SET avg_reading_speed = ?, updated_at = ? WHERE id = ?",
        [minutesPerChapter, this.now(), id],
      );
    } catch (e) {
      throw this.wrapError("updateReadingSpeed", e);
    }
  }

  // ─────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────

  /** Remove o usuário e todos os seus dados (CASCADE) */
  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync("DELETE FROM users WHERE id = ?", [id]);
    } catch (e) {
      throw this.wrapError("delete", e);
    }
  }

  // ─────────────────────────────────────────
  // UTILITÁRIOS
  // ─────────────────────────────────────────

  async exists(email: string): Promise<boolean> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) as c FROM users WHERE email = ? COLLATE NOCASE",
        [email],
      );
      return (row?.c ?? 0) > 0;
    } catch (e) {
      throw this.wrapError("exists", e);
    }
  }
}
