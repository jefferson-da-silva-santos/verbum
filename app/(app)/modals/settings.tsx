/**
 * VERBUM — app/(app)/modals/settings.tsx  [ATUALIZADO]
 *
 * Usa setTheme() do ThemeContext para aplicar o tema imediatamente
 * ao invés de apenas salvar no perfil do usuário.
 */

import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  TextInput, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { useSafeAreaInsets }     from 'react-native-safe-area-context';
import { router }                from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme }       from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import type { ThemePreference } from '../../../src/context/ThemeContext';
import type { User }            from '../../../src/database/types';

// ─── Opções ─────────────────────────────────────────────────────

const BIBLE_VERSIONS: { value: User['preferredVersion']; label: string; desc: string }[] = [
  { value: 'acf', label: 'ACF', desc: 'Almeida Corrigida Fiel' },
  { value: 'nvi', label: 'NVI', desc: 'Nova Versão Internacional' },
  { value: 'ara', label: 'ARA', desc: 'Almeida Revista e Atualizada' },
  { value: 'naa', label: 'NAA', desc: 'Nova Almeida Atualizada' },
];

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'system', label: 'Automático', icon: 'theme-light-dark' },
  { value: 'light',  label: 'Claro',      icon: 'weather-sunny'    },
  { value: 'dark',   label: 'Escuro',     icon: 'weather-night'    },
];

const FONT_SCALES = [
  { value: 0.85, label: 'A',   size: 13 },
  { value: 1.0,  label: 'A',   size: 16 },
  { value: 1.15, label: 'A',   size: 19 },
  { value: 1.3,  label: 'A',   size: 22 },
];

// ─── Sub-componentes ─────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const { tokens } = useTheme();
  return (
    <Text style={{
      fontSize: 11, fontWeight: '700', color: tokens.textTertiary,
      textTransform: 'uppercase', letterSpacing: 1,
      paddingHorizontal: 20, paddingTop: 28, paddingBottom: 10,
    }}>
      {title}
    </Text>
  );
}

function Divider() {
  const { tokens } = useTheme();
  return <View style={{ height: 1, backgroundColor: tokens.borderLight, marginLeft: 68 }} />;
}

function Row({
  icon, iconColor, label, sublabel, onPress, right, destructive = false,
}: {
  icon:       keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  label:      string;
  sublabel?:  string;
  onPress?:   () => void;
  right?:     React.ReactNode;
  destructive?: boolean;
}) {
  const { tokens } = useTheme();
  const color      = iconColor ?? tokens.actionPrimary;
  const Wrapper    = (onPress ? TouchableOpacity : View) as any;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20, gap: 14 }}>
      <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: color + '18', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: destructive ? '#EF4444' : tokens.textPrimary }}>{label}</Text>
        {sublabel && <Text style={{ fontSize: 12, color: tokens.textTertiary, marginTop: 1 }}>{sublabel}</Text>}
      </View>
      {right ?? (onPress && !destructive && <MaterialCommunityIcons name="chevron-right" size={18} color={tokens.iconMuted} />)}
    </Wrapper>
  );
}

// ─── Modal ───────────────────────────────────────────────────────

