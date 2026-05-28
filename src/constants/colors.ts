/**
 * VERBUM — Design Tokens: Colors
 *
 * Paleta baseada em marrom/pergaminho para transmitir identidade
 * de livro antigo, espiritualidade e sobriedade cristã conservadora.
 *
 * Estrutura em dois níveis:
 *   1. PRIMITIVE PALETTE — valores brutos de cor (não usar diretamente na UI)
 *   2. SEMANTIC TOKENS  — significado semântico (usar nos componentes)
 *
 * Em componentes React Native, use sempre os tokens semânticos via
 * useTheme() hook, nunca os primitivos diretamente.
 */

import { StyleSheet } from "react-native";

// ─────────────────────────────────────────────
// 1. PALETA PRIMITIVA
// ─────────────────────────────────────────────

export const Palette = {
  // ── Família Brown (paleta principal) ──────
  brown950: "#180C04",
  brown900: "#2C1810",
  brown850: "#3A2214",
  brown800: "#4A2C1A",
  brown750: "#5C3320",
  brown700: "#5C3D1E", // Primary — botões, active states
  brown650: "#6B4828",
  brown600: "#8B6340", // Secondary — ícones, elementos médios
  brown550: "#A07848",
  brown500: "#B88A52",
  brown450: "#C4975A", // Accent / Golden — badges, streak, destaques
  brown400: "#D0A96A",
  brown350: "#DCBC82",
  brown300: "#E6CC9A",
  brown250: "#EDDDB0",

  // ── Família Parchment (backgrounds) ───────
  parchment50: "#FAF6EE", // Background absoluto (modo claro)
  parchment100: "#F7F1E3", // Background geral
  parchment150: "#F3EAD6",
  parchment200: "#EDE0C4", // Superfícies (cards, inputs)
  parchment250: "#E8D9B8",
  parchment300: "#E2D0A8",
  parchment350: "#DBC890",
  parchment400: "#D4B483", // Bordas, divisores
  parchment500: "#C9A070",
  parchment600: "#B08050",

  // ── Família Ink (texto) ───────────────────
  ink950: "#0A0604",
  ink900: "#1A0F08",
  ink800: "#2C1810",
  ink700: "#3D2415",
  ink600: "#533018",
  ink500: "#6B4028",
  ink400: "#8B5538",
  ink300: "#A87050",

  // ── Semânticas independentes ──────────────
  sageGreen: "#4A7C59",
  sageGreenLight: "#DDF0E4",
  sageGreenDark: "#2E5238",

  errorRust: "#8B3A2A",
  errorRustLight: "#FFE4E0",
  errorRustDark: "#5C2018",

  warningAmber: "#C4882A",
  warningAmberLight: "#FFF3CC",
  warningAmberDark: "#8B5A10",

  infoBlue: "#2A5C8B",
  infoBlueLight: "#DDE9F8",
  infoBlueDark: "#1A3C5C",

  // ── Neutros ───────────────────────────────
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",

  // ── Dark Mode primitives ──────────────────
  dark900: "#0E0804",
  dark850: "#1A0F08",
  dark800: "#22120A",
  dark750: "#2A1810",
  dark700: "#341E14",
  dark650: "#3E2418",
  dark600: "#4A2C1E",
  dark550: "#563528",
  dark500: "#624030",
  darkSurface: "#2A1A0E",
  darkBorder: "#4A3020",
  darkText: "#E8D5B0",
  darkTextSub: "#B8956C",
  darkTextMuted: "#8B6840",
} as const;

// ─────────────────────────────────────────────
// 2. TOKENS SEMÂNTICOS — LIGHT MODE
// ─────────────────────────────────────────────

