/**
 * VERBUM — src/components/ui/Button.tsx
 */

import { TouchableOpacity, Text, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: { container: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, minHeight: 36 }, text: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3 } },
  md: { container: { paddingVertical: 13, paddingHorizontal: 20, borderRadius: 10, minHeight: 48 }, text: { fontSize: 15, fontWeight: '600', letterSpacing: 0.3 } },
  lg: { container: { paddingVertical: 16, paddingHorizontal: 28, borderRadius: 12, minHeight: 56 }, text: { fontSize: 16, fontWeight: '700', letterSpacing: 0.4 } },
};

export function Button({ label, onPress, variant = 'primary', size = 'md', disabled = false, loading = false, fullWidth = false, style }: ButtonProps) {
  const { tokens } = useTheme();

  const bg =
    variant === 'primary' ? tokens.actionPrimary :
      variant === 'secondary' ? tokens.actionSecondary :
        variant === 'ghost' ? 'transparent' :
          tokens.actionDestructive;

  const color =
    variant === 'primary' ? tokens.actionPrimaryText :
      variant === 'secondary' ? tokens.actionSecondaryText :
        variant === 'ghost' ? tokens.actionGhostText :
          tokens.actionDestructiveText;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.76}
      style={[
        SIZE_MAP[size].container,
        { backgroundColor: bg, opacity: disabled || loading ? 0.52 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: fullWidth ? 'stretch' : 'flex-start' },
        variant === 'secondary' ? { borderWidth: 1, borderColor: tokens.borderMedium } : {},
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator size="small" color={color} />
        : <Text style={[SIZE_MAP[size].text, { color }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}