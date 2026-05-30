/**
 * VERBUM — app/(app)/modals/verse-compare.tsx
 *
 * COLE EM: app/(app)/modals/verse-compare.tsx
 *
 * FIX: O GET /versions estava quebrando o modal inteiro.
 * Solução: lista de versões conhecidas hardcoded como fallback.
 * A API /versions é tentada mas nunca bloqueia a tela se falhar.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Share, StatusBar,
} from 'react-native';
import { useSafeAreaInsets }            from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons }       from '@expo/vector-icons';

import { useTheme }       from '../../../src/context/ThemeContext';
import { BibleApiClient } from '../../../src/api/bibliaApi';
import { BIBLIA_API_BASE_URL } from '../../../src/api/endpoints';

// ─────────────────────────────────────────────
// VERSÕES CONHECIDAS DA BIBLIAAPI
// Usadas como fallback se GET /versions falhar ou retornar formato inesperado.
// Adicione ou remova conforme o seu plano.
// ─────────────────────────────────────────────

const KNOWN_VERSIONS: VersionMeta[] = [
  { code: 'ACF',  name: 'Almeida Corrigida Fiel',       color: '#8B6340' },
  { code: 'NVI',  name: 'Nova Versão Internacional',     color: '#4A7C59' },
  { code: 'ARA',  name: 'Almeida Revista e Atualizada',  color: '#4A5C8B' },
  { code: 'NAA',  name: 'Nova Almeida Atualizada',       color: '#7A4A8B' },
  { code: 'KJV',  name: 'King James Version',            color: '#8B4A4A' },
  { code: 'BBE',  name: 'Bible in Basic English',        color: '#4A8B7A' },
];

interface VersionMeta {
  code:  string;
  name:  string;
  color: string;
}

// ─────────────────────────────────────────────
// RESULTADO POR VERSÃO
// ─────────────────────────────────────────────

interface VersionResult extends VersionMeta {
  text:      string | null;
  status:    'loading' | 'done' | 'error' | 'unavailable';
}

// ─────────────────────────────────────────────
// BUSCA DE VERSÕES DISPONÍVEIS (com fallback)
// ─────────────────────────────────────────────

let _cachedVersions: VersionMeta[] | null = null;

async function resolveVersions(): Promise<VersionMeta[]> {
  if (_cachedVersions) return _cachedVersions;

  try {
    const raw = await fetch(`${BIBLIA_API_BASE_URL}/versions`, {
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_BIBLIA_API_KEY ?? ''}`,
        Accept: 'application/json',
      },
    });

    if (!raw.ok) throw new Error(`HTTP ${raw.status}`);

    const json = await raw.json();

    // Extrai o array independente do formato de resposta
    const arr: unknown[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
        ? json.data
        : [];

    if (arr.length === 0) throw new Error('Array vazio');

    // Mapeia para VersionMeta, usando KNOWN_VERSIONS para cores e nomes completos
    const knownMap = Object.fromEntries(KNOWN_VERSIONS.map(v => [v.code, v]));
    const mapped: VersionMeta[] = arr
      .map((item: any) => {
        const code = (item?.version ?? item?.code ?? item?.name ?? String(item))
          .toUpperCase()
          .trim();
        return {
          code,
          name:  knownMap[code]?.name  ?? code,
          color: knownMap[code]?.color ?? '#8B6340',
        };
      })
      .filter(v => v.code.length > 0);

    _cachedVersions = mapped.length > 0 ? mapped : KNOWN_VERSIONS;
  } catch (e) {
    console.warn('[VerseCompare] GET /versions falhou, usando lista hardcoded:', e);
    _cachedVersions = KNOWN_VERSIONS;
  }

  return _cachedVersions;
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

export default function VerseCompareModal() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();

  const {
    bookSlug  = 'gn',
    bookName  = '',
    chapter:  chParam = '1',
    verse:    vParam  = '1',
    reference = '',
  } = useLocalSearchParams<{
    bookSlug:  string;
    bookName:  string;
    chapter:   string;
    verse:     string;
    reference: string;
  }>();

  const chapterNum = parseInt(chParam, 10) || 1;
  const verseNum   = parseInt(vParam,  10) || 1;
  const ref        = reference || `${String(bookName)} ${chapterNum}:${verseNum}`;

  const [results, setResults] = useState<VersionResult[]>([]);
  const [isBooting, setIsBooting] = useState(true);

  // ── Inicializa e busca em paralelo ──────────

  const fetchAll = useCallback(async () => {
    setIsBooting(true);
    setResults([]);

    // 1. Descobre as versões (com fallback garantido)
    const versions = await resolveVersions();

    // 2. Inicializa todos os cards como "loading"
    const initial: VersionResult[] = versions.map(v => ({
      ...v,
      text:   null,
      status: 'loading',
    }));
    setResults(initial);
    setIsBooting(false);

    // 3. Busca em paralelo — cada card atualiza individualmente
    versions.forEach(v => {
      BibleApiClient
        .getVerse(v.code, String(bookSlug), chapterNum, verseNum)
        .then(res => {
          // Extrai o texto de forma defensiva
          const raw = res as any;
          const text: string =
            raw?.text    ??
            raw?.verse?.text ??
            raw?.data?.text  ??
            '';

          setResults(prev => prev.map(r =>
            r.code === v.code
              ? { ...r, text: text || null, status: text ? 'done' : 'unavailable' }
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

  // ── Métricas ─────────────────────────────────

  const done        = results.filter(r => r.status === 'done');
  const loading     = results.filter(r => r.status === 'loading');
  const unavailable = results.filter(r => r.status === 'error' || r.status === 'unavailable');

  // ── Compartilhar ─────────────────────────────

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
          <Text style={{
            fontSize: 16, fontWeight: '700', color: tokens.textPrimary,
          }}>
            Comparar versões
          </Text>
          <Text style={{ fontSize: 13, color: tokens.textTertiary }}>
            {ref}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => { _cachedVersions = null; fetchAll(); }}
          style={{ padding: 4 }}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={tokens.iconPrimary} />
        </TouchableOpacity>
      </View>

      {/* Carregando lista de versões */}
      {isBooting ? (
        <View style={{
          flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14,
        }}>
          <ActivityIndicator size="large" color={tokens.actionPrimary} />
          <Text style={{ fontSize: 14, color: tokens.textTertiary }}>
            Preparando versões…
          </Text>
        </View>

      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
            gap: 14,
            paddingBottom: insets.bottom + 40,
          }}
        >
          {/* Status geral */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            {loading.length > 0 && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: tokens.bgCard, borderRadius: 20,
                paddingVertical: 5, paddingHorizontal: 12,
                borderWidth: 1, borderColor: tokens.borderLight,
              }}>
                <ActivityIndicator size="small" color={tokens.actionPrimary} />
                <Text style={{ fontSize: 12, color: tokens.textTertiary }}>
                  {loading.length} carregando…
                </Text>
              </View>
            )}
            {done.length > 0 && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: tokens.successBg, borderRadius: 20,
                paddingVertical: 5, paddingHorizontal: 12,
              }}>
                <MaterialCommunityIcons name="check" size={14} color={tokens.success} />
                <Text style={{ fontSize: 12, color: tokens.success, fontWeight: '600' }}>
                  {done.length} carregadas
                </Text>
              </View>
            )}
          </View>

          {/* Cartões */}
          {results
            .filter(r => r.status !== 'error' && r.status !== 'unavailable')
            .map(result => (
              <VersionCard
                key={result.code}
                result={result}
                reference={ref}
                onShare={() => result.text && shareVerse(result.code, result.text)}
              />
            ))
          }

          {/* Indisponíveis */}
          {unavailable.length > 0 && (
            <View style={{
              backgroundColor: tokens.bgSecondary,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: tokens.borderLight,
            }}>
              <Text style={{
                fontSize: 12, color: tokens.textDisabled, textAlign: 'center',
              }}>
                Não disponível em:{' '}
                {unavailable.map(r => r.code).join(', ')}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// CARTÃO DE VERSÃO
// ─────────────────────────────────────────────

function VersionCard({
  result,
  reference,
  onShare,
}: {
  result:    VersionResult;
  reference: string;
  onShare:   () => void;
}) {
  const { tokens } = useTheme();
  const { code, name, color, text, status } = result;

  return (
    <View style={{
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: tokens.borderLight,
      backgroundColor: tokens.bgCard,
    }}>
      {/* Faixa da versão */}
      <View style={{
        backgroundColor: color,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 8,
      }}>
        <MaterialCommunityIcons name="book-open-variant" size={16} color="white" />
        <Text style={{
          fontSize: 13, fontWeight: '700', color: 'white', letterSpacing: 1,
        }}>
          {code}
        </Text>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', flex: 1 }}>
          {name}
        </Text>
        {status === 'done' && text && (
          <TouchableOpacity onPress={onShare} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="share-variant-outline" size={18} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Conteúdo */}
      <View style={{ padding: 18 }}>
        {status === 'loading' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator size="small" color={color} />
            <Text style={{ fontSize: 13, color: tokens.textTertiary }}>
              Carregando…
            </Text>
          </View>

        ) : status === 'done' && text ? (
          <>
            <Text style={{
              fontSize: 17,
              lineHeight: 30,
              color: tokens.textVerse,
              fontFamily: 'serif',
              fontStyle: 'italic',
            }}>
             {`"${text}"`}
            </Text>
            <Text style={{
              fontSize: 11,
              color: tokens.textDisabled,
              marginTop: 12,
              textAlign: 'right',
              letterSpacing: 0.3,
            }}>
              {reference} · {code}
            </Text>
          </>

        ) : (
          <Text style={{
            fontSize: 13, color: tokens.textDisabled, fontStyle: 'italic',
          }}>
            Versículo não encontrado nesta versão.
          </Text>
        )}
      </View>
    </View>
  );
}