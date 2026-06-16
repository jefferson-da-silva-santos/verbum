/**
 * VERBUM — src/database/migrations/003_user_avatar.ts
 *
 * Garante que a coluna avatar_url existe na tabela users.
 * Idempotente: se a coluna já existir, o SQLite lança "duplicate column
 * name" — capturamos e ignoramos, pois o resultado final é o mesmo.
 *
 * Necessário porque o UserRepository.create() agora insere avatar_url,
 * e se a tabela original (migration 001) não tiver essa coluna, o
 * INSERT falha com um erro nativo confuso (geralmente aparece como
 * "[object Object]" no Hermes, igual ao erro de boolean).
 */

import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrate003(db: SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync('ALTER TABLE users ADD COLUMN avatar_url TEXT;');
    console.log('[DB] Coluna avatar_url adicionada à tabela users.');
  } catch (e) {
    // Esperado se a coluna já existir — não é um erro real.
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes('duplicate column')) {
      console.log('[DB] Coluna avatar_url já existe — ok.');
    } else {
      // Erro inesperado (ex: tabela users não existe ainda) — relançar.
      throw e;
    }
  }
}