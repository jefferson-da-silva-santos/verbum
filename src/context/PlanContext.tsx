/**
 * VERBUM — PlanContext
 *
 * Hub central de orquestração do app. Coordena:
 *   - Plano de leitura ativo e cronograma
 *   - Marcação de capítulos lidos (com progresso em tempo real)
 *   - Verificação e desbloqueio de conquistas
 *   - Recalibração automática do plano quando há desvio
 *   - Gestão de sessões de leitura
 *
 * Dependências: AuthContext (userId), todos os repositories, Engine layer.
 *
 * Uso:
 *   const { activePlan, markChapterRead, todaySchedule } = usePlanContext();
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

import { useAuthContext } from './AuthContext';
import {
  planRepo,
  progressRepo,
  achievementRepo,
} from '../database/repositories';
import type {
  ReadingPlan,
  PlanScheduleEntry,
} from '../database/types';
import type { Achievement } from '../constants/achievements';
import {
  PlanCalculator,
  ScheduleGenerator,
  PlanRecalibrator,
  AchievementChecker,
} from '../engine';
import type { PlanInput } from '../engine/PlanCalculator';
import { todayIso } from '../engine/dateHelpers';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface PlanContextValue {
  // ── Estado ─────────────────────────────────
  activePlan: ReadingPlan | null;
  todaySchedule: PlanScheduleEntry | null;
  /** IDs dos capítulos lidos no plano ativo: Set<"gn-1"> */
  readChapterIds: ReadonlySet<string>;
  /** Capítulos lidos / total do plano */
  chaptersRead: number;
  percentComplete: number;
  isLoading: boolean;
  /** Conquistas desbloqueadas desde o último clear — para exibir toast */
  newlyUnlocked: Achievement[];

  // ── Ações principais ───────────────────────
  /** Cria um novo plano com base nos parâmetros do wizard */
  createPlan: (input: PlanInput, planName: string) => Promise<void>;
  /** Marca um capítulo como lido e dispara toda a cadeia de efeitos */
  markChapterRead: (bookSlug: string, bookName: string, chapter: number) => Promise<void>;
  /** Desfaz a marcação de leitura de um capítulo */
  unmarkChapterRead: (bookSlug: string, chapter: number) => Promise<void>;
  /** Troca o plano ativo */
  setActivePlan: (planId: string) => Promise<void>;
  /** Remove um plano e todos os seus dados */
  deletePlan: (planId: string) => Promise<void>;
  /** Recarrega o estado do plano do banco */
  refreshPlan: () => Promise<void>;
  /** Limpa a fila de conquistas recém-desbloqueadas (após exibir o toast) */
  clearNewAchievements: () => void;

  // ── Sessões de leitura ─────────────────────
  startSession: (bookSlug: string, chapter: number) => Promise<string | null>;
  endSession: (sessionId: string, durationSecs: number) => Promise<void>;
}

// ─────────────────────────────────────────────
// CONTEXTO
// ─────────────────────────────────────────────

