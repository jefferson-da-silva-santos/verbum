/**
 * FIX 6 — app/(app)/modals/verse-compare.tsx
 *
 * Adiciona filtro de versões por chips no topo.
 * Por padrão todas estão selecionadas. O usuário pode desmarcar
 * versões que não quer ver.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Share, StatusBar,
} from 'react-native';
import { useSafeAreaInsets }            from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons }       from '@expo/vector-icons';

import { useTheme }                from '../../../src/context/ThemeContext';
import { BibleApiClient }          from '../../../src/api/bibliaApi';
import { BIBLIA_API_BASE_URL }     from '../../../src/api/endpoints';

// ─── Versões conhecidas com metadados ────────

const KNOWN_VERSIONS = [
  { code: 'ACF', name: 'Almeida Corrigida Fiel',      color: '#8B6340' },
  { code: 'NVI', name: 'Nova Versão Internacional',    color: '#4A7C59' },
  { code: 'ARA', name: 'Almeida Revista e Atualizada', color: '#4A5C8B' },
  { code: 'NAA', name: 'Nova Almeida Atualizada',      color: '#7A4A8B' },
  { code: 'KJV', name: 'King James Version',           color: '#8B4A4A' },
  { code: 'BBE', name: 'Bible in Basic English',       color: '#4A8B7A' },
];

type VersionMeta = typeof KNOWN_VERSIONS[number];

interface VersionResult extends VersionMeta {
  text:   string | null;
  status: 'loading' | 'done' | 'error';
}

let _cachedVersions: VersionMeta[] | null = null;

async function resolveVersions(): Promise<VersionMeta[]> {
  if (_cachedVersions) return _cachedVersions;
  try {
    const res = await fetch(`${BIBLIA_API_BASE_URL}/versions`, {
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_BIBLIA_API_KEY ?? ''}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const arr: unknown[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data) ? json.data : [];
    if (arr.length === 0) throw new Error('Vazio');
    const knownMap = Object.fromEntries(KNOWN_VERSIONS.map(v => [v.code, v]));
    const mapped = arr
      .map((item: any) => {
        const code = (item?.version ?? item?.code ?? String(item)).toUpperCase().trim();
        return knownMap[code] ?? { code, name: code, color: '#8B6340' };
      })
      .filter(v => v.code.length > 0);
    _cachedVersions = mapped.length > 0 ? mapped : KNOWN_VERSIONS;
  } catch {
    _cachedVersions = KNOWN_VERSIONS;
  }
  return _cachedVersions;
}

// ─── Modal principal ─────────────────────────

export default function VerseCompareModal() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();

  const {
    bookSlug  = 'gn',
    bookName  = '',
    chapter:  chParam    = '1',
    verse:    vParam     = '1',
    reference = '',
  } = useLocalSearchParams<{
    bookSlug: string; bookName: string;
    chapter: string; verse: string; reference: string;
  }>();

  const chapterNum = parseInt(chParam, 10) || 1;
  const verseNum   = parseInt(vParam,  10) || 1;
  const ref        = reference || `${String(bookName)} ${chapterNum}:${verseNum}`;

  const [allVersions,     setAllVersions]     = useState<VersionMeta[]>([]);
  const [selectedCodes,   setSelectedCodes]   = useState<Set<string>>(new Set());
  const [results,         setResults]         = useState<VersionResult[]>([]);
  const [isBooting,       setIsBooting]       = useState(true);

  // ── Inicialização ───────────────────────────

  const fetchAll = useCallback(async () => {
    setIsBooting(true);
    setResults([]);

    const versions = await resolveVersions();
    setAllVersions(versions);

    // Por padrão, todas selecionadas
    setSelectedCodes(new Set(versions.map(v => v.code)));

    const initial: VersionResult[] = versions.map(v => ({
      ...v, text: null, status: 'loading',
    }));
    setResults(initial);
    setIsBooting(false);

    // Busca em paralelo
    versions.forEach(v => {
      BibleApiClient
        .getVerse(v.code, String(bookSlug), chapterNum, verseNum)
        .then(res => {
          const raw  = res as any;
          const text: string = raw?.text ?? raw?.verse?.text ?? raw?.data?.text ?? '';
          setResults(prev => prev.map(r =>
            r.code === v.code
              ? { ...r, text: text || null, status: text ? 'done' : 'error' }
              : r,
          ));
        })
        .catch(() => {
          setResults(prev => prev.map(r =>
            r.code === v.code ? { ...r, status: 'error' } : r,
          ));
        });
    });
  }, [bookSlug, chapterNum, verseNum]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Toggle de versão ────────────────────────

  const toggleVersion = (code: string) => {
    setSelectedCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        // Impede desmarcar a última selecionada
        if (next.size === 1) return prev;
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedCodes(new Set(allVersions.map(v => v.code)));
  };

  // ── Resultados filtrados ─────────────────────

  const filtered = results.filter(r =>
    selectedCodes.has(r.code) && r.status !== 'error',
  );

  const doneCount    = filtered.filter(r => r.status === 'done').length;
  const loadingCount = filtered.filter(r => r.status === 'loading').length;

  const shareVerse = async (version: string, text: string) => {
    await Share.share({
      message: `${ref}\n\n"${text}"\n\n— ${version} via Verbum`,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: tokens.borderLight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>
            Comparar versões
          </Text>
          <Text style={{ fontSize: 13, color: tokens.textTertiary }}>{ref}</Text>
        </View>
        <TouchableOpacity
          onPress={() => { _cachedVersions = null; fetchAll(); }}
          style={{ padding: 4 }}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={tokens.iconPrimary} />
        </TouchableOpacity>
      </View>

      {isBooting ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <ActivityIndicator size="large" color={tokens.actionPrimary} />
          <Text style={{ fontSize: 14, color: tokens.textTertiary }}>
            Preparando versões…
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 40,
          }}
        >
          {/* ── FIX 6: Filtro de versões ─────────── */}
          <View style={{ padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{
                fontSize: 12, fontWeight: '600', color: tokens.textTertiary,
                textTransform: 'uppercase', letterSpacing: 0.8, flex: 1,
              }}>
                Filtrar versões
              </Text>
              {selectedCodes.size < allVersions.length && (
                <TouchableOpacity onPress={selectAll}>
                  <Text style={{ fontSize: 12, color: tokens.actionPrimary }}>
                    Selecionar todas
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {allVersions.map(v => {
                const selected = selectedCodes.has(v.code);
                const result   = results.find(r => r.code === v.code);
                const isLoading = result?.status === 'loading';

                return (
                  <TouchableOpacity
                    key={v.code}
                    onPress={() => toggleVersion(v.code)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 20,
                      backgroundColor: selected ? v.color : tokens.bgCard,
                      borderWidth: 1.5,
                      borderColor: selected ? v.color : tokens.borderLight,
                      gap: 6,
                    }}
                  >
                    {isLoading && selected && (
                      <ActivityIndicator size="small" color="white" />
                    )}
                    {!isLoading && (
                      <MaterialCommunityIcons
                        name={selected ? 'check-circle' : 'circle-outline'}
                        size={14}
                        color={selected ? 'white' : tokens.iconMuted}
                      />
                    )}
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: selected ? 'white' : tokens.textSecondary,
                      letterSpacing: 0.5,
                    }}>
                      {v.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Status */}
            <Text style={{ fontSize: 11, color: tokens.textDisabled }}>
              {selectedCodes.size} versão{selectedCodes.size !== 1 ? 'ões' : ''} selecionada{selectedCodes.size !== 1 ? 's' : ''}
              {loadingCount > 0 ? ` · ${loadingCount} carregando…` : ''}
              {doneCount > 0 ? ` · ${doneCount} pronta${doneCount !== 1 ? 's' : ''}` : ''}
            </Text>
          </View>

          {/* ── Cartões de versão ─────────────────── */}
          <View style={{ paddingHorizontal: 16, gap: 14 }}>
            {filtered.map(result => (
              <VersionCard
                key={result.code}
                result={result}
                reference={ref}
                onShare={() => result.text && shareVerse(result.code, result.text)}
              />
            ))}

            {filtered.length === 0 && !isBooting && (
              <View style={{ alignItems: 'center', padding: 32, gap: 12 }}>
                <MaterialCommunityIcons
                  name="filter-remove-outline"
                  size={48}
                  color={tokens.iconMuted}
                />
                <Text style={{ fontSize: 15, color: tokens.textTertiary, textAlign: 'center' }}>
                  Nenhuma versão selecionada.{'\n'}
                  Toque nos chips acima para selecionar.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Cartão individual ───────────────────────

function VersionCard({
  result, reference, onShare,
}: {
  result:    VersionResult;
  reference: string;
  onShare:   () => void;
}) {
  const { tokens } = useTheme();

  return (
    <View style={{
      borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: tokens.borderLight,
      backgroundColor: tokens.bgCard,
    }}>
      {/* Faixa */}
      <View style={{
        backgroundColor: result.color,
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, paddingHorizontal: 16, gap: 8,
      }}>
        <MaterialCommunityIcons name="book-open-variant" size={16} color="white" />
        <Text style={{ fontSize: 13, fontWeight: '700', color: 'white', letterSpacing: 1 }}>
          {result.code}
        </Text>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', flex: 1 }}>
          {result.name}
        </Text>
        {result.status === 'done' && result.text && (
          <TouchableOpacity onPress={onShare} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="share-variant-outline" size={18} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Texto */}
      <View style={{ padding: 18 }}>
        {result.status === 'loading' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator size="small" color={result.color} />
            <Text style={{ fontSize: 13, color: tokens.textTertiary }}>Carregando…</Text>
          </View>
        ) : result.status === 'done' && result.text ? (
          <>
            <Text style={{
              fontSize: 17, lineHeight: 30, color: tokens.textVerse,
              fontFamily: 'serif', fontStyle: 'italic',
            }}>
             {`"${result.text}"`}
            </Text>
            <Text style={{
              fontSize: 11, color: tokens.textDisabled,
              marginTop: 12, textAlign: 'right',
            }}>
              {reference} · {result.code}
            </Text>
          </>
        ) : (
          <Text style={{ fontSize: 13, color: tokens.textDisabled, fontStyle: 'italic' }}>
            Não disponível nesta versão.
          </Text>
        )}
      </View>
    </View>
  );
}