/**
 * VERBUM — app/(app)/modals/sermon-editor.tsx  [CORRIGIDO v3]
 *
 * FIX: Removido paddingTop: insets.top do header interno.
 *
 * O modal NÃO cobre o AppHeader do drawer no Android — ele renderiza
 * DENTRO do layout, logo abaixo do AppHeader. Por isso:
 *   - paddingTop: insets.top + 8  →  padding duplo (gap enorme)
 *   - paddingTop: 8               →  correto (cola logo abaixo do header)
 *
 * Também corrigido:
 *   - Hint removido (conflitava visualmente com o placeholder do TextInput)
 *   - Layout sem SafeAreaView e sem KeyboardAvoidingView aninhados
 *   - flex:1 garantido na cadeia View → Tab content → ScrollView
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Share, Alert, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme }         from '../../../src/context/ThemeContext';
import { SermonRepository } from '../../../src/database/repositories/SermonRepository';
import type { SermonWithVerses, SermonStatus } from '../../../src/database/types';
import { SERMON_STATUS_LABELS, SERMON_STATUS_COLORS } from '../../../src/database/types';

// ─── Abas ───────────────────────────────────────────────────────────

type Tab = 'passage' | 'context' | 'structure' | 'exegesis' | 'outline' | 'application';

const TABS: { key: Tab; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'passage',     label: 'Passagem',  icon: 'book-open-outline'    },
  { key: 'context',     label: 'Contexto',  icon: 'history'              },
  { key: 'structure',   label: 'Estrutura', icon: 'format-list-bulleted' },
  { key: 'exegesis',    label: 'Exegese',   icon: 'magnify'              },
  { key: 'outline',     label: 'Outline',   icon: 'format-list-numbered' },
  { key: 'application', label: 'Aplicação', icon: 'heart-outline'        },
];

const PLACEHOLDERS: Record<Tab, string> = {
  passage:     '',
  context:     'Quem escreveu? Para quem? Quando?\nQual o contexto histórico e o gênero literário?',
  structure:   'Como o texto está organizado?\nSeções, paralelismos, quiasmos, palavras-chave...',
  exegesis:    'O que o texto diz e significa?\nAnalise versículo a versículo.',
  outline:     '1. Introdução\n   — Ilustração de abertura\n\n2. Ponto principal\n   — Subponto\n\n3. Conclusão e chamado',
  application: 'O que essa verdade muda na vida do ouvinte?\nO que ele deve crer, sentir ou fazer de diferente?',
};

// ─── Modal ──────────────────────────────────────────────────────────

export default function SermonEditorModal() {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  const { sermonId } = useLocalSearchParams<{ sermonId: string }>();

  const [sermon,    setSermon]    = useState<SermonWithVerses | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab,       setTab]       = useState<Tab>('passage');
  const [isSaving,  setIsSaving]  = useState(false);

  const [title,       setTitle]       = useState('');
  const [passageRef,  setPassageRef]  = useState('');
  const [context,     setContext]     = useState('');
  const [structure,   setStructure]   = useState('');
  const [exegesis,    setExegesis]    = useState('');
  const [outline,     setOutline]     = useState('');
  const [application, setApplication] = useState('');

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Carregamento ─────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!sermonId) return;
    setIsLoading(true);
    try {
      const data = await SermonRepository.findWithVerses(sermonId);
      if (!data) return;
      setSermon(data);
      setTitle(data.title ?? '');
      setPassageRef(data.passageRef ?? '');
      setContext(data.contextNotes ?? '');
      setStructure(data.structureNotes ?? '');
      setExegesis(data.exegesisNotes ?? '');
      setOutline(data.outline ? JSON.stringify(data.outline, null, 2) : '');
      setApplication(data.applicationNotes ?? '');
    } finally {
      setIsLoading(false);
    }
  }, [sermonId]);

  useEffect(() => { load(); }, [load]);

  // ── Auto-save ────────────────────────────────────────────────────

  const triggerSave = useCallback(() => {
    if (!sermonId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setIsSaving(true);
    saveTimer.current = setTimeout(async () => {
      try {
        await SermonRepository.update(sermonId, {
          title:            title.trim() || 'Sem título',
          passageRef:       passageRef.trim() || null,
          contextNotes:     context.trim()    || null,
          structureNotes:   structure.trim()  || null,
          exegesisNotes:    exegesis.trim()   || null,
          applicationNotes: application.trim()|| null,
        });
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  }, [sermonId, title, passageRef, context, structure, exegesis, application]);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleStatusChange = async (status: SermonStatus) => {
    if (!sermonId) return;
    await SermonRepository.update(sermonId, {
      status,
      preachedAt: status === 'preached' ? new Date().toISOString() : null,
    });
    setSermon(prev => prev ? { ...prev, status } : null);
  };

  const handleShare = async () => {
    if (!sermon) return;
    const parts = [
      `📖 ${title || 'Sem título'}`,
      passageRef  ? `Passagem: ${passageRef}` : '',
      context     ? `\nCONTEXTO\n${context}`     : '',
      structure   ? `\nESTRUTURA\n${structure}`   : '',
      exegesis    ? `\nEXEGESE\n${exegesis}`      : '',
      outline     ? `\nOUTLINE\n${outline}`       : '',
      application ? `\nAPLICAÇÃO\n${application}` : '',
      '\n— via Verbum',
    ].filter(Boolean).join('\n');
    await Share.share({ message: parts });
  };

  const handleOpenPulpit = () => {
    if (!sermon?.verses.length) {
      Alert.alert('Sem versículos', 'Adicione versículos antes de usar o Modo Púlpito.');
      return;
    }
    const refs = sermon.verses.map(v => `${v.bookSlug}:${v.chapter}:${v.verse}`).join(',');
    router.push(
      `/(app)/modals/pulpit-mode?verseRefs=${encodeURIComponent(refs)}&title=${encodeURIComponent(title)}`,
    );
  };

  const handleRemoveVerse = async (verseId: string) => {
    await SermonRepository.removeVerse(verseId);
    load();
  };

  // ── Progresso das abas ───────────────────────────────────────────

  const done: Record<Tab, boolean> = {
    passage:     !!passageRef.trim() || (sermon?.verses.length ?? 0) > 0,
    context:     !!context.trim(),
    structure:   !!structure.trim(),
    exegesis:    !!exegesis.trim(),
    outline:     !!outline.trim(),
    application: !!application.trim(),
  };
  const doneCount = Object.values(done).filter(Boolean).length;

  // ── Conteúdo de cada aba ─────────────────────────────────────────

  const textInputStyle = {
    flex: 1,
    padding: 20,
    fontSize: 15 as number,
    color: tokens.textPrimary,
    lineHeight: 26 as number,
    textAlignVertical: 'top' as const,
    fontFamily: 'serif' as const,
  };

  const renderPassage = () => (
    <ScrollView
      contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Referência */}
      <View style={{ gap: 8 }}>
        <Text style={{
          fontSize: 10, fontWeight: '700', color: tokens.textTertiary,
          textTransform: 'uppercase', letterSpacing: 1,
        }}>
          Referência da passagem
        </Text>
        <TextInput
          value={passageRef}
          onChangeText={v => { setPassageRef(v); triggerSave(); }}
          placeholder="Ex: Romanos 8:28–39"
          placeholderTextColor={tokens.textDisabled}
          style={{
            fontSize: 18, fontWeight: '600', color: tokens.actionPrimary,
            paddingBottom: 10,
            borderBottomWidth: 1.5,
            borderBottomColor: tokens.actionPrimary + '50',
          }}
          returnKeyType="done"
        />
      </View>

      {/* Versículos */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{
            fontSize: 10, fontWeight: '700', color: tokens.textTertiary,
            textTransform: 'uppercase', letterSpacing: 1,
          }}>
            Versículos da pregação
          </Text>
          <View style={{
            backgroundColor: tokens.actionPrimary + '20',
            borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: tokens.actionPrimary }}>
              {sermon?.verses.length ?? 0}
            </Text>
          </View>
        </View>

        {(sermon?.verses.length ?? 0) === 0 ? (
          <View style={{
            backgroundColor: tokens.bgCard, borderRadius: 14, padding: 20,
            borderWidth: 1, borderColor: tokens.borderLight,
            alignItems: 'center', gap: 12,
          }}>
            <MaterialCommunityIcons name="book-plus-outline" size={36} color={tokens.iconMuted} />
            <Text style={{ fontSize: 14, color: tokens.textTertiary, textAlign: 'center', lineHeight: 22 }}>
              No leitor, faça{' '}
              <Text style={{ fontWeight: '700' }}>long press</Text>
              {' '}em qualquer versículo e toque em{' '}
              <Text style={{ fontWeight: '700', color: tokens.actionPrimary }}>{`"Adicionar ao sermão"`}</Text>
              {' '}para vinculá-lo aqui.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {sermon!.verses.map(v => (
              <View key={v.id} style={{
                backgroundColor: tokens.bgCard, borderRadius: 14,
                borderWidth: 1, borderColor: tokens.borderLight,
                flexDirection: 'row', alignItems: 'flex-start',
                padding: 14, gap: 12,
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  backgroundColor: tokens.actionPrimary + '15',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <MaterialCommunityIcons name="book-open-variant" size={18} color={tokens.actionPrimary} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.actionPrimary }}>
                    {v.bookName} {v.chapter}:{v.verse}
                  </Text>
                  {v.verseText ? (
                    <Text numberOfLines={3} style={{ fontSize: 13, color: tokens.textSecondary, fontFamily: 'serif', lineHeight: 20 }}>
                      {v.verseText}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => handleRemoveVerse(v.id)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <MaterialCommunityIcons name="close" size={16} color={tokens.iconMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderText = (value: string, setValue: (v: string) => void, key: Tab) => (
    <TextInput
      key={key}
      value={value}
      onChangeText={v => { setValue(v); triggerSave(); }}
      multiline
      placeholder={PLACEHOLDERS[key]}
      placeholderTextColor={tokens.textDisabled}
      autoFocus={false}
      style={textInputStyle}
    />
  );

  const renderContent = () => {
    if (tab === 'passage') return renderPassage();
    const map: Record<Exclude<Tab,'passage'>, [string, (v:string)=>void]> = {
      context:     [context,     setContext],
      structure:   [structure,   setStructure],
      exegesis:    [exegesis,    setExegesis],
      outline:     [outline,     setOutline],
      application: [application, setApplication],
    };
    const [val, setter] = map[tab as Exclude<Tab,'passage'>];
    return renderText(val, setter, tab);
  };

  // ── Loading ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={tokens.actionPrimary} />
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tokens.bgPrimary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── HEADER — paddingTop: 8 (sem insets, já está sob o AppHeader) ── */}
      <View style={{
        paddingTop:        8,
        paddingHorizontal: 16,
        paddingBottom:     10,
        borderBottomWidth: 1,
        borderBottomColor: tokens.borderLight,
        gap:               8,
      }}>
        {/* Linha 1: voltar + título + ações */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={tokens.iconPrimary} />
          </TouchableOpacity>

          <TextInput
            value={title}
            onChangeText={v => { setTitle(v); triggerSave(); }}
            placeholder="Título do sermão"
            placeholderTextColor={tokens.textDisabled}
            style={{
              flex: 1, fontSize: 15, fontWeight: '700',
              color: tokens.textPrimary,
            }}
            returnKeyType="done"
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {isSaving && <ActivityIndicator size="small" color={tokens.textDisabled} style={{ marginRight: 4 }} />}
            <TouchableOpacity onPress={handleOpenPulpit} style={{ padding: 8 }}>
              <MaterialCommunityIcons name="presentation-play" size={22} color={tokens.actionPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={{ padding: 8 }}>
              <MaterialCommunityIcons name="share-variant-outline" size={20} color={tokens.iconPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Linha 2: status + progresso */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {(['draft', 'ready', 'preached'] as SermonStatus[]).map(st => {
            const active = sermon?.status === st;
            const color  = SERMON_STATUS_COLORS[st];
            return (
              <TouchableOpacity
                key={st}
                onPress={() => handleStatusChange(st)}
                style={{
                  paddingVertical: 5, paddingHorizontal: 12,
                  borderRadius: 14,
                  backgroundColor: active ? color : 'transparent',
                  borderWidth: 1, borderColor: color,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? 'white' : color }}>
                  {SERMON_STATUS_LABELS[st]}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {TABS.map(t => (
                <View key={t.key} style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: done[t.key] ? tokens.success : tokens.borderMedium,
                }} />
              ))}
            </View>
            <Text style={{ fontSize: 11, color: tokens.textTertiary }}>
              {doneCount}/{TABS.length}
            </Text>
          </View>
        </View>
      </View>

      {/* ── ABAS — colada logo abaixo do header ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: tokens.borderLight,
          flexGrow: 0,          // não cresce além da altura natural
          flexShrink: 0,        // não encolhe
        }}
        contentContainerStyle={{ paddingHorizontal: 6 }}
      >
        {TABS.map(t => {
          const active   = tab === t.key;
          const isDone   = done[t.key];
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                flexDirection:    'row',
                alignItems:       'center',
                gap:              5,
                paddingVertical:  10,
                paddingHorizontal: 10,
                borderBottomWidth: active ? 2.5 : 0,
                borderBottomColor: tokens.actionPrimary,
                marginBottom:     -1,
              }}
            >
              <MaterialCommunityIcons
                name={t.icon}
                size={14}
                color={
                  active  ? tokens.actionPrimary :
                  isDone  ? tokens.success :
                  tokens.iconMuted
                }
              />
              <Text style={{
                fontSize:   13,
                fontWeight: active ? '700' : '400',
                color:
                  active  ? tokens.actionPrimary :
                  isDone  ? tokens.textSecondary :
                  tokens.textTertiary,
              }}>
                {t.label}
              </Text>
              {isDone && !active && (
                <MaterialCommunityIcons name="check-circle" size={11} color={tokens.success} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── CONTEÚDO — ocupa o espaço restante ── */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
    </KeyboardAvoidingView>
  );
}