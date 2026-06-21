/**
 * VERBUM — src/database/repositories/UserRepository.ts  [DIAGNÓSTICO]
 *
 * Idêntico ao UserRepository.ts anterior, EXCETO pelo método create(),
 * que agora valida cada parâmetro antes de enviar ao SQLite.
 *
 * Por quê: refazendo as contas com o AuthContext.tsx e types.ts que
 * você mandou, todo parâmetro já deveria ser primitivo — o que sugere
 * que o crash "[object Object]" veio de um BUILD desatualizado, não
 * deste código. Mas para não continuar adivinhando às cegas, esta
 * versão lança um erro NOMEANDO o campo exato se algo não-primitivo
 * passar — assim, se o erro persistir mesmo num build limpo, a
 * próxima mensagem de erro vai dizer precisamente qual campo é.
 *
 * Depois de confirmar que o cadastro funciona, pode voltar para a
 * versão sem a validação (ela tem um custo mínimo de performance,
 * irrelevante aqui, mas é só por organização de código).
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

// Tipos aceitos como parâmetro de bind do SQLite — qualquer outra
// coisa (objeto, array, função, Date não-convertida) é erro de uso.
type SqlPrimitive = string | number | null;

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

  // ── Validação diagnóstica ────────────────────────────────────

  /**
   * Confere que cada valor do array de bind é string | number | null.
   * Se algum não for, lança um erro nomeando o campo e mostrando o
   * valor recebido — substitui o "[object Object]" genérico do Kotlin
   * por algo que aponta a causa exata.
   */
  private assertPrimitiveParams(named: Record<string, unknown>): SqlPrimitive[] {
    const out: SqlPrimitive[] = [];
    for (const [fieldName, value] of Object.entries(named)) {
      const isPrimitive =
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number';

      if (!isPrimitive) {
        const typeDesc = Array.isArray(value) ? 'array' : typeof value;
        let preview: string;
        try { preview = JSON.stringify(value); } catch { preview = String(value); }
        throw new Error(
          `Campo "${fieldName}" não é primitivo válido para o SQLite ` +
          `(tipo: ${typeDesc}, valor: ${preview}). ` +
          `Eperado string | number | null.`,
        );
      }
      out.push(value as SqlPrimitive);
    }
    return out;
  }

  // ── CREATE ───────────────────────────────────────────────────

  async create(input: CreateUserInput): Promise<User> {
    try {
      const id = this.generateId();
      const ts = this.now();

      // Cada campo nomeado — se algum vier como objeto/array/etc,
      // assertPrimitiveParams lança um erro apontando QUAL campo é.
      const params = this.assertPrimitiveParams({
        id,
        name:                 input.name.trim(),
        email:                input.email.trim().toLowerCase(),
        avatarUrl:            input.avatarUrl ?? null,
        preferredVersion:     input.preferredVersion ?? 'acf',
        avgReadingSpeed:      input.avgReadingSpeed ?? 3.7,
        fontScale:            input.fontScale ?? 1.0,
        darkModePreference:   input.darkModePreference ?? 'system',
        notificationsEnabled: this.boolToInt(input.notificationsEnabled ?? true),
        reminderTime:         input.reminderTime ?? null,
        createdAt:            ts,
        updatedAt:            ts,
      });

      await this.db.runAsync(
        `INSERT INTO users (
          id, name, email, avatar_url,
          preferred_version, avg_reading_speed, font_scale,
          dark_mode_preference, notifications_enabled,
          reminder_time, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params,
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
        values.push(this.boolToInt(data.notificationsEnabled));
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