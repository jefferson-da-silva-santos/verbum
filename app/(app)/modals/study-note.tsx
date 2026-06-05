/**
 * VERBUM — app/(app)/modals/study-note.tsx
 * Exposição Guiada — método COIA (Contexto / Observação / Interpretação / Aplicação)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme }       from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { StudyNoteRepository } from '@/src/database/repositories/ThematicMapRepository';
import type { StudyNote } from '../../../src/database/types';

type Section = 'C' | 'O' | 'I' | 'A';

const SECTIONS: { key: Section; label: string; title: string; description: string; color: string; icon: keyof typeof import('@expo/vector-icons').MaterialCommunityIcons.glyphMap }[] = [
  { key: 'C', label: 'Contexto',       title: 'C — Contexto',       color: '#8B6340',
    description: 'Quem escreveu? Para quem? Quando? Qual a situação histórica? Qual o gênero literário e o argumento do livro?',
    icon: 'history' },
  { key: 'O', label: 'Observação',     title: 'O — Observação',     color: '#4A5C8B',
    description: 'O que o texto diz? Quais personagens, ações, palavras-chave e estrutura você observa? Seja descritivo, não interpretativo.',
    icon: 'eye-outline' },
  { key: 'I', label: 'Interpretação',  title: 'I — Interpretação',  color: '#4A7C59',
    description: 'O que o texto significa? Qual a mensagem central? Como se conecta ao restante das Escrituras?',
    icon: 'book-search-outline' },
  { key: 'A', label: 'Aplicação',      title: 'A — Aplicação',      color: '#7A4A8B',
    description: 'O que isso muda em mim? O que devo crer, sentir ou fazer de diferente a partir desta passagem?',
    icon: 'heart-outline' },
];

export default function StudyNoteModal() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  const { user }   = useAuthContext();
  const {
    bookSlug  = 'gn', bookName = 'Gênesis',
    chapter:  chapterParam = '1',
    verseStart: vsParam = '', verseEnd: veParam = '',
  } = useLocalSearchParams<{ bookSlug: string; bookName: string; chapter: string; verseStart?: string; verseEnd?: string }>();

  const chapter = parseInt(chapterParam, 10) || 1;
  const vs      = vsParam ? parseInt(vsParam) : null;
  const ve      = veParam ? parseInt(veParam) : null;

  const passageRef = vs
    ? `${bookName} ${chapter}:${vs}${ve && ve !== vs ? `-${ve}` : ''}`
    : `${bookName} ${chapter}`;

  const [note,       setNote]       = useState<StudyNote | null>(null);
  const [activeSection, setSection] = useState<Section>('C');
  const [context,    setContext]     = useState('');
  const [observation, setObserv]    = useState('');
  const [interpret,  setInterpret]  = useState('');
  const [application, setApply]     = useState('');
  const [saving,     setSaving]     = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const existing = await StudyNoteRepository.findByChapter(user.id, bookSlug, chapter);
    if (existing) {
      setNote(existing);
      setContext(existing.context ?? '');
      setObserv(existing.observation ?? '');
      setInterpret(existing.interpretation ?? '');
      setApply(existing.application ?? '');
    }
  }, [user?.id, bookSlug, chapter]);

  useEffect(() => { load(); }, [load]);

  const scheduleSave = useCallback(async (field: Section, value: string) => {
    if (!user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      try {
        let n = note;
        if (!n) {
          n = await StudyNoteRepository.upsert({ userId: user.id, bookSlug, bookName, chapter, verseStart: vs ?? undefined, verseEnd: ve ?? undefined, passageRef });
          setNote(n);
        }
        const updateMap: Record<Section, Parameters<typeof StudyNoteRepository.update>[1]> = {
          C: { context: field === 'C' ? value : context },
          O: { observation: field === 'O' ? value : observation },
          I: { interpretation: field === 'I' ? value : interpret },
          A: { application: field === 'A' ? value : application },
        };
        await StudyNoteRepository.update(n.id, updateMap[field]);
      } finally {
        setSaving(false);
      }
    }, 1500);
  }, [note, user, bookSlug, bookName, chapter, vs, ve, passageRef, context, observation, interpret, application]);

  const activeConfig = SECTIONS.find(s => s.key === activeSection)!;
  const completedSections = [
    context.trim() ? 'C' : '',
    observation.trim() ? 'O' : '',
    interpret.trim() ? 'I' : '',
    application.trim() ? 'A' : '',
  ].filter(Boolean);

  const textContent = activeSection === 'C' ? context
    : activeSection === 'O' ? observation
    : activeSection === 'I' ? interpret
    : application;

  const setTextContent = (v: string) => {
    if (activeSection === 'C') { setContext(v); scheduleSave('C', v); }
    else if (activeSection === 'O') { setObserv(v); scheduleSave('O', v); }
    else if (activeSection === 'I') { setInterpret(v); scheduleSave('I', v); }
    else { setApply(v); scheduleSave('A', v); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>Exposição Guiada</Text>
            <Text style={{ fontSize: 12, color: tokens.actionPrimary, fontWeight: '600' }}>{passageRef}</Text>
          </View>
          {saving && <Text style={{ fontSize: 11, color: tokens.textDisabled }}>Salvando...</Text>}
          <Text style={{ fontSize: 12, color: tokens.textTertiary }}>{completedSections.length}/4</Text>
        </View>
      </View>

      {/* Seletor de seção COIA */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
        {SECTIONS.map(s => {
          const done   = s.key === 'C' ? !!context.trim() : s.key === 'O' ? !!observation.trim() : s.key === 'I' ? !!interpret.trim() : !!application.trim();
          const active = activeSection === s.key;
          return (
            <TouchableOpacity key={s.key} onPress={() => setSection(s.key as Section)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: active ? s.color : done ? s.color + '20' : tokens.bgCard, borderWidth: 1, borderColor: active ? s.color : done ? s.color : tokens.borderLight, gap: 4 }}>
              <MaterialCommunityIcons name={s.icon} size={18} color={active ? 'white' : done ? s.color : tokens.iconMuted} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: active ? 'white' : done ? s.color : tokens.textTertiary }}>{s.key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Seção ativa */}
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: activeConfig.color }}>{activeConfig.title}</Text>
        <Text style={{ fontSize: 12, color: tokens.textTertiary, lineHeight: 18, marginTop: 4 }}>{activeConfig.description}</Text>
      </View>

      {/* Editor */}
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <TextInput
          key={activeSection}
          value={textContent}
          onChangeText={setTextContent}
          multiline
          autoFocus
          placeholder={`Escreva sua ${activeConfig.label.toLowerCase()} aqui...`}
          placeholderTextColor={tokens.textDisabled}
          style={{
            padding: 20, fontSize: 15, color: tokens.textPrimary,
            lineHeight: 26, textAlignVertical: 'top',
            minHeight: 300, fontFamily: 'serif',
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}