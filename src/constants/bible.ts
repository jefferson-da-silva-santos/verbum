/**
 * VERBUM — Bible Constants
 *
 * Fonte de verdade estática para toda a lógica de planos, progresso e navegação.
 * Estes dados são imutáveis em runtime — qualquer alteração exige nova versão do app.
 *
 * Contagens de capítulos baseadas no cânon protestante (66 livros).
 * Slugs alinhados ao padrão BIBLIAAPI v2 — verificar endpoint /versions/{v}/books
 * para confirmação dos slugs exatos antes de integrar.
 *
 * Totais auditados:
 *   AT: 39 livros · 929 capítulos
 *   NT: 27 livros · 260 capítulos
 *   Total: 66 livros · 1.189 capítulos
 */

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export type Testament = "OT" | "NT";

export type BookCategory =
  | "pentateuch" // Pentateuco
  | "historical_ot" // Históricos (AT)
  | "poetic" // Poéticos / Sapienciais
  | "major_prophets" // Profetas Maiores
  | "minor_prophets" // Profetas Menores
  | "gospels" // Evangelhos
  | "historical_nt" // Históricos (NT) — Atos
  | "pauline" // Cartas Paulinas
  | "general_epistles" // Cartas Gerais / Católicas
  | "prophetic_nt"; // Profético (NT) — Apocalipse

export type HighlightColor = "yellow" | "red" | "blue" | "green";

export type NoteType = "reflexao" | "interpretacao" | "revelacao" | "aplicacao";

export interface BibleBook {
  /** Slug usado na URL da BIBLIAAPI: /versions/{v}/books/{slug}/... */
  slug: string;
  /** Nome completo em português */
  name: string;
  /** Abreviatura padrão usada em exibição */
  abbr: string;
  /** AT = Antigo Testamento · NT = Novo Testamento */
  testament: Testament;
  /** Grupo canônico/literário do livro */
  category: BookCategory;
  /** Número total de capítulos */
  chapters: number;
  /** Posição na ordem canônica (1–66) */
  order: number;
  /** Número médio estimado de palavras por capítulo (usado no cálculo de tempo) */
  avgWordsPerChapter: number;
}

export interface ChapterRef {
  bookSlug: string;
  bookName: string;
  bookAbbr: string;
  chapterNumber: number;
  /** Chave única e estável para indexação: "{slug}-{chapter}" */
  chapterId: string;
}

// ─────────────────────────────────────────────
// OS 66 LIVROS
// ─────────────────────────────────────────────

