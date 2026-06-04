/**
 * VERBUM — Hook: useAchievements
 *
 * Carrega as conquistas desbloqueadas pelo usuário e calcula
 * estatísticas para a tela de conquistas.
 *
 * Uso:
 *   const { unlockedAchievements, progressPercent, refresh } = useAchievements();
 */

import { useState, useEffect, useCallback } from "react";
import { achievementRepo } from "../database/repositories";
import {
  getUnlockedAchievements,
  getVisibleAchievements,
  ACHIEVEMENTS_BY_CATEGORY,
  ACHIEVEMENT_CATEGORY_LABELS,
  TOTAL_PUBLIC_ACHIEVEMENTS,
} from "../constants/achievements";
import type {
  Achievement,
  AchievementCategory,
} from "../constants/achievements";
import type { AchievementRecord } from "../database/types";
import { useAuth } from "./useAuth";

export interface CategoryGroup {
  category: AchievementCategory;
  label: string;
  achievements: Achievement[];
  unlockedCount: number;
}

export interface UseAchievementsReturn {
  /** Conquistas desbloqueadas, ordenadas por raridade decrescente */
  unlockedAchievements: Achievement[];
  /** Registros com data de desbloqueio */
  records: AchievementRecord[];
  /** Todas as conquistas visíveis (desbloqueadas + não-ocultas) */
  visibleAchievements: Achievement[];
  /** Agrupadas por categoria para exibição em seções */
  categoryGroups: CategoryGroup[];
  unlockedCount: number;
  totalCount: number;
  /** % de conquistas desbloqueadas (0–100) */
  progressPercent: number;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  unlockedKeys: ReadonlySet<string> | undefined;
}

export function useAchievements(): UseAchievementsReturn {
  const { user } = useAuth();

  const [unlockedKeys, setUnlockedKeys] = useState<Set<string>>(new Set());
  const [records, setRecords] = useState<AchievementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!user) {
      setUnlockedKeys(new Set());
      setRecords([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const [keys, recs] = await Promise.all([
        achievementRepo.getUnlockedKeys(user.id),
        achievementRepo.findAll(user.id),
      ]);

      setUnlockedKeys(keys);
      setRecords(recs);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Derivações
  const unlockedAchievements = getUnlockedAchievements(unlockedKeys);
  const visibleAchievements = getVisibleAchievements(unlockedKeys);
  const unlockedCount = unlockedKeys.size;
  const progressPercent =
    TOTAL_PUBLIC_ACHIEVEMENTS > 0
      ? parseFloat(
          ((unlockedCount / TOTAL_PUBLIC_ACHIEVEMENTS) * 100).toFixed(1),
        )
      : 0;

  // Agrupar por categoria
  const categoryGroups: CategoryGroup[] = (
    Object.entries(ACHIEVEMENTS_BY_CATEGORY) as [
      AchievementCategory,
      Achievement[],
    ][]
  )
    .map(([cat, all]) => {
      const visible = all.filter((a) => !a.hidden || unlockedKeys.has(a.key));
      const unlocked = visible.filter((a) => unlockedKeys.has(a.key));
      return {
        category: cat,
        label: ACHIEVEMENT_CATEGORY_LABELS[cat],
        achievements: visible,
        unlockedCount: unlocked.length,
      };
    })
    .filter((g) => g.achievements.length > 0);

  return {
    unlockedAchievements,
    records,
    visibleAchievements,
    categoryGroups,
    unlockedCount,
    totalCount: TOTAL_PUBLIC_ACHIEVEMENTS,
    progressPercent,
    isLoading,
    unlockedKeys,
    error,
    refresh: fetch,
  };
}
