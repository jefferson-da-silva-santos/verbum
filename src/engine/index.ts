/**
 * VERBUM — Engine Layer (Barrel Export)
 *
 * Ponto único de entrada para toda a lógica de negócio.
 * Os Hooks e Contexts importam daqui — nunca dos arquivos internos.
 *
 * Uso:
 *   import { PlanCalculator, StreakCalculator, AchievementChecker } from '@/engine';
 */

export * from "./dateHelpers";
export * from "./PlanCalculator";
export * from "./ScheduleGenerator";
export * from "./PlanRecalibrator";
export * from "./StreakCalculator";
export * from "./MetricsCalculator";
export * from "./AchievementChecker";
