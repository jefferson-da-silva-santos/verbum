/**
 * VERBUM — src/components/bible/ChapterHeader.tsx
 * Contém: ChapterHeader, VerseActionSheet
 */

import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ChapterHeaderProps { bookName: string; chapterNum: number; totalVerses: number; }

export function ChapterHeader({ bookName, chapterNum, totalVerses }: ChapterHeaderProps) {
  const { tokens } = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: tokens.borderLight, marginBottom: 8 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: tokens.textPrimary, fontFamily: 'serif', textAlign: 'center', letterSpacing: -0.5, textTransform: 'uppercase' }}>
        {bookName}
      </Text>
      <Text style={{ fontSize: 16, color: tokens.textTertiary, marginTop: 6, letterSpacing: 1.2, textTransform: 'uppercase' }}>
        Capítulo {chapterNum}
      </Text>
      <Text style={{ fontSize: 12, color: tokens.textDisabled, marginTop: 4 }}>{totalVerses} versículos</Text>
    </View>
  );
}