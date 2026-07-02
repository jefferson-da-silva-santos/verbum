/**
 * VERBUM — src/components/bible/ChapterHeader.tsx  [ATUALIZADO]
 *
 * Adiciona a ação "Comparar versões" no VerseActionSheet.
 * Nova prop: onCompare — callback chamado quando o usuário toca em comparar.
 */

import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context';
import { HIGHLIGHT_DEFINITIONS } from '@/src/constants';
import type { HighlightColor } from '@/src/constants';

// ─── ChapterHeader ────────────────────────────

interface ChapterHeaderProps {
  bookName:    string;
  chapterNum:  number;
  totalVerses: number;
}

export function ChapterHeader({ bookName, chapterNum, totalVerses }: ChapterHeaderProps) {
  const { tokens } = useTheme();
  return (
    <View style={{
      paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24,
      alignItems: 'center', borderBottomWidth: 1, borderBottomColor: tokens.borderLight,
      marginBottom: 8,
    }}>
      <Text style={{
        fontSize: 28, fontWeight: '700', color: tokens.textPrimary,
        fontFamily: 'serif', textAlign: 'center', letterSpacing: -0.5,
        textTransform: 'uppercase',
      }}>
        {bookName}
      </Text>
      <Text style={{
        fontSize: 16, color: tokens.textTertiary, marginTop: 6,
        letterSpacing: 1.2, textTransform: 'uppercase',
      }}>
        Capítulo {chapterNum}
      </Text>
      <Text style={{ fontSize: 12, color: tokens.textDisabled, marginTop: 4 }}>
        {totalVerses} versículos
      </Text>
    </View>
  );
}

// ─── VerseActionSheet ─────────────────────────

interface VerseActionSheetProps {
  visible:      boolean;
  verseNumber:  number;
  verseText:    string;
  reference:    string;  // ex: "Jo 3:16"
  onClose:      () => void;
  onHighlight:  (color: HighlightColor) => void;
  onNote:       () => void;
  onFavorite:   () => void;
  onShare:      () => void;
  /** NOVO — abre o modal de comparação de versões */
  onCompare:    () => void;
  isFavorited:  boolean;
}

export function VerseActionSheet({
  visible, verseNumber, verseText, reference,
  onClose, onHighlight, onNote, onFavorite, onShare, onCompare,
  isFavorited,
}: VerseActionSheetProps) {
  const { tokens } = useTheme();
  if (!visible) return null;

  const colors: HighlightColor[] = ['yellow', 'red', 'blue', 'green'];

  const actions = [
    {
      icon:    'compare' as keyof typeof MaterialCommunityIcons.glyphMap,
      label:   'Comparar versões',
      onPress: onCompare,
      accent:  true,  // destaque visual para a nova ação
    },
    {
      icon:    'pencil-outline' as keyof typeof MaterialCommunityIcons.glyphMap,
      label:   'Anotar',
      onPress: onNote,
      accent:  false,
    },
    {
      icon:    (isFavorited ? 'heart' : 'heart-outline') as keyof typeof MaterialCommunityIcons.glyphMap,
      label:   isFavorited ? 'Salvo nos favoritos' : 'Favoritar',
      onPress: onFavorite,
      accent:  false,
    },
    {
      icon:    'share-variant-outline' as keyof typeof MaterialCommunityIcons.glyphMap,
      label:   'Compartilhar',
      onPress: onShare,
      accent:  false,
    },
  ] as const;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: tokens.bgOverlay }}
        onPress={onClose}
      />
      <View style={{
        backgroundColor: tokens.bgModal,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingBottom: 32, paddingTop: 12,
      }}>
        {/* Handle */}
        <View style={{
          width: 40, height: 4, backgroundColor: tokens.borderMedium,
          borderRadius: 2, alignSelf: 'center', marginBottom: 14,
        }} />

        {/* Referência e preview do versículo */}
        <Text style={{
          fontSize: 12, fontWeight: '700', color: tokens.actionPrimary,
          textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          {reference || `Versículo ${verseNumber}`}
        </Text>
        <Text
          numberOfLines={2}
          style={{
            fontSize: 13, color: tokens.textSecondary,
            textAlign: 'center', paddingHorizontal: 28,
            fontFamily: 'serif', lineHeight: 20,
            marginBottom: 20,
          }}
        >
          {verseText}
        </Text>

        {/* Cores de destaque */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
          {colors.map(color => {
            const def = HIGHLIGHT_DEFINITIONS[color];
            return (
              <TouchableOpacity
                key={color}
                onPress={() => { onHighlight(color); onClose(); }}
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: def.hexBackground,
                  borderWidth: 2, borderColor: def.hex,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons
                  name={def.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={20}
                  color={def.hex}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Divisor */}
        <View style={{ height: 1, backgroundColor: tokens.borderLight, marginHorizontal: 20, marginBottom: 8 }} />

        {/* Ações — centralizadas horizontalmente */}
        {actions.map(action => (
          <TouchableOpacity
            key={action.label}
            onPress={() => { action.onPress(); onClose(); }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 14,
              paddingHorizontal: 24,
              gap: 12,
              backgroundColor: action.accent ? tokens.actionPrimary + '12' : 'transparent',
            }}
          >
            <MaterialCommunityIcons
              name={action.icon}
              size={22}
              color={action.accent ? tokens.actionPrimary : tokens.iconPrimary}
            />
            <Text style={{
              fontSize: 16,
              color: action.accent ? tokens.actionPrimary : tokens.textPrimary,
              fontWeight: action.accent ? '600' : '400',
            }}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}