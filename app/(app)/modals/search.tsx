/**
 * VERBUM — app/(app)/modals/search.tsx  [CORRIGIDO]
 *
 * FIX: A BIBLIAAPI v2 retorna resultados em { data: { results: [...] } }
 *      O código anterior lia response.results (sem o .data) → array undefined → nada exibido
 *
 * Estrutura real da resposta:
 * {
 *   "data": {
 *     "query": "Ti",
 *     "version": "ACF",
 *     "limit": 30,
 *     "offset": 0,
 *     "results": [
 *       { "reference": "Gênesis 1:21", "book": {...}, "chapter": 1, "verse": 21, "text": "..." },
 *       ...
 *     ]
 *   }
 * }
 */

import { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router }            from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme }       from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';

// ─── Tipos da resposta da BIBLIAAPI v2 ────────────────────────────

interface SearchResultItem {
  reference: string;
  book: {
    id:        number;
    name:      string;
    abbrev:    string;
    testament: 'VT' | 'NT';
  };
  chapter: number;
  verse:   number;
  text:    string;
}

interface SearchApiResponse {
  data: {
    query:   string;
    version: string;
    limit:   number;
    offset:  number;
    results: SearchResultItem[];
  };
}

// ─── Extrator defensivo dos resultados ───────────────────────────

function extractResults(raw: unknown): SearchResultItem[] {
  if (!raw || typeof raw !== 'object') return [];
  const r = raw as Record<string, any>;

  // Formato real: { data: { results: [...] } }
  if (Array.isArray(r?.data?.results)) return r.data.results;

  // Fallbacks para outros formatos possíveis
  if (Array.isArray(r?.results))       return r.results;
  if (Array.isArray(r?.data))          return r.data;
  if (Array.isArray(r))                return r as SearchResultItem[];

  return [];
}

// ─── Componente ──────────────────────────────────────────────────

