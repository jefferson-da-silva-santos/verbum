/**
 * VERBUM — src/components/ui/Input.tsx
 */

import { View, Text, TextInput, type ViewStyle, type TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, icon, containerStyle, ...rest }: InputProps) {
  const { tokens } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label && (
        <Text style={{ fontSize: 13, fontWeight: '500', color: tokens.textSecondary }}>{label}</Text>
      )}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: tokens.bgInput,
        borderWidth: 1,
        borderColor: focused ? tokens.borderFocus : (error ? tokens.error : tokens.borderLight),
        borderRadius: 10, paddingHorizontal: 14, minHeight: 48, gap: 10,
      }}>
        {icon && (
          <MaterialCommunityIcons name={icon} size={18} color={focused ? tokens.iconPrimary : tokens.iconMuted} />
        )}
        <TextInput
          style={{ flex: 1, fontSize: 15, color: tokens.textPrimary, paddingVertical: 0 }}
          placeholderTextColor={tokens.textDisabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
      </View>
      {error && <Text style={{ fontSize: 12, color: tokens.error }}>{error}</Text>}
    </View>
  );
}