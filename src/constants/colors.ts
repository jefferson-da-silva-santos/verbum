/**
 * VERBUM — src/constants/colors.ts  [REDESENHADO]
 *
 * Nova identidade visual:
 *   Light: fundo branco puro, texto escuro, detalhes em violeta/roxo
 *   Dark:  fundo preto puro, texto claro, detalhes em violeta claro/azul
 *
 * Mantém os MESMOS NOMES de tokens para não quebrar nenhum componente.
 * Apenas os VALORES mudam.
 */

// ─── 1. PALETA PRIMITIVA ─────────────────────────────────────────

export const Palette = {
  // ── Violeta / Roxo (acento principal) ──
  violet900: '#2E1065',
  violet800: '#3B0764',  // botões pressionados
  violet700: '#5B21B6',  // ação primária light mode
  violet600: '#7C3AED',
  violet500: '#8B5CF6',  // ação primária dark mode
  violet400: '#A78BFA',
  violet300: '#C4B5FD',
  violet200: '#DDD6FE',
  violet100: '#EDE9FE',
  violet50:  '#F5F3FF',

  // ── Índigo / Azul (acento secundário) ──
  indigo700: '#3730A3',
  indigo600: '#4338CA',
  indigo500: '#6366F1',
  indigo400: '#818CF8',
  indigo300: '#A5B4FC',
  indigo200: '#C7D2FE',
  indigo100: '#E0E7FF',

  // ── Azul elétrico (destaques de cards) ──
  blue700:   '#1D4ED8',
  blue600:   '#2563EB',
  blue500:   '#3B82F6',
  blue400:   '#60A5FA',
  blue300:   '#93C5FD',
  blue100:   '#DBEAFE',

  // ── Rosa / Fúcsia (destaques de cards) ──
  rose600:   '#E11D48',
  rose500:   '#F43F5E',
  rose400:   '#FB7185',
  rose100:   '#FFE4E6',

  // ── Esmeralda (sucesso) ──
  emerald700: '#047857',
  emerald600: '#059669',
  emerald500: '#10B981',
  emerald400: '#34D399',
  emerald100: '#D1FAE5',

  // ── Âmbar (warning) ──
  amber700:  '#B45309',
  amber500:  '#F59E0B',
  amber400:  '#FCD34D',
  amber100:  '#FEF3C7',

  // ── Vermelho (erro) ──
  red700:    '#B91C1C',
  red600:    '#DC2626',
  red500:    '#EF4444',
  red100:    '#FEE2E2',

  // ── Ciano (info) ──
  cyan700:   '#0E7490',
  cyan500:   '#06B6D4',
  cyan300:   '#67E8F9',
  cyan100:   '#CFFAFE',

  // ── Neutros ──
  white:     '#FFFFFF',
  gray50:    '#F9FAFB',
  gray100:   '#F3F4F6',
  gray200:   '#E5E7EB',
  gray300:   '#D1D5DB',
  gray400:   '#9CA3AF',
  gray500:   '#6B7280',
  gray600:   '#4B5563',
  gray700:   '#374151',
  gray800:   '#1F2937',
  gray900:   '#111827',

  black:     '#000000',
  dark50:    '#0A0A0A',
  dark100:   '#111111',
  dark150:   '#161616',
  dark200:   '#1A1A1A',
  dark300:   '#242424',
  dark400:   '#2E2E2E',
  dark500:   '#3A3A3A',
  dark600:   '#484848',
  dark700:   '#585858',

  transparent: 'transparent',
} as const;

// ─── 2. TOKENS — LIGHT MODE (fundo branco + roxo) ────────────────

