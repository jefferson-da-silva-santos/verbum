/**
 * VERBUM — HighlightRepository [named params fix]
 */
import { BaseRepository } from "./BaseRepository";
import type { Highlight, CreateHighlightInput } from "../types";
import type { HighlightColor } from "../../constants";

interface HighlightRow {
  id: string; user_id: string; book_slug: string; chapter_number: number;
  verse_number: number; color: string; tag: string; verse_text: string;
  bible_version: string; created_at: string;
}

export class HighlightRepository extends BaseRepository {
  protected readonly name = "HighlightRepository";

  private mapRow(row: HighlightRow): Highlight {
    return {
      id: row.id, userId: row.user_id, bookSlug: row.book_slug,
      chapterNumber: row.chapter_number, verseNumber: row.verse_number,
      color: row.color as HighlightColor, tag: row.tag, verseText: row.verse_text,
      bibleVersion: row.bible_version as Highlight["bibleVersion"], createdAt: row.created_at,
    };
  }

  async upsert(input: CreateHighlightInput): Promise<Highlight> {
    try {
      const existing = await this.findByVerse(input.userId, input.bookSlug, input.chapterNumber, input.verseNumber);
      if (existing) {
        await this.db.runAsync(
          `UPDATE highlights SET color = $color, tag = $tag, verse_text = $verseText WHERE id = $id`,
          { $color: input.color, $tag: input.tag, $verseText: input.verseText, $id: existing.id },
        );
        return (await this.findByVerse(input.userId, input.bookSlug, input.chapterNumber, input.verseNumber))!;
      }
      const id = this.generateId(); const now = this.now();
      await this.db.runAsync(
        `INSERT INTO highlights (id, user_id, book_slug, chapter_number, verse_number, color, tag, verse_text, bible_version, created_at)
         VALUES ($id, $userId, $bookSlug, $chapterNumber, $verseNumber, $color, $tag, $verseText, $bibleVersion, $now)`,
        { $id: id, $userId: input.userId, $bookSlug: input.bookSlug, $chapterNumber: input.chapterNumber, $verseNumber: input.verseNumber, $color: input.color, $tag: input.tag, $verseText: input.verseText, $bibleVersion: input.bibleVersion, $now: now },
      );
      return (await this.findByVerse(input.userId, input.bookSlug, input.chapterNumber, input.verseNumber))!;
    } catch (e) { throw this.wrapError("upsert", e); }
  }

  async findByVerse(userId: string, bookSlug: string, chapterNumber: number, verseNumber: number): Promise<Highlight | null> {
    try {
      const row = await this.db.getFirstAsync<HighlightRow>(
        `SELECT * FROM highlights WHERE user_id = $userId AND book_slug = $bookSlug AND chapter_number = $chapterNumber AND verse_number = $verseNumber`,
        { $userId: userId, $bookSlug: bookSlug, $chapterNumber: chapterNumber, $verseNumber: verseNumber },
      );
      return row ? this.mapRow(row) : null;
    } catch (e) { throw this.wrapError("findByVerse", e); }
  }

  async findByChapter(userId: string, bookSlug: string, chapterNumber: number): Promise<Highlight[]> {
    try {
      const rows = await this.db.getAllAsync<HighlightRow>(
        `SELECT * FROM highlights WHERE user_id = $userId AND book_slug = $bookSlug AND chapter_number = $chapterNumber ORDER BY verse_number ASC`,
        { $userId: userId, $bookSlug: bookSlug, $chapterNumber: chapterNumber },
      );
      return rows.map(r => this.mapRow(r));
    } catch (e) { throw this.wrapError("findByChapter", e); }
  }

  async findAll(userId: string, opts: { limit?: number; offset?: number } = {}): Promise<Highlight[]> {
    try {
      const { limit = 100, offset = 0 } = opts;
      const rows = await this.db.getAllAsync<HighlightRow>(
        `SELECT * FROM highlights WHERE user_id = $userId ORDER BY created_at DESC LIMIT $limit OFFSET $offset`,
        { $userId: userId, $limit: limit, $offset: offset },
      );
      return rows.map(r => this.mapRow(r));
    } catch (e) { throw this.wrapError("findAll", e); }
  }

  async delete(userId: string, bookSlug: string, chapterNumber: number, verseNumber: number): Promise<void> {
    try {
      await this.db.runAsync(
        `DELETE FROM highlights WHERE user_id = $userId AND book_slug = $bookSlug AND chapter_number = $chapterNumber AND verse_number = $verseNumber`,
        { $userId: userId, $bookSlug: bookSlug, $chapterNumber: chapterNumber, $verseNumber: verseNumber },
      );
    } catch (e) { throw this.wrapError("delete", e); }
  }

  async count(userId: string): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM highlights WHERE user_id = $userId`, { $userId: userId },
      );
      return row?.c ?? 0;
    } catch (e) { throw this.wrapError("count", e); }
  }
}