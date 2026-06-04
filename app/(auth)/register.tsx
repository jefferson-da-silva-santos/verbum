/**
 * VERBUM — app/(auth)/register.tsx  [CORRIGIDO]
 * FIX: useSafeAreaInsets no paddingTop e paddingBottom.
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

export default function RegisterScreen() {
  const { tokens }   = useTheme();
  const insets       = useSafeAreaInsets();   // FIX
  const { register } = useAuthContext();

  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [errors,  setErrors]  = useState<{
    name?: string; email?: string; general?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim())                       e.name  = 'Informe seu nome.';
    if (!email.trim())                      e.email = 'Informe seu e-mail.';
    else if (!/\S+@\S+\.\S+/.test(email))  e.email = 'E-mail inválido.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name:  name.trim(),
        email: email.trim().toLowerCase(),
      });
    } catch (e) {
      setErrors({
        general: e instanceof Error ? e.message : 'Erro ao criar conta.',
      });
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
          paddingTop:    insets.top + 24,    // FIX
          paddingBottom: insets.bottom + 24, // FIX
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Voltar */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginBottom: 32, alignSelf: 'flex-start' }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={tokens.iconPrimary}
          />
        </TouchableOpacity>

        {/* Cabeçalho */}
        <View style={{ marginBottom: 40, gap: 8 }}>
          <Text style={{
            fontSize: 28, fontWeight: '700', fontFamily: 'serif',
            color: tokens.textPrimary,
          }}>
            Criar conta
          </Text>
          <Text style={{ fontSize: 15, color: tokens.textSecondary, lineHeight: 22 }}>
            Seu perfil é salvo localmente neste dispositivo.
          </Text>
        </View>

        {/* Formulário */}
        <View style={{ gap: 16 }}>
          <Input
            label="Seu nome"
            icon="account-outline"
            placeholder="Como prefere ser chamado"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
            error={errors.name}
          />

          <Input
            label="E-mail"
            icon="email-outline"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            error={errors.email}
          />

          {errors.general && (
            <Text style={{ fontSize: 13, color: tokens.error, textAlign: 'center' }}>
              {errors.general}
            </Text>
          )}

          <Button
            label="Criar conta"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            style={{ marginTop: 8 }}
          />
        </View>

        {/* Link para login */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={{
            flexDirection: 'row', justifyContent: 'center',
            gap: 4, marginTop: 28,
          }}
        >
          <Text style={{ fontSize: 14, color: tokens.textSecondary }}>
            Já tem conta?
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: tokens.textLink }}>
            Entrar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}