export const LightTokens = {
  // Backgrounds
  bgPrimary:   Palette.white,        // Tela principal
  bgSecondary: Palette.gray50,       // Seções alternadas
  bgTertiary:  Palette.gray100,      // Terceiro nível
  bgCard:      Palette.gray100,      // Cards e painéis
  bgInput:     Palette.white,        // Campo de input
  bgModal:     Palette.white,        // Fundo de modais
  bgOverlay:   'rgba(0,0,0,0.45)',   // Overlay

  // Texto
  textPrimary:   Palette.gray900,    // Títulos, corpo
  textSecondary: Palette.gray700,    // Subtítulos
  textTertiary:  Palette.gray500,    // Placeholders, muted
  textOnPrimary: Palette.white,      // Texto sobre botão primário
  textOnAccent:  Palette.white,
  textLink:      Palette.violet700,
  textDisabled:  Palette.gray300,
  textVerse:     Palette.gray800,    // Texto de versículos

  // Bordas
  borderLight:  Palette.gray200,
  borderMedium: Palette.gray300,
  borderStrong: Palette.gray400,
  borderFocus:  Palette.violet600,

  // Ações
  actionPrimary:          Palette.violet700,
  actionPrimaryText:      Palette.white,
  actionPrimaryHover:     Palette.violet800,
  actionSecondary:        Palette.violet100,
  actionSecondaryText:    Palette.violet700,
  actionGhost:            Palette.transparent,
  actionGhostText:        Palette.violet700,
  actionDestructive:      Palette.red600,
  actionDestructiveText:  Palette.white,

  // Ícones
  iconPrimary:  Palette.gray800,
  iconSecondary: Palette.gray600,
  iconMuted:    Palette.gray400,
  iconOnDark:   Palette.gray100,

  // Feedback
  success:     Palette.emerald600,
  successBg:   Palette.emerald100,
  successText: Palette.emerald700,
  error:       Palette.red600,
  errorBg:     Palette.red100,
  errorText:   Palette.red700,
  warning:     Palette.amber500,
  warningBg:   Palette.amber100,
  warningText: Palette.amber700,
  info:        Palette.cyan500,
  infoBg:      Palette.cyan100,
  infoText:    Palette.cyan700,

  // Streak
  streakActive: Palette.amber500,
  streakBg:     Palette.amber100,
  streakText:   Palette.amber700,
  streakIcon:   Palette.amber500,

  // Progresso
  progressFill: Palette.violet700,
  progressBg:   Palette.gray200,
  progressText: Palette.violet700,

  // Heatmap (tons de violeta)
  heatmap0: Palette.gray100,     // Sem leitura
  heatmap1: Palette.violet200,   // 1–2 cap
  heatmap2: Palette.violet400,   // 3–4 cap
  heatmap3: Palette.violet600,   // 5–7 cap
  heatmap4: Palette.violet700,   // 8+ cap

  // Destaques de versículos
  highlightYellowBg:     Palette.amber100,
  highlightYellowBorder: Palette.amber500,
  highlightRedBg:        Palette.red100,
  highlightRedBorder:    Palette.red500,
  highlightBlueBg:       Palette.blue100,
  highlightBlueBorder:   Palette.blue500,
  highlightGreenBg:      Palette.emerald100,
  highlightGreenBorder:  Palette.emerald500,

  // Leitor
  cultoBg:       Palette.white,
  cultoText:     Palette.gray900,
  cultoVerseNum: Palette.gray400,

  // Navegação
  tabBarBg:      Palette.white,
  tabBarBorder:  Palette.gray200,
  tabBarActive:  Palette.violet700,
  tabBarInactive: Palette.gray400,
  headerBg:      Palette.white,
  headerBorder:  Palette.gray200,
  headerText:    Palette.gray900,

  // Sombras
  shadow: Palette.black,
} as const;

// ─── 3. TOKENS — DARK MODE (fundo preto + violeta claro) ─────────

export const DarkTokens = {
  // Backgrounds
  bgPrimary:   Palette.black,        // Tela principal
  bgSecondary: Palette.dark50,       // Seções alternadas
  bgTertiary:  Palette.dark100,      // Terceiro nível
  bgCard:      Palette.dark200,      // Cards e painéis
  bgInput:     Palette.dark150,      // Campo de input
  bgModal:     Palette.dark100,      // Fundo de modais
  bgOverlay:   'rgba(0,0,0,0.65)',   // Overlay

  // Texto
  textPrimary:   Palette.white,
  textSecondary: '#E0E0E0',
  textTertiary:  Palette.gray400,
  textOnPrimary: Palette.white,
  textOnAccent:  Palette.white,
  textLink:      Palette.violet400,
  textDisabled:  Palette.dark600,
  textVerse:     '#F0F0F0',

  // Bordas
  borderLight:  Palette.dark300,
  borderMedium: Palette.dark400,
  borderStrong: Palette.dark600,
  borderFocus:  Palette.violet500,

  // Ações
  actionPrimary:         Palette.violet500,
  actionPrimaryText:     Palette.white,
  actionPrimaryHover:    Palette.violet600,
  actionSecondary:       '#2D1B69',      // violeta muito escuro
  actionSecondaryText:   Palette.violet400,
  actionGhost:           Palette.transparent,
  actionGhostText:       Palette.violet400,
  actionDestructive:     Palette.rose500,
  actionDestructiveText: Palette.white,

  // Ícones
  iconPrimary:  '#E5E5E5',
  iconSecondary: Palette.gray400,
  iconMuted:    Palette.dark600,
  iconOnDark:   Palette.gray200,

  // Feedback
  success:     Palette.emerald400,
  successBg:   '#064E3B',
  successText: Palette.emerald400,
  error:       Palette.rose400,
  errorBg:     '#450A0A',
  errorText:   Palette.rose400,
  warning:     Palette.amber400,
  warningBg:   '#451A03',
  warningText: Palette.amber400,
  info:        Palette.cyan300,
  infoBg:      '#083344',
  infoText:    Palette.cyan300,

  // Streak
  streakActive: Palette.amber400,
  streakBg:     '#451A03',
  streakText:   Palette.amber400,
  streakIcon:   Palette.amber400,

  // Progresso
  progressFill: Palette.violet500,
  progressBg:   Palette.dark400,
  progressText: Palette.violet400,

  // Heatmap (tons de violeta no escuro)
  heatmap0: Palette.dark300,
  heatmap1: '#2D1B69',
  heatmap2: '#4C1D95',
  heatmap3: Palette.violet600,
  heatmap4: Palette.violet500,

  // Destaques de versículos
  highlightYellowBg:     '#451A03',
  highlightYellowBorder: Palette.amber400,
  highlightRedBg:        '#450A0A',
  highlightRedBorder:    Palette.rose400,
  highlightBlueBg:       '#1E3A5F',
  highlightBlueBorder:   Palette.blue400,
  highlightGreenBg:      '#064E3B',
  highlightGreenBorder:  Palette.emerald400,

  // Leitor
  cultoBg:       Palette.black,
  cultoText:     '#F0F0F0',
  cultoVerseNum: Palette.dark600,

  // Navegação
  tabBarBg:       Palette.black,
  tabBarBorder:   Palette.dark300,
  tabBarActive:   Palette.violet500,
  tabBarInactive: Palette.dark600,
  headerBg:       Palette.black,
  headerBorder:   Palette.dark300,
  headerText:     Palette.white,

  // Sombras
  shadow: Palette.black,
} as const;

