/**
 * VERBUM — app/(app)/modals/sermon-list.tsx
 * Lista de sermões do Caderno do Pregador.
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme }       from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { SermonRepository } from '../../../src/database/repositories/SermonRepository';
import type { Sermon } from '../../../src/database/types';
import { SERMON_STATUS_LABELS, SERMON_STATUS_COLORS } from '../../../src/database/types';
import { relativeDate } from '../../../src/utils/dateUtils';

export default function SermonListModal() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  const { user }   = useAuthContext();

  const [sermons,  setSermons]  = useState<Sermon[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setSermons(await SermonRepository.findAll(user.id));
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!user || !newTitle.trim()) return;
    const sermon = await SermonRepository.create({ userId: user.id, title: newTitle.trim() });
    setCreating(false);
    setNewTitle('');
    router.push(`/(app)/modals/sermon-editor?sermonId=${sermon.id}`);
  };

  const handleDelete = (s: Sermon) => {
    Alert.alert('Excluir sermão', `Excluir "${s.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        await SermonRepository.delete(s.id); load();
      }},
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>Caderno do Pregador</Text>
          <Text style={{ fontSize: 12, color: tokens.textTertiary }}>{sermons.length} sermão{sermons.length !== 1 ? 'ões' : ''}</Text>
        </View>
        <TouchableOpacity onPress={() => setCreating(true)} style={{ backgroundColor: tokens.actionPrimary, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.actionPrimaryText }}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Campo de criação rápida */}
      {creating && (
        <View style={{ padding: 16, backgroundColor: tokens.bgCard, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, gap: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: tokens.textTertiary }}>Título do novo sermão</Text>
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Ex: A graça que transforma (Romanos 5:1-11)"
            placeholderTextColor={tokens.textDisabled}
            style={{ fontSize: 15, color: tokens.textPrimary, borderBottomWidth: 1, borderBottomColor: tokens.borderMedium, paddingBottom: 8 }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => { setCreating(false); setNewTitle(''); }} style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: tokens.borderMedium, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: tokens.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreate} disabled={!newTitle.trim()} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: newTitle.trim() ? tokens.actionPrimary : tokens.bgSecondary, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: newTitle.trim() ? tokens.actionPrimaryText : tokens.textDisabled }}>Criar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={sermons}
        keyExtractor={s => s.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: s }) => {
          const statusColor = SERMON_STATUS_COLORS[s.status];
          const statusLabel = SERMON_STATUS_LABELS[s.status];
          return (
            <TouchableOpacity onPress={() => router.push(`/(app)/modals/sermon-editor?sermonId=${s.id}`)} onLongPress={() => handleDelete(s)}
              style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.textPrimary }}>{s.title}</Text>
                  {s.passageRef && <Text style={{ fontSize: 12, color: tokens.actionPrimary, fontWeight: '600' }}>{s.passageRef}</Text>}
                  <Text style={{ fontSize: 11, color: tokens.textDisabled }}>Atualizado {relativeDate(s.updatedAt)}</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: statusColor + '20' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>{statusLabel}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={!creating ? (
          <View style={{ padding: 48, alignItems: 'center', gap: 16 }}>
            <MaterialCommunityIcons name="notebook-outline" size={56} color={tokens.iconMuted} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: tokens.textPrimary, textAlign: 'center' }}>Nenhum sermão ainda</Text>
            <Text style={{ fontSize: 14, color: tokens.textSecondary, textAlign: 'center', lineHeight: 22 }}>Organize sua preparação — contexto, exegese, outline e aplicação em um só lugar.</Text>
            <TouchableOpacity onPress={() => setCreating(true)} style={{ backgroundColor: tokens.actionPrimary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.actionPrimaryText }}>Criar primeiro sermão</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}