export default function SettingsModal() {
  const { tokens, preference, setTheme } = useTheme();
  const insets                            = useSafeAreaInsets();
  const { user, updateProfile, logout }   = useAuthContext();

  const [name,          setName]          = useState(user?.name ?? '');
  const [version,       setVersion]       = useState<User['preferredVersion']>(user?.preferredVersion ?? 'acf');
  const [fontScale,     setFontScale]     = useState(user?.fontScale ?? 1.0);
  const [notifications, setNotifications] = useState(user?.notificationsEnabled ?? false);
  const [isSaving,      setIsSaving]      = useState(false);
  const [apiStatus,     setApiStatus]     = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setVersion(user.preferredVersion);
      setFontScale(user.fontScale);
      setNotifications(user.notificationsEnabled);
    }
  }, [user?.id]);

  // ── Salvar ────────────────────────────────────────────────────

  const save = async (data: Parameters<typeof updateProfile>[0]) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(data);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameSave = () => {
    const t = name.trim();
    if (!t || t === user?.name) return;
    save({ name: t });
  };

  const handleVersionChange = (v: User['preferredVersion']) => {
    setVersion(v); save({ preferredVersion: v });
  };

  // FIX: chama setTheme() do ThemeContext → aplica imediatamente
  const handleThemeChange = async (t: ThemePreference) => {
    await setTheme(t);
    save({ darkModePreference: t });
  };

  const handleFontScaleChange = (s: number) => {
    setFontScale(s); save({ fontScale: s });
  };

  const handleNotificationsChange = (v: boolean) => {
    setNotifications(v); save({ notificationsEnabled: v });
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Seus dados ficam salvos neste dispositivo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/onboarding');
      }},
    ]);
  };

  const handleCheckApi = async () => {
    setApiStatus('checking');
    try {
      const r = await fetch('https://bibliaapi.com.br/api/v2/versions/ACF/books/gn/chapters/1', {
        headers: { Authorization: `Bearer ${process.env.EXPO_PUBLIC_BIBLIA_API_KEY ?? ''}` },
      });
      setApiStatus(r.ok ? 'ok' : 'error');
    } catch { setApiStatus('error'); }
    setTimeout(() => setApiStatus('idle'), 4000);
  };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.actionPrimary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      {/* Header */}
      <View style={{
        paddingTop: 8, paddingHorizontal: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: tokens.borderLight,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>Configurações</Text>
        {isSaving && <ActivityIndicator size="small" color={tokens.actionPrimary} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}>

        {/* ── PERFIL ── */}
        <SectionHeader title="Perfil" />
        <View style={{ paddingHorizontal: 20, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: tokens.actionPrimary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: tokens.actionPrimaryText }}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <TextInput
              value={name}
              onChangeText={setName}
              onBlur={handleNameSave}
              onSubmitEditing={handleNameSave}
              returnKeyType="done"
              style={{ fontSize: 17, fontWeight: '700', color: tokens.textPrimary, borderBottomWidth: 1, borderBottomColor: tokens.borderMedium, paddingBottom: 4 }}
            />
            <Text style={{ fontSize: 12, color: tokens.textTertiary }}>{user.email}</Text>
          </View>
        </View>

        {/* ── VERSÃO ── */}
        <SectionHeader title="Versão da Bíblia" />
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {BIBLE_VERSIONS.map(v => {
            const active = version === v.value;
            return (
              <TouchableOpacity key={v.value} onPress={() => handleVersionChange(v.value)}
                style={{
                  flex: 1, minWidth: '40%', padding: 14, borderRadius: 14,
                  backgroundColor: active ? tokens.actionPrimary : tokens.bgCard,
                  borderWidth: 1.5, borderColor: active ? tokens.actionPrimary : tokens.borderLight,
                  alignItems: 'center', gap: 4,
                }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: active ? tokens.actionPrimaryText : tokens.textPrimary }}>{v.label}</Text>
                <Text style={{ fontSize: 11, color: active ? tokens.actionPrimaryText + 'CC' : tokens.textTertiary, textAlign: 'center' }}>{v.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── APARÊNCIA ── */}
        <SectionHeader title="Aparência" />
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 10 }}>
          {THEME_OPTIONS.map(t => {
            const active = preference === t.value;
            return (
              <TouchableOpacity key={t.value} onPress={() => handleThemeChange(t.value)}
                style={{
                  flex: 1, alignItems: 'center', gap: 8, paddingVertical: 14,
                  borderRadius: 14,
                  backgroundColor: active ? tokens.actionPrimary : tokens.bgCard,
                  borderWidth: 1.5, borderColor: active ? tokens.actionPrimary : tokens.borderLight,
                }}>
                <MaterialCommunityIcons name={t.icon} size={22} color={active ? tokens.actionPrimaryText : tokens.iconMuted} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? tokens.actionPrimaryText : tokens.textSecondary }}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tamanho de fonte */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14, gap: 10 }}>
          <Text style={{ fontSize: 13, color: tokens.textTertiary }}>Tamanho da fonte no leitor</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {FONT_SCALES.map(f => {
              const active = Math.abs(fontScale - f.value) < 0.01;
              return (
                <TouchableOpacity key={f.value} onPress={() => handleFontScaleChange(f.value)}
                  style={{
                    flex: 1, alignItems: 'center', justifyContent: 'center',
                    height: 52, borderRadius: 12,
                    backgroundColor: active ? tokens.actionPrimary : tokens.bgCard,
                    borderWidth: 1, borderColor: active ? tokens.actionPrimary : tokens.borderLight,
                  }}>
                  <Text style={{ fontSize: f.size, fontWeight: '700', fontFamily: 'serif', color: active ? tokens.actionPrimaryText : tokens.textSecondary }}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Preview */}
          <View style={{ backgroundColor: tokens.bgCard, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: tokens.borderLight }}>
            <Text style={{ fontSize: 15 * fontScale, color: tokens.textVerse, fontFamily: 'serif', lineHeight: 26 * fontScale, fontStyle: 'italic' }}>
              {`"No princípio criou Deus os céus e a terra."`}
            </Text>
            <Text style={{ fontSize: 11, color: tokens.textTertiary, marginTop: 6 }}>Gênesis 1:1</Text>
          </View>
        </View>

        {/* ── NOTIFICAÇÕES ── */}
        <SectionHeader title="Notificações" />
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <Row icon="bell-outline" label="Lembrete diário de leitura"
            sublabel={notifications ? 'Ativo' : 'Desativado'}
            right={
              <Switch value={notifications} onValueChange={handleNotificationsChange}
                trackColor={{ false: tokens.borderMedium, true: tokens.actionPrimary }}
                thumbColor="white" />
            }
          />
        </View>

        {/* ── VELOCIDADE ── */}
        <SectionHeader title="Velocidade de leitura" />
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <Row icon="speedometer" label="Calibrar velocidade"
            sublabel={`Atual: ${user.avgReadingSpeed} min/capítulo`}
            onPress={() => router.push('/(app)/modals/calibrate-speed')} />
        </View>

           {/* ── LEGAL ── */}
        <SectionHeader title="Legal e Privacidade" />
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <Row
            icon="shield-account-outline"
            label="Política de Privacidade"
            sublabel="LGPD · Como seus dados são tratados"
            onPress={() => router.push('/(app)/modals/privacy_policy')}
          />
          <Divider />
          <Row
            icon="file-document-outline"
            label="Termos de Uso"
            sublabel="Regras e limites de responsabilidade"
            onPress={() => router.push('/(app)/modals/terms')}
          />
          <Divider />
          <Row
            icon="database-outline"
            label="Dados coletados"
            sublabel="Nome, e-mail · Armazenados localmente · Não compartilhados"
            onPress={() => Alert.alert(
              'Dados coletados pelo Verbum',
              '✓ Nome e e-mail (conta local)\n✓ Progresso de leitura\n✓ Anotações e favoritos\n✓ Preferências do app\n\n✗ Localização: NÃO\n✗ Câmera/fotos: NÃO\n✗ Analytics: NÃO\n✗ Servidores externos: NÃO\n\nTodos os dados ficam apenas no seu dispositivo.'
            )}
          />
        </View>

        {/* ── AVANÇADO ── */}
        <SectionHeader title="Avançado" />
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <Row
            icon={apiStatus === 'ok' ? 'check-circle-outline' : apiStatus === 'error' ? 'alert-circle-outline' : 'wifi-check'}
            iconColor={apiStatus === 'ok' ? tokens.success : apiStatus === 'error' ? tokens.error : tokens.iconPrimary}
            label="Verificar conexão com API"
            sublabel={apiStatus === 'checking' ? 'Verificando...' : apiStatus === 'ok' ? 'API online ✓' : apiStatus === 'error' ? 'API indisponível ✗' : 'Testa a conexão com a Bíblia API'}
            onPress={apiStatus === 'idle' ? handleCheckApi : undefined}
            right={apiStatus === 'checking' ? <ActivityIndicator size="small" color={tokens.actionPrimary} /> : undefined}
          />
          <Divider />
          <Row icon="information-outline" label="Sobre o Verbum" sublabel="v1.0.0" onPress={() => {}} />
        </View>

        {/* ── CONTA ── */}
        <SectionHeader title="Conta" />
        <View style={{ backgroundColor: tokens.bgCard, marginHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderLight, overflow: 'hidden' }}>
          <Row icon="logout" iconColor="#EF4444" label="Sair da conta" destructive onPress={handleLogout} right={null} />
        </View>

      </ScrollView>
    </View>
  );
}