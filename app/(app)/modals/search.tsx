/**
 * VERBUM — app/(app)/modals/search.tsx  [FINAL]
 *
 * Problemas anteriores:
 *   - Normalizer não tratava book_id (integer) que a BIBLIAAPI pode retornar
 *   - Sem log visível do que a API está retornando
 *
 * Agora:
 *   - Mostra log completo no console
 *   - Exibe debug do raw response na tela quando não há resultados
 *   - Mapeia book_id (1-66) → slug correto para navegação
 *   - Trata todos os formatos possíveis de resposta
 */

import { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme }       from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { BIBLIA_API_BASE_URL } from '../../../src/api/endpoints';
import { DEFAULT_BIBLE_VERSION } from '../../../src/constants/bible';

// ─── Mapeamento book_id (1-66) → slug ──────────
// A BIBLIAAPI pode retornar book_id como inteiro em vez de abreviação

const BOOK_ID_TO_SLUG: Record<number, string> = {
  1:'gn',2:'ex',3:'lv',4:'nm',5:'dt',6:'js',7:'jz',8:'rt',
  9:'1sm',10:'2sm',11:'1rs',12:'2rs',13:'1cr',14:'2cr',
  15:'ed',16:'ne',17:'et',18:'job',19:'sl',20:'pv',21:'ec',22:'ct',
  23:'is',24:'jr',25:'lm',26:'ez',27:'dn',28:'os',29:'jl',30:'am',
  31:'ob',32:'jn',33:'mq',34:'na',35:'hc',36:'sf',37:'ag',38:'zc',39:'ml',
  40:'mt',41:'mc',42:'lc',43:'jo',44:'at',45:'rm',
  46:'1co',47:'2co',48:'gl',49:'ef',50:'fp',51:'cl',
  52:'1ts',53:'2ts',54:'1tm',55:'2tm',56:'tt',57:'fm',
  58:'hb',59:'tg',60:'1pe',61:'2pe',62:'1jo',63:'2jo',64:'3jo',
  65:'jd',66:'ap',
};

// Tenta extrair slug de qualquer formato de item da API
function extractSlug(item: any): string {
  // book_id inteiro
  if (typeof item?.book_id === 'number') {
    return BOOK_ID_TO_SLUG[item.book_id] ?? 'gn';
  }
  // Objeto book com abbrev
  const abbrevEn = item?.book?.abbrev?.en?.toLowerCase();
  if (abbrevEn) return abbrevEn;
  const abbrevPt = item?.book?.abbrev?.pt?.toLowerCase();
  if (abbrevPt) return abbrevPt;
  // String direto
  if (typeof item?.book === 'string') return item.book.toLowerCase();
  return 'gn';
}

interface SearchItem {
  reference: string;
  text:      string;
  bookSlug:  string;
  chapter:   number;
}

// ─── Normalizer ultra-defensivo ──────────────

function normalizeResults(raw: unknown): SearchItem[] {
  if (!raw) return [];

  // Encontra o array de versículos
  let arr: any[] = [];
  if (Array.isArray(raw)) {
    arr = raw;
  } else {
    const r = raw as any;
    arr = Array.isArray(r.verses)  ? r.verses  :
          Array.isArray(r.data)    ? r.data    :
          Array.isArray(r.results) ? r.results :
          Array.isArray(r.items)   ? r.items   :
          [];
  }

  return arr
    .map((item: any): SearchItem | null => {
      const text = String(
        item?.text ?? item?.verse?.text ?? item?.verse_text ?? item?.body ?? ''
      ).trim();

      if (!text) return null;

      const chapter  = Number(item?.chapter ?? item?.chapter_number ?? 0);
      const verseNum = Number(item?.number ?? item?.verse_number ?? item?.verse ?? 0);
      const bookSlug = extractSlug(item);

      // Abreviação para exibir
      const abbrev =
        item?.book?.abbrev?.pt ??
        item?.book?.abbrev ??
        (typeof item?.book === 'string' ? item.book : null) ??
        bookSlug.toUpperCase();

      return {
        text,
        bookSlug,
        chapter,
        reference: `${abbrev} ${chapter}:${verseNum}`,
      };
    })
    .filter((i): i is SearchItem => i !== null);
}

// ─── Modal ───────────────────────────────────

