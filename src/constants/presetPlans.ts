/**
 * VERBUM — Planos de Leitura Pré-definidos
 *
 * Cada plano define um ESCOPO (quais livros ler e em que ordem) e
 * METADADOS de apresentação (nome, descrição, ícone, dificuldade).
 *
 * O PlanCalculator usa o escopo para gerar o cronograma concreto
 * com base no modo de cálculo escolhido pelo usuário (caps/dia,
 * minutos/dia ou prazo final).
 *
 * Os slugs de livros referem-se às chaves em bible.ts (BOOK_MAP).
 */

import {
  BIBLE_BOOKS,
  CHRONOLOGICAL_ORDER,
  BookCategory,
  sumChapters,
  estimatedReadingMinutes,
} from "./bible";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export type PresetPlanId =
  | "full_bible_canonical"
  | "full_bible_chronological"
  | "new_testament"
  | "old_testament"
  | "gospels"
  | "pentateuch"
  | "psalms_proverbs"
  | "pauline_letters"
  | "major_prophets"
  | "minor_prophets"
  | "poetic_books"
  | "historical_ot"
  | "historical_nt";

export type PlanDifficulty = "iniciante" | "moderado" | "avancado" | "intenso";

export interface PresetPlan {
  id: PresetPlanId;
  /** Nome curto exibido nos cards */
  name: string;
  /** Nome completo exibido na tela de detalhes */
  fullName: string;
  /** Descrição do propósito e conteúdo do plano */
  description: string;
  /** Dica motivacional ou contexto espiritual */
  insight: string;
  /** Nome do ícone em MaterialCommunityIcons */
  icon: string;
  /** Slugs dos livros, na ordem de leitura do plano */
  bookSlugs: readonly string[];
  /** Total de capítulos (pré-computado para evitar recalcular) */
  totalChapters: number;
  /**
   * Estimativa de minutos totais a 180 palavras/min.
   * Pré-computado para exibição rápida sem instanciar o engine.
   */
  estimatedTotalMinutes: number;
  /** Referências de caps/dia para planos típicos (30, 90, 180, 365 dias) */
  paceGuide: PaceGuide;
  /** Dificuldade baseada no volume total */
  difficulty: PlanDifficulty;
  /** Se o plano é exibido em destaque na tela de seleção */
  featured: boolean;
  /** Testemunhos ou citações bíblicas relacionadas ao plano (opcional) */
  keyVerses?: readonly string[];
}

export interface PaceGuide {
  /** Caps/dia para ler em ~30 dias */
  days30?: number;
  /** Caps/dia para ler em ~90 dias */
  days90?: number;
  /** Caps/dia para ler em ~180 dias */
  days180?: number;
  /** Caps/dia para ler em ~365 dias */
  days365?: number;
}

// ─────────────────────────────────────────────
// UTILITÁRIO INTERNO
// ─────────────────────────────────────────────

function makePace(totalChapters: number): PaceGuide {
  const ceil = Math.ceil;
  return {
    days30: totalChapters >= 30 ? ceil(totalChapters / 30) : undefined,
    days90: totalChapters >= 90 ? ceil(totalChapters / 90) : undefined,
    days180: totalChapters >= 180 ? ceil(totalChapters / 180) : undefined,
    days365: totalChapters >= 365 ? ceil(totalChapters / 365) : undefined,
  };
}

function slugsByCategory(...categories: BookCategory[]): string[] {
  return BIBLE_BOOKS.filter((b) =>
    (categories as string[]).includes(b.category),
  ).map((b) => b.slug);
}

// ─────────────────────────────────────────────
// ESCOPOS PRÉ-CALCULADOS
// ─────────────────────────────────────────────

const ALL_BOOKS_CANONICAL = BIBLE_BOOKS.map((b) => b.slug);

const ALL_OT_SLUGS = BIBLE_BOOKS.filter((b) => b.testament === "OT").map(
  (b) => b.slug,
);

const ALL_NT_SLUGS = BIBLE_BOOKS.filter((b) => b.testament === "NT").map(
  (b) => b.slug,
);

const GOSPELS_SLUGS = ["mt", "mc", "lc", "jo"] as const;
const PENTATEUCH_SLUGS = ["gn", "ex", "lv", "nm", "dt"] as const;
const PSALMS_PROV_SLUGS = ["sl", "pv"] as const;

