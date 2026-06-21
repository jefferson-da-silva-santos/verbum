/**
 * VERBUM — Database Types
 *
 * Interfaces que espelham fielmente o schema do SQLite.
 * Todas as datas são strings ISO 8601 no banco — conversão
 * para Date é responsabilidade da camada de UI/Engine quando necessário.
 *
 * Convenção de campos booleanos:
 *   SQLite não tem BOOLEAN nativo. Todos os campos booleanos
 *   são INTEGER (0 | 1) no banco e boolean no TypeScript.
 *   A BaseRepository cuida da conversão.
 */

import type {
  ChapterRef,
  BibleVersion,
  NoteType,
  HighlightColor,
} from "../constants";

// ─────────────────────────────────────────────
// ENTIDADES PRINCIPAIS
// ─────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  preferredVersion: BibleVersion;
  /** Minutos por capítulo — calibrado pelo usuário (padrão: 3.7) */
  avgReadingSpeed: number;
  /** Fator de escala da fonte (0.85 | 1.0 | 1.15 | 1.30) */
  fontScale: number;
  /** 'light' | 'dark' | 'system' */
  darkModePreference: string;
  notificationsEnabled: boolean;
  /** Horário de lembrete diário ex: "07:00" — null = sem lembrete */
  reminderTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ReadingPlanMode = "chapters" | "time" | "deadline";

export type ReadingPlanScopeType =
  | "full_bible"
  | "preset"
  | "book"
  | "books"
  | "testament";

export type ScopeData =
  | { type: "full_bible" }
  | { type: "preset"; presetId: string }
  | { type: "book"; bookSlug: string }
  | { type: "books"; bookSlugs: string[] }
  | { type: "testament"; testament: "OT" | "NT" };

export interface ReadingPlan {
  id: string;
  userId: string;
  name: string;
  scopeType: ReadingPlanScopeType;
  scopeData: ScopeData;
  mode: ReadingPlanMode;
  chaptersPerDay: number | null;
  minutesPerDay: number | null;
  targetDate: string | null;
  startDate: string;
  estimatedEndDate: string | null;
  /** Dias da semana para descanso: 0 = domingo, 6 = sábado */
  skipWeekdays: number[];
  totalChapters: number;
  bibleVersion: BibleVersion;
  isActive: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  recalibrationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanScheduleEntry {
  id: string;
  planId: string;
  /** ISO date "2025-01-15" */
  date: string;
  /** false = dia de descanso (skipWeekday) */
  isActive: boolean;
  chapters: ChapterRef[];
  estimatedMinutes: number | null;
  createdAt: string;
}

export interface ChapterProgress {
  id: string;
  planId: string | null;
  userId: string;
  bookSlug: string;
  bookName: string;
  chapterNumber: number;
  /** ISO datetime do momento em que foi marcado como lido */
  readAt: string;
  /** Tempo real de leitura em segundos (do cronômetro interno) */
  readingDurationSeconds: number | null;
  /** Data prevista no plano (para calcular atraso ou adiantamento) */
  scheduleDate: string | null;
  /** true = lido na data prevista ou antes */
  isOnTime: boolean;
  createdAt: string;
}

export interface ReadingSession {
  id: string;
  userId: string;
  planId: string | null;
  bookSlug: string | null;
  chapterNumber: number | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  chaptersRead: number;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  bookSlug: string;
  chapterNumber: number;
  /** null = anotação de capítulo inteiro */
  verseNumber: number | null;
  content: string;
  type: NoteType;
  createdAt: string;
  updatedAt: string;
}

export interface Highlight {
  id: string;
  userId: string;
  bookSlug: string;
  chapterNumber: number;
  verseNumber: number;
  color: HighlightColor;
  tag: string;
  verseText: string;
  bibleVersion: BibleVersion;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  bookSlug: string;
  bookName: string;
  chapterNumber: number;
  verseNumber: number;
  verseText: string;
  bibleVersion: BibleVersion;
  createdAt: string;
}

export type DiaryMood =
  | "gratidao"
  | "oracao"
  | "reflexao"
  | "testemunho"
  | "pedido";

export interface DiaryEntry {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  mood: DiaryMood | null;
  /** ISO date "2025-01-15" */
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AchievementRecord {
  id: string;
  userId: string;
  achievementKey: string;
  unlockedAt: string;
}

export interface ApiCacheEntry {
  cacheKey: string;
  bibleVersion: string;
  bookSlug: string;
  chapterNumber: number;
  /** JSON completo da resposta da BIBLIAAPI */
  data: string;
  cachedAt: string;
  expiresAt: string;
}

// ─────────────────────────────────────────────
// TIPOS DE ENTRADA — CREATE / UPDATE
// Omitem campos gerados automaticamente (id, timestamps)
// ─────────────────────────────────────────────

