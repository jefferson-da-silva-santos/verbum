/**
 * VERBUM — app/(app)/profile.tsx  —  ProfileScreen
 */

import { ScrollView, View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { useAchievements } from '../../src/hooks/useAchievements';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { BIBLE_VERSIONS } from '../../src/constants/bible';
import type { BibleVersion } from '../../src/constants/bible';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function SettingRow({ icon, label, right, onPress, danger = false }: {
  icon: IconName; label: string; right?: React.ReactNode; onPress?: () => void; danger?: boolean;
}) {
  const { tokens } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress && !right} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
      <MaterialCommunityIcons name={icon} size={22} color={danger ? tokens.error : tokens.iconPrimary} />
      <Text style={{ flex: 1, fontSize: 15, color: danger ? tokens.error : tokens.textPrimary }}>{label}</Text>
      {right ?? (onPress && <MaterialCommunityIcons name="chevron-right" size={18} color={tokens.iconMuted} />)}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { tokens, isDark, preference, setPreference } = useTheme();
  const { user, logout, updateProfile } = useAuthContext();
  const { unlockedCount, totalCount, progressPercent } = useAchievements();

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Seus dados locais serão mantidos. Deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24 }}>
          <Text style={{ fontSize: 26, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary }}>Perfil</Text>
        </View>

        {/* Avatar */}
        <View style={{ alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: tokens.actionPrimary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: '700', color: tokens.actionPrimaryText }}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.textPrimary }}>{user?.name}</Text>
          <Text style={{ fontSize: 13, color: tokens.textTertiary }}>{user?.email}</Text>
        </View>

        {/* Conquistas resumo */}
        <TouchableOpacity onPress={() => router.push('/(app)/modals/achievements')} style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: tokens.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: tokens.borderLight, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="trophy-outline" size={22} color={tokens.actionPrimary} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: tokens.textPrimary }}>Conquistas</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.actionPrimary }}>{unlockedCount}/{totalCount}</Text>
          </View>
          <ProgressBar value={progressPercent} />
        </TouchableOpacity>

        {/* Versão bíblica */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, letterSpacing: 1.2, textTransform: 'uppercase' }}>Versão Bíblica</Text>
        </View>
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          {BIBLE_VERSIONS.map(v => (
            <TouchableOpacity key={v.id} onPress={() => updateProfile({ preferredVersion: v.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
              <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: user?.preferredVersion === v.id ? tokens.actionPrimary : tokens.bgSecondary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: user?.preferredVersion === v.id ? tokens.actionPrimaryText : tokens.textTertiary }}>{v.name}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: tokens.textPrimary }}>{v.name}</Text>
                <Text style={{ fontSize: 11, color: tokens.textTertiary }}>{v.fullName}</Text>
              </View>
              {user?.preferredVersion === v.id && <MaterialCommunityIcons name="check" size={18} color={tokens.success} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Aparência */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, letterSpacing: 1.2, textTransform: 'uppercase' }}>Aparência</Text>
        </View>
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <SettingRow icon="theme-light-dark" label="Tema escuro" right={
            <Switch value={preference === 'dark'} onValueChange={val => setPreference(val ? 'dark' : 'light')} trackColor={{ true: tokens.actionPrimary, false: tokens.borderMedium }} />
          } />
          <SettingRow icon="monitor-cellphone" label="Seguir o sistema" right={
            <Switch value={preference === 'system'} onValueChange={val => setPreference(val ? 'system' : isDark ? 'dark' : 'light')} trackColor={{ true: tokens.actionPrimary, false: tokens.borderMedium }} />
          } />
        </View>

        {/* Dados */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, letterSpacing: 1.2, textTransform: 'uppercase' }}>Dados</Text>
        </View>
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <SettingRow icon="book-heart-outline" label="Diário Espiritual" onPress={() => { }} />
          <SettingRow icon="export-variant" label="Exportar anotações" onPress={() => { }} />
        </View>

        <View style={{ marginHorizontal: 16, marginTop: 20, backgroundColor: tokens.bgCard, borderRadius: 12, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <SettingRow icon="logout" label="Sair da conta" onPress={handleLogout} danger />
        </View>

        <Text style={{ textAlign: 'center', color: tokens.textDisabled, fontSize: 12, marginTop: 24 }}>Verbum · versão 1.0.0</Text>
      </ScrollView>
    </View>
  );
}