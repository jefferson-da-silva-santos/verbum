/**
 * VERBUM — src/api/bibliaApi.ts  [DEFINITIVO]
 *
 * Normalizer defensivo que aceita QUALQUER estrutura de resposta da BIBLIAAPI.
 * Na primeira execução loga o JSON raw para diagnóstico:
 *   [BIBLIAAPI] Raw response (primeiros 600 chars): {...}
 */

import {
  BIBLIA_API_BASE_URL,
  API_MAX_RETRIES,
  API_RETRY_BASE_DELAY_MS,
  API_REQUEST_TIMEOUT_MS,
  Endpoints,
  ApiError,
} from './endpoints';

import type {
  ApiChapterResponse,
  ApiVerseResponse,
  ApiSearchResponse,
  ApiBookListItem,
  ApiVersionItem,
} from './endpoints';

// ─── Slugs → abreviações da API ──────────────

const SLUG_TO_ABBREV: Record<string, string> = {
  gn:'gn',ex:'ex',lv:'lv',nm:'nm',dt:'dt',
  js:'js',jz:'jz',rt:'rt',
  '1sm':'1sm','2sm':'2sm','1rs':'1rs','2rs':'2rs',
  '1cr':'1cr','2cr':'2cr',ed:'ed',ne:'ne',et:'et',
  job:'jó',jó:'jó',
  sl:'sl',pv:'pv',ec:'ec',ct:'ct',
  is:'is',jr:'jr',lm:'lm',ez:'ez',dn:'dn',
  os:'os',jl:'jl',am:'am',ob:'ob',jn:'jn',
  mq:'mq',na:'na',hc:'hc',sf:'sf',ag:'ag',zc:'zc',ml:'ml',
  mt:'mt',mc:'mc',lc:'lc',jo:'jo',at:'at',rm:'rm',
  '1co':'1co','2co':'2co',gl:'gl',ef:'ef',fp:'fp',cl:'cl',
  '1ts':'1ts','2ts':'2ts','1tm':'1tm','2tm':'2tm',
  tt:'tt',fm:'fm',hb:'hb',tg:'tg',
  '1pe':'1pe','2pe':'2pe','1jo':'1jo','2jo':'2jo','3jo':'3jo',
  jd:'jd',ap:'ap',
};

function toAbbrev(slug: string): string {
  return SLUG_TO_ABBREV[slug] ?? slug;
}

function toApiVersion(v: string): string {
  return v.toUpperCase(); // acf → ACF
}

// ─── Normalizer defensivo ────────────────────
//
// Possíveis estruturas de resposta da BIBLIAAPI:
//  A) { book, chapter: { number, verses: [{number,text},...] } }
//  B) { book, chapter: { number, verses: 31 }, verses: [...] }
//  C) { book, chapter: 1, verses: [...] }
//  D) { book, verses: [...] }
//  E) { data: { book, verses: [...] } }  ← Laravel Resource wrapper
//  F) { data: [...] }
//  G) [...]

type AnyObj = Record<string, unknown>;

function extractVerses(raw: unknown): { number: number; text: string }[] {
  if (Array.isArray(raw)) return raw as { number:number; text:string }[];

  const r = raw as AnyObj;

  // Wrapper Laravel Resource
  if (r.data !== undefined) {
    if (Array.isArray(r.data)) return r.data as { number:number; text:string }[];
    return extractVerses(r.data);
  }

  // chapter.verses é array
  const ch = r.chapter as AnyObj | undefined;
  if (ch && Array.isArray(ch.verses)) return ch.verses as { number:number; text:string }[];

  // verses no nível raiz
  if (Array.isArray(r.verses)) return r.verses as { number:number; text:string }[];

  return [];
}

function extractChapterNumber(raw: unknown): number {
  const r    = raw as AnyObj;
  const body = (r.data !== undefined ? r.data : r) as AnyObj;
  const ch   = body.chapter;
  if (typeof ch === 'number') return ch;
  if (ch && typeof (ch as AnyObj).number === 'number') return (ch as AnyObj).number as number;
  if (typeof body.number === 'number') return body.number as number;
  return 0;
}

function extractBook(raw: unknown): ApiChapterResponse['book'] {
  const r    = raw as AnyObj;
  const body = (r.data !== undefined ? r.data : r) as AnyObj;
  return (body.book as ApiChapterResponse['book']) ?? {
    abbrev: { pt: '?', en: '?' }, chapters: 0, name: 'Desconhecido',
    author: '', group: '', version: '',
  };
}