export const LightTokens = {
  // Backgrounds
  bgPrimary: Palette.parchment50, // Tela principal
  bgSecondary: Palette.parchment100, // Seções alternadas
  bgTertiary: Palette.parchment150, // Terceiro nível
  bgCard: Palette.parchment200, // Cards e painéis
  bgInput: Palette.parchment50, // Campo de input
  bgModal: Palette.parchment50, // Fundo de modais
  bgOverlay: "rgba(44, 24, 16, 0.55)", // Overlay sobre conteúdo

  // Texto
  textPrimary: Palette.brown900, // Título, corpo principal
  textSecondary: Palette.brown800, // Subtítulos, labels
  textTertiary: Palette.brown600, // Placeholders, muted
  textOnPrimary: Palette.parchment50, // Texto sobre fundo marrom
  textOnAccent: Palette.brown900, // Texto sobre golden
  textLink: Palette.brown700, // Links e ações textuais
  textDisabled: Palette.brown350, // Elementos desativados
  textVerse: Palette.brown850, // Texto de versículos

  // Bordas e divisores
  borderLight: Palette.parchment400, // Divisores suaves
  borderMedium: Palette.brown300, // Bordas de cards
  borderStrong: Palette.brown450, // Bordas com destaque
  borderFocus: Palette.brown700, // Input em foco

  // Ações primárias
  actionPrimary: Palette.brown700, // Botão primário (fundo)
  actionPrimaryText: Palette.parchment50, // Texto do botão primário
  actionPrimaryHover: Palette.brown800, // Estado hover/pressed
  actionSecondary: Palette.parchment200, // Botão secundário (fundo)
  actionSecondaryText: Palette.brown700, // Texto do botão secundário
  actionGhost: Palette.transparent, // Botão ghost
  actionGhostText: Palette.brown700, // Texto do botão ghost
  actionDestructive: Palette.errorRust, // Ação destrutiva
  actionDestructiveText: Palette.parchment50,

  // Ícones
  iconPrimary: Palette.brown700,
  iconSecondary: Palette.brown600,
  iconMuted: Palette.brown400,
  iconOnDark: Palette.parchment200,

  // Estado / Feedback
  success: Palette.sageGreen,
  successBg: Palette.sageGreenLight,
  successText: Palette.sageGreenDark,
  error: Palette.errorRust,
  errorBg: Palette.errorRustLight,
  errorText: Palette.errorRustDark,
  warning: Palette.warningAmber,
  warningBg: Palette.warningAmberLight,
  warningText: Palette.warningAmberDark,
  info: Palette.infoBlue,
  infoBg: Palette.infoBlueLight,
  infoText: Palette.infoBlueDark,

  // Streak / Gamificação
  streakActive: Palette.brown450,
  streakBg: Palette.warningAmberLight,
  streakText: Palette.warningAmberDark,
  streakIcon: Palette.warningAmber,

  // Progresso
  progressFill: Palette.brown700,
  progressBg: Palette.parchment400,
  progressText: Palette.brown700,

  // Heatmap de atividade (5 níveis de intensidade)
  heatmap0: Palette.parchment200, // Sem leitura
  heatmap1: Palette.brown350, // 1–2 capítulos
  heatmap2: Palette.brown450, // 3–4 capítulos
  heatmap3: Palette.brown600, // 5–7 capítulos
  heatmap4: Palette.brown700, // 8+ capítulos

  // Destaques de versículos (backgrounds)
  highlightYellowBg: "#FFF3CC",
  highlightYellowBorder: Palette.warningAmber,
  highlightRedBg: "#FFE4E0",
  highlightRedBorder: Palette.errorRust,
  highlightBlueBg: "#DDE9F8",
  highlightBlueBorder: Palette.infoBlue,
  highlightGreenBg: Palette.sageGreenLight,
  highlightGreenBorder: Palette.sageGreenDark,

  // Modo Culto (leitura focada)
  cultoBg: Palette.parchment50,
  cultoText: Palette.brown900,
  cultoVerseNum: Palette.brown400,

  // Navegação
  tabBarBg: Palette.parchment50,
  tabBarBorder: Palette.parchment400,
  tabBarActive: Palette.brown700,
  tabBarInactive: Palette.brown400,
  headerBg: Palette.parchment100,
  headerBorder: Palette.parchment400,
  headerText: Palette.brown900,

  // Sombras
  shadow: Palette.brown900,
} as const;

// ─────────────────────────────────────────────
// 3. TOKENS SEMÂNTICOS — DARK MODE
// ─────────────────────────────────────────────

