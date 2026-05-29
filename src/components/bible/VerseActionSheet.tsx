import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { HIGHLIGHT_DEFINITIONS } from '../../constants/bible';
import type { HighlightColor } from '../../constants/bible';

interface VerseActionSheetProps {
  visible: boolean; verseNumber: number; verseText: string;
  onClose: () => void; onHighlight: (c: HighlightColor) => void;
  onNote: () => void; onFavorite: () => void; onShare: () => void;
  isFavorited: boolean;
}

export function VerseActionSheet({ visible, verseNumber, verseText, onClose, onHighlight, onNote, onFavorite, onShare, isFavorited }: VerseActionSheetProps) {
  const { tokens } = useTheme();
  if (!visible) return null;

  const colors: HighlightColor[] = ['yellow', 'red', 'blue', 'green'];

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: tokens.bgOverlay }} onPress={onClose} />
      <View style={{ backgroundColor: tokens.bgModal, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, paddingTop: 16 }}>
        <View style={{ width: 40, height: 4, backgroundColor: tokens.borderMedium, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
        <Text style={{ fontSize: 13, color: tokens.textTertiary, textAlign: 'center', marginBottom: 4, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          Versículo {verseNumber}
        </Text>
        <Text numberOfLines={2} style={{ fontSize: 14, color: tokens.textSecondary, textAlign: 'center', paddingHorizontal: 24, fontFamily: 'serif', marginBottom: 20 }}>
          {verseText}
        </Text>

        {/* Cores */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          {colors.map(color => {
            const def = HIGHLIGHT_DEFINITIONS[color];
            return (
              <TouchableOpacity key={color} onPress={() => onHighlight(color)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: def.hexBackground, borderWidth: 2, borderColor: def.hex, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={def.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={def.hex} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ações */}
        {[
          { icon: 'pencil-outline' as keyof typeof MaterialCommunityIcons.glyphMap, label: 'Anotar', onPress: onNote },
          { icon: (isFavorited ? 'heart' : 'heart-outline') as keyof typeof MaterialCommunityIcons.glyphMap, label: isFavorited ? 'Salvo' : 'Favoritar', onPress: onFavorite },
          { icon: 'share-variant-outline' as keyof typeof MaterialCommunityIcons.glyphMap, label: 'Compartilhar', onPress: onShare },
        ].map(action => (
          <TouchableOpacity key={action.label} onPress={() => { action.onPress(); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, gap: 14 }}>
            <MaterialCommunityIcons name={action.icon} size={22} color={tokens.iconPrimary} />
            <Text style={{ fontSize: 16, color: tokens.textPrimary }}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}