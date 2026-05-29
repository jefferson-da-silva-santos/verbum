
import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';


interface ProgressBarProps { value: number; height?: number; showLabel?: boolean; color?: string; }

export function ProgressBar({ value, height = 8, showLabel = false, color }: ProgressBarProps) {
  const { tokens } = useTheme();
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <View style={{ gap: 4 }}>
      {showLabel && <Text style={{ fontSize: 12, fontWeight: '600', color: tokens.progressText, alignSelf: 'flex-end' }}>{clamped.toFixed(1)}%</Text>}
      <View style={{ height, backgroundColor: tokens.progressBg, borderRadius: height / 2, overflow: 'hidden' }}>
        <View style={{ height, width: `${clamped}%`, backgroundColor: color ?? tokens.progressFill, borderRadius: height / 2 }} />
      </View>
    </View>
  );
}