const PAULINE_SLUGS = BIBLE_BOOKS.filter((b) => b.category === "pauline").map(
  (b) => b.slug,
);

const MAJOR_PROPHETS_SLUGS = ["is", "jr", "lm", "ez", "dn"] as const;

const MINOR_PROPHETS_SLUGS = BIBLE_BOOKS.filter(
  (b) => b.category === "minor_prophets",
).map((b) => b.slug);

const POETIC_SLUGS = BIBLE_BOOKS.filter((b) => b.category === "poetic").map(
  (b) => b.slug,
);

const HISTORICAL_OT_SLUGS = BIBLE_BOOKS.filter(
  (b) => b.category === "historical_ot",
).map((b) => b.slug);

// ─────────────────────────────────────────────
// CATÁLOGO DE PLANOS
// ─────────────────────────────────────────────

export const PRESET_PLANS: readonly PresetPlan[] = [
  // ════════════════════════════════════════════
  // BÍBLIA COMPLETA — ORDEM CANÔNICA
  // ════════════════════════════════════════════
  {
    id: "full_bible_canonical",
    name: "Bíblia em 1 Ano",
    fullName: "Bíblia Completa — Ordem Canônica",
    description:
      "Leitura integral da Bíblia seguindo a ordem dos livros como aparecem no cânon, " +
      "do Gênesis ao Apocalipse.",
    insight:
      "O plano mais tradicional. Ideal para quem deseja conhecer o fluxo completo " +
      "da narrativa bíblica na sequência estabelecida pela tradição cristã.",
    icon: "book-open-variant",
    bookSlugs: ALL_BOOKS_CANONICAL,
    totalChapters: sumChapters(ALL_BOOKS_CANONICAL),
    estimatedTotalMinutes: Math.round(
      estimatedReadingMinutes(ALL_BOOKS_CANONICAL),
    ),
    paceGuide: makePace(sumChapters(ALL_BOOKS_CANONICAL)),
    difficulty: "moderado",
    featured: true,
    keyVerses: ["2Tm 3:16-17", "Sl 119:105"],
  },

  // ════════════════════════════════════════════
  // BÍBLIA COMPLETA — ORDEM CRONOLÓGICA
  // ════════════════════════════════════════════
  {
    id: "full_bible_chronological",
    name: "Ordem Cronológica",
    fullName: "Bíblia Completa — Ordem Cronológica",
    description:
      "Leitura integral dos 66 livros reorganizados aproximadamente pela sequência " +
      "histórica dos eventos narrados, do período patriarcal ao Apocalipse.",
    insight:
      "Ideal para quem deseja compreender a história da redenção como uma narrativa " +
      "contínua. Jó, por exemplo, é lido logo após Gênesis, onde se encaixa historicamente.",
    icon: "timeline-clock-outline",
    bookSlugs: CHRONOLOGICAL_ORDER,
    totalChapters: sumChapters(CHRONOLOGICAL_ORDER),
    estimatedTotalMinutes: Math.round(
      estimatedReadingMinutes(CHRONOLOGICAL_ORDER),
    ),
    paceGuide: makePace(sumChapters(CHRONOLOGICAL_ORDER)),
    difficulty: "moderado",
    featured: true,
    keyVerses: ["Hb 1:1-2"],
  },

  // ════════════════════════════════════════════
  // NOVO TESTAMENTO
  // ════════════════════════════════════════════
  {
    id: "new_testament",
    name: "Novo Testamento",
    fullName: "Novo Testamento Completo",
    description:
      "Os 27 livros do Novo Testamento: Evangelhos, Atos, Cartas Paulinas, " +
      "Cartas Gerais e Apocalipse.",
    insight:
      "Ótimo ponto de entrada para novos leitores ou para aprofundar a compreensão " +
      "da vida de Cristo e da Igreja primitiva.",
    icon: "cross",
    bookSlugs: ALL_NT_SLUGS,
    totalChapters: sumChapters(ALL_NT_SLUGS),
    estimatedTotalMinutes: Math.round(estimatedReadingMinutes(ALL_NT_SLUGS)),
    paceGuide: makePace(sumChapters(ALL_NT_SLUGS)),
    difficulty: "iniciante",
    featured: true,
    keyVerses: ["Jo 20:31", "Rm 1:16"],
  },

  // ════════════════════════════════════════════
  // ANTIGO TESTAMENTO
  // ════════════════════════════════════════════
  {
    id: "old_testament",
    name: "Antigo Testamento",
    fullName: "Antigo Testamento Completo",
    description:
      "Os 39 livros do Antigo Testamento: Pentateuco, Históricos, Poéticos, " +
      "Profetas Maiores e Profetas Menores.",
    insight:
      "A base teológica do pensamento cristão. Compreender o AT é fundamental " +
      "para interpretar o NT com profundidade.",
    icon: "scroll",
    bookSlugs: ALL_OT_SLUGS,
    totalChapters: sumChapters(ALL_OT_SLUGS),
    estimatedTotalMinutes: Math.round(estimatedReadingMinutes(ALL_OT_SLUGS)),
    paceGuide: makePace(sumChapters(ALL_OT_SLUGS)),
    difficulty: "avancado",
    featured: false,
    keyVerses: ["Lc 24:27", "Rm 15:4"],
  },

  // ════════════════════════════════════════════
  // EVANGELHOS
  // ════════════════════════════════════════════
  {
    id: "gospels",
    name: "Evangelhos",
    fullName: "Os Quatro Evangelhos",
    description:
      "Mateus, Marcos, Lucas e João — as quatro perspectivas inspiradas sobre " +
      "a vida, ministério, morte e ressurreição de Jesus Cristo.",
    insight:
      "Perfeito como primeiro plano ou como retorno anual à vida de Cristo. " +
      "Os Evangelhos são o coração do cânon neotestamentário.",
    icon: "fish",
    bookSlugs: GOSPELS_SLUGS,
    totalChapters: sumChapters(GOSPELS_SLUGS),
    estimatedTotalMinutes: Math.round(estimatedReadingMinutes(GOSPELS_SLUGS)),
    paceGuide: makePace(sumChapters(GOSPELS_SLUGS)),
    difficulty: "iniciante",
    featured: true,
    keyVerses: ["Jo 3:16", "Mt 28:19-20"],
  },

  // ════════════════════════════════════════════
  // PENTATEUCO
  // ════════════════════════════════════════════
  {
    id: "pentateuch",
    name: "Pentateuco",
    fullName: "O Pentateuco — A Lei de Moisés",
    description:
      "Os cinco primeiros livros da Bíblia: Gênesis, Êxodo, Levítico, Números " +
      "e Deuteronômio. Da criação à entrada na Terra Prometida.",
    insight:
      "O fundamento de toda a teologia bíblica. A compreensão do Pentateuco " +
      "ilumina inúmeras passagens do NT, especialmente em Paulo e Hebreus.",
    icon: "pillar",
    bookSlugs: PENTATEUCH_SLUGS,
    totalChapters: sumChapters(PENTATEUCH_SLUGS),
    estimatedTotalMinutes: Math.round(
      estimatedReadingMinutes(PENTATEUCH_SLUGS),
    ),
    paceGuide: makePace(sumChapters(PENTATEUCH_SLUGS)),
    difficulty: "moderado",
    featured: false,
    keyVerses: ["Gn 1:1", "Dt 6:4-5"],
  },

  // ════════════════════════════════════════════
  // SALMOS E PROVÉRBIOS
  // ════════════════════════════════════════════
  {
    id: "psalms_proverbs",
    name: "Salmos e Provérbios",
    fullName: "Salmos e Provérbios — Poesia e Sabedoria",
    description:
      "Os 150 Salmos e os 31 capítulos de Provérbios. Literatura de louvor, " +
      "lamento, meditação e sabedoria prática.",
    insight:
      "Clássico devocional: ler um Salmo e um capítulo de Provérbios por dia " +
      "conclui este plano em exatamente 5 meses. Alimenta tanto a emoção quanto a razão.",
    icon: "music-note",
    bookSlugs: PSALMS_PROV_SLUGS,
    totalChapters: sumChapters(PSALMS_PROV_SLUGS),
    estimatedTotalMinutes: Math.round(
      estimatedReadingMinutes(PSALMS_PROV_SLUGS),
    ),
    paceGuide: makePace(sumChapters(PSALMS_PROV_SLUGS)),
    difficulty: "iniciante",
    featured: true,
    keyVerses: ["Sl 1:1-3", "Pv 3:5-6"],
  },

  // ════════════════════════════════════════════
  // CARTAS PAULINAS
  // ════════════════════════════════════════════
  {
    id: "pauline_letters",
    name: "Cartas Paulinas",
    fullName: "As 13 Cartas de Paulo",
    description:
      "Romanos, 1 e 2 Coríntios, Gálatas, Efésios, Filipenses, Colossenses, " +
      "1 e 2 Tessalonicenses, 1 e 2 Timóteo, Tito e Filemom.",
    insight:
      "A espinha dorsal da teologia cristã sistemática. Paulo articula graça, " +
      "fé, santificação, igreja e escatologia com profundidade sem paralelo.",
    icon: "feather",
    bookSlugs: PAULINE_SLUGS,
    totalChapters: sumChapters(PAULINE_SLUGS),
    estimatedTotalMinutes: Math.round(estimatedReadingMinutes(PAULINE_SLUGS)),
    paceGuide: makePace(sumChapters(PAULINE_SLUGS)),
    difficulty: "moderado",
    featured: false,
    keyVerses: ["Rm 8:28", "Ef 2:8-9"],
  },

  // ════════════════════════════════════════════
  // PROFETAS MAIORES
  // ════════════════════════════════════════════
  {
    id: "major_prophets",
    name: "Profetas Maiores",
    fullName: "Os Cinco Profetas Maiores",
    description:
      "Isaías, Jeremias, Lamentações, Ezequiel e Daniel. A maior produção " +
      "profética do AT, cobrindo julgamento, exílio e restauração.",
    insight:
      'Isaías é frequentemente chamado de "o NT do AT" por suas profecias ' +
      "messiânicas. Este plano revela o coração de Deus pela sua nação.",
    icon: "account-voice",
    bookSlugs: MAJOR_PROPHETS_SLUGS,
    totalChapters: sumChapters(MAJOR_PROPHETS_SLUGS),
    estimatedTotalMinutes: Math.round(
      estimatedReadingMinutes(MAJOR_PROPHETS_SLUGS),
    ),
    paceGuide: makePace(sumChapters(MAJOR_PROPHETS_SLUGS)),
    difficulty: "avancado",
    featured: false,
    keyVerses: ["Is 53:5", "Jr 29:11"],
  },

  // ════════════════════════════════════════════
  // PROFETAS MENORES
  // ════════════════════════════════════════════
  {
    id: "minor_prophets",
    name: "Profetas Menores",
    fullName: "Os Doze Profetas Menores",
    description:
      "Oseias a Malaquias: doze livros proféticos mais curtos, mas de enorme " +
      "peso teológico e relevância histórica.",
    insight:
      '"Menores" em tamanho, não em importância. Juntos formam o "Dodecaprofeta" ' +
      "e encerram o AT com o chamado ao arrependimento e à esperança messiânica.",
    icon: "bullhorn-outline",
    bookSlugs: MINOR_PROPHETS_SLUGS,
    totalChapters: sumChapters(MINOR_PROPHETS_SLUGS),
    estimatedTotalMinutes: Math.round(
      estimatedReadingMinutes(MINOR_PROPHETS_SLUGS),
    ),
    paceGuide: makePace(sumChapters(MINOR_PROPHETS_SLUGS)),
    difficulty: "moderado",
    featured: false,
    keyVerses: ["Mq 6:8", "Ml 4:2"],
  },

  // ════════════════════════════════════════════
  // LIVROS POÉTICOS
  // ════════════════════════════════════════════
  {
    id: "poetic_books",
    name: "Livros Poéticos",
    fullName: "Literatura Poética e Sapiencial",
    description:
      "Jó, Salmos, Provérbios, Eclesiastes e Cânticos. A sabedoria de Israel " +
      "expressa em forma de poesia, filosofia e amor lírico.",
    insight:
      "Uma das leituras mais ricas da Bíblia. Jó trata do sofrimento, Eclesiastes " +
      "da vaidade, Cânticos do amor — temas eternamente humanos.",
    icon: "book-heart",
    bookSlugs: POETIC_SLUGS,
    totalChapters: sumChapters(POETIC_SLUGS),
    estimatedTotalMinutes: Math.round(estimatedReadingMinutes(POETIC_SLUGS)),
    paceGuide: makePace(sumChapters(POETIC_SLUGS)),
    difficulty: "moderado",
    featured: false,
    keyVerses: ["Jó 19:25", "Sl 23:1", "Ec 12:13"],
  },

  // ════════════════════════════════════════════
  // HISTÓRICOS AT
  // ════════════════════════════════════════════
  {
    id: "historical_ot",
    name: "Históricos do AT",
    fullName: "Livros Históricos do Antigo Testamento",
    description:
      "Josué, Juízes, Rute, 1 e 2 Samuel, 1 e 2 Reis, 1 e 2 Crônicas, " +
      "Esdras, Neemias e Ester — a história do povo de Deus em Canaã.",
    insight:
      "Da conquista de Canaã à restauração pós-exílio, estes livros mostram como " +
      "Deus age na história real das nações e das pessoas comuns.",
    icon: "castle",
    bookSlugs: HISTORICAL_OT_SLUGS,
    totalChapters: sumChapters(HISTORICAL_OT_SLUGS),
    estimatedTotalMinutes: Math.round(
      estimatedReadingMinutes(HISTORICAL_OT_SLUGS),
    ),
    paceGuide: makePace(sumChapters(HISTORICAL_OT_SLUGS)),
    difficulty: "moderado",
    featured: false,
    keyVerses: ["Js 1:9", "Rt 1:16"],
  },

  // ════════════════════════════════════════════
  // HISTÓRICOS NT (Atos)
  // ════════════════════════════════════════════
  {
    id: "historical_nt",
    name: "Atos dos Apóstolos",
    fullName: "Atos dos Apóstolos — A Igreja Primitiva",
    description:
      "O único livro histórico do NT: os primeiros 30 anos da Igreja Cristã, " +
      "do Pentecostes às missões de Paulo em Roma.",
    insight:
      "Leitura rápida e emocionante. Atos revela como o Espírito Santo opera " +
      "através de pessoas comuns para transformar o mundo.",
    icon: "fire",
    bookSlugs: ["at"],
    totalChapters: 28,
    estimatedTotalMinutes: Math.round(estimatedReadingMinutes(["at"])),
    paceGuide: makePace(28),
    difficulty: "iniciante",
    featured: false,
    keyVerses: ["At 1:8", "At 2:42"],
  },
] as const;

