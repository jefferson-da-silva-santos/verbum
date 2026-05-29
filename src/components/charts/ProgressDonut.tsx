
import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ProgressDonutProps { percent: number; size?: number; label?: string; }

export function ProgressDonut({ percent, size = 120, label }: ProgressDonutProps) {
  const { tokens } = useTheme();
  const stroke = size * 0.1;
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: tokens.progressBg, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: size - stroke * 2, height: size - stroke * 2, borderRadius: (size - stroke * 2) / 2, backgroundColor: tokens.bgCard, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: size * 0.2, fontWeight: '700', color: tokens.textPrimary }}>{clamped.toFixed(0)}%</Text>
          {label && <Text style={{ fontSize: size * 0.1, color: tokens.textTertiary, textAlign: 'center' }}>{label}</Text>}
        </View>
      </View>
    </View>
  );
}
