/**
 * VERBUM — Modal: Settings
 * Tela dedicada de configurações — acessada pelo Profile.
 */

import { View, Text, ScrollView, TouchableOpacity, Switch, SafeAreaView, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { BibleApiClient } from '../../../src/api/bibliaApi';
import { BIBLE_VERSIONS, FontScaleFactors } from '../../../src/constants/typography';
import type { FontScaleFactor } from '../../../src/constants/typography';
import { useState } from 'react';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function Section({ label }: { label: string }) {
  const { tokens } = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 10 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textTertiary, textTransform: 'uppercase', letterSpacing: 1.2 }}>
        {label}
      </Text>
    </View>
  );
}

function SettingRow({ icon, label, right, onPress, danger = false, subtext }: {
  icon: IconName; label: string; subtext?: string;
  right?: React.ReactNode; onPress?: () => void; danger?: boolean;
}) {
  const { tokens } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !right}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}
    >
      <MaterialCommunityIcons name={icon} size={22} color={danger ? tokens.error : tokens.iconPrimary} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: danger ? tokens.error : tokens.textPrimary }}>{label}</Text>
        {subtext && <Text style={{ fontSize: 12, color: tokens.textTertiary, marginTop: 1 }}>{subtext}</Text>}
      </View>
      {right ?? (onPress && !danger && <MaterialCommunityIcons name="chevron-right" size={18} color={tokens.iconMuted} />)}
    </TouchableOpacity>
  );
}

export default function SettingsModal() {
  const { tokens, isDark, preference, setPreference } = useTheme();
  const { user, logout, updateProfile } = useAuthContext();
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');

  const checkApi = async () => {
    setApiStatus('checking');
    const ok = await BibleApiClient.healthCheck();
    setApiStatus(ok ? 'ok' : 'error');
    setTimeout(() => setApiStatus('idle'), 3000);
  };

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Seus dados locais serão mantidos. Deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>
          Configurações
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Leitura */}
        <Section label="Leitura" />
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <SettingRow icon="translate" label="Versão Bíblica" subtext={user?.preferredVersion?.toUpperCase()} onPress={() => { }} />
          <SettingRow icon="speedometer" label="Calibrar velocidade de leitura" subtext={`${user?.avgReadingSpeed ?? 3.7} min/capítulo`} onPress={() => router.push('/(app)/modals/calibrate-speed')} />
          <SettingRow icon="format-size" label="Tamanho da fonte" subtext={`Escala ${user?.fontScale ?? 1.0}×`} onPress={() => { }} />
        </View>

        {/* Aparência */}
        <Section label="Aparência" />
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <SettingRow icon="weather-night" label="Tema escuro" right={
            <Switch value={preference === 'dark' || (preference === 'system' && isDark)} onValueChange={v => setPreference(v ? 'dark' : 'light')} trackColor={{ true: tokens.actionPrimary, false: tokens.borderMedium }} />
          } />
          <SettingRow icon="theme-light-dark" label="Seguir o sistema" right={
            <Switch value={preference === 'system'} onValueChange={v => setPreference(v ? 'system' : isDark ? 'dark' : 'light')} trackColor={{ true: tokens.actionPrimary, false: tokens.borderMedium }} />
          } />
        </View>

        {/* Notificações */}
        <Section label="Notificações" />
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <SettingRow icon="bell-outline" label="Lembrete diário" subtext={user?.reminderTime ?? 'Desativado'} onPress={() => { }} />
          <SettingRow icon="bell-ring-outline" label="Notificações ativas" right={
            <Switch value={user?.notificationsEnabled ?? false} onValueChange={v => updateProfile({ notificationsEnabled: v })} trackColor={{ true: tokens.actionPrimary, false: tokens.borderMedium }} />
          } />
        </View>

        {/* Dados */}
        <Section label="Dados e Privacidade" />
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <SettingRow icon="export-variant" label="Exportar anotações (Markdown)" onPress={() => { }} />
          <SettingRow icon="file-pdf-box" label="Exportar anotações (PDF)" onPress={() => { }} />
          <SettingRow icon="note-text-outline" label="Exportar diário" onPress={() => { }} />
        </View>

        {/* API */}
        <Section label="Conexão" />
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <SettingRow
            icon="api"
            label="Verificar conexão com BIBLIAAPI"
            subtext={
              apiStatus === 'ok' ? '✓ API disponível' :
                apiStatus === 'error' ? '✗ API indisponível — usando cache' :
                  apiStatus === 'checking' ? 'Verificando…' :
                    'Toque para verificar'
            }
            onPress={checkApi}
          />
        </View>

        {/* Conta */}
        <Section label="Conta" />
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <SettingRow icon="logout" label="Sair da conta" onPress={handleLogout} danger />
        </View>

        <Text style={{ textAlign: 'center', color: tokens.textDisabled, fontSize: 12, marginTop: 28 }}>
          Verbum v1.0.0 · Dados locais · Sem anúncios
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}