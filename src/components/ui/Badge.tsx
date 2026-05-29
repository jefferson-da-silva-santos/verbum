// ─── Badge ───────────────────────────────────


import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface BadgeProps { label: string; color?: string; bgColor?: string; size?: 'sm' | 'md'; }

export function Badge({ label, color, bgColor, size = 'md' }: BadgeProps) {
  const { tokens } = useTheme();
  return (
    <View style={{ backgroundColor: bgColor ?? tokens.actionSecondary, borderRadius: 99, paddingVertical: size === 'sm' ? 2 : 4, paddingHorizontal: size === 'sm' ? 8 : 12, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: size === 'sm' ? 10 : 12, fontWeight: '600', color: color ?? tokens.textSecondary, letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}