export const BIBLE_BOOKS: readonly BibleBook[] = [
  // ════════════════════════════════════════════
  // ANTIGO TESTAMENTO — 39 livros · 929 capítulos
  // ════════════════════════════════════════════

  // PENTATEUCO (5 livros · 187 capítulos)
  {
    slug: "gn",
    name: "Gênesis",
    abbr: "Gn",
    testament: "OT",
    category: "pentateuch",
    chapters: 50,
    order: 1,
    avgWordsPerChapter: 775,
  },
  {
    slug: "ex",
    name: "Êxodo",
    abbr: "Êx",
    testament: "OT",
    category: "pentateuch",
    chapters: 40,
    order: 2,
    avgWordsPerChapter: 742,
  },
  {
    slug: "lv",
    name: "Levítico",
    abbr: "Lv",
    testament: "OT",
    category: "pentateuch",
    chapters: 27,
    order: 3,
    avgWordsPerChapter: 612,
  },
  {
    slug: "nm",
    name: "Números",
    abbr: "Nm",
    testament: "OT",
    category: "pentateuch",
    chapters: 36,
    order: 4,
    avgWordsPerChapter: 810,
  },
  {
    slug: "dt",
    name: "Deuteronômio",
    abbr: "Dt",
    testament: "OT",
    category: "pentateuch",
    chapters: 34,
    order: 5,
    avgWordsPerChapter: 738,
  },

  // HISTÓRICOS AT (12 livros · 249 capítulos)
  {
    slug: "js",
    name: "Josué",
    abbr: "Js",
    testament: "OT",
    category: "historical_ot",
    chapters: 24,
    order: 6,
    avgWordsPerChapter: 620,
  },
  {
    slug: "jz",
    name: "Juízes",
    abbr: "Jz",
    testament: "OT",
    category: "historical_ot",
    chapters: 21,
    order: 7,
    avgWordsPerChapter: 685,
  },
  {
    slug: "rt",
    name: "Rute",
    abbr: "Rt",
    testament: "OT",
    category: "historical_ot",
    chapters: 4,
    order: 8,
    avgWordsPerChapter: 540,
  },
  {
    slug: "1sm",
    name: "1 Samuel",
    abbr: "1Sm",
    testament: "OT",
    category: "historical_ot",
    chapters: 31,
    order: 9,
    avgWordsPerChapter: 720,
  },
  {
    slug: "2sm",
    name: "2 Samuel",
    abbr: "2Sm",
    testament: "OT",
    category: "historical_ot",
    chapters: 24,
    order: 10,
    avgWordsPerChapter: 698,
  },
  {
    slug: "1rs",
    name: "1 Reis",
    abbr: "1Rs",
    testament: "OT",
    category: "historical_ot",
    chapters: 22,
    order: 11,
    avgWordsPerChapter: 755,
  },
  {
    slug: "2rs",
    name: "2 Reis",
    abbr: "2Rs",
    testament: "OT",
    category: "historical_ot",
    chapters: 25,
    order: 12,
    avgWordsPerChapter: 710,
  },
  {
    slug: "1cr",
    name: "1 Crônicas",
    abbr: "1Cr",
    testament: "OT",
    category: "historical_ot",
    chapters: 29,
    order: 13,
    avgWordsPerChapter: 675,
  },
  {
    slug: "2cr",
    name: "2 Crônicas",
    abbr: "2Cr",
    testament: "OT",
    category: "historical_ot",
    chapters: 36,
    order: 14,
    avgWordsPerChapter: 690,
  },
  {
    slug: "ed",
    name: "Esdras",
    abbr: "Ed",
    testament: "OT",
    category: "historical_ot",
    chapters: 10,
    order: 15,
    avgWordsPerChapter: 588,
  },
  {
    slug: "ne",
    name: "Neemias",
    abbr: "Ne",
    testament: "OT",
    category: "historical_ot",
    chapters: 13,
    order: 16,
    avgWordsPerChapter: 642,
  },
  {
    slug: "et",
    name: "Ester",
    abbr: "Et",
    testament: "OT",
    category: "historical_ot",
    chapters: 10,
    order: 17,
    avgWordsPerChapter: 510,
  },

  // POÉTICOS / SAPIENCIAIS (5 livros · 243 capítulos)
  {
    slug: "job",
    name: "Jó",
    abbr: "Jó",
    testament: "OT",
    category: "poetic",
    chapters: 42,
    order: 18,
    avgWordsPerChapter: 590,
  },
  {
    slug: "sl",
    name: "Salmos",
    abbr: "Sl",
    testament: "OT",
    category: "poetic",
    chapters: 150,
    order: 19,
    avgWordsPerChapter: 392,
  },
  {
    slug: "pv",
    name: "Provérbios",
    abbr: "Pv",
    testament: "OT",
    category: "poetic",
    chapters: 31,
    order: 20,
    avgWordsPerChapter: 455,
  },
  {
    slug: "ec",
    name: "Eclesiastes",
    abbr: "Ec",
    testament: "OT",
    category: "poetic",
    chapters: 12,
    order: 21,
    avgWordsPerChapter: 495,
  },
  {
    slug: "ct",
    name: "Cânticos",
    abbr: "Ct",
    testament: "OT",
    category: "poetic",
    chapters: 8,
    order: 22,
    avgWordsPerChapter: 380,
  },

  // PROFETAS MAIORES (5 livros · 183 capítulos)
  {
    slug: "is",
    name: "Isaías",
    abbr: "Is",
    testament: "OT",
    category: "major_prophets",
    chapters: 66,
    order: 23,
    avgWordsPerChapter: 620,
  },
  {
    slug: "jr",
    name: "Jeremias",
    abbr: "Jr",
    testament: "OT",
    category: "major_prophets",
    chapters: 52,
    order: 24,
    avgWordsPerChapter: 685,
  },
  {
    slug: "lm",
    name: "Lamentações",
    abbr: "Lm",
    testament: "OT",
    category: "major_prophets",
    chapters: 5,
    order: 25,
    avgWordsPerChapter: 440,
  },
  {
    slug: "ez",
    name: "Ezequiel",
    abbr: "Ez",
    testament: "OT",
    category: "major_prophets",
    chapters: 48,
    order: 26,
    avgWordsPerChapter: 712,
  },
  {
    slug: "dn",
    name: "Daniel",
    abbr: "Dn",
    testament: "OT",
    category: "major_prophets",
    chapters: 12,
    order: 27,
    avgWordsPerChapter: 598,
  },

  // PROFETAS MENORES (12 livros · 67 capítulos)
  {
    slug: "os",
    name: "Oseias",
    abbr: "Os",
    testament: "OT",
    category: "minor_prophets",
    chapters: 14,
    order: 28,
    avgWordsPerChapter: 470,
  },
  {
    slug: "jl",
    name: "Joel",
    abbr: "Jl",
    testament: "OT",
    category: "minor_prophets",
    chapters: 3,
    order: 29,
    avgWordsPerChapter: 420,
  },
  {
    slug: "am",
    name: "Amós",
    abbr: "Am",
    testament: "OT",
    category: "minor_prophets",
    chapters: 9,
    order: 30,
    avgWordsPerChapter: 490,
  },
  {
    slug: "ob",
    name: "Obadias",
    abbr: "Ob",
    testament: "OT",
    category: "minor_prophets",
    chapters: 1,
    order: 31,
    avgWordsPerChapter: 360,
  },
  {
    slug: "jn",
    name: "Jonas",
    abbr: "Jn",
    testament: "OT",
    category: "minor_prophets",
    chapters: 4,
    order: 32,
    avgWordsPerChapter: 390,
  },
  {
    slug: "mq",
    name: "Miquéias",
    abbr: "Mq",
    testament: "OT",
    category: "minor_prophets",
    chapters: 7,
    order: 33,
    avgWordsPerChapter: 450,
  },
  {
    slug: "na",
    name: "Naum",
    abbr: "Na",
    testament: "OT",
    category: "minor_prophets",
    chapters: 3,
    order: 34,
    avgWordsPerChapter: 410,
  },
  {
    slug: "hc",
    name: "Habacuque",
    abbr: "Hc",
    testament: "OT",
    category: "minor_prophets",
    chapters: 3,
    order: 35,
    avgWordsPerChapter: 400,
  },
  {
    slug: "sf",
    name: "Sofonias",
    abbr: "Sf",
    testament: "OT",
    category: "minor_prophets",
    chapters: 3,
    order: 36,
    avgWordsPerChapter: 415,
  },
  {
    slug: "ag",
    name: "Ageu",
    abbr: "Ag",
    testament: "OT",
    category: "minor_prophets",
    chapters: 2,
    order: 37,
    avgWordsPerChapter: 380,
  },
  {
    slug: "zc",
    name: "Zacarias",
    abbr: "Zc",
    testament: "OT",
    category: "minor_prophets",
    chapters: 14,
    order: 38,
    avgWordsPerChapter: 505,
  },
  {
    slug: "ml",
    name: "Malaquias",
    abbr: "Ml",
    testament: "OT",
    category: "minor_prophets",
    chapters: 4,
    order: 39,
    avgWordsPerChapter: 430,
  },

  // ════════════════════════════════════════════
  // NOVO TESTAMENTO — 27 livros · 260 capítulos
  // ════════════════════════════════════════════

  // EVANGELHOS (4 livros · 89 capítulos)
  {
    slug: "mt",
    name: "Mateus",
    abbr: "Mt",
    testament: "NT",
    category: "gospels",
    chapters: 28,
    order: 40,
    avgWordsPerChapter: 720,
  },
  {
    slug: "mc",
    name: "Marcos",
    abbr: "Mc",
    testament: "NT",
    category: "gospels",
    chapters: 16,
    order: 41,
    avgWordsPerChapter: 665,
  },
  {
    slug: "lc",
    name: "Lucas",
    abbr: "Lc",
    testament: "NT",
    category: "gospels",
    chapters: 24,
    order: 42,
    avgWordsPerChapter: 745,
  },
  {
    slug: "jo",
    name: "João",
    abbr: "Jo",
    testament: "NT",
    category: "gospels",
    chapters: 21,
    order: 43,
    avgWordsPerChapter: 680,
  },

  // HISTÓRICO NT (1 livro · 28 capítulos)
  {
    slug: "at",
    name: "Atos",
    abbr: "At",
    testament: "NT",
    category: "historical_nt",
    chapters: 28,
    order: 44,
    avgWordsPerChapter: 698,
  },

  // CARTAS PAULINAS (13 livros · 87 capítulos)
  {
    slug: "rm",
    name: "Romanos",
    abbr: "Rm",
    testament: "NT",
    category: "pauline",
    chapters: 16,
    order: 45,
    avgWordsPerChapter: 705,
  },
  {
    slug: "1co",
    name: "1 Coríntios",
    abbr: "1Co",
    testament: "NT",
    category: "pauline",
    chapters: 16,
    order: 46,
    avgWordsPerChapter: 682,
  },
  {
    slug: "2co",
    name: "2 Coríntios",
    abbr: "2Co",
    testament: "NT",
    category: "pauline",
    chapters: 13,
    order: 47,
    avgWordsPerChapter: 620,
  },
  {
    slug: "gl",
    name: "Gálatas",
    abbr: "Gl",
    testament: "NT",
    category: "pauline",
    chapters: 6,
    order: 48,
    avgWordsPerChapter: 560,
  },
  {
    slug: "ef",
    name: "Efésios",
    abbr: "Ef",
    testament: "NT",
    category: "pauline",
    chapters: 6,
    order: 49,
    avgWordsPerChapter: 575,
  },
  {
    slug: "fp",
    name: "Filipenses",
    abbr: "Fp",
    testament: "NT",
    category: "pauline",
    chapters: 4,
    order: 50,
    avgWordsPerChapter: 548,
  },
  {
    slug: "cl",
    name: "Colossenses",
    abbr: "Cl",
    testament: "NT",
    category: "pauline",
    chapters: 4,
    order: 51,
    avgWordsPerChapter: 530,
  },
  {
    slug: "1ts",
    name: "1 Tessalonicenses",
    abbr: "1Ts",
    testament: "NT",
    category: "pauline",
    chapters: 5,
    order: 52,
    avgWordsPerChapter: 490,
  },
  {
    slug: "2ts",
    name: "2 Tessalonicenses",
    abbr: "2Ts",
    testament: "NT",
    category: "pauline",
    chapters: 3,
    order: 53,
    avgWordsPerChapter: 460,
  },
  {
    slug: "1tm",
    name: "1 Timóteo",
    abbr: "1Tm",
    testament: "NT",
    category: "pauline",
    chapters: 6,
    order: 54,
    avgWordsPerChapter: 510,
  },
  {
    slug: "2tm",
    name: "2 Timóteo",
    abbr: "2Tm",
    testament: "NT",
    category: "pauline",
    chapters: 4,
    order: 55,
    avgWordsPerChapter: 485,
  },
  {
    slug: "tt",
    name: "Tito",
    abbr: "Tt",
    testament: "NT",
    category: "pauline",
    chapters: 3,
    order: 56,
    avgWordsPerChapter: 450,
  },
  {
    slug: "fm",
    name: "Filemom",
    abbr: "Fm",
    testament: "NT",
    category: "pauline",
    chapters: 1,
    order: 57,
    avgWordsPerChapter: 335,
  },

  // CARTAS GERAIS / CATÓLICAS (8 livros · 34 capítulos)
  {
    slug: "hb",
    name: "Hebreus",
    abbr: "Hb",
    testament: "NT",
    category: "general_epistles",
    chapters: 13,
    order: 58,
    avgWordsPerChapter: 628,
  },
  {
    slug: "tg",
    name: "Tiago",
    abbr: "Tg",
    testament: "NT",
    category: "general_epistles",
    chapters: 5,
    order: 59,
    avgWordsPerChapter: 545,
  },
  {
    slug: "1pe",
    name: "1 Pedro",
    abbr: "1Pe",
    testament: "NT",
    category: "general_epistles",
    chapters: 5,
    order: 60,
    avgWordsPerChapter: 520,
  },
  {
    slug: "2pe",
    name: "2 Pedro",
    abbr: "2Pe",
    testament: "NT",
    category: "general_epistles",
    chapters: 3,
    order: 61,
    avgWordsPerChapter: 498,
  },
  {
    slug: "1jo",
    name: "1 João",
    abbr: "1Jo",
    testament: "NT",
    category: "general_epistles",
    chapters: 5,
    order: 62,
    avgWordsPerChapter: 470,
  },
  {
    slug: "2jo",
    name: "2 João",
    abbr: "2Jo",
    testament: "NT",
    category: "general_epistles",
    chapters: 1,
    order: 63,
    avgWordsPerChapter: 295,
  },
  {
    slug: "3jo",
    name: "3 João",
    abbr: "3Jo",
    testament: "NT",
    category: "general_epistles",
    chapters: 1,
    order: 64,
    avgWordsPerChapter: 285,
  },
  {
    slug: "jd",
    name: "Judas",
    abbr: "Jd",
    testament: "NT",
    category: "general_epistles",
    chapters: 1,
    order: 65,
    avgWordsPerChapter: 340,
  },

  // PROFÉTICO NT (1 livro · 22 capítulos)
  {
    slug: "ap",
    name: "Apocalipse",
    abbr: "Ap",
    testament: "NT",
    category: "prophetic_nt",
    chapters: 22,
    order: 66,
    avgWordsPerChapter: 688,
  },
] as const;

