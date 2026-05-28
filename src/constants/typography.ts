/**
 * VERBUM — Design Tokens: Typography
 *
 * Sistema tipográfico de dois níveis:
 *   1. Escala primitiva — valores brutos de tamanho/peso/espaçamento
 *   2. Estilos compostos — TextStyle prontos para uso em componentes
 *
 * Filosofia:
 *   - Corpo e UI: fonte do sistema (San Francisco / Roboto) — legibilidade
 *   - Versículos e títulos nobres: fonte serifada — solenidade e identidade
 *   - Sem decorações desnecessárias, escala de 8 sizes com proporção áurea
 */

import { Platform, TextStyle } from "react-native";

// ─────────────────────────────────────────────
// FAMÍLIAS DE FONTE
// ─────────────────────────────────────────────

export const FontFamily = {
  /**
   * Fonte serifada para versículos, títulos de livros e elementos editoriais.
   * Carregada via expo-font (arquivo local em /assets/fonts/).
   * Fallback: Georgia (iOS) / serif (Android).
   */
  serif: Platform.select({
    ios: "Palatino",
    android: "serif",
    default: "serif",
  }),
  serifMedium: Platform.select({
    ios: "Palatino",
    android: "serif",
    default: "serif",
  }),
  serifBold: Platform.select({
    ios: "Palatino-Bold",
    android: "serif",
    default: "serif",
  }),
  serifItalic: Platform.select({
    ios: "Palatino-Italic",
    android: "serif",
    default: "serif",
  }),

  /**
   * Fonte sem-serifa para UI, labels, botões e elementos interativos.
   * Usa a fonte do sistema para máxima performance e familiaridade.
   */
  sans: Platform.select({
    ios: "System",
    android: "Roboto",
    default: "sans-serif",
  }),
  sansMedium: Platform.select({
    ios: "System",
    android: "Roboto-Medium",
    default: "sans-serif",
  }),
  sansBold: Platform.select({
    ios: "System",
    android: "Roboto-Bold",
    default: "sans-serif",
  }),

  /**
   * Mono para referências bíblicas em contextos técnicos (logs, busca, etc.)
   */
  mono: Platform.select({
    ios: "Courier New",
    android: "monospace",
    default: "monospace",
  }),
} as const;

// ─────────────────────────────────────────────
// ESCALA DE TAMANHO
// Proporção baseada em razão ~1.25 (Major Third)
// ─────────────────────────────────────────────

export const FontSize = {
  /** 11px — metadata, timestamps, badges minúsculos */
  xs: 11,
  /** 13px — legendas, botões pequenos, verse numbers */
  sm: 13,
  /** 15px — corpo de texto, inputs, labels padrão */
  md: 15,
  /** 17px — corpo primário de versículos, itens de lista */
  lg: 17,
  /** 20px — subtítulos, nome de livro na navbar */
  xl: 20,
  /** 24px — títulos de tela, headings de seção */
  "2xl": 24,
  /** 30px — títulos de destaque, número de streak */
  "3xl": 30,
  /** 38px — display, número de progresso em tela cheia */
  "4xl": 38,
} as const;

// ─────────────────────────────────────────────
// PESOS
// ─────────────────────────────────────────────

export const FontWeight = {
  regular: "400" as TextStyle["fontWeight"],
  medium: "500" as TextStyle["fontWeight"],
  semibold: "600" as TextStyle["fontWeight"],
  bold: "700" as TextStyle["fontWeight"],
} as const;

// ─────────────────────────────────────────────
// LINE HEIGHTS
// Seguem razão 1.4–1.8 dependendo do contexto
// ─────────────────────────────────────────────

export const LineHeight = {
  /** Para elementos tight (botões, badges, labels curtos) */
  tight: 1.2,
  /** Para UI padrão (menus, navegação, campos) */
  normal: 1.4,
  /** Para corpo de texto (listas, descrições) */
  relaxed: 1.6,
  /** Para versículos e textos contemplativos */
  loose: 1.85,
} as const;

// ─────────────────────────────────────────────
// LETTER SPACING
// ─────────────────────────────────────────────

export const LetterSpacing = {
  tight: -0.3,
  normal: 0,
  wide: 0.3,
  wider: 0.6,
  /** Para labels uppercase de seção */
  widest: 1.2,
} as const;

// ─────────────────────────────────────────────
// ESTILOS COMPOSTOS — TEXTO SANS-SERIFA (UI)
// ─────────────────────────────────────────────

