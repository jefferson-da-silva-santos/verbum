/**
 * VERBUM — src/database/migrations/004_seed_test_user.ts
 *
 * Insere um usuário de teste para login direto, sem passar pelo
 * cadastro. Idempotente: verifica se o e-mail já existe antes de
 * inserir — pode rodar em todo boot do app sem duplicar.
 *
 * IMPORTANTE: só deve rodar em desenvolvimento. A chamada no
 * _layout.tsx é envolvida em `if (__DEV__)`.
 *
 * Depois de rodar, faça login normalmente na tela de login com:
 *   E-mail: teste@verbum.app
 * (o AuthContext.login() busca só por e-mail, sem senha)
 */

import type { SQLiteDatabase } from 'expo-sqlite';

export const TEST_USER_EMAIL = 'teste@verbum.app';

export async function migrate004(db: SQLiteDatabase): Promise<void> {
  try {
    const existing = await db.getFirstAsync<{ c: number }>(
      'SELECT COUNT(*) as c FROM users WHERE email = ?',
      [TEST_USER_EMAIL],
    );

    if ((existing?.c ?? 0) > 0) {
      console.log('[DB] Usuário de teste já existe — pulando seed.');
      return;
    }

    const now = new Date().toISOString();
    const id  = 'test-user-seed-0000-000000000001';

    // Mesma estrutura de colunas do UserRepository.create() —
    // notifications_enabled vai como INTEGER (1), nunca boolean.
    await db.runAsync(
      `INSERT INTO users (
        id, name, email, avatar_url,
        preferred_version, avg_reading_speed, font_scale,
        dark_mode_preference, notifications_enabled,
        reminder_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        'Usuário Teste',
        TEST_USER_EMAIL,
        null,        // avatar_url
        'acf',       // preferred_version
        3.7,         // avg_reading_speed
        1.0,         // font_scale
        'system',    // dark_mode_preference
        1,           // notifications_enabled = true → INTEGER
        null,        // reminder_time
        now,
        now,
      ],
    );

    console.log(`[DB] ✓ Usuário de teste criado — faça login com: ${TEST_USER_EMAIL}`);
  } catch (e) {
    console.warn('[DB] Falha ao inserir usuário de teste:', e);
  }
}