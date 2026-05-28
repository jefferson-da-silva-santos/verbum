/**
 * VERBUM — Sistema de Conquistas (Achievements)
 *
 * Filosofia: conquistas discretas, não intrusivas. O usuário é notificado
 * de forma suave quando alcança um marco — sem animações barulhentas ou
 * gamificação agressiva que descaracterize a seriedade do estudo bíblico.
 *
 * Estrutura de condições:
 *   O AchievementChecker (engine layer) avalia cada conquista após eventos
 *   relevantes. Cada achievement tem um `condition` que descreve o critério
 *   de forma declarativa — o checker implementa a lógica de avaliação.
 *
 * Categorias:
 *   - reading_volume  → volume total de leitura
 *   - streak          → consistência de dias consecutivos
 *   - books           → livros específicos concluídos
 *   - plan            → conclusão de planos de leitura
 *   - notes           → produção de anotações
 *   - diversity       → variedade de leitura (categorias, testamentos)
 *   - milestone       → marcos especiais (primeiro, centenário, etc.)
 */

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export type AchievementCategory =
  | "reading_volume"
  | "streak"
  | "books"
  | "plan"
  | "notes"
  | "diversity"
  | "milestone";

export type AchievementConditionType =
  | "chapters_read_gte" // total de capítulos lidos >= N
  | "streak_days_gte" // streak atual ou mais alto já alcançado >= N
  | "book_completed" // livro específico 100% lido
  | "books_completed_gte" // N ou mais livros concluídos
  | "testament_completed" // testamento completo (OT ou NT)
  | "bible_completed" // todos os 1189 caps lidos
  | "plan_completed" // pelo menos 1 plano concluído
  | "plans_completed_gte" // N planos concluídos
  | "notes_created_gte" // N anotações criadas
  | "highlights_created_gte" // N destaques criados
  | "categories_read_gte" // N categorias de livros com leitura registrada
  | "first_chapter_read" // primeiro capítulo lido (evento único)
  | "reading_sessions_gte" // N sessões de leitura completadas
  | "diary_entries_gte"; // N entradas no diário espiritual

export interface AchievementCondition {
  type: AchievementConditionType;
  /** Valor numérico alvo (quando aplicável) */
  value?: number;
  /** Slug do livro (para book_completed) */
  bookSlug?: string;
  /** Testamento (para testament_completed) */
  testament?: "OT" | "NT";
}

export interface Achievement {
  /** Identificador único e estável — nunca alterar após publicação */
  key: string;
  /** Título curto exibido no badge e na tela de conquistas */
  title: string;
  /** Descrição completa do que foi alcançado */
  description: string;
  /** Mensagem exibida no momento do desbloqueio (toast/modal) */
  unlockMessage: string;
  /** Categoria para agrupamento na UI */
  category: AchievementCategory;
  /** Nome do ícone em MaterialCommunityIcons */
  icon: string;
  /**
   * Cor do ícone/badge quando desbloqueado.
   * Usa valores da paleta Verbum (não tokens semânticos).
   */
  colorHex: string;
  /** Condição que deve ser satisfeita para desbloquear */
  condition: AchievementCondition;
  /**
   * Se true, esta conquista não aparece na lista pública até ser desbloqueada.
   * Usada para conquistas "surpresa" que não devem ser spoiladas.
   */
  hidden: boolean;
  /** Versículo bíblico relacionado ao tema da conquista (opcional) */
  keyVerse?: string;
  /** Peso de raridade para ordenação (1 = comum, 5 = raríssimo) */
  rarity: 1 | 2 | 3 | 4 | 5;
}

// ─────────────────────────────────────────────
// CATÁLOGO DE CONQUISTAS
// ─────────────────────────────────────────────