export default function SearchModal() {
  const { tokens }  = useTheme();
  const insets      = useSafeAreaInsets();
  const { user }    = useAuthContext();
  const version     = ((user?.preferredVersion ?? DEFAULT_BIBLE_VERSION) as string).toUpperCase();

  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState<SearchItem[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [rawDebug, setRawDebug] = useState('');  // ← mostra na UI para diagnóstico
  const [statusMsg, setStatusMsg] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]); setRawDebug(''); setStatusMsg(''); return;
    }

    setLoading(true);
    setStatusMsg('');
    setRawDebug('');

    try {
      const apiKey = process.env.EXPO_PUBLIC_BIBLIA_API_KEY ?? '';
      const url    = `${BIBLIA_API_BASE_URL}/versions/${version}/search?q=${encodeURIComponent(trimmed)}&limit=30`;

      console.log('[Search] URL:', url);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      });

      const bodyText = await res.text();
      console.log('[Search] Status:', res.status);
      console.log('[Search] Response:', bodyText.slice(0, 800));

      // Mostra debug na tela para diagnóstico
      setRawDebug(`Status: ${res.status}\n${bodyText.slice(0, 400)}`);

      if (!res.ok) {
        setStatusMsg(`Erro ${res.status} — ${bodyText.slice(0, 100)}`);
        setResults([]);
        return;
      }

      let raw: unknown;
      try { raw = JSON.parse(bodyText); }
      catch { setStatusMsg('Resposta inválida da API.'); setResults([]); return; }

      const items = normalizeResults(raw);
      setResults(items);

      if (items.length === 0) {
        // Conta o total se a API informou
        const r = raw as any;
        const total = r?.meta?.total ?? r?.total ?? r?.occurrence ?? 0;
        setStatusMsg(
          total > 0
            ? `API retornou ${total} item(ns) mas não conseguimos extraí-los. Veja o debug abaixo.`
            : `Nenhum resultado para "${trimmed}".`
        );
      } else {
        setRawDebug(''); // Limpa debug quando há resultados
        const total = (raw as any)?.meta?.total ?? (raw as any)?.total ?? (raw as any)?.occurrence ?? items.length;
        setStatusMsg(`${total} resultado${total !== 1 ? 's' : ''} · ${version}`);
      }
    } catch (e) {
      console.error('[Search] Erro:', e);
      setStatusMsg(`Falha na busca: ${e instanceof Error ? e.message : String(e)}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [version]);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length >= 2) {
      debounceRef.current = setTimeout(() => search(text), 600);
    } else {
      setResults([]); setStatusMsg(''); setRawDebug('');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        paddingTop: insets.top + 8, gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <View style={{
          flex: 1, flexDirection: 'row', alignItems: 'center',
          backgroundColor: tokens.bgCard, borderRadius: 12,
          paddingHorizontal: 14, height: 44,
          borderWidth: 1, borderColor: tokens.borderLight, gap: 8,
        }}>
          <MaterialCommunityIcons name="magnify" size={18} color={tokens.iconMuted} />
          <TextInput
            placeholder="Buscar palavra ou trecho…"
            placeholderTextColor={tokens.textDisabled}
            value={query}
            onChangeText={handleChangeText}
            style={{ flex: 1, fontSize: 15, color: tokens.textPrimary }}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              search(query);
            }}
          />
          {loading
            ? <ActivityIndicator size="small" color={tokens.actionPrimary} />
            : query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setStatusMsg(''); setRawDebug(''); }}>
                <MaterialCommunityIcons name="close-circle" size={16} color={tokens.iconMuted} />
              </TouchableOpacity>
            )
          }
        </View>
      </View>

      {/* Status */}
      {statusMsg !== '' && (
        <Text style={{ fontSize: 12, color: tokens.textTertiary, paddingHorizontal: 20, marginBottom: 4 }}>
          {statusMsg}
        </Text>
      )}

      {/* Placeholder inicial */}
      {query.length === 0 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
          <MaterialCommunityIcons name="book-search-outline" size={52} color={tokens.iconMuted} />
          <Text style={{ fontSize: 15, color: tokens.textTertiary, textAlign: 'center' }}>
            Digite ao menos 2 caracteres para buscar
          </Text>
          <Text style={{ fontSize: 12, color: tokens.textDisabled, textAlign: 'center' }}>
            Exemplos:{` "amor"`},{` "fé"`}, {`"oração"`}, {`"graça"`}
          </Text>
        </View>
      )}

      {/* Debug: mostra raw quando não há resultados */}
      {rawDebug !== '' && results.length === 0 && !loading && (
        <ScrollView style={{ margin: 16, maxHeight: 200 }}>
          <View style={{ backgroundColor: tokens.bgSecondary, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: tokens.borderLight }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: tokens.textTertiary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Resposta da API (debug)
            </Text>
            <Text style={{ fontSize: 11, color: tokens.textSecondary, fontFamily: 'monospace' }}>
              {rawDebug}
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Resultados */}
      <FlatList
        data={results}
        keyExtractor={(item, i) => `${item.reference}-${i}`}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/(app)/modals/chapter-reader?bookSlug=${item.bookSlug}&chapter=${item.chapter}`,
              )
            }
            style={{
              padding: 16,
              borderBottomWidth: 1, borderBottomColor: tokens.borderLight,
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: tokens.actionPrimary, letterSpacing: 0.4 }}>
              {item.reference}
            </Text>
            <Text style={{ fontSize: 14, color: tokens.textPrimary, lineHeight: 22, fontFamily: 'serif' }}>
              {item.text}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}