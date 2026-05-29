/**
 * VERBUM — src/components/bible/VerseItem.tsx
 */

import { Text, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Highlight } from '../../database/types';

interface VerseItemProps {
  number: number;
  text: string;
  highlight?: Highlight | null;
  onLongPress: (verseNumber: number, verseText: string) => void;
  fontSize?: number;
}

export function VerseItem({ number, text, highlight, onLongPress, fontSize = 17 }: VerseItemProps) {
  const { tokens } = useTheme();

  const highlightBg =
    highlight?.color === 'yellow' ? tokens.highlightYellowBg :
      highlight?.color === 'red' ? tokens.highlightRedBg :
        highlight?.color === 'blue' ? tokens.highlightBlueBg :
          highlight?.color === 'green' ? tokens.highlightGreenBg :
            undefined;

  const highlightBorder =
    highlight?.color === 'yellow' ? tokens.highlightYellowBorder :
      highlight?.color === 'red' ? tokens.highlightRedBorder :
        highlight?.color === 'blue' ? tokens.highlightBlueBorder :
          highlight?.color === 'green' ? tokens.highlightGreenBorder :
            undefined;

  return (
    <Pressable
      onLongPress={() => onLongPress(number, text)}
      delayLongPress={350}
      android_ripple={{ color: tokens.borderLight }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: pressed ? tokens.bgTertiary : (highlightBg ?? 'transparent'),
        borderLeftWidth: highlight ? 3 : 0,
        borderLeftColor: highlightBorder,
        marginBottom: 2,
      })}
    >
      <Text style={{
        fontSize: 11, fontWeight: '700', color: tokens.cultoVerseNum,
        marginRight: 10, marginTop: 5, lineHeight: 14,
        minWidth: 22, textAlign: 'right', letterSpacing: 0.4,
      }}>
        {number}
      </Text>
      <Text selectable style={{ flex: 1, fontSize, lineHeight: fontSize * 1.85, color: tokens.textVerse, fontFamily: 'serif' }}>
        {text}
      </Text>
    </Pressable>
  );
}