/**
 * VERBUM — NoteRepository
 *
 * Gerencia anotações vinculadas a capítulos ou versículos específicos.
 */

import { BaseRepository } from "./BaseRepository";
import type { Note, CreateNoteInput, UpdateNoteInput } from "../../types";
import type { NoteType } from "../../constants";

interface NoteRow {
  id: string;
  user_id: string;
  book_slug: string;
  chapter_number: number;
  verse_number: number | null;
  content: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export class NoteRepository extends BaseRepository {
  protected readonly name = "NoteRepository";

  private mapRow(row: NoteRow): Note {
    return {
      id: row.id,
      userId: row.user_id,
      bookSlug: row.book_slug,
      chapterNumber: row.chapter_number,
      verseNumber: row.verse_number,
      content: row.content,
      type: row.type as NoteType,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(input: CreateNoteInput): Promise<Note> {
    try {
      const id = this.generateId();
      const now = this.now();
      await this.db.runAsync(
        `INSERT INTO notes
          (id, user_id, book_slug, chapter_number, verse_number, content, type, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.userId,
          input.bookSlug,
          input.chapterNumber,
          input.verseNumber ?? null,
          input.content,
          input.type,
          now,
          now,
        ],
      );
      return (await this.findById(id))!;
    } catch (e) {
      throw this.wrapError("create", e);
    }
  }

  async findById(id: string): Promise<Note | null> {
    try {
      const row = await this.db.getFirstAsync<NoteRow>(
        "SELECT * FROM notes WHERE id = ?",
        [id],
      );
      return row ? this.mapRow(row) : null;
    } catch (e) {
      throw this.wrapError("findById", e);
    }
  }

  /** Notas de um capítulo inteiro (incluindo as de versículos específicos) */
  async findByChapter(
    userId: string,
    bookSlug: string,
    chapterNumber: number,
  ): Promise<Note[]> {
    try {
      const rows = await this.db.getAllAsync<NoteRow>(
        "SELECT * FROM notes WHERE user_id = ? AND book_slug = ? AND chapter_number = ? ORDER BY verse_number ASC, created_at DESC",
        [userId, bookSlug, chapterNumber],
      );
      return rows.map((r) => this.mapRow(r));
    } catch (e) {
      throw this.wrapError("findByChapter", e);
    }
  }

  /** Notas de um versículo específico */
  async findByVerse(
    userId: string,
    bookSlug: string,
    chapterNumber: number,
    verseNumber: number,
  ): Promise<Note[]> {
    try {
      const rows = await this.db.getAllAsync<NoteRow>(
        "SELECT * FROM notes WHERE user_id = ? AND book_slug = ? AND chapter_number = ? AND verse_number = ? ORDER BY created_at DESC",
        [userId, bookSlug, chapterNumber, verseNumber],
      );
      return rows.map((r) => this.mapRow(r));
    } catch (e) {
      throw this.wrapError("findByVerse", e);
    }
  }

  /** Todas as notas do usuário com paginação opcional */
  async findAll(
    userId: string,
    opts: { limit?: number; offset?: number; type?: NoteType } = {},
  ): Promise<Note[]> {
    try {
      const { limit = 50, offset = 0, type } = opts;
      const where = type ? "AND type = ?" : "";
      const params: (string | number)[] = type
        ? [userId, type, limit, offset]
        : [userId, limit, offset];

      const rows = await this.db.getAllAsync<NoteRow>(
        `SELECT * FROM notes WHERE user_id = ? ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        params,
      );
      return rows.map((r) => this.mapRow(r));
    } catch (e) {
      throw this.wrapError("findAll", e);
    }
  }

  async update(id: string, input: UpdateNoteInput): Promise<Note> {
    try {
      await this.db.runAsync(
        "UPDATE notes SET content = ?, type = ?, updated_at = ? WHERE id = ?",
        [input.content, input.type, this.now(), id],
      );
      return (await this.findById(id))!;
    } catch (e) {
      throw this.wrapError("update", e);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync("DELETE FROM notes WHERE id = ?", [id]);
    } catch (e) {
      throw this.wrapError("delete", e);
    }
  }

  async count(userId: string): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) as c FROM notes WHERE user_id = ?",
        [userId],
      );
      return row?.c ?? 0;
    } catch (e) {
      throw this.wrapError("count", e);
    }
  }
}
