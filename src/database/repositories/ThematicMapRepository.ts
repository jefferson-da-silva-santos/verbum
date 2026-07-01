/**
 * VERBUM — src/database/repositories/ThematicMapRepository.ts [named params fix]
 */

import { getDb } from "..";
import type {
  ThematicMap,
  ThematicMapVerse,
  ThematicMapWithVerses,
  MapConnectionType,
  StudyNote,
} from "../types";

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
function now(): string {
  return new Date().toISOString();
}

function rowToMap(r: any): ThematicMap {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    description: r.description,
    color: r.color,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
function rowToVerse(r: any): ThematicMapVerse {
  return {
    id: r.id,
    mapId: r.map_id,
    bookSlug: r.book_slug,
    bookName: r.book_name,
    chapter: r.chapter,
    verse: r.verse,
    verseText: r.verse_text,
    connectionType: r.connection_type as MapConnectionType,
    note: r.note,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  };
}
function rowToStudyNote(r: any): StudyNote {
  return {
    id: r.id,
    userId: r.user_id,
    bookSlug: r.book_slug,
    bookName: r.book_name,
    chapter: r.chapter,
    verseStart: r.verse_start,
    verseEnd: r.verse_end,
    passageRef: r.passage_ref,
    context: r.context,
    observation: r.observation,
    interpretation: r.interpretation,
    application: r.application,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const ThematicMapRepository = {
  async create(
    userId: string,
    name: string,
    color: string = "#8B6340",
    description?: string,
  ): Promise<ThematicMap> {
    const db = getDb();
    const id = uuid();
    const ts = now();
    await db.runAsync(
      `INSERT INTO thematic_maps (id,user_id,name,description,color,created_at,updated_at) VALUES ($id,$userId,$name,$description,$color,$ts,$ts)`,
      {
        $id: id,
        $userId: userId,
        $name: name,
        $description: description ?? null,
        $color: color,
        $ts: ts,
      },
    );
    return rowToMap(
      (await db.getFirstAsync(`SELECT * FROM thematic_maps WHERE id = $id`, {
        $id: id,
      })) as any,
    );
  },

  async findAll(userId: string): Promise<ThematicMap[]> {
    const rows = await getDb().getAllAsync(
      `SELECT * FROM thematic_maps WHERE user_id = $userId ORDER BY updated_at DESC`,
      { $userId: userId },
    );
    return rows.map(rowToMap);
  },

  async findWithVerses(mapId: string): Promise<ThematicMapWithVerses | null> {
    const db = getDb();
    const map = (await db.getFirstAsync(
      `SELECT * FROM thematic_maps WHERE id = $id`,
      { $id: mapId },
    )) as any;
    if (!map) return null;
    const verses = await db.getAllAsync(
      `SELECT * FROM thematic_map_verses WHERE map_id = $mapId ORDER BY sort_order ASC`,
      { $mapId: mapId },
    );
    return { ...rowToMap(map), verses: verses.map(rowToVerse) };
  },

  async update(
    id: string,
    data: { name?: string; description?: string | null; color?: string },
  ): Promise<void> {
    const db = getDb();
    const fields: string[] = [];
    const params: Record<string, any> = { $id: id };
    if (data.name !== undefined) {
      fields.push("name = $name");
      params.$name = data.name;
    }
    if (data.description !== undefined) {
      fields.push("description = $description");
      params.$description = data.description;
    }
    if (data.color !== undefined) {
      fields.push("color = $color");
      params.$color = data.color;
    }
    if (!fields.length) return;
    fields.push("updated_at = $updatedAt");
    params.$updatedAt = now();
    await db.runAsync(
      `UPDATE thematic_maps SET ${fields.join(", ")} WHERE id = $id`,
      params,
    );
  },

  async delete(id: string): Promise<void> {
    await getDb().runAsync(`DELETE FROM thematic_maps WHERE id = $id`, {
      $id: id,
    });
  },

  async addVerse(input: {
    mapId: string;
    bookSlug: string;
    bookName: string;
    chapter: number;
    verse: number;
    verseText?: string;
    connectionType?: MapConnectionType;
    note?: string;
  }): Promise<ThematicMapVerse> {
    const db = getDb();
    const id = uuid();
    const ts = now();
    const row: any = await db.getFirstAsync(
      `SELECT COUNT(*) as n FROM thematic_map_verses WHERE map_id = $mapId`,
      { $mapId: input.mapId },
    );
    const sortOrder = row?.n ?? 0;
    await db.runAsync(
      `INSERT INTO thematic_map_verses (id,map_id,book_slug,book_name,chapter,verse,verse_text,connection_type,note,sort_order,created_at)
       VALUES ($id,$mapId,$bookSlug,$bookName,$chapter,$verse,$verseText,$connectionType,$note,$sortOrder,$ts)`,
      {
        $id: id,
        $mapId: input.mapId,
        $bookSlug: input.bookSlug,
        $bookName: input.bookName,
        $chapter: input.chapter,
        $verse: input.verse,
        $verseText: input.verseText ?? null,
        $connectionType: input.connectionType ?? "referencia",
        $note: input.note ?? null,
        $sortOrder: sortOrder,
        $ts: ts,
      },
    );
    await db.runAsync(
      `UPDATE thematic_maps SET updated_at = $ts WHERE id = $id`,
      { $ts: ts, $id: input.mapId },
    );
    return rowToVerse(
      (await db.getFirstAsync(
        `SELECT * FROM thematic_map_verses WHERE id = $id`,
        { $id: id },
      )) as any,
    );
  },

  async updateVerse(
    verseId: string,
    data: { connectionType?: MapConnectionType; note?: string | null },
  ): Promise<void> {
    const db = getDb();
    const fields: string[] = [];
    const params: Record<string, any> = { $id: verseId };
    if (data.connectionType !== undefined) {
      fields.push("connection_type = $connectionType");
      params.$connectionType = data.connectionType;
    }
    if (data.note !== undefined) {
      fields.push("note = $note");
      params.$note = data.note;
    }
    if (!fields.length) return;
    await db.runAsync(
      `UPDATE thematic_map_verses SET ${fields.join(", ")} WHERE id = $id`,
      params,
    );
  },

  async removeVerse(verseId: string): Promise<void> {
    await getDb().runAsync(`DELETE FROM thematic_map_verses WHERE id = $id`, {
      $id: verseId,
    });
  },
};

// ════════════════════════════════════════════════════════════════
// StudyNoteRepository — Exposição Guiada (COIA) [named params fix]
// ════════════════════════════════════════════════════════════════

export const StudyNoteRepository = {
  async upsert(input: {
    userId: string;
    bookSlug: string;
    bookName: string;
    chapter: number;
    verseStart?: number;
    verseEnd?: number;
    passageRef: string;
  }): Promise<StudyNote> {
    const db = getDb();
    const existing: any = await db.getFirstAsync(
      `SELECT * FROM study_notes WHERE user_id = $userId AND book_slug = $bookSlug AND chapter = $chapter`,
      {
        $userId: input.userId,
        $bookSlug: input.bookSlug,
        $chapter: input.chapter,
      },
    );
    if (existing) return rowToStudyNote(existing);
    const id = uuid();
    const ts = now();
    await db.runAsync(
      `INSERT INTO study_notes (id,user_id,book_slug,book_name,chapter,verse_start,verse_end,passage_ref,created_at,updated_at)
       VALUES ($id,$userId,$bookSlug,$bookName,$chapter,$verseStart,$verseEnd,$passageRef,$ts,$ts)`,
      {
        $id: id,
        $userId: input.userId,
        $bookSlug: input.bookSlug,
        $bookName: input.bookName,
        $chapter: input.chapter,
        $verseStart: input.verseStart ?? null,
        $verseEnd: input.verseEnd ?? null,
        $passageRef: input.passageRef,
        $ts: ts,
      },
    );
    return rowToStudyNote(
      (await db.getFirstAsync(`SELECT * FROM study_notes WHERE id = $id`, {
        $id: id,
      })) as any,
    );
  },

  async findAll(userId: string): Promise<StudyNote[]> {
    const rows = await getDb().getAllAsync(
      `SELECT * FROM study_notes WHERE user_id = $userId ORDER BY updated_at DESC`,
      { $userId: userId },
    );
    return rows.map(rowToStudyNote);
  },

  async findByChapter(
    userId: string,
    bookSlug: string,
    chapter: number,
  ): Promise<StudyNote | null> {
    const row = await getDb().getFirstAsync(
      `SELECT * FROM study_notes WHERE user_id = $userId AND book_slug = $bookSlug AND chapter = $chapter`,
      { $userId: userId, $bookSlug: bookSlug, $chapter: chapter },
    );
    return row ? rowToStudyNote(row as any) : null;
  },

  async update(
    id: string,
    data: {
      context?: string | null;
      observation?: string | null;
      interpretation?: string | null;
      application?: string | null;
    },
  ): Promise<void> {
    const db = getDb();
    const fields: string[] = [];
    const params: Record<string, any> = { $id: id, $updatedAt: now() };
    if (data.context !== undefined) {
      fields.push("context = $context");
      params.$context = data.context;
    }
    if (data.observation !== undefined) {
      fields.push("observation = $observation");
      params.$observation = data.observation;
    }
    if (data.interpretation !== undefined) {
      fields.push("interpretation = $interpretation");
      params.$interpretation = data.interpretation;
    }
    if (data.application !== undefined) {
      fields.push("application = $application");
      params.$application = data.application;
    }
    if (!fields.length) return;
    fields.push("updated_at = $updatedAt");
    await db.runAsync(
      `UPDATE study_notes SET ${fields.join(", ")} WHERE id = $id`,
      params,
    );
  },

  async delete(id: string): Promise<void> {
    await getDb().runAsync(`DELETE FROM study_notes WHERE id = $id`, {
      $id: id,
    });
  },
};
