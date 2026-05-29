/**
 * VERBUM — API: BibleApiClient
 *
 * Cliente HTTP para a BIBLIAAPI v2. Responsabilidades:
 *   - Autenticação via Bearer token (EXPO_PUBLIC_BIBLIA_API_KEY)
 *   - Timeout com AbortController
 *   - Retry automático em falhas de rede (não em 4xx)
 *   - Tipagem completa das respostas
 *   - Classificação de erros em ApiError
 *
 * NÃO implementa cache — isso é responsabilidade do CacheManager.
 * NÃO acessa banco de dados.
 *
 * Uso direto (raramente necessário — prefira CacheManager):
 *   const data = await BibleApiClient.getChapterVerses('acf', 'gn', 1);
 */

import {
  BIBLIA_API_BASE_URL,
  API_REQUEST_TIMEOUT_MS,
  API_MAX_RETRIES,
  API_RETRY_BASE_DELAY_MS,
  Endpoints,
  ApiError,
} from "./endpoints";

import type {
  ApiChapterResponse,
  ApiVerseResponse,
  ApiSearchResponse,
  ApiBookListItem,
  ApiVersionItem,
  ApiErrorCode,
} from "./endpoints";

// ─────────────────────────────────────────────
// CONFIGURAÇÃO DE API KEY
// ─────────────────────────────────────────────

/**
 * Recupera a API key da variável de ambiente.
 *
 * Configuração:
 *   1. Crie .env na raiz: EXPO_PUBLIC_BIBLIA_API_KEY=sua_chave
 *   2. Reinicie o servidor Expo após alterar o .env
 *
 * Em produção (EAS Build): configure como secret no painel da Expo.
 */
function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_BIBLIA_API_KEY;
  if (!key || key.trim() === "") {
    throw new ApiError(
      "MISSING_API_KEY",
      0,
      "EXPO_PUBLIC_BIBLIA_API_KEY não encontrada. Configure o arquivo .env na raiz do projeto.",
    );
  }
  return key.trim();
}

// ─────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────

function buildHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function buildUrl(endpoint: string): string {
  return `${BIBLIA_API_BASE_URL}${endpoint}`;
}

/** Delay assíncrono para retentativas com backoff exponencial */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Classifica o status HTTP em ApiErrorCode.
 */
function classifyHttpError(status: number): ApiErrorCode {
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 404) return "NOT_FOUND";
  if (status === 429) return "RATE_LIMIT";
  if (status >= 500) return "SERVER_ERROR";
  return "SERVER_ERROR";
}

// ─────────────────────────────────────────────
// NÚCLEO DE REQUISIÇÃO
// ─────────────────────────────────────────────

/**
 * Executa uma requisição GET com timeout e retentativas.
 *
 * Política de retry:
 *   - Retenta apenas em falhas de rede (NETWORK_ERROR, TIMEOUT)
 *   - NÃO retenta em erros 4xx (lógicos) ou 5xx estáveis
 *   - Backoff: 800ms → 1600ms → 3200ms
 */