export default function SearchModal() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  const { user }   = useAuthContext();

  const version = ((user?.preferredVersion ?? 'acf') as string).toUpperCase();

  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState<SearchResultItem[]>([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [searched,   setSearched]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Busca ──────────────────────────────────────────────────────

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    Keyboard.dismiss();

    try {
      const url = `https://bibliaapi.com.br/api/v2/versions/${version}/search?q=${encodeURIComponent(q.trim())}&limit=30`;
      console.log('[Search] URL:', url);

      const res = await fetch(url, {
        headers: {
          Accept:        'application/json',
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_BIBLIA_API_KEY ?? ''}`,
        },
      });

      console.log('[Search] Status:', res.status);

      if (!res.ok) {
        setError(`Erro ${res.status} ao buscar.`);
        setResults([]);
        setSearched(true);
        return;
      }

      const raw = await res.json();
      console.log('[Search] Versículos encontrados:', raw?.data?.results?.length ?? 0);

      // FIX: usa o extrator defensivo
      const items = extractResults(raw);
      setResults(items);
      setSearched(true);

    } catch (e) {
      console.error('[Search] Erro:', e);
      setError('Sem conexão. Verifique sua internet.');
      setResults([]);
      setSearched(true);
    } finally {
      setIsLoading(false);
    }
  }, [version]);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 500);
  };

  const handleSubmit = () => doSearch(query);

  const openVerse = (item: SearchResultItem) => {
    router.push(
      `/(app)/modals/chapter-reader?bookSlug=${item.book.abbrev}&chapter=${item.chapter}`,
    );
  };

  // ─── UI ─────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>

      {/* Header + campo de busca */}
      <View style={{
        paddingTop:        8,
        paddingHorizontal: 16,
        paddingBottom:     12,
        borderBottomWidth: 1,
        borderBottomColor: tokens.borderLight,
        gap: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>
            Pesquisar
          </Text>
        </View>

        <View style={{
          flexDirection:   'row',
          alignItems:      'center',
          backgroundColor: tokens.bgCard,
          borderRadius:    14,
          borderWidth:     1,
          borderColor:     tokens.borderMedium,
          paddingHorizontal: 14,
          gap:             10,
        }}>
          <MaterialCommunityIcons name="magnify" size={20} color={tokens.iconMuted} />
          <TextInput
            value={query}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmit}
            placeholder="Buscar versículos..."
            placeholderTextColor={tokens.textDisabled}
            returnKeyType="search"
            autoFocus
            style={{
              flex:     1,
              fontSize: 15,
              color:    tokens.textPrimary,
              paddingVertical: 12,
            }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <MaterialCommunityIcons name="close-circle" size={18} color={tokens.iconMuted} />
            </TouchableOpacity>
          )}
        </View>

        {searched && !isLoading && (
          <Text style={{ fontSize: 12, color: tokens.textTertiary }}>
            {results.length > 0
              ? `${results.length} resultado${results.length > 1 ? 's' : ''} para "${query}"`
              : `Nenhum resultado para "${query}"`}
          </Text>
        )}
      </View>

      {/* Estado de carregamento */}
      {isLoading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <ActivityIndicator size="large" color={tokens.actionPrimary} />
          <Text style={{ fontSize: 14, color: tokens.textTertiary }}>Buscando...</Text>
        </View>
      )}

      {/* Erro */}
      {!isLoading && error && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <MaterialCommunityIcons name="wifi-off" size={48} color={tokens.iconMuted} />
          <Text style={{ fontSize: 15, color: tokens.textSecondary, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={handleSubmit} style={{ paddingVertical: 10, paddingHorizontal: 24, backgroundColor: tokens.actionPrimary, borderRadius: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.actionPrimaryText }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sem resultados */}
      {!isLoading && !error && searched && results.length === 0 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <MaterialCommunityIcons name="text-search" size={52} color={tokens.iconMuted} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: tokens.textPrimary }}>Nenhum resultado</Text>
          <Text style={{ fontSize: 14, color: tokens.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            Tente outras palavras. A pesquisa busca no texto completo da Bíblia ({version}).
          </Text>
        </View>
      )}

      {/* Estado inicial */}
      {!isLoading && !error && !searched && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
          <MaterialCommunityIcons name="book-search-outline" size={52} color={tokens.iconMuted} />
          <Text style={{ fontSize: 15, color: tokens.textTertiary, textAlign: 'center', lineHeight: 22 }}>
            Digite pelo menos 2 letras para buscar versículos na versão {version}.
          </Text>
        </View>
      )}

      {/* Resultados */}
      {!isLoading && !error && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item, i) => `${item.book.abbrev}-${item.chapter}-${item.verse}-${i}`}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            // Destaca o termo pesquisado no texto
            const lowerText  = item.text.toLowerCase();
            const lowerQuery = query.toLowerCase().trim();
            const matchIdx   = lowerText.indexOf(lowerQuery);

            return (
              <TouchableOpacity
                onPress={() => openVerse(item)}
                style={{
                  padding:           16,
                  borderBottomWidth: 1,
                  borderBottomColor: tokens.borderLight,
                  gap:               6,
                }}
              >
                {/* Referência */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.actionPrimary }}>
                    {item.reference}
                  </Text>
                  <View style={{
                    paddingHorizontal: 8, paddingVertical: 2,
                    borderRadius:      10,
                    backgroundColor:   item.book.testament === 'VT' ? '#8B6340' + '20' : '#4A5C8B' + '20',
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: item.book.testament === 'VT' ? '#8B6340' : '#4A5C8B' }}>
                      {item.book.testament === 'VT' ? 'AT' : 'NT'}
                    </Text>
                  </View>
                </View>

                {/* Texto com destaque do termo */}
                {matchIdx >= 0 ? (
                  <Text style={{ fontSize: 14, color: tokens.textPrimary, lineHeight: 22, fontFamily: 'serif' }}>
                    {item.text.slice(0, matchIdx)}
                    <Text style={{ backgroundColor: tokens.actionPrimary + '30', color: tokens.actionPrimary, fontWeight: '700' }}>
                      {item.text.slice(matchIdx, matchIdx + lowerQuery.length)}
                    </Text>
                    {item.text.slice(matchIdx + lowerQuery.length)}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 14, color: tokens.textPrimary, lineHeight: 22, fontFamily: 'serif' }}>
                    {item.text}
                  </Text>
                )}

                {/* Abrir capítulo */}
                <Text style={{ fontSize: 11, color: tokens.textDisabled }}>
                  Toque para abrir {item.book.name} {item.chapter}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}