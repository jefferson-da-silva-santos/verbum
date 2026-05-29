import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface QuickMetricsProps { streak: number; chaptersRead: number; booksCompleted: number; }

export function QuickMetrics({ streak, chaptersRead, booksCompleted }: QuickMetricsProps) {
  const { tokens } = useTheme();
  const items = [
    { icon: 'fire' as const, value: streak, label: 'dias', color: tokens.streakIcon },
    { icon: 'book-open-variant' as const, value: chaptersRead, label: 'capítulos', color: tokens.iconPrimary },
    { icon: 'bookshelf' as const, value: booksCompleted, label: 'livros', color: tokens.success },
  ];
  return (
    <View style={{ flexDirection: 'row', marginHorizontal: 16, gap: 10 }}>
      {items.map(item => (
        <View key={item.label} style={{ flex: 1, backgroundColor: tokens.bgCard, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: tokens.borderLight }}>
          <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
          <Text style={{ fontSize: 20, fontWeight: '700', color: tokens.textPrimary, lineHeight: 24 }}>{item.value}</Text>
          <Text style={{ fontSize: 11, color: tokens.textTertiary, letterSpacing: 0.3 }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}