async function request<T>(endpoint: string, attempt: number = 0): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    API_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(buildUrl(endpoint), {
      method: "GET",
      headers: buildHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Erro HTTP
    if (!response.ok) {
      const code = classifyHttpError(response.status);
      let body = "";
      try {
        body = await response.text();
      } catch {
        /* ignora */
      }
      throw new ApiError(
        code,
        response.status,
        `HTTP ${response.status}: ${body}`,
      );
    }

    // Parse JSON
    let json: unknown;
    try {
      json = await response.json();
    } catch (parseError) {
      throw new ApiError(
        "INVALID_RESPONSE",
        response.status,
        "Falha ao interpretar a resposta JSON da API.",
        parseError,
      );
    }

    return json as T;
  } catch (error) {
    clearTimeout(timeoutId);

    // Erro de timeout (AbortController)
    if (error instanceof Error && error.name === "AbortError") {
      const apiErr = new ApiError(
        "TIMEOUT",
        0,
        `Requisição excedeu ${API_REQUEST_TIMEOUT_MS}ms: ${endpoint}`,
      );

      if (attempt < API_MAX_RETRIES) {
        await delay(API_RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
        return request<T>(endpoint, attempt + 1);
      }
      throw apiErr;
    }

    // Propaga ApiError sem retry (4xx são definitivos)
    if (error instanceof ApiError) {
      if (error.isNetworkRelated && attempt < API_MAX_RETRIES) {
        await delay(API_RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
        return request<T>(endpoint, attempt + 1);
      }
      throw error;
    }

    // Erro genérico de rede (fetch falhou antes de obter resposta)
    const networkErr = new ApiError(
      "NETWORK_ERROR",
      0,
      "Falha de rede ao conectar à BIBLIAAPI.",
      error,
    );

    if (attempt < API_MAX_RETRIES) {
      await delay(API_RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
      return request<T>(endpoint, attempt + 1);
    }
    throw networkErr;
  }
}

// ─────────────────────────────────────────────
// CLIENTE PÚBLICO
// ─────────────────────────────────────────────

export const BibleApiClient = {
  // ── Versões ──────────────────────────────────

  /**
   * Lista todas as versões bíblicas disponíveis na API.
   * Ex: ACF, NVI, ARA, NAA
   */
  async getVersions(): Promise<ApiVersionItem[]> {
    return request<ApiVersionItem[]>(Endpoints.versions());
  },

  // ── Livros ───────────────────────────────────

  /**
   * Lista todos os 66 livros de uma versão com metadados.
   * Resultado é estável — pode ser cacheado por longa duração.
   */
  async getBooks(version: string): Promise<ApiBookListItem[]> {
    return request<ApiBookListItem[]>(Endpoints.books(version));
  },

  // ── Capítulos de um Livro ────────────────────

  /**
   * Lista os capítulos disponíveis de um livro.
   * Retorna metadados sem o texto dos versículos.
   */
  async getChapters(
    version: string,
    bookSlug: string,
  ): Promise<{ number: number; verses: number }[]> {
    return request<{ number: number; verses: number }[]>(
      Endpoints.chapters(version, bookSlug),
    );
  },

  // ── Versículos de um Capítulo ────────────────

  /**
   * Busca todos os versículos de um capítulo.
   * É o endpoint mais chamado no app — todo acesso passa pelo CacheManager.
   *
   * @param version  Código da versão bíblica: 'acf' | 'nvi' | 'ara' | 'naa'
   * @param bookSlug Slug do livro conforme BIBLIAAPI: 'gn', 'jo', 'rm', etc.
   * @param chapter  Número do capítulo (1-indexed)
   */
  async getChapterVerses(
    version: string,
    bookSlug: string,
    chapter: number,
  ): Promise<ApiChapterResponse> {
    return request<ApiChapterResponse>(
      Endpoints.chapterVerses(version, bookSlug, chapter),
    );
  },

  // ── Versículo Individual ─────────────────────

  /**
   * Busca um versículo específico.
   * Usado em preview de favoritos e compartilhamento.
   */
  async getVerse(
    version: string,
    bookSlug: string,
    chapter: number,
    verse: number,
  ): Promise<ApiVerseResponse> {
    return request<ApiVerseResponse>(
      Endpoints.verse(version, bookSlug, chapter, verse),
    );
  },

  // ── Busca ────────────────────────────────────

  /**
   * Busca versículos por palavra-chave, tema ou expressão.
   *
   * @param query   Termo de busca (ex: "fé", "Espírito Santo", "nova aliança")
   * @param version Versão bíblica para filtrar os resultados
   */
  async search(query: string, version: string): Promise<ApiSearchResponse> {
    if (!query.trim()) {
      return { verses: [], occurrence: 0 };
    }
    return request<ApiSearchResponse>(Endpoints.search(query, version));
  },

  // ── Health Check ─────────────────────────────

  /**
   * Verifica se a API está acessível e a chave é válida.
   * Usar na tela de configurações para feedback ao usuário.
   */
  async healthCheck(): Promise<boolean> {
    try {
      await BibleApiClient.getVersions();
      return true;
    } catch {
      return false;
    }
  },
} as const;
