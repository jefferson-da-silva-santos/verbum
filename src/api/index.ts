/**
 * VERBUM — API Layer (Barrel Export)
 *
 * Ponto único de entrada para acesso ao conteúdo bíblico.
 *
 * Uso nos hooks:
 *   import { CacheManager } from '@/api';
 *   import { ApiError }     from '@/api';
 *
 * BibleApiClient raramente é importado diretamente —
 * prefira sempre CacheManager para garantir o cache.
 */

export * from "./endpoints";
export * from "./bibliaApi";
export * from "./cacheManager";
