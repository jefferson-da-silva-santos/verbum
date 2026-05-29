/**
 * VERBUM — Hooks Layer (Barrel Export)
 *
 * Todos os hooks do app em um único ponto de importação.
 *
 * Uso:
 *   import { useAuth, useStreak, useBibleChapter } from '@/hooks';
 */

export { useAuth, useRequiredUser } from "./useAuth";
export { useActivePlan, useTodayPlan } from "./useActivePlan";
export { useStreak } from "./useStreak";
export type { UseStreakReturn } from "./useStreak";
export { useProgress } from "./useProgress";
export type { UseProgressReturn } from "./useProgress";
export { useBibleChapter } from "./useBibleChapter";
export type { UseBibleChapterReturn } from "./useBibleChapter";
export { useAchievements } from "./useAchievements";
export type { UseAchievementsReturn, CategoryGroup } from "./useAchievements";
