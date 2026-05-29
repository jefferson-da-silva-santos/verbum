/**
 * VERBUM — API: Endpoints e Tipos de Resposta
 *
 * Base URL, builders de URL e tipos TypeScript que espelham
 * fielmente o contrato da BIBLIAAPI v2.
 *
 * Documentação: https://bibliaapi.com.br
 * Autenticação: Bearer token via chave gerada no painel da API
 *
 * Configuração da chave:
 *   1. Crie um arquivo .env na raiz do projeto
 *   2. Adicione: EXPO_PUBLIC_BIBLIA_API_KEY=sua_chave_aqui
 *   3. A variável é lida em build-time pelo Expo (prefixo EXPO_PUBLIC_)
 *
 * NUNCA commitar a chave em repositório. Adicione .env ao .gitignore.
 */

// ─────────────────────────────────────────────
// CONFIGURAÇÃO BASE
// ─────────────────────────────────────────────

export const BIBLIA_API_BASE_URL = "https://bibliaapi.com.br/api/v2";

/** Timeout padrão em milissegundos para cada requisição */
export const API_REQUEST_TIMEOUT_MS = 12_000;

/** Número máximo de tentativas automáticas em caso de falha de rede */
export const API_MAX_RETRIES = 2;

/** Delay entre retentativas (ms) — aumenta exponencialmente */
export const API_RETRY_BASE_DELAY_MS = 800;

// ─────────────────────────────────────────────
// BUILDERS DE URL
// ─────────────────────────────────────────────

export const Endpoints = {
  /** GET /versions → lista todas as versões disponíveis */
  versions: (): string => `/versions`,

  /** GET /versions/{v}/books → lista todos os 66 livros */
  books: (version: string): string => `/versions/${version}/books`,

  /** GET /versions/{v}/books/{b}/chapters → lista capítulos de um livro */
  chapters: (version: string, bookSlug: string): string =>
    `/versions/${version}/books/${bookSlug}/chapters`,

  /** GET /versions/{v}/books/{b}/chapters/{n}/verses → todos os versículos de um capítulo */
  chapterVerses: (version: string, bookSlug: string, chapter: number): string =>
    `/versions/${version}/books/${bookSlug}/chapters/${chapter}/verses`,

  /** GET /versions/{v}/books/{b}/chapters/{n}/verses/{v} → versículo individual */
  verse: (
    version: string,
    bookSlug: string,
    chapter: number,
    verse: number,
  ): string =>
    `/versions/${version}/books/${bookSlug}/chapters/${chapter}/verses/${verse}`,

  /** GET /search?q={termo}&version={v} → busca por palavra ou expressão */
  search: (query: string, version: string): string =>
    `/search?q=${encodeURIComponent(query)}&version=${version}`,
} as const;

// ─────────────────────────────────────────────
// TIPOS DE RESPOSTA DA API
// ─────────────────────────────────────────────

/** Abreviações de um livro (multilíngue) */
export interface ApiBookAbbrev {
  pt: string;
  en: string;
}

/** Metadados de livro retornados junto a cada endpoint */
export interface ApiBookMeta {
  abbrev: ApiBookAbbrev;
  chapters: number;
  name: string;
  author: string;
  group: string;
  version: string;
}

/** Versículo individual */
export interface ApiVerse {
  number: number;
  text: string;
}

/**
 * Resposta do endpoint chapterVerses
 * GET /versions/{v}/books/{b}/chapters/{n}/verses
 */
export interface ApiChapterResponse {
  book: ApiBookMeta;
  chapter: {
    number: number;
    verses: number;
  };
  verses: ApiVerse[];
}

/**
 * Versículo individual com metadados
 * GET /versions/{v}/books/{b}/chapters/{n}/verses/{n}
 */
export interface ApiVerseResponse {
  book: ApiBookMeta;
  chapter: number;
  verse: ApiVerse;
}

/** Item de resultado de busca */
export interface ApiSearchVerse {
  book: ApiBookMeta;
  chapter: number;
  number: number;
  text: string;
}

/**
 * Resposta do endpoint de busca
 * GET /search?q={query}&version={v}
 */
export interface ApiSearchResponse {
  verses: ApiSearchVerse[];
  occurrence: number;
}

/** Um livro da lista retornada por /books */
export interface ApiBookListItem {
  abbrev: ApiBookAbbrev;
  chapters: number;
  name: string;
  author: string;
  group: string;
}

/** Uma versão bíblica disponível */
export interface ApiVersionItem {
  version: string;
  verses: number;
}

// ─────────────────────────────────────────────
// ERROS DA API
// ─────────────────────────────────────────────

export type ApiErrorCode =
  | "NETWORK_ERROR" // sem conexão / timeout
  | "UNAUTHORIZED" // 401 — chave inválida ou expirada
  | "NOT_FOUND" // 404 — livro, capítulo ou versículo não existe
  | "RATE_LIMIT" // 429 — limite de requisições excedido
  | "SERVER_ERROR" // 5xx — erro no servidor da BIBLIAAPI
  | "TIMEOUT" // requisição excedeu API_REQUEST_TIMEOUT_MS
  | "INVALID_RESPONSE" // JSON malformado ou schema inesperado
  | "MISSING_API_KEY"; // EXPO_PUBLIC_BIBLIA_API_KEY não configurada

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public readonly status: number,
    message: string,
    public readonly original?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isNetworkRelated(): boolean {
    return this.code === "NETWORK_ERROR" || this.code === "TIMEOUT";
  }

  get isAuthError(): boolean {
    return this.code === "UNAUTHORIZED" || this.code === "MISSING_API_KEY";
  }

  /** Mensagem legível para exibir ao usuário */
  get userMessage(): string {
    const messages: Record<ApiErrorCode, string> = {
      NETWORK_ERROR:
        "Sem conexão com a internet. Exibindo dados do cache local.",
      UNAUTHORIZED: "Chave de API inválida. Verifique as configurações.",
      NOT_FOUND: "Conteúdo não encontrado.",
      RATE_LIMIT: "Muitas requisições. Tente novamente em instantes.",
      SERVER_ERROR: "Erro no servidor. Tente novamente.",
      TIMEOUT: "Conexão lenta. Exibindo dados do cache.",
      INVALID_RESPONSE: "Resposta inesperada da API.",
      MISSING_API_KEY: "API key não configurada. Verifique o arquivo .env.",
    };
    return messages[this.code];
  }
}
