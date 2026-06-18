/**
 * VERBUM — app/(app)/modals/sermon-editor.tsx  [v4 — outline estruturado]
 *
 * MUDANÇAS PRINCIPAIS:
 *
 * 1. BUG CORRIGIDO: a aba Outline nunca era salva. O triggerSave()
 *    montava o payload de update sem o campo `outline` — tudo que
 *    você digitava lá se perdia ao trocar de aba ou fechar o app.
 *
 * 2. Outline deixou de ser um textarea de texto solto e passou a ser
 *    uma lista estruturada de pontos (principais e sub-pontos), com
 *    botões de adicionar/remover/mover — isso é o que permite ao
 *    Modo Púlpito renderizar um slide de outline com hierarquia visual
 *    real, em vez de um bloco de texto cru.
 *
 * 3. handleOpenPulpit agora navega só com `sermonId`. O Modo Púlpito
 *    busca o sermão completo (Contexto, Estrutura, Outline, Exegese,
 *    Aplicação, Versículos) direto do banco — sem depender de tudo
 *    isso caber numa query string de URL.
 *
 * 4. Botão de iniciar o púlpito ficou mais evidente (pill com
 *    gradiente + label), não só um ícone solto.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Share, Alert, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme }         from '../../../src/context/ThemeContext';
import { SermonRepository } from '../../../src/database/repositories/SermonRepository';
import type { SermonWithVerses, SermonStatus } from '../../../src/database/types';
import { SERMON_STATUS_LABELS, SERMON_STATUS_COLORS } from '../../../src/database/types';
import { VersePickerModal } from '../../../src/components/sermon/VersePickerModal';
import type { PickedVerse } from '../../../src/components/sermon/VersePickerModal';

// ─── Outline estruturado ──────────────────────────────────────────
//
// Adicione este tipo em src/database/featureTypes.ts (se ainda não existir):
//
//   export interface SermonOutlineItem {
//     id:    string;
//     level: 0 | 1;   // 0 = ponto principal, 1 = sub-ponto
//     text:  string;
//   }
//
// E garanta que UpdateSermonInput tenha: outline?: SermonOutlineItem[] | null

export interface SermonOutlineItem {
  id:    string;
  level: 0 | 1;
  text:  string;
}

function newOutlineId() {
  return `o_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

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

const SECTION_HELP: Record<Tab, string> = {
  passage:     'Referência e versículos que você vai pregar.',
  context:     'Quem escreveu? Para quem? Quando? Contexto histórico e gênero literário.',
  structure:   'Como o texto está organizado — seções, paralelismos, quiasmos, palavras-chave.',
  exegesis:    'O que o texto diz e significa. Análise versículo a versículo.',
  outline:     'Os pontos da sua pregação, em ordem. Vão aparecer como slide no Modo Púlpito.',
  application: 'O que essa verdade muda na vida do ouvinte — o que crer, sentir ou fazer.',
};

const PLACEHOLDERS: Partial<Record<Tab, string>> = {
  context:     'Ex: Paulo escreve aos romanos por volta de 57 d.C., antes de visitar Roma pessoalmente...',
  structure:   'Ex: O capítulo se divide em três movimentos: a condição humana (1-3), a justificação (4-5)...',
  exegesis:    'Ex: O termo "justificação" (dikaiosis) aqui carrega sentido jurídico-forense...',
  application: 'Ex: Se Deus já nos justificou, a culpa que sentimos não tem mais fundamento legal diante dele...',
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
  const [outlineItems, setOutlineItems] = useState<SermonOutlineItem[]>([]);
  const [application, setApplication] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isAddingVerses, setIsAddingVerses] = useState(false);

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
      setApplication(data.applicationNotes ?? '');

      // outline pode vir null, [] ou (de versões antigas) string — trata todos
      const rawOutline: any = (data as any).outline;
      if (Array.isArray(rawOutline)) {
        setOutlineItems(rawOutline);
      } else if (typeof rawOutline === 'string' && rawOutline.trim()) {
        // Migração suave de texto livre antigo → 1 item por linha não vazia
        setOutlineItems(
          rawOutline.split('\n').filter(l => l.trim()).map(l => ({
            id: newOutlineId(),
            level: l.trim().startsWith('—') || l.trim().startsWith('-') ? 1 : 0,
            text: l.replace(/^[—-]\s*/, '').trim(),
          })),
        );
      } else {
        setOutlineItems([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sermonId]);

  useEffect(() => { load(); }, [load]);

  // ── Auto-save ────────────────────────────────────────────────────
  // FIX: outline agora está incluído no payload — antes era perdido.

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
          outline:          outlineItems.length > 0 ? outlineItems : null,   // ← FIX
        } as any);
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  }, [sermonId, title, passageRef, context, structure, exegesis, application, outlineItems]);

  // Salva automaticamente também quando o outline muda (antes só nos textos)
  useEffect(() => { if (!isLoading) triggerSave(); }, [outlineItems]);

  // ── Handlers de outline ───────────────────────────────────────────

  const addOutlinePoint = (level: 0 | 1) => {
    setOutlineItems(prev => [...prev, { id: newOutlineId(), level, text: '' }]);
  };

  const updateOutlineText = (id: string, text: string) => {
    setOutlineItems(prev => prev.map(it => it.id === id ? { ...it, text } : it));
  };

  const removeOutlinePoint = (id: string) => {
    setOutlineItems(prev => prev.filter(it => it.id !== id));
  };

  const moveOutlinePoint = (id: string, dir: -1 | 1) => {
    setOutlineItems(prev => {
      const idx = prev.findIndex(it => it.id === id);
      const newIdx = idx + dir;
      if (idx === -1 || newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  const toggleOutlineLevel = (id: string) => {
    setOutlineItems(prev => prev.map(it => it.id === id ? { ...it, level: it.level === 0 ? 1 : 0 } : it));
  };

  // ── Outros handlers ────────────────────────────────────────────────

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
    const outlineText = outlineItems
      .map(it => (it.level === 0 ? `${it.text}` : `   — ${it.text}`))
      .join('\n');
    const parts = [
      `📖 ${title || 'Sem título'}`,
      passageRef  ? `Passagem: ${passageRef}` : '',
      context     ? `\nCONTEXTO\n${context}`     : '',
      structure   ? `\nESTRUTURA\n${structure}`   : '',
      exegesis    ? `\nEXEGESE\n${exegesis}`      : '',
      outlineText ? `\nOUTLINE\n${outlineText}`   : '',
      application ? `\nAPLICAÇÃO\n${application}` : '',
      '\n— via Verbum',
    ].filter(Boolean).join('\n');
    await Share.share({ message: parts });
  };

  // FIX: navega só com sermonId — o Modo Púlpito busca tudo sozinho
  const handleOpenPulpit = () => {
    const hasAnyContent =
      (sermon?.verses.length ?? 0) > 0 || context.trim() || structure.trim() ||
      exegesis.trim() || outlineItems.length > 0 || application.trim();

    if (!hasAnyContent) {
      Alert.alert('Sermão vazio', 'Adicione ao menos um versículo ou conteúdo antes de iniciar o Modo Púlpito.');
      return;
    }
    router.push(`/(app)/modals/pulpit-mode?sermonId=${sermonId}`);
  };

  const handleRemoveVerse = async (verseId: string) => {
    await SermonRepository.removeVerse(verseId);
    load();
  };

  // Recebe os versículos escolhidos no VersePickerModal e vincula ao sermão
  const handleVersesPicked = async (picked: PickedVerse[]) => {
    if (!sermonId) return;
    setPickerOpen(false);
    setIsAddingVerses(true);
    try {
      for (const v of picked) {
        const already = await SermonRepository.isVerseInSermon(sermonId, v.bookSlug, v.chapter, v.verse);
        if (already) continue;
        await SermonRepository.addVerse({
          sermonId, bookSlug: v.bookSlug, bookName: v.bookName,
          chapter: v.chapter, verse: v.verse, verseText: v.verseText,
        });
      }
      await load();
    } finally {
      setIsAddingVerses(false);
    }
  };

  // ── Progresso das abas ───────────────────────────────────────────

  const done: Record<Tab, boolean> = {
    passage:     !!passageRef.trim() || (sermon?.verses.length ?? 0) > 0,
    context:     !!context.trim(),
    structure:   !!structure.trim(),
    exegesis:    !!exegesis.trim(),
    outline:     outlineItems.length > 0,
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

  const SectionHelp = ({ tabKey }: { tabKey: Tab }) => (
    <View style={{
      paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4,
      flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    }}>
      <MaterialCommunityIcons name="information-outline" size={14} color={tokens.textTertiary} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, fontSize: 12, color: tokens.textTertiary, lineHeight: 17 }}>
        {SECTION_HELP[tabKey]}
      </Text>
    </View>
  );

  const renderPassage = () => (
    <ScrollView
      contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }}>
          Referência da passagem
        </Text>
        <TextInput
          value={passageRef}
          onChangeText={v => { setPassageRef(v); triggerSave(); }}
          placeholder="Ex: Romanos 8:28–39"
          placeholderTextColor={tokens.textDisabled}
          style={{ fontSize: 18, fontWeight: '600', color: tokens.actionPrimary, paddingBottom: 10, borderBottomWidth: 1.5, borderBottomColor: tokens.actionPrimary + '50' }}
          returnKeyType="done"
        />
      </View>

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }}>
            Versículos da pregação
          </Text>
          <View style={{ backgroundColor: tokens.actionPrimary + '20', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: tokens.actionPrimary }}>
              {sermon?.verses.length ?? 0}
            </Text>
          </View>
        </View>

        {/* Botão para escolher versículo direto daqui, sem precisar ir até o leitor */}
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
          disabled={isAddingVerses}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            backgroundColor: tokens.actionPrimary + '12', borderRadius: 12, paddingVertical: 12,
            borderWidth: 1, borderColor: tokens.actionPrimary + '30',
          }}
        >
          {isAddingVerses ? (
            <ActivityIndicator size="small" color={tokens.actionPrimary} />
          ) : (
            <MaterialCommunityIcons name="book-search-outline" size={18} color={tokens.actionPrimary} />
          )}
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: tokens.actionPrimary }}>
            {isAddingVerses ? 'Adicionando…' : 'Escolher versículo da Bíblia'}
          </Text>
        </TouchableOpacity>

        {(sermon?.verses.length ?? 0) === 0 ? (
          <View style={{ backgroundColor: tokens.bgCard, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: tokens.borderLight, alignItems: 'center', gap: 12 }}>
            <MaterialCommunityIcons name="book-plus-outline" size={36} color={tokens.iconMuted} />
            <Text style={{ fontSize: 14, color: tokens.textTertiary, textAlign: 'center', lineHeight: 22 }}>
              Toque em <Text style={{ fontWeight: '700', color: tokens.actionPrimary }}>{`"Escolher versículo da Bíblia"`}</Text> acima,
              ou no leitor faça <Text style={{ fontWeight: '700' }}>long press</Text> em qualquer versículo e toque em{' '}
              <Text style={{ fontWeight: '700', color: tokens.actionPrimary }}>{`"Adicionar ao sermão"`}</Text>.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {sermon!.verses.map((v: any) => (
              <View key={v.id} style={{ backgroundColor: tokens.bgCard, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderLight, flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, backgroundColor: tokens.actionPrimary + '15', alignItems: 'center', justifyContent: 'center' }}>
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
    <View style={{ flex: 1 }}>
      <SectionHelp tabKey={key} />
      <TextInput
        key={key}
        value={value}
        onChangeText={v => { setValue(v); triggerSave(); }}
        multiline
        placeholder={PLACEHOLDERS[key]}
        placeholderTextColor={tokens.textDisabled}
        style={textInputStyle}
      />
    </View>
  );

  // ── Outline — lista estruturada, não textarea ────────────────────

  const renderOutline = () => (
    <View style={{ flex: 1 }}>
      <SectionHelp tabKey="outline" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 10, paddingBottom: 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {outlineItems.length === 0 && (
          <View style={{ backgroundColor: tokens.bgCard, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: tokens.borderLight, alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="format-list-numbered" size={32} color={tokens.iconMuted} />
            <Text style={{ fontSize: 13, color: tokens.textTertiary, textAlign: 'center' }}>
              Nenhum ponto ainda. Adicione o primeiro ponto da sua pregação.
            </Text>
          </View>
        )}

        {outlineItems.map((item, idx) => {
          const mainNumber = outlineItems.slice(0, idx + 1).filter(i => i.level === 0).length;
          return (
            <View key={item.id} style={{
              flexDirection: 'row', alignItems: 'flex-start', gap: 10,
              marginLeft: item.level === 1 ? 28 : 0,
            }}>
              {/* Marcador */}
              <TouchableOpacity onPress={() => toggleOutlineLevel(item.id)} style={{ paddingTop: 12 }}>
                {item.level === 0 ? (
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: tokens.actionPrimary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: tokens.actionPrimaryText }}>{mainNumber}</Text>
                  </View>
                ) : (
                  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="minus" size={16} color={tokens.textTertiary} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Texto */}
              <TextInput
                value={item.text}
                onChangeText={t => updateOutlineText(item.id, t)}
                placeholder={item.level === 0 ? 'Ponto principal...' : 'Sub-ponto, ilustração...'}
                placeholderTextColor={tokens.textDisabled}
                multiline
                style={{
                  flex: 1, fontSize: item.level === 0 ? 15 : 14,
                  fontWeight: item.level === 0 ? '700' : '400',
                  color: item.level === 0 ? tokens.textPrimary : tokens.textSecondary,
                  paddingVertical: 10, paddingHorizontal: 12,
                  backgroundColor: tokens.bgCard, borderRadius: 10,
                  borderWidth: 1, borderColor: tokens.borderLight,
                }}
              />

              {/* Ações: mover + remover */}
              <View style={{ gap: 2, paddingTop: 8 }}>
                <TouchableOpacity onPress={() => moveOutlinePoint(item.id, -1)} disabled={idx === 0} style={{ opacity: idx === 0 ? 0.25 : 1, padding: 3 }}>
                  <MaterialCommunityIcons name="chevron-up" size={16} color={tokens.iconMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveOutlinePoint(item.id, 1)} disabled={idx === outlineItems.length - 1} style={{ opacity: idx === outlineItems.length - 1 ? 0.25 : 1, padding: 3 }}>
                  <MaterialCommunityIcons name="chevron-down" size={16} color={tokens.iconMuted} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => removeOutlinePoint(item.id)} style={{ paddingTop: 10, paddingLeft: 2 }}>
                <MaterialCommunityIcons name="close" size={16} color={tokens.iconMuted} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Botões de adicionar */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <TouchableOpacity
            onPress={() => addOutlinePoint(0)}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: tokens.actionPrimary + '15', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: tokens.actionPrimary + '30' }}
          >
            <MaterialCommunityIcons name="plus" size={16} color={tokens.actionPrimary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.actionPrimary }}>Ponto principal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => addOutlinePoint(1)}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: tokens.bgCard, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: tokens.borderLight }}
          >
            <MaterialCommunityIcons name="plus" size={16} color={tokens.textSecondary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.textSecondary }}>Sub-ponto</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const renderContent = () => {
    if (tab === 'passage') return renderPassage();
    if (tab === 'outline') return renderOutline();
    const map: Record<'context' | 'structure' | 'exegesis' | 'application', [string, (v: string) => void]> = {
      context:     [context,     setContext],
      structure:   [structure,   setStructure],
      exegesis:    [exegesis,    setExegesis],
      application: [application, setApplication],
    };
    const [val, setter] = map[tab as 'context' | 'structure' | 'exegesis' | 'application'];
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: tokens.bgPrimary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── HEADER ── */}
      <View style={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, gap: 10 }}>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={tokens.iconPrimary} />
          </TouchableOpacity>

          <TextInput
            value={title}
            onChangeText={v => { setTitle(v); triggerSave(); }}
            placeholder="Título do sermão"
            placeholderTextColor={tokens.textDisabled}
            style={{ flex: 1, fontSize: 15, fontWeight: '700', color: tokens.textPrimary }}
            returnKeyType="done"
          />

          {isSaving && <ActivityIndicator size="small" color={tokens.textDisabled} />}

          <TouchableOpacity onPress={handleShare} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="share-variant-outline" size={20} color={tokens.iconPrimary} />
          </TouchableOpacity>
        </View>

        {/* Botão de iniciar o púlpito — agora é um pill com gradiente, não um ícone solto */}
        <TouchableOpacity onPress={handleOpenPulpit} style={{ borderRadius: 12, overflow: 'hidden' }}>
          <LinearGradient
            colors={['#6D28D9', '#8B5CF6']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11 }}
          >
            <MaterialCommunityIcons name="presentation-play" size={18} color="white" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>Iniciar Modo Púlpito</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Status + progresso */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {(['draft', 'ready', 'preached'] as SermonStatus[]).map(st => {
            const active = sermon?.status === st;
            const color  = SERMON_STATUS_COLORS[st];
            return (
              <TouchableOpacity
                key={st}
                onPress={() => handleStatusChange(st)}
                style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 14, backgroundColor: active ? color : 'transparent', borderWidth: 1, borderColor: color }}
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
                <View key={t.key} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: done[t.key] ? tokens.success : tokens.borderMedium }} />
              ))}
            </View>
            <Text style={{ fontSize: 11, color: tokens.textTertiary }}>
              {doneCount}/{TABS.length}
            </Text>
          </View>
        </View>
      </View>

      {/* ── ABAS ── */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false} bounces={false}
        style={{ borderBottomWidth: 1, borderBottomColor: tokens.borderLight, flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ paddingHorizontal: 6 }}
      >
        {TABS.map(t => {
          const active = tab === t.key;
          const isDone = done[t.key];
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: active ? 2.5 : 0, borderBottomColor: tokens.actionPrimary, marginBottom: -1 }}
            >
              <MaterialCommunityIcons name={t.icon} size={14} color={active ? tokens.actionPrimary : isDone ? tokens.success : tokens.iconMuted} />
              <Text style={{ fontSize: 13, fontWeight: active ? '700' : '400', color: active ? tokens.actionPrimary : isDone ? tokens.textSecondary : tokens.textTertiary }}>
                {t.label}
              </Text>
              {isDone && !active && <MaterialCommunityIcons name="check-circle" size={11} color={tokens.success} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── CONTEÚDO ── */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>

      {/* Seletor de versículo — Livro → Capítulo → Versículos, focado, não a área Bíblia completa */}
      <VersePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handleVersesPicked}
      />
    </KeyboardAvoidingView>
  );
}