// ─────────────────────────────────────────────
// TOTAIS AUDITADOS
// ─────────────────────────────────────────────

export const BIBLE_TOTALS = {
  books: 66,
  booksOT: 39,
  booksNT: 27,
  chapters: 1189,
  chaptersOT: 929,
  chaptersNT: 260,
} as const;

/** Minutos médios por capítulo para leitura contemplativa (~180 palavras/min) */
export const DEFAULT_MINUTES_PER_CHAPTER = 3.7;

/** Mínimo de minutos diários que o sistema aceita para gerar um plano */
export const MIN_MINUTES_PER_DAY = 2;

/** Máximo de capítulos/dia antes de emitir aviso de meta agressiva */
export const AGGRESSIVE_CHAPTERS_THRESHOLD = 10;

/** Máximo absoluto de capítulos/dia — acima disso o plano é rejeitado */
export const MAX_CHAPTERS_PER_DAY = 50;

// ─────────────────────────────────────────────
// MAPA DE LOOKUP — O(1) por slug
// ─────────────────────────────────────────────

/** Acesso direto por slug: BOOK_MAP['jo'] → BibleBook (João) */
export const BOOK_MAP: Readonly<Record<string, BibleBook>> = Object.fromEntries(
  BIBLE_BOOKS.map((book) => [book.slug, book]),
);

