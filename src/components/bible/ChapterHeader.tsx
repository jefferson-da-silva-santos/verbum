/**
 * VERBUM — src/components/bible/ChapterHeader.tsx  [ATUALIZADO]
 *
 * VerseActionSheet agora inclui:
 *   - Comparar versões (existia)
 *   - Adicionar ao sermão (NOVO)
 *   - Adicionar ao mapa temático (NOVO)
 *   - Exposição guiada do capítulo (nova prop onStudy)
 *   - Anotar / Favoritar / Compartilhar (existia)
 */

import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { HIGHLIGHT_DEFINITIONS } from '../../constants/bible';
import type { HighlightColor } from '../../constants/bible';

// ─── ChapterHeader ───────────────────────────────────────────────────

export function ChapterHeader({ bookName, chapterNum, totalVerses, onStudy }: {
  bookName: string; chapterNum: number; totalVerses: number;
  /** Abre a Exposição Guiada (COIA) para este capítulo */
  onStudy?: () => void;
}) {
  const { tokens } = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: tokens.borderLight, marginBottom: 8 }}>
      <Text style={{ fontSize: 26, fontWeight: '700', color: tokens.textPrimary, fontFamily: 'serif', textTransform: 'uppercase', letterSpacing: -0.5, textAlign: 'center' }}>{bookName}</Text>
      <Text style={{ fontSize: 14, color: tokens.textTertiary, marginTop: 4, letterSpacing: 1.2, textTransform: 'uppercase' }}>Capítulo {chapterNum}</Text>
      <Text style={{ fontSize: 12, color: tokens.textDisabled, marginTop: 2 }}>{totalVerses} versículos</Text>
      {onStudy && (
        <TouchableOpacity onPress={onStudy} style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, backgroundColor: tokens.actionPrimary + '15', borderWidth: 1, borderColor: tokens.actionPrimary + '40' }}>
          <MaterialCommunityIcons name="book-search-outline" size={14} color={tokens.actionPrimary} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: tokens.actionPrimary }}>Exposição Guiada (COIA)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── VerseActionSheet ────────────────────────────────────────────────

export interface VerseActionSheetProps {
  visible:      boolean;
  verseNumber:  number;
  verseText:    string;
  reference:    string;
  onClose:      () => void;
  onHighlight:  (color: HighlightColor) => void;
  onNote:       () => void;
  onFavorite:   () => void;
  onShare:      () => void;
  onCompare:    () => void;
  /** Adicionar versículo ao sermão ativo */
  onAddToSermon: () => void;
  /** Adicionar versículo a um mapa temático */
  onAddToMap:    () => void;
  isFavorited:  boolean;
}

export function VerseActionSheet({
  visible, verseNumber, verseText, reference,
  onClose, onHighlight, onNote, onFavorite, onShare,
  onCompare, onAddToSermon, onAddToMap,
  isFavorited,
}: VerseActionSheetProps) {
  const { tokens } = useTheme();
  if (!visible) return null;

  const highlightColors: HighlightColor[] = ['yellow', 'red', 'blue', 'green'];

  // Ações organizadas: destaques visuais primeiro, depois lista vertical
  const primaryActions = [
    {
      icon:    'compare' as keyof typeof MaterialCommunityIcons.glyphMap,
      label:   'Comparar versões',
      sub:     'Outras traduções',
      onPress: onCompare,
      color:   tokens.actionPrimary,
    },
    {
      icon:    'notebook-outline' as keyof typeof MaterialCommunityIcons.glyphMap,
      label:   'Adicionar ao sermão',
      sub:     'Caderno do pregador',
      onPress: onAddToSermon,
      color:   '#8B6340',
    },
    {
      icon:    'transit-connection-variant' as keyof typeof MaterialCommunityIcons.glyphMap,
      label:   'Adicionar ao mapa',
      sub:     'Mapa temático',
      onPress: onAddToMap,
      color:   '#4A7C59',
    },
  ];

  const secondaryActions = [
    { icon: 'pencil-outline'         as keyof typeof MaterialCommunityIcons.glyphMap, label: 'Anotar',      onPress: onNote },
    { icon: (isFavorited ? 'heart' : 'heart-outline') as keyof typeof MaterialCommunityIcons.glyphMap, label: isFavorited ? 'Favoritado' : 'Favoritar', onPress: onFavorite },
    { icon: 'share-variant-outline'  as keyof typeof MaterialCommunityIcons.glyphMap, label: 'Compartilhar', onPress: onShare },
  ];

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: tokens.bgOverlay }} onPress={onClose} />
      <View style={{ backgroundColor: tokens.bgModal, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 36 }}>
        {/* Handle */}
        <View style={{ width: 40, height: 4, backgroundColor: tokens.borderMedium, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

        {/* Referência + preview */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.actionPrimary, textAlign: 'center', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
          {reference || `Versículo ${verseNumber}`}
        </Text>
        <Text numberOfLines={2} style={{ fontSize: 13, color: tokens.textSecondary, textAlign: 'center', paddingHorizontal: 28, fontFamily: 'serif', lineHeight: 20, marginBottom: 20 }}>
          {verseText}
        </Text>

        {/* Cores de destaque */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 20, paddingHorizontal: 20 }}>
          {highlightColors.map(color => {
            const def = HIGHLIGHT_DEFINITIONS[color];
            return (
              <TouchableOpacity key={color} onPress={() => { onHighlight(color); onClose(); }}
                style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: def.hexBackground, borderWidth: 2, borderColor: def.hex, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={def.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={def.hex} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 1, backgroundColor: tokens.borderLight, marginHorizontal: 20, marginBottom: 4 }} />

        {/* Ações primárias (com ícone colorido em destaque) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
          {primaryActions.map(action => (
            <TouchableOpacity key={action.label} onPress={() => { action.onPress(); onClose(); }}
              style={{ alignItems: 'center', gap: 6, width: 90 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: action.color + '18', borderWidth: 1.5, borderColor: action.color + '50', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: action.color, textAlign: 'center' }}>{action.label}</Text>
              <Text style={{ fontSize: 10, color: tokens.textDisabled, textAlign: 'center' }}>{action.sub}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ height: 1, backgroundColor: tokens.borderLight, marginHorizontal: 20, marginBottom: 4 }} />

        {/* Ações secundárias (lista simples) */}
        {secondaryActions.map(action => (
          <TouchableOpacity key={action.label} onPress={() => { action.onPress(); onClose(); }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 24, gap: 16 }}>
            <MaterialCommunityIcons name={action.icon} size={22} color={tokens.iconPrimary} />
            <Text style={{ fontSize: 16, color: tokens.textPrimary }}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}