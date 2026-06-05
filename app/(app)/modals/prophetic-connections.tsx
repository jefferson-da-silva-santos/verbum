/**
 * VERBUM — app/(app)/modals/prophetic-connections.tsx
 * Navegador de conexões proféticas AT → NT.
 * Filtro por categoria, visualização lado a lado com acesso ao leitor.
 */

import { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ScrollView, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import {
  PROPHETIC_CONNECTIONS, PROPHETIC_CATEGORIES,
  CONNECTION_TYPE_COLORS, CONNECTION_TYPE_LABELS,
} from '../../../src/constants/propheticConnections';
import type { PropheticConnection, PropheticCategory } from '../../../src/constants/propheticConnections';

// ── Card de detalhes de uma conexão ────────────────────────────────

function ConnectionDetailModal({ connection, onClose }: { connection: PropheticConnection; onClose: () => void }) {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  const typeColor  = CONNECTION_TYPE_COLORS[connection.connectionType];

  const openOT = () => {
    onClose();
    setTimeout(() => {
      router.push(`/(app)/modals/chapter-reader?bookSlug=${connection.ot.bookSlug}&chapter=${connection.ot.chapter}`);
    }, 300);
  };

  const openNT = () => {
    onClose();
    setTimeout(() => {
      router.push(`/(app)/modals/chapter-reader?bookSlug=${connection.nt.bookSlug}&chapter=${connection.nt.chapter}`);
    }, 300);
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(44,24,16,0.5)' }} onPress={onClose} />
      <View style={{ backgroundColor: tokens.bgModal, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: insets.bottom + 24, maxHeight: '85%' }}>
        {/* Handle */}
        <View style={{ width: 40, height: 4, backgroundColor: tokens.borderMedium, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 }} />

        {/* Tema + tipo */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary, flex: 1 }}>
              {connection.theme}
            </Text>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: typeColor + '20' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: typeColor }}>{CONNECTION_TYPE_LABELS[connection.connectionType]}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: tokens.textTertiary, marginTop: 4 }}>{connection.category}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
          {/* AT */}
          <View style={{ backgroundColor: tokens.bgCard, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
            <View style={{ backgroundColor: '#8B6340', paddingVertical: 8, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: 'white', letterSpacing: 0.8 }}>ANTIGO TESTAMENTO</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{connection.ot.reference}</Text>
            </View>
            <View style={{ padding: 16, gap: 10 }}>
              <Text style={{ fontSize: 16, color: tokens.textVerse, fontFamily: 'serif', lineHeight: 28, fontStyle: 'italic' }}>
                {`"${connection.ot.preview}"`}
              </Text>
              <TouchableOpacity onPress={openOT} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: 13, color: '#8B6340', fontWeight: '600' }}>Abrir {connection.ot.reference}</Text>
                <MaterialCommunityIcons name="arrow-right" size={14} color="#8B6340" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Seta de conexão */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: 2, height: 12, backgroundColor: typeColor + '60' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: typeColor + '40' }} />
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: typeColor + '15', borderWidth: 1, borderColor: typeColor }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: typeColor }}>{CONNECTION_TYPE_LABELS[connection.connectionType]}</Text>
              </View>
              <View style={{ flex: 1, height: 1, backgroundColor: typeColor + '40' }} />
            </View>
            <View style={{ width: 2, height: 12, backgroundColor: typeColor + '60' }} />
          </View>

          {/* NT */}
          <View style={{ backgroundColor: tokens.bgCard, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
            <View style={{ backgroundColor: '#4A5C8B', paddingVertical: 8, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: 'white', letterSpacing: 0.8 }}>NOVO TESTAMENTO</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{connection.nt.reference}</Text>
            </View>
            <View style={{ padding: 16, gap: 10 }}>
              <Text style={{ fontSize: 16, color: tokens.textVerse, fontFamily: 'serif', lineHeight: 28, fontStyle: 'italic' }}>
                {`"${connection.nt.preview}"`}
              </Text>
              <TouchableOpacity onPress={openNT} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: 13, color: '#4A5C8B', fontWeight: '600' }}>Abrir {connection.nt.reference}</Text>
                <MaterialCommunityIcons name="arrow-right" size={14} color="#4A5C8B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nota teológica */}
          <View style={{ backgroundColor: tokens.bgCard, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderLight, padding: 16, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="lightbulb-outline" size={16} color={typeColor} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: typeColor, textTransform: 'uppercase', letterSpacing: 0.6 }}>Nota exegética</Text>
            </View>
            <Text style={{ fontSize: 14, color: tokens.textSecondary, lineHeight: 22 }}>{connection.note}</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Modal principal ─────────────────────────────────────────────────

export default function PropheticConnectionsModal() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();

  const [selectedCategory, setCategory] = useState<PropheticCategory>('Todos');
  const [selected, setSelected]         = useState<PropheticConnection | null>(null);

  const filtered = useMemo(() =>
    selectedCategory === 'Todos'
      ? PROPHETIC_CONNECTIONS
      : PROPHETIC_CONNECTIONS.filter(c => c.category === selectedCategory),
    [selectedCategory],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>Conexões Proféticas</Text>
          <Text style={{ fontSize: 12, color: tokens.textTertiary }}>AT → NT · {filtered.length} de {PROPHETIC_CONNECTIONS.length} conexões</Text>
        </View>
      </View>

      {/* Filtro de categorias */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderBottomColor: tokens.borderLight }} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
        {PROPHETIC_CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
            style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: selectedCategory === cat ? tokens.actionPrimary : tokens.bgCard, borderWidth: 1, borderColor: selectedCategory === cat ? 'transparent' : tokens.borderLight }}>
            <Text style={{ fontSize: 13, fontWeight: selectedCategory === cat ? '700' : '400', color: selectedCategory === cat ? tokens.actionPrimaryText : tokens.textSecondary }}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista */}
      <FlatList
        data={filtered}
        keyExtractor={c => c.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        renderItem={({ item: c }) => {
          const typeColor = CONNECTION_TYPE_COLORS[c.connectionType];
          return (
            <TouchableOpacity onPress={() => setSelected(c)}
              style={{ paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                {/* Linha AT→NT */}
                <View style={{ alignItems: 'center', gap: 2, paddingTop: 2 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B6340' }} />
                  <View style={{ width: 2, height: 18, backgroundColor: typeColor + '50' }} />
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4A5C8B' }} />
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: tokens.textPrimary }}>{c.theme}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 12, color: '#8B6340', fontWeight: '600' }}>{c.ot.reference}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={12} color={typeColor} />
                    <Text style={{ fontSize: 12, color: '#4A5C8B', fontWeight: '600' }}>{c.nt.reference}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: typeColor + '15' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: typeColor }}>{CONNECTION_TYPE_LABELS[c.connectionType]}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: tokens.textDisabled }}>{c.category}</Text>
                  </View>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={18} color={tokens.iconMuted} />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Detail modal */}
      {selected && <ConnectionDetailModal connection={selected} onClose={() => setSelected(null)} />}
    </SafeAreaView>
  );
}