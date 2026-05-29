
import { View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface DividerProps { vertical?: boolean; thickness?: number; margin?: number; }

export function Divider({ vertical = false, thickness = 1, margin = 0 }: DividerProps) {
  const { tokens } = useTheme();
  return <View style={vertical
    ? { width: thickness, backgroundColor: tokens.borderLight, marginHorizontal: margin, alignSelf: 'stretch' }
    : { height: thickness, backgroundColor: tokens.borderLight, marginVertical: margin, alignSelf: 'stretch' }} />;
}