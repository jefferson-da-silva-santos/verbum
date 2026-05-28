/**
 * VERBUM — Database Schema
 *
 * DDL de todas as tabelas do SQLite.
 * Organizado em constantes string para uso no sistema de migrações.
 *
 * Convenções:
 *   - Todas as PKs são UUID v4 (TEXT)
 *   - Datas são ISO 8601 (TEXT): "2025-01-15T10:30:00.000Z"
 *   - Booleanos são INTEGER (0 | 1)
 *   - Arrays e objetos são JSON (TEXT)
 *   - REFERENCES com ON DELETE CASCADE para limpeza automática
 *   - Índices em colunas de query frequente
 */

// ─────────────────────────────────────────────
// TABELAS
// ─────────────────────────────────────────────

export const CREATE_USERS = `
  CREATE TABLE IF NOT EXISTS users (
    id                    TEXT    PRIMARY KEY,
    name                  TEXT    NOT NULL,
    email                 TEXT    NOT NULL UNIQUE,
    avatar_url            TEXT,
    preferred_version     TEXT    NOT NULL DEFAULT 'acf',
    avg_reading_speed     REAL    NOT NULL DEFAULT 3.7,
    font_scale            REAL    NOT NULL DEFAULT 1.0,
    dark_mode_preference  TEXT    NOT NULL DEFAULT 'system',
    notifications_enabled INTEGER NOT NULL DEFAULT 1,
    reminder_time         TEXT,
    created_at            TEXT    NOT NULL,
    updated_at            TEXT    NOT NULL
  );
`;

export const CREATE_READING_PLANS = `
  CREATE TABLE IF NOT EXISTS reading_plans (
    id                  TEXT    PRIMARY KEY,
    user_id             TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                TEXT    NOT NULL,
    scope_type          TEXT    NOT NULL,
    scope_data          TEXT    NOT NULL DEFAULT '{}',
    mode                TEXT    NOT NULL,
    chapters_per_day    INTEGER,
    minutes_per_day     REAL,
    target_date         TEXT,
    start_date          TEXT    NOT NULL,
    estimated_end_date  TEXT,
    skip_weekdays       TEXT    NOT NULL DEFAULT '[]',
    total_chapters      INTEGER NOT NULL,
    bible_version       TEXT    NOT NULL DEFAULT 'acf',
    is_active           INTEGER NOT NULL DEFAULT 1,
    is_completed        INTEGER NOT NULL DEFAULT 0,
    completed_at        TEXT,
    recalibration_count INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT    NOT NULL,
    updated_at          TEXT    NOT NULL
  );
`;

export const CREATE_PLAN_SCHEDULE = `
  CREATE TABLE IF NOT EXISTS plan_schedule (
    id                TEXT    PRIMARY KEY,
    plan_id           TEXT    NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
    date              TEXT    NOT NULL,
    is_active         INTEGER NOT NULL DEFAULT 1,
    chapters          TEXT    NOT NULL DEFAULT '[]',
    estimated_minutes REAL,
    created_at        TEXT    NOT NULL,
    UNIQUE(plan_id, date)
  );
`;

export const CREATE_CHAPTER_PROGRESS = `
  CREATE TABLE IF NOT EXISTS chapter_progress (
    id                        TEXT    PRIMARY KEY,
    plan_id                   TEXT    NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
    user_id                   TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_slug                 TEXT    NOT NULL,
    book_name                 TEXT    NOT NULL,
    chapter_number            INTEGER NOT NULL,
    read_at                   TEXT    NOT NULL,
    reading_duration_seconds  INTEGER,
    schedule_date             TEXT,
    is_on_time                INTEGER NOT NULL DEFAULT 1,
    created_at                TEXT    NOT NULL,
    UNIQUE(plan_id, book_slug, chapter_number)
  );
`;

export const CREATE_READING_SESSIONS = `
  CREATE TABLE IF NOT EXISTS reading_sessions (
    id               TEXT    PRIMARY KEY,
    user_id          TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id          TEXT    REFERENCES reading_plans(id) ON DELETE SET NULL,
    book_slug        TEXT,
    chapter_number   INTEGER,
    started_at       TEXT    NOT NULL,
    ended_at         TEXT,
    duration_seconds INTEGER,
    chapters_read    INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT    NOT NULL
  );
`;

export const CREATE_NOTES = `
  CREATE TABLE IF NOT EXISTS notes (
    id             TEXT    PRIMARY KEY,
    user_id        TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_slug      TEXT    NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_number   INTEGER,
    content        TEXT    NOT NULL,
    type           TEXT    NOT NULL,
    created_at     TEXT    NOT NULL,
    updated_at     TEXT    NOT NULL
  );
`;

export const CREATE_HIGHLIGHTS = `
  CREATE TABLE IF NOT EXISTS highlights (
    id             TEXT    PRIMARY KEY,
    user_id        TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_slug      TEXT    NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_number   INTEGER NOT NULL,
    color          TEXT    NOT NULL,
    tag            TEXT    NOT NULL,
    verse_text     TEXT    NOT NULL,
    bible_version  TEXT    NOT NULL DEFAULT 'acf',
    created_at     TEXT    NOT NULL,
    UNIQUE(user_id, book_slug, chapter_number, verse_number)
  );
`;

