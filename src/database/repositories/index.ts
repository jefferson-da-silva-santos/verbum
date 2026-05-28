/**
 * VERBUM — Repositories (Barrel Export)
 *
 * Exporta as classes e cria instâncias singleton de cada repository.
 * Os singletons usam getDb() de forma lazy — são seguros para importar
 * antes de initDatabase() desde que não sejam chamados antes da init.
 *
 * Uso recomendado nos hooks e engine:
 *   import { userRepo, planRepo, progressRepo } from '@/database/repositories';
 *
 * Uso das classes (para testes com mock):
 *   import { UserRepository } from '@/database/repositories';
 */

// ─────────────────────────────────────────────
// CLASSES (para extensão e testes)
// ─────────────────────────────────────────────

export { BaseRepository }      from './BaseRepository';
export { UserRepository }      from './UserRepository';
export { PlanRepository }      from './PlanRepository';
export { ProgressRepository }  from './ProgressRepository';
export { NoteRepository }      from './NoteRepository';
export { HighlightRepository } from './HighlightRepository';
export { FavoriteRepository }  from './FavoriteRepository';
export { DiaryRepository }     from './DiaryRepository';
export { AchievementRepository } from './AchievementRepository';
export { CacheRepository }     from './CacheRepository';

// ─────────────────────────────────────────────
// SINGLETONS — instâncias prontas para uso
// ─────────────────────────────────────────────

import { UserRepository }        from './UserRepository';
import { PlanRepository }        from './PlanRepository';
import { ProgressRepository }    from './ProgressRepository';
import { NoteRepository }        from './NoteRepository';
import { HighlightRepository }   from './HighlightRepository';
import { FavoriteRepository }    from './FavoriteRepository';
import { DiaryRepository }       from './DiaryRepository';
import { AchievementRepository } from './AchievementRepository';
import { CacheRepository }       from './CacheRepository';

export const userRepo        = new UserRepository();
export const planRepo        = new PlanRepository();
export const progressRepo    = new ProgressRepository();
export const noteRepo        = new NoteRepository();
export const highlightRepo   = new HighlightRepository();
export const favoriteRepo    = new FavoriteRepository();
export const diaryRepo       = new DiaryRepository();
export const achievementRepo = new AchievementRepository();
export const cacheRepo       = new CacheRepository();