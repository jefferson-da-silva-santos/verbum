/**
 * VERBUM — HighlightRepository
 *
 * Destaques coloridos em versículos.
 * Constraint UNIQUE(user_id, book_slug, chapter_number, verse_number) garante
 * que cada versículo tem no máximo uma cor por usuário.
 * O upsert atualiza a cor sem alterar o id ou created_at originais.
 */

import { BaseRepository } from "./BaseRepository";
import type { Highlight, CreateHighlightInput } from "../types";
import type { HighlightColor } from "../../constants";

interface HighlightRow {
  id: string;
  user_id: string;
  book_slug: string;
  chapter_number: number;
  verse_number: number;
  color: string;
  tag: string;
  verse_text: string;
  bible_version: string;
  created_at: string;
}

export class HighlightRepository extends BaseRepository {
  protected readonly name = "HighlightRepository";

  private mapRow(row: HighlightRow): Highlight {
    return {
      id: row.id,
      userId: row.user_id,
      bookSlug: row.book_slug,
      chapterNumber: row.chapter_number,
      verseNumber: row.verse_number,
      color: row.color as HighlightColor,
      tag: row.tag,
      verseText: row.verse_text,
      bibleVersion: row.bible_version as Highlight["bibleVersion"],
      createdAt: row.created_at,
    };
  }

  /**
   * Insere ou atualiza o destaque de um versículo.
   * Se o versículo já tiver um destaque, apenas cor e tag são atualizados —
   * o id e created_at originais são preservados.
   */
  async upsert(input: CreateHighlightInput): Promise<Highlight> {
    try {
      const existing = await this.findByVerse(
        input.userId,
        input.bookSlug,
        input.chapterNumber,
        input.verseNumber,
      );

      if (existing) {
        await this.db.runAsync(
          "UPDATE highlights SET color = ?, tag = ?, verse_text = ? WHERE id = ?",
          [input.color, input.tag, input.verseText, existing.id],
        );
        return (await this.findByVerse(
          input.userId,
          input.bookSlug,
          input.chapterNumber,
          input.verseNumber,
        ))!;
      }

      const id = this.generateId();
      const now = this.now();
      await this.db.runAsync(
        `INSERT INTO highlights
          (id, user_id, book_slug, chapter_number, verse_number,
           color, tag, verse_text, bible_version, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.userId,
          input.bookSlug,
          input.chapterNumber,
          input.verseNumber,
          input.color,
          input.tag,
          input.verseText,
          input.bibleVersion,
          now,
        ],
      );
      return (await this.findByVerse(
        input.userId,
        input.bookSlug,
        input.chapterNumber,
        input.verseNumber,
      ))!;
    } catch (e) {
      throw this.wrapError("upsert", e);
    }
  }

  async findByVerse(
    userId: string,
    bookSlug: string,
    chapterNumber: number,
    verseNumber: number,
  ): Promise<Highlight | null> {
    try {
      const row = await this.db.getFirstAsync<HighlightRow>(
        "SELECT * FROM highlights WHERE user_id = ? AND book_slug = ? AND chapter_number = ? AND verse_number = ?",
        [userId, bookSlug, chapterNumber, verseNumber],
      );
      return row ? this.mapRow(row) : null;
    } catch (e) {
      throw this.wrapError("findByVerse", e);
    }
  }

  /** Todos os destaques de um capítulo (para renderizar o Reader) */
  async findByChapter(
    userId: string,
    bookSlug: string,
    chapterNumber: number,
  ): Promise<Highlight[]> {
    try {
      const rows = await this.db.getAllAsync<HighlightRow>(
        "SELECT * FROM highlights WHERE user_id = ? AND book_slug = ? AND chapter_number = ? ORDER BY verse_number ASC",
        [userId, bookSlug, chapterNumber],
      );
      return rows.map((r) => this.mapRow(r));
    } catch (e) {
      throw this.wrapError("findByChapter", e);
    }
  }

  /** Todos os destaques do usuário — para tela de exportação */
  async findAll(
    userId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<Highlight[]> {
    try {
      const { limit = 100, offset = 0 } = opts;
      const rows = await this.db.getAllAsync<HighlightRow>(
        "SELECT * FROM highlights WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        [userId, limit, offset],
      );
      return rows.map((r) => this.mapRow(r));
    } catch (e) {
      throw this.wrapError("findAll", e);
    }
  }

  async delete(
    userId: string,
    bookSlug: string,
    chapterNumber: number,
    verseNumber: number,
  ): Promise<void> {
    try {
      await this.db.runAsync(
        "DELETE FROM highlights WHERE user_id = ? AND book_slug = ? AND chapter_number = ? AND verse_number = ?",
        [userId, bookSlug, chapterNumber, verseNumber],
      );
    } catch (e) {
      throw this.wrapError("delete", e);
    }
  }

  async count(userId: string): Promise<number> {
    try {
      const row = await this.db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) as c FROM highlights WHERE user_id = ?",
        [userId],
      );
      return row?.c ?? 0;
    } catch (e) {
      throw this.wrapError("count", e);
    }
  }
}
