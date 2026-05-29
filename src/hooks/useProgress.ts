/**
 * VERBUM — Hook: useProgress
 *
 * Agrega métricas globais do usuário para a ProgressScreen.
 * Combina dados de múltiplos repositories e processa via MetricsCalculator.
 *
 * Uso:
 *   const { global: metrics, heatmap, planMetrics, refresh } = useProgress();
 */

import { useState, useEffect, useCallback } from "react";
import { progressRepo } from "../database/repositories";
import { MetricsCalculator } from "../engine/MetricsCalculator";
import type {
  GlobalMetrics,
  HeatmapCell,
  PlanMetrics,
} from "../engine/MetricsCalculator";
import { useAuth } from "./useAuth";
import { useActivePlan } from "./useActivePlan";

export interface UseProgressReturn {
  /** Métricas globais (toda a Bíblia, não apenas o plano ativo) */
  global: GlobalMetrics | null;
  /** Células do heatmap dos últimos 365 dias */
  heatmap: HeatmapCell[];
  /** Métricas do plano ativo (null se não há plano) */
  planMetrics: PlanMetrics | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useProgress(): UseProgressReturn {
  const { user } = useAuth();
  const { activePlan, readChapterIds } = useActivePlan();

  const [global, setGlobal] = useState<GlobalMetrics | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [planMetrics, setPlanMetrics] = useState<PlanMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!user) {
      setGlobal(null);
      setHeatmap([]);
      setPlanMetrics(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Busca paralela para minimizar latência
      const [globalReadIds, sessionStats, heatmapEntries] = await Promise.all([
        progressRepo.getReadChapterIdsGlobal(user.id),
        progressRepo.getSessionStats(user.id),
        progressRepo.getHeatmapData(user.id, 365),
      ]);

      const globalMetrics = MetricsCalculator.global(
        globalReadIds,
        sessionStats,
        heatmapEntries,
      );

      const heatmapCells = MetricsCalculator.heatmap(heatmapEntries, 365);

      let pm: PlanMetrics | null = null;
      if (activePlan) {
        pm = MetricsCalculator.plan(activePlan, readChapterIds as Set<string>);
      }

      setGlobal(globalMetrics);
      setHeatmap(heatmapCells);
      setPlanMetrics(pm);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, activePlan?.id, readChapterIds]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { global, heatmap, planMetrics, isLoading, error, refresh: fetch };
}