// ─────────────────────────────────────────────
// MAPA DE LOOKUP
// ─────────────────────────────────────────────

export const PRESET_PLAN_MAP: Readonly<Record<PresetPlanId, PresetPlan>> =
  Object.fromEntries(PRESET_PLANS.map((p) => [p.id, p])) as Record<
    PresetPlanId,
    PresetPlan
  >;

export const FEATURED_PLANS = PRESET_PLANS.filter((p) => p.featured);

// ─────────────────────────────────────────────
// RÓTULOS DE DIFICULDADE
// ─────────────────────────────────────────────

export const DIFFICULTY_LABELS: Readonly<Record<PlanDifficulty, string>> = {
  iniciante: "Iniciante",
  moderado: "Moderado",
  avancado: "Avançado",
  intenso: "Intenso",
};

export const DIFFICULTY_COLORS: Readonly<Record<PlanDifficulty, string>> = {
  iniciante: "#4A7C59", // sage green
  moderado: "#8B6340", // medium brown
  avancado: "#C4882A", // amber
  intenso: "#8B3A2A", // rust red
};

// ─────────────────────────────────────────────
// FUNÇÕES UTILITÁRIAS
// ─────────────────────────────────────────────

/**
 * Retorna o plano pelo ID. Lança erro se inválido.
 */
export function getPresetPlan(id: PresetPlanId): PresetPlan {
  const plan = PRESET_PLAN_MAP[id];
  if (!plan) throw new Error(`[presetPlans] ID desconhecido: "${id}"`);
  return plan;
}

/**
 * Formata o tempo total de leitura de forma legível.
 * Ex: 3.652 min → "60h 52min" ou "2 dias 12h"
 */
export function formatTotalReadingTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);

  if (hours === 0) return `${mins} min`;
  if (hours < 24) return `${hours}h ${mins > 0 ? `${mins}min` : ""}`.trim();

  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return `${days}d ${remH > 0 ? `${remH}h` : ""}`.trim();
}

/**
 * Retorna a sugestão de caps/dia para atingir um prazo específico em dias.
 * Útil para exibir estimativas rápidas nos cards de plano.
 */
export function suggestedPaceForDays(
  planId: PresetPlanId,
  targetDays: number,
): number {
  const plan = PRESET_PLAN_MAP[planId];
  if (!plan) return 0;
  return Math.ceil(plan.totalChapters / targetDays);
}
