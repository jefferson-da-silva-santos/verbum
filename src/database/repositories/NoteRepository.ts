/**
 * VERBUM — NoteRepository [named params fix]
 * O findAll tinha um array dinâmico params que causava "[object Object]"
 * no bridge Kotlin quando type era passado. Agora usa named params.
 */
import type { NoteType } from "../../constants";
import type { CreateNoteInput, Note, UpdateNoteInput } from "../types";
import { BaseRepository } from "./BaseRepository";

interface NoteRow {
  id: string; user_id: string; book_slug: string; chapter_number: number;
  verse_number: number | null; content: string; type: string;
  created_at: string; updated_at: string;
}

export class NoteRepository extends BaseRepository {
  protected readonly name = "NoteRepository";

  private mapRow(row: NoteRow): Note {
    return {
      id: row.id, userId: row.user_id, bookSlug: row.book_slug,
      chapterNumber: row.chapter_number, verseNumber: row.verse_number,
      content: row.content, type: row.type as NoteType,
      createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }

  async create(input: CreateNoteInput): Promise<Note> {
    try {
      const id = this.generateId(); const now = this.now();
      await this.db.runAsync(
        `INSERT INTO notes (id, user_id, book_slug, chapter_number, verse_number, content, type, created_at, updated_at)
         VALUES ($id, $userId, $bookSlug, $chapterNumber, $verseNumber, $content, $type, $now, $now)`,
        { $id: id, $userId: input.userId, $bookSlug: input.bookSlug, $chapterNumber: input.chapterNumber, $verseNumber: input.verseNumber ?? null, $content: input.content, $type: input.type, $now: now },
      );
      return (await this.findById(id))!;
    } catch (e) { throw this.wrapError("create", e); }
  }

  async findById(id: string): Promise<Note | null> {
    try {
      const row = await this.db.getFirstAsync<NoteRow>(
        `SELECT * FROM notes WHERE id = $id`, { $id: id },
      );
      return row ? this.mapRow(row) : null;
    } catch (e) { throw this.wrapError("findById", e); }
  }

  async findByChapter(userId: string, bookSlug: string, chapterNumber: number): Promise<Note[]> {
    try {
      const rows = await this.db.getAllAsync<NoteRow>(
        `SELECT * FROM notes WHERE user_id = $userId AND book_slug = $bookSlug AND chapter_number = $chapterNumber ORDER BY verse_number ASC, created_at DESC`,
        { $userId: userId, $bookSlug: bookSlug, $chapterNumber: chapterNumber },
      );
      return rows.map(r => this.mapRow(r));
    } catch (e) { throw this.wrapError("findByChapter", e); }
  }

  async findByVerse(userId: string, bookSlug: string, chapterNumber: number, verseNumber: number): Promise<Note[]> {
    try {
      const rows = await this.db.getAllAsync<NoteRow>(
        `SELECT * FROM notes WHERE user_id = $userId AND book_slug = $bookSlug AND chapter_number = $chapterNumber AND verse_number = $verseNumber ORDER BY created_at DESC`,
        { $userId: userId, $bookSlug: bookSlug, $chapterNumber: chapterNumber, $verseNumber: verseNumber },
      );
      return rows.map(r => this.mapRow(r));
    } catch (e) { throw this.wrapError("findByVerse", e); }
  }

  async findAll(userId: string, opts: { limit?: number; offset?: number; type?: NoteType } = {}): Promise<Note[]> {
    try {
      const { limit = 50, offset = 0, type } = opts;
      // FIX: antes construía um array dinâmico [userId, type?, limit, offset]
      // que causava "[object Object]" no bridge Kotlin.
      // Agora usa named params com cláusula WHERE opcional.
      const whereType = type ? "AND type = $type" : "";
      const params: Record<string, string | number> = { $userId: userId, $limit: limit, $offset: offset };
      if (type) params.$type = type;

      const rows = await this.db.getAllAsync<NoteRow>(
        `SELECT * FROM notes WHERE user_id = $userId ${whereType} ORDER BY created_at DESC LIMIT $limit OFFSET $offset`,
        params,
      );
      return rows.map(r => this.mapRow(r));
    } catch (e) { throw this.wrapError("findAll", e); }
  }

  async update(id: string, input: UpdateNoteInput): Promise<Note> {
    try {
      await this.db.runAsync(
        `UPDATE notes SET content = $content, type = $type, updated_at = $now WHERE id = $id`,
        { $content: input.content, $type: input.type, $now: this.now(), $id: id },
      );
      return (await this.findById(id))!;
    } catch (e) { throw this.wrapError("update", e); }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync(`DELETE FROM notes WHERE id = $id`, { $id: id });
    } catch (e) { throw this.wrapError("delete", e); }
  }

  async count(userId: string): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM notes WHERE user_id = $userId`, { $userId: userId },
      );
      return row?.c ?? 0;
    } catch (e) { throw this.wrapError("count", e); }
  }
}