export const ACHIEVEMENTS: readonly Achievement[] = [
  // ════════════════════════════════════════════
  // MARCO INICIAL
  // ════════════════════════════════════════════

  {
    key: "first_chapter",
    title: "Primeiro Passo",
    description: "Você leu seu primeiro capítulo.",
    unlockMessage:
      "A jornada de mil capítulos começa com um. Bem-vindo, leitor.",
    category: "milestone",
    icon: "foot-print",
    colorHex: "#C4975A",
    condition: { type: "first_chapter_read" },
    hidden: false,
    keyVerse: "Sl 119:105",
    rarity: 1,
  },

  // ════════════════════════════════════════════
  // VOLUME DE LEITURA
  // ════════════════════════════════════════════

  {
    key: "chapters_10",
    title: "Dez Capítulos",
    description: "Você leu 10 capítulos da Bíblia.",
    unlockMessage: "Dez capítulos — você está construindo um hábito.",
    category: "reading_volume",
    icon: "numeric-10-box-outline",
    colorHex: "#8B6340",
    condition: { type: "chapters_read_gte", value: 10 },
    hidden: false,
    rarity: 1,
  },

  {
    key: "chapters_50",
    title: "Cinquenta Capítulos",
    description: "Você leu 50 capítulos da Bíblia.",
    unlockMessage:
      "Cinquenta capítulos — você já leu mais do que muitos leem em anos.",
    category: "reading_volume",
    icon: "numeric-5-box-multiple-outline",
    colorHex: "#8B6340",
    condition: { type: "chapters_read_gte", value: 50 },
    hidden: false,
    keyVerse: "Tg 1:22",
    rarity: 2,
  },

  {
    key: "chapters_100",
    title: "Centenário",
    description: "Você leu 100 capítulos da Bíblia.",
    unlockMessage: "100 capítulos! Você completou 8,4% da Bíblia.",
    category: "reading_volume",
    icon: "counter",
    colorHex: "#C4975A",
    condition: { type: "chapters_read_gte", value: 100 },
    hidden: false,
    keyVerse: "Fp 3:14",
    rarity: 2,
  },

  {
    key: "chapters_250",
    title: "Duzentos e Cinquenta",
    description: "Você leu 250 capítulos da Bíblia.",
    unlockMessage: "250 capítulos — você passou de 20% da Bíblia. Persevere.",
    category: "reading_volume",
    icon: "book-multiple-outline",
    colorHex: "#8B6340",
    condition: { type: "chapters_read_gte", value: 250 },
    hidden: false,
    rarity: 3,
  },

  {
    key: "chapters_500",
    title: "Quinhentos Capítulos",
    description: "Você leu 500 capítulos da Bíblia.",
    unlockMessage:
      "500 capítulos — quase metade da Bíblia. Uma conquista extraordinária.",
    category: "reading_volume",
    icon: "book-open-page-variant",
    colorHex: "#C4975A",
    condition: { type: "chapters_read_gte", value: 500 },
    hidden: false,
    keyVerse: "Is 40:31",
    rarity: 4,
  },

  {
    key: "chapters_1000",
    title: "Mil Capítulos",
    description: "Você leu 1.000 capítulos da Bíblia.",
    unlockMessage: "Mil capítulos. Você está entre os leitores mais dedicados.",
    category: "reading_volume",
    icon: "crown-outline",
    colorHex: "#C4975A",
    condition: { type: "chapters_read_gte", value: 1000 },
    hidden: false,
    keyVerse: "Dt 8:3",
    rarity: 5,
  },

  {
    key: "chapters_1189",
    title: "A Palavra Completa",
    description: "Você leu todos os 1.189 capítulos da Bíblia.",
    unlockMessage:
      "Você leu a Bíblia inteira. Que esta conquista seja apenas o início de uma nova jornada.",
    category: "milestone",
    icon: "star-circle",
    colorHex: "#C4975A",
    condition: { type: "bible_completed" },
    hidden: false,
    keyVerse: "2Tm 3:16-17",
    rarity: 5,
  },

  // ════════════════════════════════════════════
  // STREAK — CONSISTÊNCIA
  // ════════════════════════════════════════════

  {
    key: "streak_3",
    title: "Trilogia Fiel",
    description: "Você leu por 3 dias consecutivos.",
    unlockMessage: "3 dias seguidos — a consistência começa a se formar.",
    category: "streak",
    icon: "fire",
    colorHex: "#C4882A",
    condition: { type: "streak_days_gte", value: 3 },
    hidden: false,
    rarity: 1,
  },

  {
    key: "streak_7",
    title: "Semana Completa",
    description: "Você leu por 7 dias consecutivos.",
    unlockMessage: "7 dias — uma semana inteira na Palavra. Isso transforma.",
    category: "streak",
    icon: "fire",
    colorHex: "#C4882A",
    condition: { type: "streak_days_gte", value: 7 },
    hidden: false,
    keyVerse: "Js 1:8",
    rarity: 1,
  },

  {
    key: "streak_14",
    title: "Duas Semanas",
    description: "Você leu por 14 dias consecutivos.",
    unlockMessage:
      "Duas semanas sem falhar. O hábito está se tornando parte de você.",
    category: "streak",
    icon: "fire",
    colorHex: "#C4882A",
    condition: { type: "streak_days_gte", value: 14 },
    hidden: false,
    rarity: 2,
  },

  {
    key: "streak_30",
    title: "Mês Fiel",
    description: "Você leu por 30 dias consecutivos.",
    unlockMessage: "30 dias consecutivos. Você comprovou que é possível.",
    category: "streak",
    icon: "fire",
    colorHex: "#C4882A",
    condition: { type: "streak_days_gte", value: 30 },
    hidden: false,
    keyVerse: "Sl 1:2",
    rarity: 3,
  },

  {
    key: "streak_60",
    title: "Dois Meses",
    description: "Você leu por 60 dias consecutivos.",
    unlockMessage: "60 dias — dois meses de disciplina inabalável.",
    category: "streak",
    icon: "fire",
    colorHex: "#8B3A2A",
    condition: { type: "streak_days_gte", value: 60 },
    hidden: false,
    rarity: 4,
  },

  {
    key: "streak_100",
    title: "Centenário Fiel",
    description: "Você leu por 100 dias consecutivos.",
    unlockMessage:
      "100 dias seguidos. Pouquíssimas pessoas chegam aqui. Parabéns.",
    category: "streak",
    icon: "fire",
    colorHex: "#8B3A2A",
    condition: { type: "streak_days_gte", value: 100 },
    hidden: false,
    keyVerse: "Hb 10:36",
    rarity: 5,
  },

  {
    key: "streak_365",
    title: "Um Ano na Palavra",
    description: "Você leu por 365 dias consecutivos.",
    unlockMessage:
      "Um ano inteiro. Esta conquista é raridade absoluta. Honra a Deus.",
    category: "streak",
    icon: "crown",
    colorHex: "#C4975A",
    condition: { type: "streak_days_gte", value: 365 },
    hidden: true,
    keyVerse: "Dt 17:19",
    rarity: 5,
  },

  // ════════════════════════════════════════════
  // LIVROS ESPECÍFICOS
  // ════════════════════════════════════════════

  {
    key: "book_genesis",
    title: "No Princípio",
    description: "Você concluiu o livro de Gênesis.",
    unlockMessage: '"No princípio, Deus criou..." — você leu o começo de tudo.',
    category: "books",
    icon: "earth",
    colorHex: "#4A7C59",
    condition: { type: "book_completed", bookSlug: "gn" },
    hidden: false,
    keyVerse: "Gn 1:1",
    rarity: 1,
  },

  {
    key: "book_psalms",
    title: "O Saltério",
    description: "Você concluiu os 150 Salmos.",
    unlockMessage:
      "150 Salmos. Você passou por cada lamento e cada louvor de Davi.",
    category: "books",
    icon: "music-note-outline",
    colorHex: "#2A5C8B",
    condition: { type: "book_completed", bookSlug: "sl" },
    hidden: false,
    keyVerse: "Sl 150:6",
    rarity: 3,
  },

  {
    key: "book_proverbs",
    title: "Escritos do Sábio",
    description: "Você concluiu o livro de Provérbios.",
    unlockMessage: "31 capítulos de sabedoria. Seu coração foi instruído.",
    category: "books",
    icon: "lightbulb-outline",
    colorHex: "#C4882A",
    condition: { type: "book_completed", bookSlug: "pv" },
    hidden: false,
    keyVerse: "Pv 1:7",
    rarity: 2,
  },

  {
    key: "book_isaiah",
    title: "O Quinto Evangelho",
    description: "Você concluiu o livro de Isaías.",
    unlockMessage:
      "66 capítulos de Isaías — o livro mais citado no NT. Grande conquista.",
    category: "books",
    icon: "account-voice",
    colorHex: "#8B6340",
    condition: { type: "book_completed", bookSlug: "is" },
    hidden: false,
    keyVerse: "Is 53:5",
    rarity: 3,
  },

  {
    key: "book_jeremiah",
    title: "O Profeta Lacrimoso",
    description: "Você concluiu o livro de Jeremias.",
    unlockMessage:
      "Jeremias — o profeta que chorou por seu povo. Você perseverou com ele.",
    category: "books",
    icon: "water-outline",
    colorHex: "#2A5C8B",
    condition: { type: "book_completed", bookSlug: "jr" },
    hidden: false,
    keyVerse: "Jr 29:11",
    rarity: 4,
  },

  {
    key: "book_john",
    title: "O Discípulo Amado",
    description: "Você concluiu o Evangelho de João.",
    unlockMessage:
      '"No princípio era o Verbo" — você concluiu o Evangelho do amor.',
    category: "books",
    icon: "heart-outline",
    colorHex: "#8B3A2A",
    condition: { type: "book_completed", bookSlug: "jo" },
    hidden: false,
    keyVerse: "Jo 3:16",
    rarity: 1,
  },

  {
    key: "book_romans",
    title: "A Grande Epístola",
    description: "Você concluiu a Epístola aos Romanos.",
    unlockMessage:
      "Romanos — a exposição mais sistemática do evangelho. Você a leu por completo.",
    category: "books",
    icon: "pillar",
    colorHex: "#8B6340",
    condition: { type: "book_completed", bookSlug: "rm" },
    hidden: false,
    keyVerse: "Rm 8:28",
    rarity: 2,
  },

  {
    key: "book_revelation",
    title: "A Revelação Final",
    description: "Você concluiu o Apocalipse de João.",
    unlockMessage:
      'Você chegou ao fim — e é um novo começo. "Eis que faço novas todas as coisas."',
    category: "books",
    icon: "star-shooting",
    colorHex: "#C4975A",
    condition: { type: "book_completed", bookSlug: "ap" },
    hidden: false,
    keyVerse: "Ap 22:20",
    rarity: 3,
  },

  {
    key: "book_job",
    title: "Provado como Ouro",
    description: "Você concluiu o livro de Jó.",
    unlockMessage:
      "Jó — 42 capítulos de sofrimento e redenção. Você foi até o fim com ele.",
    category: "books",
    icon: "shield-outline",
    colorHex: "#C4882A",
    condition: { type: "book_completed", bookSlug: "job" },
    hidden: false,
    keyVerse: "Jó 19:25",
    rarity: 3,
  },

  // ════════════════════════════════════════════
  // LIVROS — VOLUME
  // ════════════════════════════════════════════

  {
    key: "books_5",
    title: "Cinco Livros",
    description: "Você concluiu 5 livros da Bíblia.",
    unlockMessage:
      "Cinco livros concluídos. Você está construindo uma biblioteca interior.",
    category: "books",
    icon: "bookshelf",
    colorHex: "#8B6340",
    condition: { type: "books_completed_gte", value: 5 },
    hidden: false,
    rarity: 2,
  },

  {
    key: "books_20",
    title: "Vinte Livros",
    description: "Você concluiu 20 livros da Bíblia.",
    unlockMessage:
      "Vinte livros — quase um terço do cânon. Sua biblioteca interior cresce.",
    category: "books",
    icon: "bookshelf",
    colorHex: "#C4975A",
    condition: { type: "books_completed_gte", value: 20 },
    hidden: false,
    rarity: 4,
  },

  {
    key: "books_66",
    title: "O Cânon Completo",
    description: "Você concluiu todos os 66 livros da Bíblia.",
    unlockMessage: "Todos os 66 livros. A Palavra habitou plenamente em você.",
    category: "milestone",
    icon: "bookshelf",
    colorHex: "#C4975A",
    condition: { type: "books_completed_gte", value: 66 },
    hidden: true,
    keyVerse: "Cl 3:16",
    rarity: 5,
  },

  // ════════════════════════════════════════════
  // TESTAMENTOS
  // ════════════════════════════════════════════

  {
    key: "nt_complete",
    title: "Novo Testamento",
    description: "Você concluiu todos os 260 capítulos do Novo Testamento.",
    unlockMessage:
      "260 capítulos. O evangelho de Cristo habita inteiramente em você.",
    category: "diversity",
    icon: "cross-outline",
    colorHex: "#2A5C8B",
    condition: { type: "testament_completed", testament: "NT" },
    hidden: false,
    keyVerse: "2Tm 3:15",
    rarity: 4,
  },

  {
    key: "ot_complete",
    title: "Antigo Testamento",
    description: "Você concluiu todos os 929 capítulos do Antigo Testamento.",
    unlockMessage:
      "929 capítulos. Você caminhou com Israel através de toda a sua história.",
    category: "diversity",
    icon: "scroll-text",
    colorHex: "#C4882A",
    condition: { type: "testament_completed", testament: "OT" },
    hidden: false,
    keyVerse: "Rm 15:4",
    rarity: 5,
  },

  // ════════════════════════════════════════════
  // PLANOS
  // ════════════════════════════════════════════

  {
    key: "first_plan_complete",
    title: "Plano Cumprido",
    description: "Você concluiu seu primeiro plano de leitura.",
    unlockMessage:
      "Você começou e terminou um plano. Isso é mais do que a maioria faz.",
    category: "plan",
    icon: "check-decagram",
    colorHex: "#4A7C59",
    condition: { type: "plan_completed" },
    hidden: false,
    keyVerse: "Fl 1:6",
    rarity: 3,
  },

  {
    key: "plans_3",
    title: "Três Planos",
    description: "Você concluiu 3 planos de leitura.",
    unlockMessage:
      "Três planos. Você já tem um histórico consistente de leitura.",
    category: "plan",
    icon: "check-decagram-outline",
    colorHex: "#4A7C59",
    condition: { type: "plans_completed_gte", value: 3 },
    hidden: false,
    rarity: 4,
  },

  // ════════════════════════════════════════════
  // ANOTAÇÕES
  // ════════════════════════════════════════════

  {
    key: "first_note",
    title: "Escriba",
    description: "Você criou sua primeira anotação.",
    unlockMessage:
      "Registrar o que você leu é o primeiro passo do verdadeiro estudo.",
    category: "notes",
    icon: "pencil-outline",
    colorHex: "#8B6340",
    condition: { type: "notes_created_gte", value: 1 },
    hidden: false,
    rarity: 1,
  },

  {
    key: "notes_10",
    title: "Caderno Fiel",
    description: "Você criou 10 anotações.",
    unlockMessage:
      "10 anotações. Suas reflexões são um testemunho vivo do seu crescimento.",
    category: "notes",
    icon: "notebook-outline",
    colorHex: "#8B6340",
    condition: { type: "notes_created_gte", value: 10 },
    hidden: false,
    rarity: 2,
  },

  {
    key: "notes_50",
    title: "Diário do Estudioso",
    description: "Você criou 50 anotações.",
    unlockMessage: "50 anotações. Você está registrando uma vida transformada.",
    category: "notes",
    icon: "notebook-multiple",
    colorHex: "#C4975A",
    condition: { type: "notes_created_gte", value: 50 },
    hidden: false,
    keyVerse: "Hc 2:2",
    rarity: 3,
  },

  {
    key: "notes_100",
    title: "O Grande Comentário",
    description: "Você criou 100 anotações.",
    unlockMessage:
      "100 anotações. Você tem material para um comentário bíblico pessoal.",
    category: "notes",
    icon: "book-edit-outline",
    colorHex: "#C4975A",
    condition: { type: "notes_created_gte", value: 100 },
    hidden: false,
    rarity: 4,
  },

  // ════════════════════════════════════════════
  // DESTAQUES
  // ════════════════════════════════════════════

  {
    key: "first_highlight",
    title: "Marcador",
    description: "Você destacou seu primeiro versículo.",
    unlockMessage: "Um versículo marcado é um versículo que entrou no coração.",
    category: "notes",
    icon: "marker",
    colorHex: "#C4882A",
    condition: { type: "highlights_created_gte", value: 1 },
    hidden: false,
    rarity: 1,
  },

  {
    key: "highlights_50",
    title: "Tesouro Sublinhado",
    description: "Você destacou 50 versículos.",
    unlockMessage: "50 versículos em destaque. Seu Verbum está vivo.",
    category: "notes",
    icon: "format-color-highlight",
    colorHex: "#C4882A",
    condition: { type: "highlights_created_gte", value: 50 },
    hidden: false,
    rarity: 3,
  },

  // ════════════════════════════════════════════
  // DIVERSIDADE
  // ════════════════════════════════════════════

  {
    key: "all_categories",
    title: "Explorador da Palavra",
    description:
      "Você leu capítulos de todas as 10 categorias de livros da Bíblia.",
    unlockMessage:
      "Lei, História, Poesia, Profecia, Evangelhos, Epístolas — você tocou em tudo.",
    category: "diversity",
    icon: "compass-outline",
    colorHex: "#4A7C59",
    condition: { type: "categories_read_gte", value: 10 },
    hidden: false,
    keyVerse: "2Tm 3:16",
    rarity: 3,
  },

  // ════════════════════════════════════════════
  // DIÁRIO ESPIRITUAL
  // ════════════════════════════════════════════

  {
    key: "first_diary",
    title: "Diário Aberto",
    description: "Você criou sua primeira entrada no Diário Espiritual.",
    unlockMessage:
      "Escrever para Deus é uma das formas mais íntimas de oração.",
    category: "notes",
    icon: "book-heart-outline",
    colorHex: "#8B3A2A",
    condition: { type: "diary_entries_gte", value: 1 },
    hidden: false,
    rarity: 1,
  },

  {
    key: "diary_30",
    title: "Confissões",
    description: "Você fez 30 entradas no Diário Espiritual.",
    unlockMessage:
      "30 entradas. Como Agostinho, você escreveu sua jornada com Deus.",
    category: "notes",
    icon: "book-lock-open-outline",
    colorHex: "#C4975A",
    condition: { type: "diary_entries_gte", value: 30 },
    hidden: false,
    rarity: 3,
  },

  // ════════════════════════════════════════════
  // SESSÕES DE LEITURA
  // ════════════════════════════════════════════

  {
    key: "sessions_10",
    title: "Presença Regular",
    description: "Você completou 10 sessões de leitura.",
    unlockMessage:
      "10 vezes você abriu a Palavra. A regularidade é a raiz da transformação.",
    category: "milestone",
    icon: "calendar-check-outline",
    colorHex: "#8B6340",
    condition: { type: "reading_sessions_gte", value: 10 },
    hidden: false,
    rarity: 1,
  },

  {
    key: "sessions_100",
    title: "Cem Encontros",
    description: "Você completou 100 sessões de leitura.",
    unlockMessage:
      "100 sessões. Cem vezes você escolheu a Palavra. Isso é graça.",
    category: "milestone",
    icon: "calendar-star",
    colorHex: "#C4975A",
    condition: { type: "reading_sessions_gte", value: 100 },
    hidden: false,
    keyVerse: "Sl 27:4",
    rarity: 4,
  },
] as const;

