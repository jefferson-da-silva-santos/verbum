/**
 * VERBUM — src/components/bible/ChapterHeader.tsx
 *
 * COLE ESTE ARQUIVO EM:
 *   src/components/bible/ChapterHeader.tsx
 *
 * Mudanças em relação à versão anterior:
 *   + prop onCompare adicionada ao VerseActionSheet
 *   + prop reference adicionada (ex: "Jo 3:16")
 *   + botão "Comparar versões" como primeiro item das ações
 */

import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { HIGHLIGHT_DEFINITIONS } from '../../constants/bible';
import type { HighlightColor } from '../../constants/bible';

// ─────────────────────────────────────────────
// ChapterHeader
// ─────────────────────────────────────────────

interface ChapterHeaderProps {
  bookName:    string;
  chapterNum:  number;
  totalVerses: number;
}

export function ChapterHeader({ bookName, chapterNum, totalVerses }: ChapterHeaderProps) {
  const { tokens } = useTheme();

  return (
    <View style={{
      paddingHorizontal: 20,
      paddingTop: 32,
      paddingBottom: 24,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: tokens.borderLight,
      marginBottom: 8,
    }}>
      <Text style={{
        fontSize: 28,
        fontWeight: '700',
        color: tokens.textPrimary,
        fontFamily: 'serif',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
      }}>
        {bookName}
      </Text>
      <Text style={{
        fontSize: 16,
        color: tokens.textTertiary,
        marginTop: 6,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
      }}>
        Capítulo {chapterNum}
      </Text>
      <Text style={{ fontSize: 12, color: tokens.textDisabled, marginTop: 4 }}>
        {totalVerses} versículos
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// VerseActionSheet
// ─────────────────────────────────────────────

export interface VerseActionSheetProps {
  visible:     boolean;
  verseNumber: number;
  verseText:   string;
  /** Referência formatada, ex: "Jo 3:16" */
  reference:   string;
  onClose:     () => void;
  onHighlight: (color: HighlightColor) => void;
  onNote:      () => void;
  onFavorite:  () => void;
  onShare:     () => void;
  /** Abre o modal de comparação de versões */
  onCompare:   () => void;
  isFavorited: boolean;
}

export function VerseActionSheet({
  visible,
  verseNumber,
  verseText,
  reference,
  onClose,
  onHighlight,
  onNote,
  onFavorite,
  onShare,
  onCompare,
  isFavorited,
}: VerseActionSheetProps) {
  const { tokens } = useTheme();

  if (!visible) return null;

  const highlightColors: HighlightColor[] = ['yellow', 'red', 'blue', 'green'];

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Pressable
        style={{ flex: 1, backgroundColor: tokens.bgOverlay }}
        onPress={onClose}
      />

      {/* Sheet */}
      <View style={{
        backgroundColor: tokens.bgModal,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingBottom: 36,
      }}>

        {/* Handle */}
        <View style={{
          width: 40, height: 4,
          backgroundColor: tokens.borderMedium,
          borderRadius: 2,
          alignSelf: 'center',
          marginBottom: 16,
        }} />

        {/* Referência do versículo */}
        <Text style={{
          fontSize: 12,
          fontWeight: '700',
          color: tokens.actionPrimary,
          textAlign: 'center',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          {reference || `Versículo ${verseNumber}`}
        </Text>

        {/* Preview do texto */}
        <Text
          numberOfLines={2}
          style={{
            fontSize: 13,
            color: tokens.textSecondary,
            textAlign: 'center',
            paddingHorizontal: 28,
            fontFamily: 'serif',
            lineHeight: 20,
            marginBottom: 20,
          }}
        >
          {verseText}
        </Text>

        {/* ── Cores de destaque ── */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 14,
          marginBottom: 20,
          paddingHorizontal: 20,
        }}>
          {highlightColors.map(color => {
            const def = HIGHLIGHT_DEFINITIONS[color];
            return (
              <TouchableOpacity
                key={color}
                onPress={() => { onHighlight(color); onClose(); }}
                style={{
                  width: 48, height: 48,
                  borderRadius: 24,
                  backgroundColor: def.hexBackground,
                  borderWidth: 2,
                  borderColor: def.hex,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons
                  name={def.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={22}
                  color={def.hex}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Divisor */}
        <View style={{
          height: 1,
          backgroundColor: tokens.borderLight,
          marginHorizontal: 20,
          marginBottom: 4,
        }} />

        {/* ── Ações ── */}

        {/* COMPARAR VERSÕES — em destaque */}
        <TouchableOpacity
          onPress={() => { onCompare(); onClose(); }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 16,
            paddingHorizontal: 24,
            gap: 16,
            backgroundColor: tokens.actionPrimary + '14',
          }}
        >
          <View style={{
            width: 36, height: 36,
            borderRadius: 18,
            backgroundColor: tokens.actionPrimary + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MaterialCommunityIcons
              name="compare"
              size={20}
              color={tokens.actionPrimary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: tokens.actionPrimary }}>
              Comparar versões
            </Text>
            <Text style={{ fontSize: 12, color: tokens.textTertiary, marginTop: 1 }}>
              Ver este versículo em outras traduções
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={tokens.actionPrimary}
          />
        </TouchableOpacity>

        {/* Anotar */}
        <TouchableOpacity
          onPress={() => { onNote(); onClose(); }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 15,
            paddingHorizontal: 24,
            gap: 16,
          }}
        >
          <MaterialCommunityIcons name="pencil-outline" size={22} color={tokens.iconPrimary} />
          <Text style={{ fontSize: 16, color: tokens.textPrimary }}>Anotar</Text>
        </TouchableOpacity>

        {/* Favoritar */}
        <TouchableOpacity
          onPress={() => { onFavorite(); onClose(); }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 15,
            paddingHorizontal: 24,
            gap: 16,
          }}
        >
          <MaterialCommunityIcons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorited ? tokens.error : tokens.iconPrimary}
          />
          <Text style={{ fontSize: 16, color: tokens.textPrimary }}>
            {isFavorited ? 'Salvo nos favoritos' : 'Favoritar'}
          </Text>
        </TouchableOpacity>

        {/* Compartilhar */}
        <TouchableOpacity
          onPress={() => { onShare(); onClose(); }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 15,
            paddingHorizontal: 24,
            gap: 16,
          }}
        >
          <MaterialCommunityIcons name="share-variant-outline" size={22} color={tokens.iconPrimary} />
          <Text style={{ fontSize: 16, color: tokens.textPrimary }}>Compartilhar</Text>
        </TouchableOpacity>

      </View>
    </Modal>
  );
}