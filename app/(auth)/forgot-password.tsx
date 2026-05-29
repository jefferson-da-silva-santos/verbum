/**
 * VERBUM — app/(auth)/forgot-password.tsx
 * Tela de recuperação de senha (placeholder — requer backend).
 */

import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useState } from 'react';

export default function ForgotPasswordScreen() {
  const { tokens } = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    // TODO: integrar com backend de auth quando disponível
    // Por ora, apenas simula o envio
    await new Promise(r => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tokens.bgPrimary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, marginBottom: 32, alignSelf: 'flex-start' }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.iconPrimary} />
        </TouchableOpacity>

        {sent ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <MaterialCommunityIcons name="email-check-outline" size={64} color={tokens.success} />
            <Text style={{ fontSize: 22, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary, textAlign: 'center' }}>
              E-mail enviado!
            </Text>
            <Text style={{ fontSize: 15, color: tokens.textSecondary, textAlign: 'center', lineHeight: 24 }}>
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </Text>
            <Button label="Voltar ao login" onPress={() => router.replace('/(auth)/login')} fullWidth />
          </View>
        ) : (
          <>
            <View style={{ marginBottom: 40, gap: 8 }}>
              <Text style={{ fontSize: 28, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary }}>
                Recuperar acesso
              </Text>
              <Text style={{ fontSize: 15, color: tokens.textSecondary, lineHeight: 22 }}>
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
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
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <Button label="Enviar link" onPress={handleSend} loading={loading} fullWidth style={{ marginTop: 8 }} />
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}