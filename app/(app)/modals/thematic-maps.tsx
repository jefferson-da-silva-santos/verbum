/**
 * VERBUM — app/(app)/modals/thematic-maps.tsx
 * Lista e editor de Mapas Temáticos Interativos.
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme }       from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { ThematicMapRepository } from '@/src/database/repositories/ThematicMapRepository';
import type { ThematicMap, ThematicMapWithVerses, MapConnectionType } from '../../../src/database/types';
import { MAP_CONNECTION_LABELS, MAP_CONNECTION_COLORS } from '../../../src/database/types';
import { relativeDate } from '../../../src/utils/dateUtils';

const MAP_COLORS = ['#8B6340','#4A7C59','#4A5C8B','#7A4A8B','#8B4A4A','#4A8B7A','#8B8340'];

// ── Vista de detalhe de um mapa ────────────────────────────────────

function MapDetailView({ mapId, onBack }: { mapId: string; onBack: () => void }) {
  const { tokens } = useTheme();
  const [map, setMap] = useState<ThematicMapWithVerses | null>(null);

  const load = useCallback(async () => {
    const data = await ThematicMapRepository.findWithVerses(mapId);
    setMap(data);
  }, [mapId]);

  useEffect(() => { load(); }, [load]);

  const handleRemoveVerse = (verseId: string) => {
    Alert.alert('Remover versículo', 'Remover este versículo do mapa?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { await ThematicMapRepository.removeVerse(verseId); load(); } },
    ]);
  };

  const handleUpdateConnection = async (verseId: string, type: MapConnectionType) => {
    await ThematicMapRepository.updateVerse(verseId, { connectionType: type });
    load();
  };

  if (!map) return null;

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, gap: 10 }}>
        <TouchableOpacity onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: map.color }} />
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>{map.name}</Text>
        <Text style={{ fontSize: 12, color: tokens.textTertiary }}>{map.verses.length} vers.</Text>
      </View>

      {map.description && (
        <View style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: tokens.bgCard, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
          <Text style={{ fontSize: 13, color: tokens.textSecondary, lineHeight: 20 }}>{map.description}</Text>
        </View>
      )}

      <Text style={{ fontSize: 12, color: tokens.textDisabled, padding: 16, paddingBottom: 8 }}>
        Para adicionar versículos: no leitor, long press → {`"Adicionar ao mapa"`}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {map.verses.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40, gap: 14 }}>
            <MaterialCommunityIcons name="transit-connection-variant" size={52} color={tokens.iconMuted} />
            <Text style={{ fontSize: 15, color: tokens.textTertiary, textAlign: 'center' }}>Nenhum versículo conectado.</Text>
          </View>
        ) : (
          map.verses.map((v, i) => {
            const connColor = MAP_CONNECTION_COLORS[v.connectionType];
            return (
              <View key={v.id}>
                {/* Versículo */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 20 }}>
                  {/* Linha conectora */}
                  <View style={{ width: 20, alignItems: 'center', gap: 0 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: connColor, borderWidth: 2, borderColor: tokens.bgPrimary }} />
                    {i < map.verses.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: connColor + '40', minHeight: 30 }} />}
                  </View>

                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: tokens.actionPrimary }}>{v.bookName} {v.chapter}:{v.verse}</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: connColor + '20' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: connColor }}>{MAP_CONNECTION_LABELS[v.connectionType]}</Text>
                      </View>
                    </View>

                    {v.verseText && (
                      <Text style={{ fontSize: 13, color: tokens.textPrimary, fontFamily: 'serif', lineHeight: 20 }} numberOfLines={3}>{v.verseText}</Text>
                    )}

                    {v.note && <Text style={{ fontSize: 12, color: tokens.textTertiary, lineHeight: 18 }}>{v.note}</Text>}

                    {/* Alterar tipo de conexão */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingTop: 4 }}>
                      {(Object.keys(MAP_CONNECTION_LABELS) as MapConnectionType[]).map(ct => (
                        <TouchableOpacity key={ct} onPress={() => handleUpdateConnection(v.id, ct)}
                          style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10, backgroundColor: v.connectionType === ct ? MAP_CONNECTION_COLORS[ct] : tokens.bgCard, borderWidth: 1, borderColor: MAP_CONNECTION_COLORS[ct] }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: v.connectionType === ct ? 'white' : MAP_CONNECTION_COLORS[ct] }}>{MAP_CONNECTION_LABELS[ct]}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <TouchableOpacity onPress={() => handleRemoveVerse(v.id)} style={{ padding: 6 }}>
                    <MaterialCommunityIcons name="close" size={14} color={tokens.iconMuted} />
                  </TouchableOpacity>
                </View>

                {/* Divider entre versículos */}
                {i < map.verses.length - 1 && (
                  <View style={{ height: 1, backgroundColor: tokens.borderLight, marginLeft: 52 }} />
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ── Modal principal ────────────────────────────────────────────────

export default function ThematicMapsModal() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  const { user }   = useAuthContext();
  const { openMapId } = useLocalSearchParams<{ openMapId?: string }>();

  const [maps,      setMaps]      = useState<ThematicMap[]>([]);
  const [activeMap, setActiveMap] = useState<string | null>(openMapId ?? null);
  const [creating,  setCreating]  = useState(false);
  const [newName,   setNewName]   = useState('');
  const [newColor,  setNewColor]  = useState(MAP_COLORS[0]);

  const load = useCallback(async () => {
    if (!user) return;
    setMaps(await ThematicMapRepository.findAll(user.id));
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    const map = await ThematicMapRepository.create(user.id, newName.trim(), newColor);
    setCreating(false); setNewName(''); setNewColor(MAP_COLORS[0]);
    load();
    setActiveMap(map.id);
  };

  const handleDelete = (m: ThematicMap) => {
    Alert.alert('Excluir mapa', `Excluir "${m.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await ThematicMapRepository.delete(m.id); load(); setActiveMap(null); } },
    ]);
  };

  if (activeMap) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
        <MapDetailView mapId={activeMap} onBack={() => { setActiveMap(null); load(); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>Mapas Temáticos</Text>
          <Text style={{ fontSize: 12, color: tokens.textTertiary }}>{maps.length} mapa{maps.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity onPress={() => setCreating(true)} style={{ backgroundColor: tokens.actionPrimary, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.actionPrimaryText }}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {creating && (
        <View style={{ padding: 16, backgroundColor: tokens.bgCard, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, gap: 12 }}>
          <TextInput value={newName} onChangeText={setNewName} placeholder="Nome do tema (ex: Redenção, Fé, Criação)" placeholderTextColor={tokens.textDisabled}
            style={{ fontSize: 15, color: tokens.textPrimary, borderBottomWidth: 1, borderBottomColor: tokens.borderMedium, paddingBottom: 8 }} autoFocus />
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {MAP_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setNewColor(c)} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: newColor === c ? 3 : 0, borderColor: tokens.textPrimary }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => setCreating(false)} style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: tokens.borderMedium, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: tokens.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreate} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: tokens.actionPrimary, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.actionPrimaryText }}>Criar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={maps}
        keyExtractor={m => m.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        renderItem={({ item: m }) => (
          <TouchableOpacity onPress={() => setActiveMap(m.id)} onLongPress={() => handleDelete(m)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
            <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: m.color + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: m.color }}>
              <MaterialCommunityIcons name="transit-connection-variant" size={18} color={m.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.textPrimary }}>{m.name}</Text>
              {m.description && <Text style={{ fontSize: 12, color: tokens.textTertiary }} numberOfLines={1}>{m.description}</Text>}
              <Text style={{ fontSize: 11, color: tokens.textDisabled, marginTop: 2 }}>Atualizado {relativeDate(m.updatedAt)}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={tokens.iconMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={!creating ? (
          <View style={{ padding: 48, alignItems: 'center', gap: 16 }}>
            <MaterialCommunityIcons name="transit-connection-variant" size={56} color={tokens.iconMuted} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: tokens.textPrimary, textAlign: 'center' }}>Nenhum mapa temático</Text>
            <Text style={{ fontSize: 14, color: tokens.textSecondary, textAlign: 'center', lineHeight: 22 }}>Crie mapas conectando versículos por tema: Redenção, Fé, Criação, Aliança...</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}