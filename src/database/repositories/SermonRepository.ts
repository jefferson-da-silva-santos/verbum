/**
 * VERBUM — src/database/repositories/SermonRepository.ts
 */

import { getDb } from '..';

import type { Sermon, SermonVerse, SermonWithVerses, SermonStatus, SermonOutlinePoint } from '../types';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function now(): string { return new Date().toISOString(); }

function rowToSermon(row: any): Sermon {
  return {
    id: row.id, userId: row.user_id, title: row.title,
    passageRef: row.passage_ref, bookSlug: row.book_slug,
    chapterStart: row.chapter_start, verseStart: row.verse_start,
    chapterEnd: row.chapter_end, verseEnd: row.verse_end,
    contextNotes: row.context_notes, structureNotes: row.structure_notes,
    exegesisNotes: row.exegesis_notes,
    outline: row.outline ? JSON.parse(row.outline) : null,
    applicationNotes: row.application_notes,
    status: (row.status ?? 'draft') as SermonStatus,
    preachedAt: row.preached_at,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function rowToSermonVerse(row: any): SermonVerse {
  return {
    id: row.id, sermonId: row.sermon_id, bookSlug: row.book_slug,
    bookName: row.book_name, chapter: row.chapter, verse: row.verse,
    verseText: row.verse_text, sectionLabel: row.section_label,
    sortOrder: row.sort_order, createdAt: row.created_at,
  };
}

export const SermonRepository = {

  async create(input: {
    userId: string; title: string;
    bookSlug?: string; passageRef?: string;
    chapterStart?: number; verseStart?: number;
    chapterEnd?: number; verseEnd?: number;
  }): Promise<Sermon> {
    const db = getDb();
    const id = uuid(); const ts = now();
    await db.runAsync(
      `INSERT INTO sermons (id,user_id,title,passage_ref,book_slug,chapter_start,verse_start,chapter_end,verse_end,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, input.userId, input.title, input.passageRef ?? null, input.bookSlug ?? null,
       input.chapterStart ?? null, input.verseStart ?? null,
       input.chapterEnd ?? null, input.verseEnd ?? null, 'draft', ts, ts],
    );
    return (await SermonRepository.findById(id))!;
  },

  async findAll(userId: string): Promise<Sermon[]> {
    const db = getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM sermons WHERE user_id = ? ORDER BY updated_at DESC',
      [userId],
    );
    return rows.map(rowToSermon);
  },

  async findById(id: string): Promise<Sermon | null> {
    const db = getDb();
    const row = await db.getFirstAsync('SELECT * FROM sermons WHERE id = ?', [id]);
    return row ? rowToSermon(row) : null;
  },

  async findWithVerses(id: string): Promise<SermonWithVerses | null> {
    const sermon = await SermonRepository.findById(id);
    if (!sermon) return null;
    const verses = await SermonRepository.getVerses(id);
    return { ...sermon, verses };
  },

  async update(id: string, data: {
    title?: string; passageRef?: string | null; bookSlug?: string | null;
    chapterStart?: number | null; verseStart?: number | null;
    chapterEnd?: number | null; verseEnd?: number | null;
    contextNotes?: string | null; structureNotes?: string | null;
    exegesisNotes?: string | null; outline?: SermonOutlinePoint[] | null;
    applicationNotes?: string | null; status?: SermonStatus; preachedAt?: string | null;
  }): Promise<void> {
    const db = getDb();
    const fields: string[] = []; const values: any[] = [];

    if (data.title           !== undefined) { fields.push('title = ?');             values.push(data.title); }
    if (data.passageRef      !== undefined) { fields.push('passage_ref = ?');       values.push(data.passageRef); }
    if (data.bookSlug        !== undefined) { fields.push('book_slug = ?');          values.push(data.bookSlug); }
    if (data.chapterStart    !== undefined) { fields.push('chapter_start = ?');      values.push(data.chapterStart); }
    if (data.verseStart      !== undefined) { fields.push('verse_start = ?');        values.push(data.verseStart); }
    if (data.chapterEnd      !== undefined) { fields.push('chapter_end = ?');        values.push(data.chapterEnd); }
    if (data.verseEnd        !== undefined) { fields.push('verse_end = ?');          values.push(data.verseEnd); }
    if (data.contextNotes    !== undefined) { fields.push('context_notes = ?');      values.push(data.contextNotes); }
    if (data.structureNotes  !== undefined) { fields.push('structure_notes = ?');    values.push(data.structureNotes); }
    if (data.exegesisNotes   !== undefined) { fields.push('exegesis_notes = ?');     values.push(data.exegesisNotes); }
    if (data.outline         !== undefined) { fields.push('outline = ?');            values.push(data.outline ? JSON.stringify(data.outline) : null); }
    if (data.applicationNotes!== undefined) { fields.push('application_notes = ?'); values.push(data.applicationNotes); }
    if (data.status          !== undefined) { fields.push('status = ?');             values.push(data.status); }
    if (data.preachedAt      !== undefined) { fields.push('preached_at = ?');        values.push(data.preachedAt); }

    if (fields.length === 0) return;
    fields.push('updated_at = ?'); values.push(now()); values.push(id);
    await db.runAsync(`UPDATE sermons SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM sermons WHERE id = ?', [id]);
  },

  // ── VERSÍCULOS DO SERMÃO ────────────────────────────────────────

  async getVerses(sermonId: string): Promise<SermonVerse[]> {
    const db = getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM sermon_verses WHERE sermon_id = ? ORDER BY sort_order ASC',
      [sermonId],
    );
    return rows.map(rowToSermonVerse);
  },

  async addVerse(input: {
    sermonId: string; bookSlug: string; bookName: string;
    chapter: number; verse: number; verseText?: string;
    sectionLabel?: string;
  }): Promise<SermonVerse> {
    const db = getDb();
    const id = uuid(); const ts = now();
    const countRow: any = await db.getFirstAsync(
      'SELECT COUNT(*) as n FROM sermon_verses WHERE sermon_id = ?', [input.sermonId],
    );
    const sortOrder = (countRow?.n ?? 0) as number;

    await db.runAsync(
      `INSERT INTO sermon_verses (id,sermon_id,book_slug,book_name,chapter,verse,verse_text,section_label,sort_order,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, input.sermonId, input.bookSlug, input.bookName,
       input.chapter, input.verse, input.verseText ?? null,
       input.sectionLabel ?? null, sortOrder, ts],
    );
    // Atualiza updated_at do sermão
    await db.runAsync('UPDATE sermons SET updated_at = ? WHERE id = ?', [ts, input.sermonId]);
    return (await db.getFirstAsync('SELECT * FROM sermon_verses WHERE id = ?', [id]) as any).then
      ? rowToSermonVerse(await db.getFirstAsync('SELECT * FROM sermon_verses WHERE id = ?', [id]) as any)
      : rowToSermonVerse(await db.getFirstAsync('SELECT * FROM sermon_verses WHERE id = ?', [id]) as any);
  },

  async removeVerse(verseId: string): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM sermon_verses WHERE id = ?', [verseId]);
  },

  async isVerseInSermon(sermonId: string, bookSlug: string, chapter: number, verse: number): Promise<boolean> {
    const db = getDb();
    const row: any = await db.getFirstAsync(
      'SELECT id FROM sermon_verses WHERE sermon_id = ? AND book_slug = ? AND chapter = ? AND verse = ?',
      [sermonId, bookSlug, chapter, verse],
    );
    return !!row;
  },
};