/** Acesso por ordem canônica: BOOK_BY_ORDER[1] → BibleBook (Gênesis) */
export const BOOK_BY_ORDER: Readonly<Record<number, BibleBook>> =
  Object.fromEntries(BIBLE_BOOKS.map((book) => [book.order, book]));

// ─────────────────────────────────────────────
// AGRUPAMENTOS PRÉ-COMPUTADOS
// ─────────────────────────────────────────────

export const OT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === "OT");
export const NT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === "NT");

export const BOOKS_BY_CATEGORY: Readonly<
  Record<BookCategory, readonly BibleBook[]>
> = {
  pentateuch: BIBLE_BOOKS.filter((b) => b.category === "pentateuch"),
  historical_ot: BIBLE_BOOKS.filter((b) => b.category === "historical_ot"),
  poetic: BIBLE_BOOKS.filter((b) => b.category === "poetic"),
  major_prophets: BIBLE_BOOKS.filter((b) => b.category === "major_prophets"),
  minor_prophets: BIBLE_BOOKS.filter((b) => b.category === "minor_prophets"),
  gospels: BIBLE_BOOKS.filter((b) => b.category === "gospels"),
  historical_nt: BIBLE_BOOKS.filter((b) => b.category === "historical_nt"),
  pauline: BIBLE_BOOKS.filter((b) => b.category === "pauline"),
  general_epistles: BIBLE_BOOKS.filter(
    (b) => b.category === "general_epistles",
  ),
  prophetic_nt: BIBLE_BOOKS.filter((b) => b.category === "prophetic_nt"),
};