const PlanContext = createContext<PlanContextValue | null>(null);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Extrai os slugs de livros a partir do escopo de um plano */
function bookSlugsFromPlan(plan: ReadingPlan): string[] {
  const { scopeData } = plan;
  switch (scopeData.type) {
    case 'full_bible':
    case 'preset':
    case 'testament': {
      // Para estes tipos, o schedule já contém a sequência correta.
      // Reconstruímos a partir das entradas do schedule (via queue).
      // Como fallback, usamos a ordem canônica completa.
      return []; // será preenchido pelo schedule
    }
    case 'book': return [scopeData.bookSlug];
    case 'books': return scopeData.bookSlugs;
  }
}

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();

  const [activePlan, setActivePlan_] = useState<ReadingPlan | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<PlanScheduleEntry | null>(null);
  const [readChapterIds, setReadChapterIds] = useState<ReadonlySet<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  // Ref para evitar operações em componente desmontado
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  // ── Carregar plano ──────────────────────────

  const loadPlan = useCallback(async (userId: string) => {
    try {
      const plan = await planRepo.findActive(userId);
      if (!plan) {
        if (mounted.current) {
          setActivePlan_(null);
          setTodaySchedule(null);
          setReadChapterIds(new Set());
          setIsLoading(false);
        }
        return;
      }

      const today = todayIso();
      const schedule = await planRepo.getScheduleForDate(plan.id, today);
      const readIds = await progressRepo.getReadChapterIdsForPlan(plan.id);

      if (mounted.current) {
        setActivePlan_(plan);
        setTodaySchedule(schedule);
        setReadChapterIds(readIds);
        setIsLoading(false);
      }
    } catch (e) {
      console.error('[PlanContext] Erro ao carregar plano:', e);
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      loadPlan(user.id);
    } else {
      setActivePlan_(null);
      setTodaySchedule(null);
      setReadChapterIds(new Set());
      setIsLoading(false);
    }
  }, [user?.id, loadPlan]);

  // ── refreshPlan ──────────────────────────────

  const refreshPlan = useCallback(async () => {
    if (user) await loadPlan(user.id);
  }, [user, loadPlan]);

  // ── createPlan ───────────────────────────────

  const createPlan = useCallback(async (input: PlanInput, planName: string) => {
    if (!user) throw new Error('Usuário não autenticado.');

    const calc = PlanCalculator.calculate(input);
    const schedule = ScheduleGenerator.fromCalculation(calc, input.bookSlugs);

    const created = await planRepo.create(
      {
        userId: user.id,
        name: planName,
        scopeType: 'books',
        scopeData: { type: 'books', bookSlugs: [...input.bookSlugs] },
        mode: input.mode,
        chaptersPerDay: calc.chaptersPerDay,
        minutesPerDay: calc.minutesPerDay,
        targetDate: calc.targetDate,
        startDate: calc.startDate,
        estimatedEndDate: calc.estimatedEndDate,
        skipWeekdays: [...input.skipWeekdays],
        totalChapters: calc.totalChapters,
        bibleVersion: user.preferredVersion,
        isActive: true,
      },
      schedule.entries.map((e) => ({
        planId: '', // preenchido internamente pelo PlanRepository
        date: e.date,
        isActive: e.isActive,
        chapters: e.chapters,
        estimatedMinutes: e.estimatedMinutes,
      })),
    );

    await loadPlan(user.id);
  }, [user, loadPlan]);

  // ── markChapterRead ──────────────────────────

  const markChapterRead = useCallback(async (
    bookSlug: string,
    bookName: string,
    chapter:  number,
  ) => {
    if (!user) return;
 
    const chapterId = `${bookSlug}-${chapter}`;
 
    // ── FIX 3: verifica escopo do plano ────────────────────────────────────
    // Extrai os slugs do plano ativo (se existir)
    let planSlugs: string[] = [];
    if (activePlan) {
      const scope = activePlan.scopeData as any;
      if (scope?.type === 'books' && Array.isArray(scope.bookSlugs)) {
        planSlugs = scope.bookSlugs;
      } else if (scope?.type === 'book' && scope.bookSlug) {
        planSlugs = [scope.bookSlug];
      }
      // full_bible / testament / preset: planSlugs vazio = tudo conta
    }
 
    const isInPlanScope =
      !activePlan ||                          // sem plano ativo: registra globalmente
      planSlugs.length === 0 ||              // full_bible: tudo conta
      planSlugs.includes(bookSlug);          // livro pertence ao plano
 
    // planId só é atribuído se o capítulo pertence ao plano
    const planIdToSave = isInPlanScope && activePlan ? activePlan.id : null;
 
    // Se já foi lido para ESTE plano, não duplica
    if (isInPlanScope && readChapterIds.has(chapterId)) return;
 
    const today = todayIso();
 
    await progressRepo.markChapterRead({
      planId:                   planIdToSave,
      userId:                   user.id,
      bookSlug,
      bookName,
      chapterNumber:            chapter,
      readAt:                   new Date().toISOString(),
      readingDurationSeconds:   null,
      scheduleDate:             todaySchedule?.date ?? today,
      isOnTime:                 todaySchedule?.date === today,
    });
 
    // Atualiza estado local apenas se pertence ao plano
    if (isInPlanScope && activePlan) {
      const newReadIds = new Set(readChapterIds);
      newReadIds.add(chapterId);
      if (mounted.current) setReadChapterIds(newReadIds);
 
      // Verifica conclusão do plano
      if (newReadIds.size >= activePlan.totalChapters) {
        await planRepo.markCompleted(activePlan.id);
        if (mounted.current) {
          setActivePlan_((prev) => prev ? { ...prev, isCompleted: true } : null);
        }
      }
 
      // Verifica conquistas em background
      _checkAchievements(user.id, newReadIds).catch(
        (e) => console.warn('[PlanContext] Erro ao verificar conquistas:', e),
      );
 
      // Recalibração a cada 5 capítulos
      if (newReadIds.size % 5 === 0 && !activePlan.isCompleted) {
        _maybeRecalibrate(activePlan, newReadIds, user.id).catch(
          (e) => console.warn('[PlanContext] Erro ao recalibrar:', e),
        );
      }
    }
  }, [activePlan, user, readChapterIds, todaySchedule]);

  // ── unmarkChapterRead ────────────────────────

  const unmarkChapterRead = useCallback(async (bookSlug: string, chapter: number) => {
    if (!activePlan) return;

    await progressRepo.unmarkChapterRead(activePlan.id, bookSlug, chapter);

    const newReadIds = new Set(readChapterIds);
    newReadIds.delete(`${bookSlug}-${chapter}`);
    if (mounted.current) setReadChapterIds(newReadIds);
  }, [activePlan, readChapterIds]);

  // ── setActivePlan ────────────────────────────

  const setActivePlanAction = useCallback(async (planId: string) => {
    if (!user) return;
    await planRepo.setActive(planId, user.id);
    await loadPlan(user.id);
  }, [user, loadPlan]);

  // ── deletePlan ───────────────────────────────

  const deletePlan = useCallback(async (planId: string) => {
    await planRepo.delete(planId);
    if (activePlan?.id === planId && user) {
      await loadPlan(user.id);
    }
  }, [activePlan, user, loadPlan]);

  // ── Sessões ───────────────────────────────────

  const startSession = useCallback(async (bookSlug: string, chapter: number) => {
    if (!user) return null;
    try {
      const session = await progressRepo.startSession({
        userId: user.id,
        planId: activePlan?.id ?? null,
        bookSlug,
        chapterNumber: chapter,
        startedAt: new Date().toISOString(),
      });
      return session.id;
    } catch {
      return null;
    }
  }, [user, activePlan]);

  const endSession = useCallback(async (sessionId: string, durationSecs: number) => {
    await progressRepo.endSession(sessionId, durationSecs, 1);
  }, []);

  // ── Achievement check (background) ───────────

  const _checkAchievements = async (userId: string, newReadIds: Set<string>) => {
    const [streakData, unlockedKeys, plansCount, notesCount, hlCount, diaryCount, sessionCount] =
      await Promise.all([
        progressRepo.getStreakData(userId),
        achievementRepo.getUnlockedKeys(userId),
        planRepo.countCompleted(userId),
        Promise.resolve(0), // noteRepo.count — simplificado no MVP
        Promise.resolve(0), // highlightRepo.count
        Promise.resolve(0), // diaryRepo.count
        progressRepo.countSessions(userId),
      ]);

    const { StreakCalculator } = await import('../engine/StreakCalculator');
    const streakResult = StreakCalculator.calculate(streakData);

    const checkInput = AchievementChecker.buildInput({
      readChapterIds: newReadIds,
      longestStreak: streakResult.longestStreak,
      currentStreak: streakResult.currentStreak,
      completedPlansCount: plansCount,
      notesCount,
      highlightsCount: hlCount,
      diaryEntriesCount: diaryCount,
      sessionCount,
      unlockedKeys,
    });

    const newAchievements = AchievementChecker.check(checkInput);

    if (newAchievements.length > 0) {
      await Promise.all(
        newAchievements.map((a) => achievementRepo.unlock(userId, a.key)),
      );
      if (mounted.current) {
        setNewlyUnlocked((prev) => [...prev, ...newAchievements]);
      }
    }
  };

  // ── Recalibração (background) ─────────────────

  const _maybeRecalibrate = async (
    plan: ReadingPlan,
    newReadIds: Set<string>,
    userId: string,
  ) => {
    // Reconstrói bookSlugs a partir do schedule (primeiros 3 dias ativos)
    const upcoming = await planRepo.getUpcomingSchedule(plan.id, todayIso(), 3);
    const slugsInSchedule = [...new Set(
      upcoming.flatMap((e) => e.chapters.map((c) => c.bookSlug)),
    )];
    if (slugsInSchedule.length === 0) return;

    const needsRecalib = PlanRecalibrator.needsRecalibration(
      plan, newReadIds.size, slugsInSchedule,
    );
    if (!needsRecalib) return;

    // TODO: aqui dispararia a recalibração via planRepo.recalibrate()
    // Por ora apenas loga — a UI terá uma ação explícita de recalibrar
    console.log('[PlanContext] Recalibração necessária — implementar via UI');
  };

  // ── Valores derivados ─────────────────────────

  const chaptersRead = readChapterIds.size;
  const percentComplete = activePlan && activePlan.totalChapters > 0
    ? parseFloat(((chaptersRead / activePlan.totalChapters) * 100).toFixed(1))
    : 0;

  // ── Valor do contexto ────────────────────────

  const value: PlanContextValue = {
    activePlan,
    todaySchedule,
    readChapterIds,
    chaptersRead,
    percentComplete,
    isLoading,
    newlyUnlocked,
    createPlan,
    markChapterRead,
    unmarkChapterRead,
    setActivePlan: setActivePlanAction,
    deletePlan,
    refreshPlan,
    clearNewAchievements: () => setNewlyUnlocked([]),
    startSession,
    endSession,
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}

// ─────────────────────────────────────────────
// HOOK PÚBLICO
// ─────────────────────────────────────────────

export function usePlanContext(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error('usePlanContext() deve ser usado dentro de <PlanProvider>');
  }
  return ctx;
}