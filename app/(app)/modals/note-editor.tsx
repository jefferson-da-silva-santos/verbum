/**
 * VERBUM — app/(app)/modals/note-editor.tsx
 */

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { noteRepo } from '../../../src/database/repositories';
import { NOTE_TYPE_DEFINITIONS } from '../../../src/constants/bible';
import type { NoteType } from '../../../src/constants/bible';
import { Button } from '../../../src/components/ui/Button';

export default function NoteEditorModal() {
  const { tokens } = useTheme();
  const { user } = useAuthContext();
  const { bookSlug = 'gn', chapter = '1', verse } = useLocalSearchParams<{
    bookSlug?: string; chapter?: string; verse?: string;
  }>();

  const [content, setContent] = useState('');
  const [type, setType] = useState<NoteType>('reflexao');
  const [saving, setSaving] = useState(false);

  const verseNum = verse ? parseInt(verse, 10) : undefined;

  const handleSave = async () => {
    if (!user || !content.trim()) return;
    setSaving(true);
    await noteRepo.create({
      userId: user.id,
      bookSlug: String(bookSlug),
      chapterNumber: parseInt(String(chapter), 10),
      verseNumber: verseNum ?? null,
      content: content.trim(),
      type,
    });
    router.back();
  };

  const types = Object.values(NOTE_TYPE_DEFINITIONS);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>Nova Anotação</Text>
        <Button label="Salvar" size="sm" onPress={handleSave} loading={saving} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={{ fontSize: 13, color: tokens.textTertiary }}>
          {String(bookSlug).toUpperCase()} {chapter}{verseNum ? `:${verseNum}` : ''}
        </Text>

        {/* Tipo */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {types.map(t => (
            <TouchableOpacity key={t.type} onPress={() => setType(t.type)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, backgroundColor: type === t.type ? tokens.actionPrimary : tokens.bgCard, borderWidth: 1, borderColor: type === t.type ? 'transparent' : tokens.borderLight }}>
              <MaterialCommunityIcons name={t.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={14} color={type === t.type ? tokens.actionPrimaryText : t.colorHex} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: type === t.type ? tokens.actionPrimaryText : tokens.textSecondary }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Escreva sua reflexão..."
          placeholderTextColor={tokens.textDisabled}
          multiline
          autoFocus
          style={{ fontSize: 16, color: tokens.textPrimary, lineHeight: 26, minHeight: 200, textAlignVertical: 'top', backgroundColor: tokens.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: tokens.borderLight }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}