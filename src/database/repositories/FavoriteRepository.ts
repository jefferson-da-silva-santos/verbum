/**
 * VERBUM — FavoriteRepository [named params fix]
 */
import type { CreateFavoriteInput, Favorite } from "../types";
import { BaseRepository } from "./BaseRepository";

interface FavoriteRow {
  id: string; user_id: string; book_slug: string; book_name: string;
  chapter_number: number; verse_number: number; verse_text: string;
  bible_version: string; created_at: string;
}

export class FavoriteRepository extends BaseRepository {
  protected readonly name = "FavoriteRepository";

  private mapRow(row: FavoriteRow): Favorite {
    return {
      id: row.id, userId: row.user_id, bookSlug: row.book_slug, bookName: row.book_name,
      chapterNumber: row.chapter_number, verseNumber: row.verse_number,
      verseText: row.verse_text, bibleVersion: row.bible_version as Favorite["bibleVersion"],
      createdAt: row.created_at,
    };
  }

  async add(input: CreateFavoriteInput): Promise<Favorite> {
    try {
      const id = this.generateId(); const now = this.now();
      await this.db.runAsync(
        `INSERT OR IGNORE INTO favorites (id, user_id, book_slug, book_name, chapter_number, verse_number, verse_text, bible_version, created_at)
         VALUES ($id, $userId, $bookSlug, $bookName, $chapterNumber, $verseNumber, $verseText, $bibleVersion, $now)`,
        { $id: id, $userId: input.userId, $bookSlug: input.bookSlug, $bookName: input.bookName, $chapterNumber: input.chapterNumber, $verseNumber: input.verseNumber, $verseText: input.verseText, $bibleVersion: input.bibleVersion, $now: now },
      );
      return (await this.findByVerse(input.userId, input.bookSlug, input.chapterNumber, input.verseNumber))!;
    } catch (e) { throw this.wrapError("add", e); }
  }

  async remove(userId: string, bookSlug: string, chapterNumber: number, verseNumber: number): Promise<void> {
    try {
      await this.db.runAsync(
        `DELETE FROM favorites WHERE user_id = $userId AND book_slug = $bookSlug AND chapter_number = $chapterNumber AND verse_number = $verseNumber`,
        { $userId: userId, $bookSlug: bookSlug, $chapterNumber: chapterNumber, $verseNumber: verseNumber },
      );
    } catch (e) { throw this.wrapError("remove", e); }
  }

  async isFavorite(userId: string, bookSlug: string, chapterNumber: number, verseNumber: number): Promise<boolean> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM favorites WHERE user_id = $userId AND book_slug = $bookSlug AND chapter_number = $chapterNumber AND verse_number = $verseNumber`,
        { $userId: userId, $bookSlug: bookSlug, $chapterNumber: chapterNumber, $verseNumber: verseNumber },
      );
      return (row?.c ?? 0) > 0;
    } catch (e) { throw this.wrapError("isFavorite", e); }
  }

  async findByVerse(userId: string, bookSlug: string, chapterNumber: number, verseNumber: number): Promise<Favorite | null> {
    try {
      const row = await this.db.getFirstAsync<FavoriteRow>(
        `SELECT * FROM favorites WHERE user_id = $userId AND book_slug = $bookSlug AND chapter_number = $chapterNumber AND verse_number = $verseNumber`,
        { $userId: userId, $bookSlug: bookSlug, $chapterNumber: chapterNumber, $verseNumber: verseNumber },
      );
      return row ? this.mapRow(row) : null;
    } catch (e) { throw this.wrapError("findByVerse", e); }
  }

  async findAll(userId: string, opts: { limit?: number; offset?: number } = {}): Promise<Favorite[]> {
    try {
      const { limit = 100, offset = 0 } = opts;
      const rows = await this.db.getAllAsync<FavoriteRow>(
        `SELECT * FROM favorites WHERE user_id = $userId ORDER BY created_at DESC LIMIT $limit OFFSET $offset`,
        { $userId: userId, $limit: limit, $offset: offset },
      );
      return rows.map(r => this.mapRow(r));
    } catch (e) { throw this.wrapError("findAll", e); }
  }

  async count(userId: string): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM favorites WHERE user_id = $userId`, { $userId: userId },
      );
      return row?.c ?? 0;
    } catch (e) { throw this.wrapError("count", e); }
  }
}