/**
 * FIX 1 — app/(auth)/login.tsx
 * Adiciona useSafeAreaInsets para corrigir sobreposição com barra Android.
 */

import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme }       from '../../src/context/ThemeContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { Button }         from '../../src/components/ui/Button';
import { Input }          from '../../src/components/ui/Input';

export default function LoginScreen() {
  const { tokens }   = useTheme();
  const insets       = useSafeAreaInsets();
  const { login }    = useAuthContext();

  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) { setError('Informe seu e-mail.'); return; }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tokens.bgPrimary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          paddingTop: insets.top + 24,  // FIX 1
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginBottom: 32, alignSelf: 'flex-start' }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.iconPrimary} />
        </TouchableOpacity>

        <View style={{ marginBottom: 40, gap: 8 }}>
          <Text style={{
            fontSize: 28, fontWeight: '700', fontFamily: 'serif',
            color: tokens.textPrimary,
          }}>
            Bem-vindo de volta
          </Text>
          <Text style={{ fontSize: 15, color: tokens.textSecondary, lineHeight: 22 }}>
            Entre com seu e-mail para continuar sua jornada de leitura.
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <Input
            label="E-mail"
            icon="email-outline"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            error={error}
          />
          <Button
            label="Entrar"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            style={{ marginTop: 8 }}
          />
        </View>

        <View style={{
          flexDirection: 'row', alignItems: 'center',
          marginVertical: 28, gap: 12,
        }}>
          <View style={{ flex: 1, height: 1, backgroundColor: tokens.borderLight }} />
          <Text style={{ fontSize: 12, color: tokens.textTertiary }}>ou</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: tokens.borderLight }} />
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}
        >
          <Text style={{ fontSize: 14, color: tokens.textSecondary }}>
            Não tem conta?
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: tokens.textLink }}>
            Criar agora
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}