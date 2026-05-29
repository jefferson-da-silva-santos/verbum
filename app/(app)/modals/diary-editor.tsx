/**
 * VERBUM — Modal: DiaryEditor
 * Criação e edição de entradas do diário espiritual.
 */

import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { diaryRepo } from '../../../src/database/repositories';
import type { DiaryEntry, DiaryMood } from '../../../src/database/types';
import { Button } from '../../../src/components/ui/Button';
import { todayIsoDate } from '../../../src/utils/dateUtils';
import { DIARY_MOOD_LABELS } from '../../../src/utils/formatters';

const MOODS = Object.entries(DIARY_MOOD_LABELS) as [DiaryMood, string][];

export default function DiaryEditorModal() {
  const { tokens } = useTheme();
  const { user } = useAuthContext();
  const { entryId } = useLocalSearchParams<{ entryId?: string }>();

  const isEdit = Boolean(entryId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<DiaryMood | null>(null);
  const [date, setDate] = useState(todayIsoDate());
  const [saving, setSaving] = useState(false);

  // Carregar entrada existente para edição
  useEffect(() => {
    if (!entryId) return;
    diaryRepo.findById(entryId).then(entry => {
      if (!entry) return;
      setTitle(entry.title ?? '');
      setContent(entry.content);
      setMood(entry.mood);
      setDate(entry.entryDate);
    });
  }, [entryId]);

  const handleSave = async () => {
    if (!user || !content.trim()) return;
    setSaving(true);
    try {
      if (isEdit && entryId) {
        await diaryRepo.update(entryId, {
          title: title.trim() || null,
          content: content.trim(),
          mood,
        });
      } else {
        await diaryRepo.create({
          userId: user.id,
          title: title.trim() || null,
          content: content.trim(),
          mood,
          entryDate: date,
        });
      }
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entryId) return;
    await diaryRepo.delete(entryId);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tokens.bgPrimary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>
            {isEdit ? 'Editar Entrada' : 'Nova Entrada'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isEdit && (
              <TouchableOpacity onPress={handleDelete} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="delete-outline" size={20} color={tokens.error} />
              </TouchableOpacity>
            )}
            <Button label="Salvar" size="sm" onPress={handleSave} loading={saving} />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          {/* Data */}
          <Text style={{ fontSize: 13, color: tokens.textTertiary, fontWeight: '600' }}>{date}</Text>

          {/* Humor */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>Como está seu coração?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MOODS.map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setMood(m => m === key ? null : key)}
                  style={{
                    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
                    backgroundColor: mood === key ? tokens.actionPrimary : tokens.bgCard,
                    borderWidth: 1, borderColor: mood === key ? 'transparent' : tokens.borderLight,
                  }}
                >
                  <Text style={{ fontSize: 13, color: mood === key ? tokens.actionPrimaryText : tokens.textSecondary }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Título opcional */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Título (opcional)"
            placeholderTextColor={tokens.textDisabled}
            style={{
              fontSize: 18, fontWeight: '700', color: tokens.textPrimary,
              borderBottomWidth: 1, borderBottomColor: tokens.borderLight,
              paddingBottom: 8,
            }}
            returnKeyType="next"
          />

          {/* Conteúdo */}
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="O que está em seu coração hoje?&#10;&#10;Escreva livremente — orações, reflexões, testemunhos..."
            placeholderTextColor={tokens.textDisabled}
            multiline
            autoFocus={!isEdit}
            style={{
              fontSize: 16, color: tokens.textPrimary, lineHeight: 28,
              minHeight: 300, textAlignVertical: 'top',
              fontFamily: 'serif',
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}