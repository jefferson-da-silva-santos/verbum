/**
 * VERBUM — Hook: useStreak
 *
 * Busca as datas de leitura do banco e calcula o streak atual e histórico.
 * Expõe refresh() para que telas recarreguem após marcação de capítulos.
 *
 * Uso:
 *   const { streak, isLoading, refresh } = useStreak();
 *   // Chamar refresh() no useFocusEffect da tela de progresso
 */

import { useState, useEffect, useCallback } from "react";
import { progressRepo } from "../database/repositories";
import { StreakCalculator } from "../engine/StreakCalculator";
import type { StreakResult } from "../engine/StreakCalculator";
import { useAuth } from "./useAuth";

export interface UseStreakReturn {
  streak: StreakResult | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useStreak(): UseStreakReturn {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!user) {
      setStreak(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await progressRepo.getStreakData(user.id);
      const result = StreakCalculator.calculate(data);
      setStreak(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { streak, isLoading, error, refresh: fetch };
}