export const TextStyles = {
  // ── Hierarquia de Títulos ─────────────────

  /** Título principal de tela (ex: "Gênesis", "Meu Progresso") */
  screenTitle: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize["2xl"] * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
  } satisfies TextStyle,

  /** Título de seção dentro de uma tela */
  sectionTitle: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.md * LineHeight.normal,
    letterSpacing: LetterSpacing.widest,
    textTransform: "uppercase",
  } satisfies TextStyle,

  /** Título de card ou item de lista */
  cardTitle: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.lg * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
  } satisfies TextStyle,

  /** Subtítulo / descrição secundária */
  subtitle: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.relaxed,
    letterSpacing: LetterSpacing.normal,
  } satisfies TextStyle,

  // ── Corpo de Texto ────────────────────────

  /** Corpo principal — listas, descrições, anotações */
  body: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.md * LineHeight.relaxed,
    letterSpacing: LetterSpacing.normal,
  } satisfies TextStyle,

  /** Corpo pequeno — metadados, timestamps */
  bodySmall: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
  } satisfies TextStyle,

  // ── Botões ────────────────────────────────

  /** Label de botão tamanho padrão */
  buttonLg: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.md * LineHeight.tight,
    letterSpacing: LetterSpacing.wide,
  } satisfies TextStyle,

  /** Label de botão tamanho pequeno */
  buttonSm: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.tight,
    letterSpacing: LetterSpacing.wide,
  } satisfies TextStyle,

  // ── Labels e UI ───────────────────────────

  /** Label de input ou campo de formulário */
  inputLabel: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
  } satisfies TextStyle,

  /** Placeholder de input */
  inputPlaceholder: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.md * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
  } satisfies TextStyle,

  /** Badge e pill */
  badge: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xs * LineHeight.tight,
    letterSpacing: LetterSpacing.wider,
    textTransform: "uppercase",
  } satisfies TextStyle,

  /** Label da tab bar */
  tabLabel: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xs * LineHeight.tight,
    letterSpacing: LetterSpacing.normal,
  } satisfies TextStyle,

  // ── Números e Métricas ────────────────────

  /** Número de destaque (ex: "47%", "12 dias") */
  metricLarge: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize["3xl"],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize["3xl"] * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
  } satisfies TextStyle,

  /** Número médio (ex: capítulos em cards) */
  metricMedium: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xl * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
  } satisfies TextStyle,

  /** Label de unidade das métricas (ex: "capítulos", "dias") */
  metricUnit: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
  } satisfies TextStyle,
} as const;

// ─────────────────────────────────────────────
// ESTILOS COMPOSTOS — TEXTO SERIFADO (Bíblia)
// ─────────────────────────────────────────────

export const VerseStyles = {
  /**
   * Texto do versículo em modo de leitura normal.
   * Serifado, espaçamento generoso para contemplação.
   */
  verseText: {
    fontFamily: FontFamily.serif,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.lg * LineHeight.loose,
    letterSpacing: LetterSpacing.normal,
  } satisfies TextStyle,

  /**
   * Texto do versículo em modo Culto (tela cheia).
   * Ligeiramente maior para leitura à distância/projeção.
   */
  verseCulto: {
    fontFamily: FontFamily.serif,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.xl * LineHeight.loose,
    letterSpacing: LetterSpacing.normal,
  } satisfies TextStyle,

  /**
   * Número do versículo — sobrescrito discreto.
   */
  verseNumber: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xs * LineHeight.tight,
    letterSpacing: LetterSpacing.wider,
  } satisfies TextStyle,

  /**
   * Título de capítulo (ex: "CAPÍTULO 1").
   */
  chapterTitle: {
    fontFamily: FontFamily.serif,
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize["2xl"] * LineHeight.tight,
    letterSpacing: LetterSpacing.wide,
  } satisfies TextStyle,

  /**
   * Nome do livro na tela de leitura.
   */
  bookName: {
    fontFamily: FontFamily.serifBold,
    fontSize: FontSize["3xl"],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize["3xl"] * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
  } satisfies TextStyle,

  /**
   * Versículo destacado (favorito ou em modo de memória).
   */
  verseFeatured: {
    fontFamily: FontFamily.serifItalic,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.lg * LineHeight.loose,
    letterSpacing: LetterSpacing.normal,
  } satisfies TextStyle,

  /**
   * Referência de versículo (ex: "João 3:16").
   */
  verseReference: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.normal,
    letterSpacing: LetterSpacing.wide,
  } satisfies TextStyle,
} as const;

// ─────────────────────────────────────────────
// CONFIGURAÇÕES DE ACESSIBILIDADE
// ─────────────────────────────────────────────

/**
 * Tamanhos mínimos de fonte por categoria de conteúdo.
 * O usuário pode ajustar o tamanho base e estes são os limites.
 */
export const FontSizeConstraints = {
  verse: { min: 14, max: 28, default: FontSize.lg },
  body: { min: 13, max: 22, default: FontSize.md },
  ui: { min: 11, max: 18, default: FontSize.sm },
} as const;

/**
 * Fator de escala para acessibilidade.
 * Multiplicar o tamanho base pelo fator escolhido pelo usuário.
 */
export const FontScaleFactors = [
  { label: "Pequeno", value: 0.85 },
  { label: "Normal", value: 1.0 },
  { label: "Grande", value: 1.15 },
  { label: "Muito grande", value: 1.3 },
] as const;

export type FontScaleFactor = (typeof FontScaleFactors)[number]["value"];
