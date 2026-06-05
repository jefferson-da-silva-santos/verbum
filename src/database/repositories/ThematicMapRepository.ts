/**
 * VERBUM — src/database/repositories/ThematicMapRepository.ts
 */

import { getDb } from '..';
import type { ThematicMap, ThematicMapVerse, ThematicMapWithVerses, MapConnectionType } from '../types';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
function now(): string { return new Date().toISOString(); }

function rowToMap(r: any): ThematicMap {
  return { id: r.id, userId: r.user_id, name: r.name, description: r.description, color: r.color, createdAt: r.created_at, updatedAt: r.updated_at };
}
function rowToVerse(r: any): ThematicMapVerse {
  return { id: r.id, mapId: r.map_id, bookSlug: r.book_slug, bookName: r.book_name, chapter: r.chapter, verse: r.verse, verseText: r.verse_text, connectionType: r.connection_type as MapConnectionType, note: r.note, sortOrder: r.sort_order, createdAt: r.created_at };
}

export const ThematicMapRepository = {
  async create(userId: string, name: string, color: string = '#8B6340', description?: string): Promise<ThematicMap> {
    const db = getDb(); const id = uuid(); const ts = now();
    await db.runAsync('INSERT INTO thematic_maps (id,user_id,name,description,color,created_at,updated_at) VALUES (?,?,?,?,?,?,?)', [id, userId, name, description ?? null, color, ts, ts]);
    return rowToMap(await db.getFirstAsync('SELECT * FROM thematic_maps WHERE id = ?', [id]) as any);
  },

  async findAll(userId: string): Promise<ThematicMap[]> {
    const db = getDb();
    const rows = await db.getAllAsync('SELECT * FROM thematic_maps WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
    return rows.map(rowToMap);
  },

  async findWithVerses(mapId: string): Promise<ThematicMapWithVerses | null> {
    const db = getDb();
    const map = await db.getFirstAsync('SELECT * FROM thematic_maps WHERE id = ?', [mapId]) as any;
    if (!map) return null;
    const verses = await db.getAllAsync('SELECT * FROM thematic_map_verses WHERE map_id = ? ORDER BY sort_order ASC', [mapId]);
    return { ...rowToMap(map), verses: verses.map(rowToVerse) };
  },

  async update(id: string, data: { name?: string; description?: string | null; color?: string }): Promise<void> {
    const db = getDb();
    const fields: string[] = []; const values: any[] = [];
    if (data.name        !== undefined) { fields.push('name = ?');        values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.color       !== undefined) { fields.push('color = ?');       values.push(data.color); }
    if (!fields.length) return;
    fields.push('updated_at = ?'); values.push(now()); values.push(id);
    await db.runAsync(`UPDATE thematic_maps SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id: string): Promise<void> {
    await getDb().runAsync('DELETE FROM thematic_maps WHERE id = ?', [id]);
  },

  async addVerse(input: { mapId: string; bookSlug: string; bookName: string; chapter: number; verse: number; verseText?: string; connectionType?: MapConnectionType; note?: string }): Promise<ThematicMapVerse> {
    const db = getDb(); const id = uuid(); const ts = now();
    const row: any = await db.getFirstAsync('SELECT COUNT(*) as n FROM thematic_map_verses WHERE map_id = ?', [input.mapId]);
    const sortOrder = row?.n ?? 0;
    await db.runAsync(
      'INSERT INTO thematic_map_verses (id,map_id,book_slug,book_name,chapter,verse,verse_text,connection_type,note,sort_order,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [id, input.mapId, input.bookSlug, input.bookName, input.chapter, input.verse, input.verseText ?? null, input.connectionType ?? 'referencia', input.note ?? null, sortOrder, ts],
    );
    await db.runAsync('UPDATE thematic_maps SET updated_at = ? WHERE id = ?', [ts, input.mapId]);
    return rowToVerse(await db.getFirstAsync('SELECT * FROM thematic_map_verses WHERE id = ?', [id]) as any);
  },

  async updateVerse(verseId: string, data: { connectionType?: MapConnectionType; note?: string | null }): Promise<void> {
    const db = getDb();
    const fields: string[] = []; const values: any[] = [];
    if (data.connectionType !== undefined) { fields.push('connection_type = ?'); values.push(data.connectionType); }
    if (data.note           !== undefined) { fields.push('note = ?');            values.push(data.note); }
    if (!fields.length) return;
    values.push(verseId);
    await db.runAsync(`UPDATE thematic_map_verses SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async removeVerse(verseId: string): Promise<void> {
    await getDb().runAsync('DELETE FROM thematic_map_verses WHERE id = ?', [verseId]);
  },
};

// ═══════════════════════════════════════════════════════════════════
// StudyNoteRepository — Exposição Guiada (COIA)
// ═══════════════════════════════════════════════════════════════════

import type { StudyNote } from '../types';

function rowToStudyNote(r: any): StudyNote {
  return { id: r.id, userId: r.user_id, bookSlug: r.book_slug, bookName: r.book_name, chapter: r.chapter, verseStart: r.verse_start, verseEnd: r.verse_end, passageRef: r.passage_ref, context: r.context, observation: r.observation, interpretation: r.interpretation, application: r.application, createdAt: r.created_at, updatedAt: r.updated_at };
}

export const StudyNoteRepository = {
  async upsert(input: { userId: string; bookSlug: string; bookName: string; chapter: number; verseStart?: number; verseEnd?: number; passageRef: string }): Promise<StudyNote> {
    const db = getDb();
    const existing: any = await db.getFirstAsync(
      'SELECT * FROM study_notes WHERE user_id = ? AND book_slug = ? AND chapter = ?',
      [input.userId, input.bookSlug, input.chapter],
    );
    if (existing) return rowToStudyNote(existing);
    const id = uuid(); const ts = now();
    await db.runAsync(
      'INSERT INTO study_notes (id,user_id,book_slug,book_name,chapter,verse_start,verse_end,passage_ref,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id, input.userId, input.bookSlug, input.bookName, input.chapter, input.verseStart ?? null, input.verseEnd ?? null, input.passageRef, ts, ts],
    );
    return rowToStudyNote(await db.getFirstAsync('SELECT * FROM study_notes WHERE id = ?', [id]) as any);
  },

  async findAll(userId: string): Promise<StudyNote[]> {
    const rows = await getDb().getAllAsync('SELECT * FROM study_notes WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
    return rows.map(rowToStudyNote);
  },

  async findByChapter(userId: string, bookSlug: string, chapter: number): Promise<StudyNote | null> {
    const row = await getDb().getFirstAsync('SELECT * FROM study_notes WHERE user_id = ? AND book_slug = ? AND chapter = ?', [userId, bookSlug, chapter]);
    return row ? rowToStudyNote(row as any) : null;
  },

  async update(id: string, data: { context?: string | null; observation?: string | null; interpretation?: string | null; application?: string | null }): Promise<void> {
    const db = getDb();
    const fields: string[] = []; const values: any[] = [];
    if (data.context        !== undefined) { fields.push('context = ?');        values.push(data.context); }
    if (data.observation    !== undefined) { fields.push('observation = ?');    values.push(data.observation); }
    if (data.interpretation !== undefined) { fields.push('interpretation = ?'); values.push(data.interpretation); }
    if (data.application    !== undefined) { fields.push('application = ?');    values.push(data.application); }
    if (!fields.length) return;
    fields.push('updated_at = ?'); values.push(now()); values.push(id);
    await db.runAsync(`UPDATE study_notes SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id: string): Promise<void> {
    await getDb().runAsync('DELETE FROM study_notes WHERE id = ?', [id]);
  },
};