/** Rótulos legíveis para exibição na UI */
export const CATEGORY_LABELS: Readonly<Record<BookCategory, string>> = {
  pentateuch: "Pentateuco",
  historical_ot: "Históricos",
  poetic: "Poéticos",
  major_prophets: "Profetas Maiores",
  minor_prophets: "Profetas Menores",
  gospels: "Evangelhos",
  historical_nt: "Atos dos Apóstolos",
  pauline: "Cartas Paulinas",
  general_epistles: "Cartas Gerais",
  prophetic_nt: "Profético",
};

// ─────────────────────────────────────────────
// ORDEM CRONOLÓGICA
// Sequência histórico-narrativa para o plano "Ordem Cronológica".
// Baseada no modelo amplamente utilizado de leitura bíblica cronológica.
// A ordem intercala livros conforme o contexto histórico subjacente.
// ─────────────────────────────────────────────

export const CHRONOLOGICAL_ORDER: readonly string[] = [
  // Criação e Patriarcas (~2000 a.C.)
  "gn",
  // Jó é posicionado aqui por ser contemporâneo dos patriarcas
  "job",
  // Saída do Egito e Lei (~1446–1406 a.C.)
  "ex",
  "lv",
  "nm",
  "dt",
  // Conquista e Juízes (~1406–1050 a.C.)
  "js",
  "jz",
  "rt",
  // Monarquia Unida — Saul, Davi, Salomão (~1050–930 a.C.)
  "1sm",
  "2sm",
  "1rs",
  "1cr",
  "2cr",
  // Poesia e Sabedoria (período salomônico)
  "sl",
  "pv",
  "ec",
  "ct",
  // Reino Dividido — Profetas do Norte (~930–722 a.C.)
  "os",
  "am",
  "jl",
  // Profetas de Judá — período assírio
  "jn",
  "mq",
  "is",
  "na",
  "hc",
  "sf",
  // Queda de Judá — período babilônico (~605–539 a.C.)
  "jr",
  "lm",
  "ez",
  "dn",
  // Restauração — período persa (~538–400 a.C.)
  "ag",
  "zc",
  "et",
  "ed",
  "ne",
  "ob",
  "ml",
  // NOVO TESTAMENTO
  // Evangelhos (vida de Jesus ~4 a.C.–30 d.C.)
  "mt",
  "mc",
  "lc",
  "jo",
  // Igreja Primitiva
  "at",
  // Cartas Paulinas — ordem aproximada de escrita
  "1ts",
  "2ts",
  "gl",
  "1co",
  "2co",
  "rm",
  "fp",
  "fm",
  "cl",
  "ef",
  "1tm",
  "tt",
  "2tm",
  // Cartas Gerais
  "tg",
  "hb",
  "1pe",
  "2pe",
  "1jo",
  "2jo",
  "3jo",
  "jd",
  // Apocalipse
  "ap",
] as const;

