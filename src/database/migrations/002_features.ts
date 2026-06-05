/**
 * VERBUM — src/database/migrations/002_features.ts  [CORRIGIDO]
 *
 * FIX: Removidas as cláusulas FOREIGN KEY REFERENCES users(id).
 *
 * Por quê quebravam no build EAS (produção):
 *   - SQLite executa validação de schema diferente em builds de produção
 *   - A tabela 'users' pode não existir ainda quando esta migration roda
 *   - PRAGMA foreign_keys não está ativo por padrão, então FKs são
 *     sintaxe aceita mas nunca executada — exceto em builds otimizados
 *     que validam o schema na criação
 *
 * As FKs foram removidas. A integridade referencial é mantida pela
 * aplicação (delete em cascata via código ao excluir usuário).
 */

import { SQLiteDatabase } from 'expo-sqlite';

export async function migrate002(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    -- ── CADERNO DO PREGADOR ───────────────────────────────────────
    CREATE TABLE IF NOT EXISTS sermons (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL,
      title             TEXT NOT NULL DEFAULT 'Sem título',
      passage_ref       TEXT,
      book_slug         TEXT,
      chapter_start     INTEGER,
      verse_start       INTEGER,
      chapter_end       INTEGER,
      verse_end         INTEGER,
      context_notes     TEXT,
      structure_notes   TEXT,
      exegesis_notes    TEXT,
      outline           TEXT,
      application_notes TEXT,
      status            TEXT NOT NULL DEFAULT 'draft',
      preached_at       TEXT,
      created_at        TEXT NOT NULL,
      updated_at        TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sermon_verses (
      id            TEXT PRIMARY KEY,
      sermon_id     TEXT NOT NULL,
      book_slug     TEXT NOT NULL,
      book_name     TEXT NOT NULL,
      chapter       INTEGER NOT NULL,
      verse         INTEGER NOT NULL,
      verse_text    TEXT,
      section_label TEXT,
      sort_order    INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sermons_user_id
      ON sermons(user_id, updated_at DESC);

    CREATE INDEX IF NOT EXISTS idx_sermon_verses_sermon
      ON sermon_verses(sermon_id, sort_order ASC);

    -- ── MAPAS TEMÁTICOS ───────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS thematic_maps (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      name        TEXT NOT NULL,
      description TEXT,
      color       TEXT NOT NULL DEFAULT '#8B6340',
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS thematic_map_verses (
      id              TEXT PRIMARY KEY,
      map_id          TEXT NOT NULL,
      book_slug       TEXT NOT NULL,
      book_name       TEXT NOT NULL,
      chapter         INTEGER NOT NULL,
      verse           INTEGER NOT NULL,
      verse_text      TEXT,
      connection_type TEXT NOT NULL DEFAULT 'referencia',
      note            TEXT,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_thematic_maps_user
      ON thematic_maps(user_id, updated_at DESC);

    CREATE INDEX IF NOT EXISTS idx_thematic_map_verses_map
      ON thematic_map_verses(map_id, sort_order ASC);

    -- ── EXPOSIÇÃO GUIADA (COIA) ───────────────────────────────────
    CREATE TABLE IF NOT EXISTS study_notes (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL,
      book_slug       TEXT NOT NULL,
      book_name       TEXT NOT NULL,
      chapter         INTEGER NOT NULL,
      verse_start     INTEGER,
      verse_end       INTEGER,
      passage_ref     TEXT NOT NULL,
      context         TEXT,
      observation     TEXT,
      interpretation  TEXT,
      application     TEXT,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_study_notes_user
      ON study_notes(user_id, updated_at DESC);

    CREATE INDEX IF NOT EXISTS idx_study_notes_chapter
      ON study_notes(user_id, book_slug, chapter);
  `);
}