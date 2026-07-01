/**
 * VERBUM — src/database/migrations/005_chapter_progress_nullable_plan.ts
 *
 * PROBLEMA:
 *   A tabela chapter_progress foi criada com `plan_id TEXT NOT NULL`.
 *   Quando o usuário lê um capítulo fora de um plano ativo, o
 *   PlanContext passa planId = null, mas o INSERT OR IGNORE falha
 *   silenciosamente (viola o NOT NULL sem levantar erro), nenhuma
 *   linha é inserida, e o SELECT seguinte retorna null → crash.
 *
 * SOLUÇÃO:
 *   SQLite não permite ALTER COLUMN para mudar constraints.
 *   A única forma é recriar a tabela:
 *     1. Cria chapter_progress_new com plan_id TEXT (nullable)
 *     2. Copia os dados existentes
 *     3. Drop na tabela antiga
 *     4. Rename
 *     5. Recria índices:
 *        - Quando plan_id NOT NULL: UNIQUE(plan_id, book_slug, chapter_number)
 *        - Quando plan_id IS NULL:  UNIQUE(book_slug, chapter_number)
 *          → evita marcar o mesmo capítulo global duas vezes
 *
 * Idempotente: verifica se a coluna já é nullable antes de rodar.
 */

import type { SQLiteDatabase } from "expo-sqlite";

export async function migrate005(db: SQLiteDatabase): Promise<void> {
  try {
    // Verifica se já foi aplicada: tenta inserir uma linha com plan_id null
    // em uma tabela temporária com o schema atual.
    // Forma mais simples: lê o sql de criação da tabela e verifica se
    // já tem "plan_id TEXT," (sem NOT NULL).
    const tableDef = await db.getFirstAsync<{ sql: string }>(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='chapter_progress'`,
    );

    if (!tableDef?.sql) {
      console.log(
        "[DB] Tabela chapter_progress não existe — pulando migration 005.",
      );
      return;
    }

    // Se o sql NÃO contém "plan_id TEXT NOT NULL" (case-insensitive),
    // a migration já foi aplicada.
    const alreadyNullable = !/plan_id\s+TEXT\s+NOT\s+NULL/i.test(tableDef.sql);
    if (alreadyNullable) {
      console.log(
        "[DB] Migration 005 já foi aplicada — plan_id já é nullable.",
      );
      return;
    }

    console.log(
      "[DB] Aplicando migration 005: tornando plan_id nullable em chapter_progress...",
    );

    await db.execAsync(`
      BEGIN TRANSACTION;

      -- 1. Nova tabela com plan_id nullable
      CREATE TABLE chapter_progress_new (
        id                       TEXT    PRIMARY KEY NOT NULL,
        plan_id                  TEXT,
        user_id                  TEXT    NOT NULL,
        book_slug                TEXT    NOT NULL,
        book_name                TEXT    NOT NULL,
        chapter_number           INTEGER NOT NULL,
        read_at                  TEXT    NOT NULL,
        reading_duration_seconds INTEGER,
        schedule_date            TEXT,
        is_on_time               INTEGER NOT NULL DEFAULT 0,
        created_at               TEXT    NOT NULL
      );

      -- 2. Copia todos os dados existentes
      INSERT INTO chapter_progress_new
        SELECT id, plan_id, user_id, book_slug, book_name,
               chapter_number, read_at, reading_duration_seconds,
               schedule_date, is_on_time, created_at
        FROM chapter_progress;

      -- 3. Remove tabela antiga
      DROP TABLE chapter_progress;

      -- 4. Renomeia
      ALTER TABLE chapter_progress_new RENAME TO chapter_progress;

      COMMIT;
    `);

    // 5. Índices separados para os dois casos de plan_id
    //    (não podem ficar dentro do BEGIN/COMMIT acima pois CREATE INDEX
    //     em algumas versões do SQLite exige fora de transação DDL)
    await db.execAsync(`
      -- Leitura vinculada a um plano: único por plano + capítulo
      CREATE UNIQUE INDEX IF NOT EXISTS idx_cp_with_plan
        ON chapter_progress(plan_id, book_slug, chapter_number)
        WHERE plan_id IS NOT NULL;

      -- Leitura global (sem plano): único por capítulo
      CREATE UNIQUE INDEX IF NOT EXISTS idx_cp_no_plan
        ON chapter_progress(book_slug, chapter_number)
        WHERE plan_id IS NULL;
    `);

    console.log("[DB] Migration 005 concluída — plan_id agora é nullable.");
  } catch (e) {
    console.error("[DB] Falha na migration 005:", e);
    // Tenta rollback se algo deu errado no meio
    try {
      await db.execAsync("ROLLBACK;");
    } catch {
      /* já fez rollback ou não havia transação */
    }
    throw e;
  }
}
