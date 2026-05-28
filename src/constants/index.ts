/**
 * VERBUM — Constants Layer (Barrel Export)
 *
 * Ponto único de entrada para todas as constantes do app.
 * Importe sempre daqui, nunca diretamente dos arquivos internos —
 * isso permite refatorar a estrutura interna sem afetar os consumidores.
 *
 * Uso:
 *   import { BIBLE_BOOKS, PRESET_PLANS, ACHIEVEMENTS, LightTokens } from '@/constants';
 */

// Dados bíblicos e utilitários
export * from './bible';

// Paleta de cores e design tokens
export * from './colors';

// Sistema tipográfico
export * from './typography';

// Planos de leitura pré-definidos
export * from './presetPlans';

// Sistema de conquistas
export * from './achievements';