function normalizeChapterResponse(raw: unknown): ApiChapterResponse {
  // LOG DIAGNÓSTICO — mostra a estrutura real na primeira execução
  console.log('[BIBLIAAPI] Raw response (600 chars):', JSON.stringify(raw).slice(0, 600));

  const verses = extractVerses(raw);
  const num    = extractChapterNumber(raw);
  const book   = extractBook(raw);

  if (verses.length === 0) {
    console.warn('[BIBLIAAPI] Nenhum versículo extraído! Estrutura completa:', JSON.stringify(raw));
  }

  return {
    book,
    chapter: { number: num, verses: verses.length },
    verses,
  };
}

// ─── Auth ─────────────────────────────────────

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_BIBLIA_API_KEY;
  if (!key?.trim()) throw new ApiError('MISSING_API_KEY', 0, 'EXPO_PUBLIC_BIBLIA_API_KEY não configurada no .env');
  return key.trim();
}

function buildHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${getApiKey()}`,
    'Content-Type':  'application/json',
    'Accept':        'application/json',
  };
}

function buildUrl(endpoint: string): string {
  return `${BIBLIA_API_BASE_URL}${endpoint}`;
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Requisição HTTP ──────────────────────────

async function request<T>(endpoint: string, attempt = 0): Promise<T> {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  const url        = buildUrl(endpoint);

  console.log(`[BIBLIAAPI] GET ${url}${attempt > 0 ? ` (retry ${attempt})` : ''}`);

  try {
    const response = await fetch(url, {
      method: 'GET', headers: buildHeaders(), signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let body = '';
    try { body = await response.text(); } catch { /* ignora */ }

    if (!response.ok) {
      console.warn(`[BIBLIAAPI] HTTP ${response.status}\n${body.slice(0, 400)}`);
      const code =
        response.status === 401 || response.status === 403 ? 'UNAUTHORIZED' :
        response.status === 404 ? 'NOT_FOUND' :
        response.status === 429 ? 'RATE_LIMIT' : 'SERVER_ERROR';
      throw new ApiError(code, response.status, `HTTP ${response.status}: ${body.slice(0,300)}`);
    }

    try {
      return JSON.parse(body) as T;
    } catch {
      throw new ApiError('INVALID_RESPONSE', response.status, 'JSON inválido');
    }

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      const e = new ApiError('TIMEOUT', 0, `Timeout após ${API_REQUEST_TIMEOUT_MS}ms`);
      if (attempt < API_MAX_RETRIES) { await delay(API_RETRY_BASE_DELAY_MS * 2**attempt); return request<T>(endpoint, attempt+1); }
      throw e;
    }

    if (error instanceof ApiError) {
      if (error.isNetworkRelated && attempt < API_MAX_RETRIES) {
        await delay(API_RETRY_BASE_DELAY_MS * 2**attempt); return request<T>(endpoint, attempt+1);
      }
      throw error;
    }

    const e = new ApiError('NETWORK_ERROR', 0,
      `Falha: ${error instanceof Error ? error.message : String(error)}`, error);
    if (attempt < API_MAX_RETRIES) { await delay(API_RETRY_BASE_DELAY_MS * 2**attempt); return request<T>(endpoint, attempt+1); }
    throw e;
  }
}

// ─── Cliente público ──────────────────────────

export const BibleApiClient = {

  async getVersions(): Promise<ApiVersionItem[]> {
    return request<ApiVersionItem[]>(Endpoints.versions());
  },

  async getBooks(): Promise<ApiBookListItem[]> {
    return request<ApiBookListItem[]>(Endpoints.books());
  },

  async getChapterVerses(version: string, bookSlug: string, chapter: number): Promise<ApiChapterResponse> {
    const raw = await request<unknown>(
      Endpoints.chapterFull(toApiVersion(version), toAbbrev(bookSlug), chapter),
    );
    return normalizeChapterResponse(raw);
  },

  async getVerse(version: string, bookSlug: string, chapter: number, verse: number): Promise<ApiVerseResponse> {
    return request<ApiVerseResponse>(
      Endpoints.verse(toApiVersion(version), toAbbrev(bookSlug), chapter, verse),
    );
  },

  async getRandom(version: string): Promise<ApiVerseResponse> {
    return request<ApiVerseResponse>(Endpoints.random(toApiVersion(version)));
  },

  async search(query: string, version: string): Promise<ApiSearchResponse> {
    if (!query.trim()) return { verses: [], occurrence: 0 };
    return request<ApiSearchResponse>(Endpoints.search(query.trim(), toApiVersion(version)));
  },

  async healthCheck(): Promise<{ ok: boolean; detail?: string }> {
    try {
      await BibleApiClient.getVersions();
      return { ok: true };
    } catch (e) {
      const err = e as ApiError;
      return { ok: false, detail: `${err.code}: ${err.message}` };
    }
  },

} as const;