// ─────────────────────────────────────────────
// MAPAS E AGRUPAMENTOS
// ─────────────────────────────────────────────

export const ACHIEVEMENT_MAP: Readonly<Record<string, Achievement>> =
  Object.fromEntries(ACHIEVEMENTS.map((a) => [a.key, a]));

export const ACHIEVEMENTS_BY_CATEGORY: Readonly<
  Record<AchievementCategory, Achievement[]>
> = {
  reading_volume: ACHIEVEMENTS.filter((a) => a.category === "reading_volume"),
  streak: ACHIEVEMENTS.filter((a) => a.category === "streak"),
  books: ACHIEVEMENTS.filter((a) => a.category === "books"),
  plan: ACHIEVEMENTS.filter((a) => a.category === "plan"),
  notes: ACHIEVEMENTS.filter((a) => a.category === "notes"),
  diversity: ACHIEVEMENTS.filter((a) => a.category === "diversity"),
  milestone: ACHIEVEMENTS.filter((a) => a.category === "milestone"),
};

/** Conquistas públicas (não ocultas) ordenadas por raridade crescente */
export const PUBLIC_ACHIEVEMENTS = ACHIEVEMENTS.filter((a) => !a.hidden).sort(
  (a, b) => a.rarity - b.rarity,
);

// ─────────────────────────────────────────────
// RÓTULOS DE CATEGORIA
// ─────────────────────────────────────────────