// ─────────────────────────────────────────────
// SEMÂNTICA DE DESTAQUES (HIGHLIGHTS)
// ─────────────────────────────────────────────

export interface HighlightDefinition {
  color: HighlightColor;
  label: string;
  description: string;
  /** Nome do ícone em MaterialCommunityIcons */
  icon: string;
  /** Hex da cor para renderização no Reader */
  hex: string;
  /** Hex com opacidade para fundo do highlight */
  hexBackground: string;
}

export const HIGHLIGHT_DEFINITIONS: Readonly<
  Record<HighlightColor, HighlightDefinition>
> = {
  yellow: {
    color: "yellow",
    label: "Promessa",
    description: "Promessa divina ou aliança",
    icon: "star-four-points",
    hex: "#C4882A",
    hexBackground: "#FFF3CC",
  },
  red: {
    color: "red",
    label: "Alerta",
    description: "Advertência, julgamento ou exortação",
    icon: "alert-circle",
    hex: "#8B3A2A",
    hexBackground: "#FFE4E0",
  },
  blue: {
    color: "blue",
    label: "Doutrina",
    description: "Ensino teológico ou doutrinário",
    icon: "book-cross",
    hex: "#2A5C8B",
    hexBackground: "#DDE9F8",
  },
  green: {
    color: "green",
    label: "Esperança",
    description: "Restauração, graça ou consolação",
    icon: "leaf",
    hex: "#3A6B47",
    hexBackground: "#DDF0E4",
  },
};

