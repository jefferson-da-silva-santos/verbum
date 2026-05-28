/**
 * VERBUM — Database Initialization
 *
 * Ponto único de acesso ao SQLite. Responsabilidades:
 *   1. Abrir o banco de dados uma única vez (singleton)
 *   2. Aplicar pragmas de performance
 *   3. Executar migrações pendentes em ordem
 *   4. Exportar getDb() para uso nos repositories
 *
 * Uso:
 *   // Em app/_layout.tsx (raiz do app):
 *   await initDatabase();
 *
 *   // Em qualquer repository:
 *   const db = getDb();
 */

import * as SQLite from "expo-sqlite";
import { PRAGMAS } from "./schema";
import { migration_001 } from "./migrations/001_initial";

// ─────────────────────────────────────────────
// REGISTRO DE MIGRAÇÕES
// Adicionar novas migrações aqui em ordem crescente de versão
// ─────────────────────────────────────────────

const MIGRATIONS = [
  migration_001,
  // migration_002, ← adicionar aqui quando necessário
] as const;

// ─────────────────────────────────────────────
// SINGLETON
// ─────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Retorna a instância do banco de dados.
 * Lança erro se chamado antes de initDatabase().
 */
export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    throw new Error(
      "[Verbum DB] Banco não inicializado. " +
        "Chame initDatabase() no _layout.tsx raiz antes de usar qualquer repository.",
    );
  }
  return _db;
}

// ─────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────

/**
 * Abre o banco SQLite, aplica pragmas e executa migrações pendentes.
 * Deve ser chamado UMA VEZ na inicialização do app, antes de qualquer
 * acesso a dados.
 *
 * @param dbName Nome do arquivo do banco (padrão: 'verbum.db')
 * @returns A instância do SQLiteDatabase inicializada
 */
export async function initDatabase(
  dbName: string = "verbum.db",
): Promise<SQLite.SQLiteDatabase> {
  if (_db) {
    console.warn(
      "[Verbum DB] initDatabase() chamado mais de uma vez. Ignorando.",
    );
    return _db;
  }

  const db = await SQLite.openDatabaseAsync(dbName);

  // Aplicar pragmas de performance (execAsync suporta múltiplos statements)
  const pragmaStatements = PRAGMAS.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const pragma of pragmaStatements) {
    await db.execAsync(pragma + ";");
  }

  // Garantir que a tabela de migrações existe antes de verificar versões
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT    NOT NULL,
      applied_at TEXT    NOT NULL
    );
  `);

  // Executar migrações pendentes
  await runPendingMigrations(db);

  _db = db;
  console.log("[Verbum DB] Banco inicializado com sucesso.");
  return db;
}

/**
 * Verifica quais migrações ainda não foram aplicadas e as executa em ordem.
 */
async function runPendingMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const applied = await db.getAllAsync<{ version: number }>(
    "SELECT version FROM schema_migrations ORDER BY version ASC",
  );
  const appliedVersions = new Set(applied.map((r) => r.version));

  const pending = MIGRATIONS.filter((m) => !appliedVersions.has(m.version));

  if (pending.length === 0) {
    console.log("[Verbum DB] Schema atualizado — nenhuma migração pendente.");
    return;
  }

  for (const migration of pending) {
    console.log(
      `[Verbum DB] Aplicando migração ${migration.version}: ${migration.name}...`,
    );

    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.runAsync(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
        [migration.version, migration.name, new Date().toISOString()],
      );
    });

    console.log(`[Verbum DB] Migração ${migration.version} aplicada.`);
  }
}

/**
 * Fecha a conexão com o banco.
 * Usar apenas em testes ou em cenários de logout completo.
 */
export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
    console.log("[Verbum DB] Conexão encerrada.");
  }
}

/**
 * Reseta completamente o banco (DROP + RECREATE).
 * USO EXCLUSIVO EM TESTES. Nunca expor para o usuário final.
 *
 * @param dbName Nome do banco a resetar
 */
export async function resetDatabaseForTesting(
  dbName: string = "verbum_test.db",
): Promise<SQLite.SQLiteDatabase> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
  await SQLite.deleteDatabaseAsync(dbName);
  return initDatabase(dbName);
}
