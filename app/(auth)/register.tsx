/**
 * VERBUM — app/(auth)/register.tsx  [ATUALIZADO com aceite legal]
 *
 * O usuário DEVE aceitar Política de Privacidade e Termos de Uso
 * antes de criar a conta — requisito LGPD Art. 7º e Art. 8º.
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthContext } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

export default function RegisterScreen() {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const { register } = useAuthContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    name.trim().length >= 2 && email.trim().includes("@") && agreed;

  const handleRegister = async () => {
    if (!isValid) {
      if (!agreed) {
        setError(
          "Você precisa aceitar os Termos de Uso e a Política de Privacidade para criar uma conta.",
        );
      }
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({ name: name.trim(), email: email.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar conta.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tokens.bgPrimary }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 28,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Voltar */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            paddingTop: insets.top + 12,
            paddingBottom: 32,
            alignSelf: "flex-start",
          }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={tokens.iconPrimary}
          />
        </TouchableOpacity>

        {/* Título */}
        <Text
          style={{
            fontSize: 32,
            fontWeight: "800",
            color: tokens.textPrimary,
            letterSpacing: -1,
            marginBottom: 8,
          }}
        >
          Criar conta
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: tokens.textTertiary,
            lineHeight: 22,
            marginBottom: 36,
          }}
        >
          Seu perfil é salvo localmente neste dispositivo.
        </Text>

        {/* Nome */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: tokens.textSecondary,
              marginBottom: 8,
            }}
          >
            Seu nome
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: tokens.bgCard,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: tokens.borderMedium,
              paddingHorizontal: 16,
            }}
          >
            <MaterialCommunityIcons
              name="account-outline"
              size={20}
              color={tokens.iconMuted}
            />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: João da Silva"
              placeholderTextColor={tokens.textDisabled}
              autoCapitalize="words"
              style={{
                flex: 1,
                fontSize: 16,
                color: tokens.textPrimary,
                paddingVertical: 14,
              }}
            />
          </View>
        </View>

        {/* E-mail */}
        <View style={{ marginBottom: 28 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: tokens.textSecondary,
              marginBottom: 8,
            }}
          >
            E-mail
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: tokens.bgCard,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: tokens.borderMedium,
              paddingHorizontal: 16,
            }}
          >
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color={tokens.iconMuted}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor={tokens.textDisabled}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                flex: 1,
                fontSize: 16,
                color: tokens.textPrimary,
                paddingVertical: 14,
              }}
            />
          </View>
        </View>

        {/* ── ACEITE LEGAL (obrigatório LGPD) ── */}
        <TouchableOpacity
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: agreed ? tokens.actionPrimary : tokens.borderMedium,
              backgroundColor: agreed ? tokens.actionPrimary : "transparent",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 2,
              flexShrink: 0,
            }}
          >
            {agreed && (
              <MaterialCommunityIcons name="check" size={14} color="white" />
            )}
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              color: tokens.textSecondary,
              lineHeight: 20,
            }}
          >
            Eu li e aceito os{" "}
            <Text
              style={{
                color: tokens.actionPrimary,
                fontWeight: "700",
                textDecorationLine: "underline",
              }}
              onPress={() => router.push("/(app)/modals/terms")}
            >
              Termos de Uso
            </Text>{" "}
            e a{" "}
            <Text
              style={{
                color: tokens.actionPrimary,
                fontWeight: "700",
                textDecorationLine: "underline",
              }}
              onPress={() => router.push("/(app)/modals/privacy_policy")}
            >
              Política de Privacidade
            </Text>
            , incluindo o tratamento dos meus dados conforme a LGPD (Lei nº
            13.709/2018).
          </Text>
        </TouchableOpacity>

        {/* Erro */}
        {error && (
          <View
            style={{
              backgroundColor: tokens.errorBg,
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 13, color: tokens.error, lineHeight: 20 }}>
              {error}
            </Text>
          </View>
        )}

        {/* Botão criar */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading || !isValid}
          style={{
            backgroundColor: isValid
              ? tokens.actionPrimary
              : tokens.borderMedium,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: "700", color: "white" }}>
              Criar conta
            </Text>
          )}
        </TouchableOpacity>

        {/* Login */}
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          style={{ marginTop: 20, alignItems: "center" }}
        >
          <Text style={{ fontSize: 14, color: tokens.textTertiary }}>
            Já tem conta?{" "}
            <Text style={{ color: tokens.actionPrimary, fontWeight: "700" }}>
              Entrar
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