// ─────────────────────────────────────────────
// SEMÂNTICA DE TIPOS DE NOTA
// ─────────────────────────────────────────────

export interface NoteTypeDefinition {
  type: NoteType;
  label: string;
  description: string;
  icon: string;
  colorHex: string;
}

export const NOTE_TYPE_DEFINITIONS: Readonly<
  Record<NoteType, NoteTypeDefinition>
> = {
  reflexao: {
    type: "reflexao",
    label: "Reflexão",
    description: "Pensamento pessoal sobre o texto",
    icon: "thought-bubble-outline",
    colorHex: "#8B6340",
  },
  interpretacao: {
    type: "interpretacao",
    label: "Interpretação",
    description: "Análise exegética ou hermenêutica",
    icon: "magnify",
    colorHex: "#2A5C8B",
  },
  revelacao: {
    type: "revelacao",
    label: "Revelação",
    description: "Insight espiritual ou iluminação",
    icon: "lightbulb-on-outline",
    colorHex: "#C4882A",
  },
  aplicacao: {
    type: "aplicacao",
    label: "Aplicação",
    description: "Como aplicar o texto na vida prática",
    icon: "check-circle-outline",
    colorHex: "#3A6B47",
  },
};

// ─────────────────────────────────────────────
// VERSÕES BÍBLICAS SUPORTADAS
// ─────────────────────────────────────────────

export type BibleVersion = "acf" | "nvi" | "ara" | "naa";

export interface BibleVersionDefinition {
  id: BibleVersion;
  name: string;
  fullName: string;
  year: number;
  description: string;
}

export const BIBLE_VERSIONS: readonly BibleVersionDefinition[] = [
  {
    id: "acf",
    name: "ACF",
    fullName: "Almeida Corrigida Fiel",
    year: 1994,
    description: "Revisão fiel à tradução clássica de João Ferreira de Almeida",
  },
  {
    id: "nvi",
    name: "NVI",
    fullName: "Nova Versão Internacional",
    year: 2001,
    description: "Tradução de linguagem contemporânea e acessível",
  },
  {
    id: "ara",
    name: "ARA",
    fullName: "Almeida Revista e Atualizada",
    year: 1993,
    description: "Revisão da versão clássica com linguagem atualizada",
  },
  {
    id: "naa",
    name: "NAA",
    fullName: "Nova Almeida Atualizada",
    year: 2017,
    description: "Atualização moderna da tradução de Almeida",
  },
] as const;

export const DEFAULT_BIBLE_VERSION: BibleVersion = "acf";

// ─────────────────────────────────────────────
// FUNÇÕES UTILITÁRIAS PURAS
// ─────────────────────────────────────────────

/**
 * Retorna o livro pelo slug. Lança erro se o slug for inválido.
 * Use com slugs conhecidos em tempo de compilação.
 */
export function getBook(slug: string): BibleBook {
  const book = BOOK_MAP[slug];
  if (!book) throw new Error(`[bible] Slug desconhecido: "${slug}"`);
  return book;
}

/**
 * Retorna o livro pelo slug sem lançar erro.
 * Use em contextos dinâmicos (dados do usuário, API response).
 */
export function findBook(slug: string): BibleBook | undefined {
  return BOOK_MAP[slug];
}

/**
 * Calcula o total de capítulos de uma lista de slugs de livros.
 */