export const ACHIEVEMENT_CATEGORY_LABELS: Readonly<
  Record<AchievementCategory, string>
> = {
  reading_volume: "Volume de Leitura",
  streak: "Consistência",
  books: "Livros Concluídos",
  plan: "Planos",
  notes: "Anotações e Destaques",
  diversity: "Diversidade",
  milestone: "Marcos Especiais",
};

export const ACHIEVEMENT_CATEGORY_ICONS: Readonly<
  Record<AchievementCategory, string>
> = {
  reading_volume: "book-open-variant",
  streak: "fire",
  books: "bookshelf",
  plan: "clipboard-check-outline",
  notes: "note-text-outline",
  diversity: "compass-outline",
  milestone: "trophy-outline",
};

// ─────────────────────────────────────────────
// RÓTULOS DE RARIDADE
// ─────────────────────────────────────────────

export const RARITY_LABELS: Readonly<Record<number, string>> = {
  1: "Comum",
  2: "Incomum",
  3: "Raro",
  4: "Épico",
  5: "Lendário",
};

export const RARITY_COLORS: Readonly<Record<number, string>> = {
  1: "#8B6340",
  2: "#4A7C59",
  3: "#2A5C8B",
  4: "#C4882A",
  5: "#C4975A",
};

// ─────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────

/** Retorna a conquista pelo key. Lança erro se inválido. */
export function getAchievement(key: string): Achievement {
  const a = ACHIEVEMENT_MAP[key];
  if (!a) throw new Error(`[achievements] Key desconhecida: "${key}"`);
  return a;
}

/** Filtra conquistas visíveis (não ocultas ou já desbloqueadas). */
export function getVisibleAchievements(
  unlockedKeys: ReadonlySet<string>,
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !a.hidden || unlockedKeys.has(a.key));
}

/** Retorna conquistas desbloqueadas em ordem de raridade decrescente. */
export function getUnlockedAchievements(
  unlockedKeys: ReadonlySet<string>,
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => unlockedKeys.has(a.key)).sort(
    (a, b) => b.rarity - a.rarity,
  );
}

/** Total de conquistas disponíveis publicamente (para exibir "X de Y"). */
export const TOTAL_PUBLIC_ACHIEVEMENTS = PUBLIC_ACHIEVEMENTS.length;