 export type CreateUserInput = Pick<User, "name" | "email"> &
    Partial<
      Pick<
        User,
        | "avatarUrl"
        | "preferredVersion"
        | "avgReadingSpeed"
        | "fontScale"
        | "darkModePreference"
        | "notificationsEnabled"
        | "reminderTime"
      >
    >;

export type UpdateUserInput = Partial<
  Pick<
    User,
    | "name"
    | "avatarUrl"
    | "preferredVersion"
    | "avgReadingSpeed"
    | "fontScale"
    | "darkModePreference"
    | "notificationsEnabled"
    | "reminderTime"
  >
>;

export type CreatePlanInput = Omit<
  ReadingPlan,
  | "id"
  | "isCompleted"
  | "completedAt"
  | "recalibrationCount"
  | "createdAt"
  | "updatedAt"
>;

export type CreateScheduleEntryInput = Omit<
  PlanScheduleEntry,
  "id" | "createdAt"
>;

export type CreateChapterProgressInput = Omit<
  ChapterProgress,
  "id" | "createdAt"
>;

export type CreateReadingSessionInput = Omit<
  ReadingSession,
  "id" | "endedAt" | "durationSeconds" | "chaptersRead" | "createdAt"
>;

export type CreateNoteInput = Omit<Note, "id" | "createdAt" | "updatedAt">;

export type UpdateNoteInput = Pick<Note, "content" | "type">;

export type CreateHighlightInput = Omit<Highlight, "id" | "createdAt">;

export type CreateFavoriteInput = Omit<Favorite, "id" | "createdAt">;

export type CreateDiaryEntryInput = Omit<
  DiaryEntry,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateDiaryEntryInput = Pick<
  DiaryEntry,
  "title" | "content" | "mood"
>;

// ─────────────────────────────────────────────
// TIPOS DE QUERY / RESULTADO DERIVADO
// ─────────────────────────────────────────────

/** Progresso detalhado de um plano — calculado sob demanda */
export interface PlanProgress {
  planId: string;
  totalChapters: number;
  readChapters: number;
  percentComplete: number;
  /** IDs dos capítulos já lidos neste plano: Set<"gn-1"> */
  readChapterIds: Set<string>;
}

/** Dados brutos para o heatmap de atividade */
export interface HeatmapEntry {
  /** ISO date "2025-01-15" */
  date: string;
  chaptersRead: number;
}

/** Dados de streak vindos do banco */
export interface StreakData {
  /** Datas com pelo menos 1 capítulo lido (mais recente primeiro) */
  readDates: string[];
  lastReadAt: string | null;
}

/** Estatísticas de sessões de leitura */
export interface SessionStats {
  totalSessions: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  totalChaptersRead: number;
}

/**
 * VERBUM — src/database/featureTypes.ts
 *
 * Tipos TypeScript para as features avançadas.
 * Adicionar no arquivo src/database/types.ts existente.
 */

// ─── CADERNO DO PREGADOR ──────────────────────────────────────────────

export type SermonStatus = 'draft' | 'ready' | 'preached';

export interface SermonOutlinePoint {
  id:           string;
  point:        string;
  subpoints?:   string[];
  illustration?: string;
}

export interface Sermon {
  id:               string;
  userId:           string;
  title:            string;
  passageRef:       string | null;
  bookSlug:         string | null;
  chapterStart:     number | null;
  verseStart:       number | null;
  chapterEnd:       number | null;
  verseEnd:         number | null;
  contextNotes:     string | null;
  structureNotes:   string | null;
  exegesisNotes:    string | null;
  outline:          SermonOutlinePoint[] | null;
  applicationNotes: string | null;
  status:           SermonStatus;
  preachedAt:       string | null;
  createdAt:        string;
  updatedAt:        string;
}

export interface SermonVerse {
  id:           string;
  sermonId:     string;
  bookSlug:     string;
  bookName:     string;
  chapter:      number;
  verse:        number;
  verseText:    string | null;
  sectionLabel: string | null;
  sortOrder:    number;
  createdAt:    string;
}

export interface SermonWithVerses extends Sermon {
  verses: SermonVerse[];
}

// ─── MAPA TEMÁTICO ───────────────────────────────────────────────────

export type MapConnectionType =
  | 'tipo'
  | 'profecia'
  | 'cumprimento'
  | 'paralelo'
  | 'referencia'
  | 'contraste';

export interface ThematicMap {
  id:          string;
  userId:      string;
  name:        string;
  description: string | null;
  color:       string;
  createdAt:   string;
  updatedAt:   string;
}

export interface ThematicMapVerse {
  id:             string;
  mapId:          string;
  bookSlug:       string;
  bookName:       string;
  chapter:        number;
  verse:          number;
  verseText:      string | null;
  connectionType: MapConnectionType;
  note:           string | null;
  sortOrder:      number;
  createdAt:      string;
}

export interface ThematicMapWithVerses extends ThematicMap {
  verses: ThematicMapVerse[];
}

// ─── EXPOSIÇÃO GUIADA (COIA) ─────────────────────────────────────────

export interface StudyNote {
  id:             string;
  userId:         string;
  bookSlug:       string;
  bookName:       string;
  chapter:        number;
  verseStart:     number | null;
  verseEnd:       number | null;
  passageRef:     string;
  context:        string | null;
  observation:    string | null;
  interpretation: string | null;
  application:    string | null;
  createdAt:      string;
  updatedAt:      string;
}

// ─── HELPERS ────────────────────────────────────────────────────────

export const MAP_CONNECTION_LABELS: Record<MapConnectionType, string> = {
  tipo:         'Tipo / Prefigura',
  profecia:     'Profecia',
  cumprimento:  'Cumprimento',
  paralelo:     'Paralelo',
  referencia:   'Referência',
  contraste:    'Contraste',
};

export const MAP_CONNECTION_COLORS: Record<MapConnectionType, string> = {
  tipo:         '#8B6340',
  profecia:     '#4A5C8B',
  cumprimento:  '#4A7C59',
  paralelo:     '#7A4A8B',
  referencia:   '#5A8B7A',
  contraste:    '#8B4A4A',
};

export const SERMON_STATUS_LABELS: Record<SermonStatus, string> = {
  draft:    'Rascunho',
  ready:    'Pronto',
  preached: 'Pregado',
};

export const SERMON_STATUS_COLORS: Record<SermonStatus, string> = {
  draft:    '#8B6340',
  ready:    '#4A7C59',
  preached: '#4A5C8B',
};