export const DarkTokens = {
  bgPrimary: Palette.dark850,
  bgSecondary: Palette.dark800,
  bgTertiary: Palette.dark750,
  bgCard: Palette.darkSurface,
  bgInput: Palette.dark700,
  bgModal: Palette.dark800,
  bgOverlay: "rgba(10, 6, 4, 0.72)",

  textPrimary: Palette.darkText,
  textSecondary: "#D4B080",
  textTertiary: Palette.darkTextMuted,
  textOnPrimary: Palette.parchment50,
  textOnAccent: Palette.brown900,
  textLink: Palette.brown450,
  textDisabled: Palette.dark500,
  textVerse: "#E0C898",

  borderLight: Palette.dark600,
  borderMedium: Palette.dark550,
  borderStrong: Palette.brown600,
  borderFocus: Palette.brown450,

  actionPrimary: Palette.brown600,
  actionPrimaryText: Palette.parchment50,
  actionPrimaryHover: Palette.brown700,
  actionSecondary: Palette.dark600,
  actionSecondaryText: Palette.darkText,
  actionGhost: Palette.transparent,
  actionGhostText: Palette.brown450,
  actionDestructive: "#A04535",
  actionDestructiveText: Palette.parchment50,

  iconPrimary: Palette.brown450,
  iconSecondary: Palette.brown350,
  iconMuted: Palette.dark500,
  iconOnDark: Palette.parchment200,

  success: "#5EA874",
  successBg: "#1A3826",
  successText: "#8FD4A8",
  error: "#C0583A",
  errorBg: "#3A1810",
  errorText: "#E89080",
  warning: "#D4A040",
  warningBg: "#3A2800",
  warningText: "#EDCA80",
  info: "#4A88C0",
  infoBg: "#0E2840",
  infoText: "#88BEE8",

  streakActive: Palette.brown450,
  streakBg: "#3A2800",
  streakText: "#EDCA80",
  streakIcon: "#D4A040",

  progressFill: Palette.brown450,
  progressBg: Palette.dark600,
  progressText: Palette.brown450,

  heatmap0: Palette.dark700,
  heatmap1: Palette.dark500,
  heatmap2: "#7A5038",
  heatmap3: Palette.brown600,
  heatmap4: Palette.brown500,

  highlightYellowBg: "#3A2800",
  highlightYellowBorder: "#D4A040",
  highlightRedBg: "#3A1810",
  highlightRedBorder: "#C0583A",
  highlightBlueBg: "#0E2840",
  highlightBlueBorder: "#4A88C0",
  highlightGreenBg: "#1A3826",
  highlightGreenBorder: "#5EA874",

  cultoBg: Palette.dark900,
  cultoText: "#E8D5B0",
  cultoVerseNum: Palette.dark500,

  tabBarBg: Palette.dark850,
  tabBarBorder: Palette.dark650,
  tabBarActive: Palette.brown450,
  tabBarInactive: Palette.dark500,
  headerBg: Palette.dark800,
  headerBorder: Palette.dark650,
  headerText: Palette.darkText,

  shadow: Palette.black,
} as const;

// ─────────────────────────────────────────────
// 4. TIPO UNIFICADO DE TOKENS
// ─────────────────────────────────────────────

export type ColorTokens = typeof LightTokens;

// ─────────────────────────────────────────────
// 5. ESTILOS DE SOMBRA
// ─────────────────────────────────────────────

export const Shadows = {
  sm: {
    shadowColor: Palette.brown900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Palette.brown900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: Palette.brown900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: Palette.brown900,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

export const DarkShadows = {
  sm: { ...Shadows.sm, shadowOpacity: 0.3, shadowColor: Palette.black },
  md: { ...Shadows.md, shadowOpacity: 0.4, shadowColor: Palette.black },
  lg: { ...Shadows.lg, shadowOpacity: 0.5, shadowColor: Palette.black },
  xl: { ...Shadows.xl, shadowOpacity: 0.6, shadowColor: Palette.black },
} as const;

// ─────────────────────────────────────────────
// 6. UTILITÁRIOS
// ─────────────────────────────────────────────

/**
 * Retorna a cor do heatmap para N capítulos lidos num dia.
 */
export function getHeatmapColor(
  chaptersRead: number,
  tokens: ColorTokens,
): string {
  if (chaptersRead === 0) return tokens.heatmap0;
  if (chaptersRead <= 2) return tokens.heatmap1;
  if (chaptersRead <= 4) return tokens.heatmap2;
  if (chaptersRead <= 7) return tokens.heatmap3;
  return tokens.heatmap4;
}

/**
 * Converte hex para rgba com opacidade customizada.
 */
export function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
