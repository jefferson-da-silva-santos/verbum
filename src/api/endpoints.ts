/**
 * VERBUM — src/api/endpoints.ts  [FINAL — documentação oficial]
 *
 * Endpoints corretos conforme docs em https://bibliaapi.com.br/api/v2
 *
 * ERROS ANTERIORES CORRIGIDOS:
 *
 *  1. Capítulo completo:
 *     ERRADO: /versions/acf/books/gn/chapters/1/verses   ← não existe
 *     CERTO:  /versions/ACF/books/gn/chapters/1          ← sem /verses
 *
 *  2. Versão em MAIÚSCULAS:
 *     ERRADO: acf, nvi, ara
 *     CERTO:  ACF, NVI, ARA
 *
 *  3. Busca:
 *     ERRADO: /verses/search?q=amor&version=ACF
 *     CERTO:  /versions/ACF/search?q=amor
 *
 * Referência dos endpoints (auth = Bearer ou X-API-Key):
 *   GET /versions                                          → sem auth
 *   GET /books                                             → sem auth
 *   GET /versions/{VER}/books/{book}/chapters/{n}          → com auth ✓
 *   GET /versions/{VER}/books/{book}/chapters/{n}/verses/{v} → com auth
 *   GET /versions/{VER}/random                             → com auth
 *   GET /versions/{VER}/search?q={termo}                  → com auth
 */

export const BIBLIA_API_BASE_URL     = 'https://bibliaapi.com.br/api/v2';
export const API_REQUEST_TIMEOUT_MS  = 20_000;
export const API_MAX_RETRIES         = 2;
export const API_RETRY_BASE_DELAY_MS = 800;

// ─────────────────────────────────────────────
// ENDPOINTS
// ─────────────────────────────────────────────

export const Endpoints = {

  /** GET /versions  → lista versões (sem auth) */
  versions: (): string => `/versions`,

  /** GET /books  → lista 66 livros (sem auth) */
  books: (): string => `/books`,

  /**
   * CAPÍTULO COMPLETO  ← endpoint principal do leitor
   * GET /versions/{VER}/books/{book}/chapters/{n}
   *
   * Exemplo: /versions/ACF/books/gn/chapters/1
   * Retorna o livro + array de versículos do capítulo.
   */
  chapterFull: (version: string, bookAbbrev: string, chapter: number): string =>
    `/versions/${version}/books/${bookAbbrev}/chapters/${chapter}`,

  /**
   * VERSÍCULO ÚNICO
   * GET /versions/{VER}/books/{book}/chapters/{n}/verses/{v}
   *
   * Exemplo: /versions/ACF/books/jo/chapters/3/verses/16
   */
  verse: (version: string, bookAbbrev: string, chapter: number, verse: number): string =>
    `/versions/${version}/books/${bookAbbrev}/chapters/${chapter}/verses/${verse}`,

  /**
   * VERSÍCULO ALEATÓRIO
   * GET /versions/{VER}/random
   */
  random: (version: string): string =>
    `/versions/${version}/random`,

  /**
   * BUSCA POR TEXTO
   * GET /versions/{VER}/search?q={termo}
   *
   * Exemplo: /versions/ACF/search?q=amor
   */
  search: (query: string, version: string): string =>
    `/versions/${version}/search?q=${encodeURIComponent(query)}`,

} as const;

// ─────────────────────────────────────────────
// TIPOS DE RESPOSTA
// ─────────────────────────────────────────────

export interface ApiBookAbbrev { pt: string; en: string; }

export interface ApiBookMeta {
  abbrev:   ApiBookAbbrev;
  chapters: number;
  name:     string;
  author:   string;
  group:    string;
  version:  string;
}

export interface ApiVerse {
  number: number;
  text:   string;
}

/**
 * Resposta de GET /versions/{VER}/books/{book}/chapters/{n}
 *
 * A API pode retornar versículos em dois formatos:
 *   A) chapter.verses = ApiVerse[]  (array dentro do objeto chapter)
 *   B) verses = ApiVerse[]          (array no nível raiz)
 *
 * O normalizer em bibliaApi.ts trata ambos.
 */
export interface ApiChapterRaw {
  book: ApiBookMeta;
  chapter: {
    number: number;
    verses: ApiVerse[] | number; // array OU contagem total
  };
  verses?: ApiVerse[]; // presente se o formato for B
}

/** Formato normalizado interno (uniforme independente do formato da API) */
export interface ApiChapterResponse {
  book:    ApiBookMeta;
  chapter: { number: number; verses: number };
  verses:  ApiVerse[];
}

export interface ApiVerseResponse {
  version: string;
  book:    string;
  chapter: number;
  verse:   number;
  text:    string;
}

export interface ApiSearchItem {
  book:    ApiBookMeta;
  chapter: number;
  number:  number;
  text:    string;
}

export interface ApiSearchResponse {
  verses:     ApiSearchItem[];
  occurrence: number;
}

export interface ApiBookListItem {
  abbrev:   ApiBookAbbrev;
  chapters: number;
  name:     string;
  author:   string;
  group:    string;
}

export interface ApiVersionItem {
  version: string;
  verses:  number;
}

// ─────────────────────────────────────────────
// ERROS
// ─────────────────────────────────────────────

export type ApiErrorCode =
  | 'NETWORK_ERROR' | 'UNAUTHORIZED' | 'NOT_FOUND'
  | 'RATE_LIMIT'    | 'SERVER_ERROR' | 'TIMEOUT'
  | 'INVALID_RESPONSE' | 'MISSING_API_KEY';

export class ApiError extends Error {
  constructor(
    public readonly code:     ApiErrorCode,
    public readonly status:   number,
    message: string,
    public readonly original?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkRelated() { return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT'; }
  get isAuthError()      { return this.code === 'UNAUTHORIZED'  || this.code === 'MISSING_API_KEY'; }

  get userMessage(): string {
    const m: Record<ApiErrorCode, string> = {
      NETWORK_ERROR:    'Sem conexão. Verifique sua internet.',
      UNAUTHORIZED:     'Chave de API inválida. Verifique o .env.',
      NOT_FOUND:        'Conteúdo não encontrado.',
      RATE_LIMIT:       'Muitas requisições. Aguarde.',
      SERVER_ERROR:     'Erro no servidor da BIBLIAAPI.',
      TIMEOUT:          'Conexão lenta. Tente novamente.',
      INVALID_RESPONSE: 'Resposta inesperada da API.',
      MISSING_API_KEY:  'Chave não configurada no .env.',
    };
    return m[this.code];
  }
}