export const CREATE_FAVORITES = `
  CREATE TABLE IF NOT EXISTS favorites (
    id             TEXT    PRIMARY KEY,
    user_id        TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_slug      TEXT    NOT NULL,
    book_name      TEXT    NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_number   INTEGER NOT NULL,
    verse_text     TEXT    NOT NULL,
    bible_version  TEXT    NOT NULL DEFAULT 'acf',
    created_at     TEXT    NOT NULL,
    UNIQUE(user_id, book_slug, chapter_number, verse_number)
  );
`;

export const CREATE_DIARY_ENTRIES = `
  CREATE TABLE IF NOT EXISTS diary_entries (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT,
    content     TEXT NOT NULL,
    mood        TEXT,
    entry_date  TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
`;

export const CREATE_ACHIEVEMENTS = `
  CREATE TABLE IF NOT EXISTS achievements (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_key TEXT NOT NULL,
    unlocked_at     TEXT NOT NULL,
    UNIQUE(user_id, achievement_key)
  );
`;

export const CREATE_API_CACHE = `
  CREATE TABLE IF NOT EXISTS api_cache (
    cache_key      TEXT    PRIMARY KEY,
    bible_version  TEXT    NOT NULL,
    book_slug      TEXT    NOT NULL,
    chapter_number INTEGER NOT NULL,
    data           TEXT    NOT NULL,
    cached_at      TEXT    NOT NULL,
    expires_at     TEXT    NOT NULL
  );
`;

export const CREATE_SCHEMA_MIGRATIONS = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version    INTEGER PRIMARY KEY,
    name       TEXT    NOT NULL,
    applied_at TEXT    NOT NULL
  );
`;

// ─────────────────────────────────────────────
// ÍNDICES
// Criados separadamente para controle fino
// ─────────────────────────────────────────────

export const CREATE_INDICES = `
  CREATE INDEX IF NOT EXISTS idx_plans_user_id
    ON reading_plans(user_id);

  CREATE INDEX IF NOT EXISTS idx_plans_active
    ON reading_plans(user_id, is_active, is_completed);

  CREATE INDEX IF NOT EXISTS idx_schedule_plan_date
    ON plan_schedule(plan_id, date);

  CREATE INDEX IF NOT EXISTS idx_progress_plan
    ON chapter_progress(plan_id);

  CREATE INDEX IF NOT EXISTS idx_progress_user
    ON chapter_progress(user_id);

  CREATE INDEX IF NOT EXISTS idx_progress_read_at
    ON chapter_progress(user_id, read_at);

  CREATE INDEX IF NOT EXISTS idx_progress_book
    ON chapter_progress(plan_id, book_slug);

  CREATE INDEX IF NOT EXISTS idx_sessions_user
    ON reading_sessions(user_id);

  CREATE INDEX IF NOT EXISTS idx_sessions_started
    ON reading_sessions(user_id, started_at);

  CREATE INDEX IF NOT EXISTS idx_notes_chapter
    ON notes(user_id, book_slug, chapter_number);

  CREATE INDEX IF NOT EXISTS idx_notes_created
    ON notes(user_id, created_at);

  CREATE INDEX IF NOT EXISTS idx_highlights_chapter
    ON highlights(user_id, book_slug, chapter_number);

  CREATE INDEX IF NOT EXISTS idx_favorites_user
    ON favorites(user_id, created_at);

  CREATE INDEX IF NOT EXISTS idx_diary_user_date
    ON diary_entries(user_id, entry_date);

  CREATE INDEX IF NOT EXISTS idx_achievements_user
    ON achievements(user_id);

  CREATE INDEX IF NOT EXISTS idx_cache_expiry
    ON api_cache(expires_at);

  CREATE INDEX IF NOT EXISTS idx_cache_lookup
    ON api_cache(bible_version, book_slug, chapter_number);
`;

// ─────────────────────────────────────────────
// PRAGMAS DE PERFORMANCE
// ─────────────────────────────────────────────

export const PRAGMAS = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = NORMAL;
  PRAGMA cache_size = -8000;
  PRAGMA temp_store = MEMORY;
`;

// ─────────────────────────────────────────────
// TABELAS AGRUPADAS — para uso no migration runner
// ─────────────────────────────────────────────

/** DDL de todas as tabelas na ordem correta (respeita FKs) */
export const ALL_CREATE_STATEMENTS = [
  CREATE_SCHEMA_MIGRATIONS,
  CREATE_USERS,
  CREATE_READING_PLANS,
  CREATE_PLAN_SCHEDULE,
  CREATE_CHAPTER_PROGRESS,
  CREATE_READING_SESSIONS,
  CREATE_NOTES,
  CREATE_HIGHLIGHTS,
  CREATE_FAVORITES,
  CREATE_DIARY_ENTRIES,
  CREATE_ACHIEVEMENTS,
  CREATE_API_CACHE,
] as const;
