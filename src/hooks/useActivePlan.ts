/**
 * VERBUM — Hook: useActivePlan
 *
 * Consumer do PlanContext com conveniências para as telas mais comuns.
 * Evita que cada tela importe e use usePlanContext() diretamente.
 *
 * Uso:
 *   const { activePlan, markChapterRead, percentComplete } = useActivePlan();
 */

import { usePlanContext } from "../context/PlanContext";
import type { PlanContextValue } from "../context/PlanContext";

export function useActivePlan(): PlanContextValue {
  return usePlanContext();
}

/**
 * Retorna apenas os dados necessários para o card de plano do dia
 * na HomeScreen — sem re-renders causados por mudanças não relacionadas.
 */
export function useTodayPlan() {
  const {
    activePlan,
    todaySchedule,
    readChapterIds,
    chaptersRead,
    percentComplete,
    markChapterRead,
    isLoading,
  } = usePlanContext();

  const todayChapters = todaySchedule?.chapters ?? [];
  const totalToday = todayChapters.length;
  const readTodayCount = todayChapters.filter((c) =>
    readChapterIds.has(c.chapterId),
  ).length;
  const allDoneToday = totalToday > 0 && readTodayCount === totalToday;

  return {
    activePlan,
    todayChapters,
    totalToday,
    readTodayCount,
    allDoneToday,
    chaptersRead,
    percentComplete,
    markChapterRead,
    isLoading,
  };
}