export function sumChapters(bookSlugs: readonly string[]): number {
  return bookSlugs.reduce((total, slug) => {
    const book = BOOK_MAP[slug];
    return total + (book?.chapters ?? 0);
  }, 0);
}

/**
 * Calcula o tempo médio estimado de leitura (em minutos) para uma lista de livros.
 * Usa o campo avgWordsPerChapter de cada livro para maior precisão
 * em vez de aplicar o coeficiente global uniformemente.
 *
 * @param bookSlugs Slugs dos livros a calcular
 * @param wordsPerMinute Velocidade do leitor (padrão: 180 palavras/min)
 */
export function estimatedReadingMinutes(
  bookSlugs: readonly string[],
  wordsPerMinute: number = 180,
): number {
  return bookSlugs.reduce((total, slug) => {
    const book = BOOK_MAP[slug];
    if (!book) return total;
    const totalWords = book.chapters * book.avgWordsPerChapter;
    return total + totalWords / wordsPerMinute;
  }, 0);
}

/**
 * Gera a lista ordenada de ChapterRef para um conjunto de livros.
 * A ordem segue a sequência do array bookSlugs (permitindo ordem cronológica
 * ou qualquer sequência personalizada).
 */
export function buildChapterQueue(bookSlugs: readonly string[]): ChapterRef[] {
  const refs: ChapterRef[] = [];

  for (const slug of bookSlugs) {
    const book = BOOK_MAP[slug];
    if (!book) continue;

    for (let ch = 1; ch <= book.chapters; ch++) {
      refs.push({
        bookSlug: book.slug,
        bookName: book.name,
        bookAbbr: book.abbr,
        chapterNumber: ch,
        chapterId: `${book.slug}-${ch}`,
      });
    }
  }

  return refs;
}

/**
 * Calcula a porcentagem de progresso de um conjunto de capítulos lidos
 * em relação ao total de capítulos do escopo.
 *
 * @param readChapterIds Set de chapterId lidos (ex: "gn-1", "jo-3")
 * @param scopeSlugs Slugs dos livros do escopo
 * @returns Número entre 0 e 100 (2 casas decimais)
 */
export function calcProgressPercent(
  readChapterIds: ReadonlySet<string>,
  scopeSlugs: readonly string[],
): number {
  const total = sumChapters(scopeSlugs);
  if (total === 0) return 0;

  let read = 0;
  for (const slug of scopeSlugs) {
    const book = BOOK_MAP[slug];
    if (!book) continue;
    for (let ch = 1; ch <= book.chapters; ch++) {
      if (readChapterIds.has(`${slug}-${ch}`)) read++;
    }
  }

  return Math.min(parseFloat(((read / total) * 100).toFixed(2)), 100);
}

/**
 * Retorna se um livro inteiro foi concluído dado um conjunto de chapterIds lidos.
 */
export function isBookCompleted(
  slug: string,
  readChapterIds: ReadonlySet<string>,
): boolean {
  const book = BOOK_MAP[slug];
  if (!book) return false;

  for (let ch = 1; ch <= book.chapters; ch++) {
    if (!readChapterIds.has(`${slug}-${ch}`)) return false;
  }
  return true;
}

/**
 * Retorna a lista de livros concluídos.
 */
export function getCompletedBooks(
  readChapterIds: ReadonlySet<string>,
): BibleBook[] {
  return BIBLE_BOOKS.filter((book) =>
    isBookCompleted(book.slug, readChapterIds),
  );
}

/**
 * Formata uma referência de capítulo para exibição (ex: "Jo 3").
 */
export function formatChapterRef(slug: string, chapter: number): string {
  const book = BOOK_MAP[slug];
  if (!book) return `${slug} ${chapter}`;
  return `${book.abbr} ${chapter}`;
}

/**
 * Formata uma referência de versículo (ex: "Jo 3:16").
 */
export function formatVerseRef(
  slug: string,
  chapter: number,
  verse: number,
): string {
  const book = BOOK_MAP[slug];
  if (!book) return `${slug} ${chapter}:${verse}`;
  return `${book.abbr} ${chapter}:${verse}`;
}
