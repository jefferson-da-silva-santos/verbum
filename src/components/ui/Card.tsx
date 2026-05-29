/**
 * VERBUM — src/components/ui/Card.tsx
 * Contém: Card, ProgressBar, Badge, Divider
 */

import { View, TouchableOpacity } from 'react-native';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// ─── Card ────────────────────────────────────

interface CardProps { children: ReactNode; onPress?: () => void; style?: ViewStyle; padding?: number; elevated?: boolean; }

export function Card({ children, onPress, style, padding = 16, elevated = true }: CardProps) {
  const { tokens, shadows } = useTheme();
  const base: ViewStyle = { backgroundColor: tokens.bgCard, borderRadius: 12, padding, borderWidth: 1, borderColor: tokens.borderLight, ...(elevated ? shadows.md : {}) };
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={[base, style]}>{children}</TouchableOpacity>;
  return <View style={[base, style]}>{children}</View>;
}