// ─── 4. TIPO UNIFICADO ───────────────────────────────────────────

// Mapeado para string puro para que LightTokens e DarkTokens
// (que têm literals diferentes) sejam ambos atribuíveis ao tipo.
export type ColorTokens = {
  readonly [K in keyof typeof LightTokens]: string;
};

// ─── 5. SOMBRAS ─────────────────────────────────────────────────

export const Shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2,  elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4,  elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 8,  elevation: 6 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 10 },
} as const;

export const DarkShadows = {
  sm: { ...Shadows.sm, shadowOpacity: 0.4 },
  md: { ...Shadows.md, shadowOpacity: 0.5 },
  lg: { ...Shadows.lg, shadowOpacity: 0.6 },
  xl: { ...Shadows.xl, shadowOpacity: 0.7 },
} as const;

// ─── 6. UTILITÁRIOS ──────────────────────────────────────────────

export function getHeatmapColor(chaptersRead: number, tokens: ColorTokens): string {
  if (chaptersRead === 0) return tokens.heatmap0;
  if (chaptersRead <= 2) return tokens.heatmap1;
  if (chaptersRead <= 4) return tokens.heatmap2;
  if (chaptersRead <= 7) return tokens.heatmap3;
  return tokens.heatmap4;
}

export function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Cores de acento para cards — para usar em badges e bordas coloridas.
 * Harmoniosas com o roxo principal.
 */
export const CardAccents = {
  purple: { bg: Palette.violet100, border: Palette.violet400, text: Palette.violet700 },
  blue:   { bg: Palette.blue100,   border: Palette.blue400,   text: Palette.blue700   },
  rose:   { bg: Palette.rose100,   border: Palette.rose400,   text: Palette.rose600   },
  cyan:   { bg: Palette.cyan100,   border: Palette.cyan500,   text: Palette.cyan700   },
  green:  { bg: Palette.emerald100, border: Palette.emerald400, text: Palette.emerald700 },
  amber:  { bg: Palette.amber100,  border: Palette.amber400,  text: Palette.amber700  },
  indigo: { bg: Palette.indigo100, border: Palette.indigo400, text: Palette.indigo700 },
} as const;

export const DarkCardAccents = {
  purple: { bg: '#2D1B69', border: Palette.violet500, text: Palette.violet400 },
  blue:   { bg: '#1E3A5F', border: Palette.blue400,   text: Palette.blue300   },
  rose:   { bg: '#450A0A', border: Palette.rose400,   text: Palette.rose400   },
  cyan:   { bg: '#083344', border: Palette.cyan300,   text: Palette.cyan300   },
  green:  { bg: '#064E3B', border: Palette.emerald400, text: Palette.emerald400 },
  amber:  { bg: '#451A03', border: Palette.amber400,  text: Palette.amber400  },
  indigo: { bg: '#1E1B4B', border: Palette.indigo400, text: Palette.indigo300 },
} as const;