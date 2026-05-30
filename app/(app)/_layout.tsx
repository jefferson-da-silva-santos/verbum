/**
 * VERBUM — app/(app)/_layout.tsx  [CORRIGIDO]
 *
 * FIX 2: Drawer lateral esquerdo no lugar do bottom tab bar.
 *         - Menos poluição visual
 *         - Sem problema de ícones inexistentes
 *         - Abre/fecha com gesto ou botão
 *
 * Dependência necessária:
 *   npx expo install @react-navigation/drawer react-native-reanimated react-native-gesture-handler
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
  StatusBar,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Slot, router, usePathname } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../src/context/ThemeContext";
import { useAuthContext } from "../../src/context/AuthContext";
import { useTodayPlan } from "../../src/hooks/useActivePlan";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(300, SCREEN_WIDTH * 0.78);

// ─────────────────────────────────────────────
// ITENS DO MENU
// ─────────────────────────────────────────────

type MenuItem = {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconFocus: keyof typeof MaterialCommunityIcons.glyphMap;
  href: string;
};

const MENU_ITEMS: MenuItem[] = [
  { label: "Início", icon: "home-outline", iconFocus: "home", href: "/(app)" },
  {
    label: "Bíblia",
    icon: "book-open-outline",
    iconFocus: "book-open-variant",
    href: "/(app)/reader",
  },
  {
    label: "Planos",
    icon: "calendar-outline",
    iconFocus: "calendar",
    href: "/(app)/plans",
  },
  {
    label: "Progresso",
    icon: "chart-bar-stacked",
    iconFocus: "chart-bar-stacked",
    href: "/(app)/progress",
  },
];

const MENU_EXTRAS: MenuItem[] = [
  {
    label: "Favoritos",
    icon: "heart-outline",
    iconFocus: "heart",
    href: "/(app)/modals/favorites",
  },
  {
    label: "Diário",
    icon: "book-alert-outline",
    iconFocus: "book-alert",
    href: "/(app)/modals/diary-list",
  },
  {
    label: "Conquistas",
    icon: "trophy-outline",
    iconFocus: "trophy",
    href: "/(app)/modals/achievements",
  },
  {
    label: "Busca",
    icon: "magnify",
    iconFocus: "magnify",
    href: "/(app)/modals/search",
  },
];

// ─────────────────────────────────────────────
// DRAWER CONTENT
// ─────────────────────────────────────────────

function DrawerContent({ onClose }: { onClose: () => void }) {
  const { tokens } = useTheme();
  const { user } = useAuthContext();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const navigate = (href: string) => {
    onClose();
    setTimeout(() => router.push(href as any), 150);
  };

  const isActive = (href: string) =>
    pathname === href || (href === "/(app)" && pathname === "/");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.bgPrimary,
        paddingTop: insets.top,
      }}
    >
      {/* Header do drawer */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
          borderBottomWidth: 1,
          borderBottomColor: tokens.borderLight,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            fontFamily: "serif",
            color: tokens.textPrimary,
            letterSpacing: -0.5,
          }}
        >
          Verbum
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: tokens.textTertiary,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          a Palavra
        </Text>
        {user && (
          <TouchableOpacity
            onPress={() => navigate("/(app)/profile")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginTop: 16,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: tokens.actionPrimary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: tokens.actionPrimaryText,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: tokens.textPrimary,
                }}
                numberOfLines={1}
              >
                {user.name}
              </Text>
              <Text
                style={{ fontSize: 11, color: tokens.textTertiary }}
                numberOfLines={1}
              >
                {user.email}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Menu principal */}
        <View style={{ paddingTop: 8 }}>
          {MENU_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <TouchableOpacity
                key={item.href}
                onPress={() => navigate(item.href)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  paddingVertical: 13,
                  paddingHorizontal: 20,
                  backgroundColor: active
                    ? tokens.actionPrimary + "15"
                    : "transparent",
                  borderLeftWidth: active ? 3 : 0,
                  borderLeftColor: tokens.actionPrimary,
                  marginBottom: 2,
                }}
              >
                <MaterialCommunityIcons
                  name={active ? item.iconFocus : item.icon}
                  size={22}
                  color={active ? tokens.actionPrimary : tokens.iconSecondary}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: active ? "700" : "400",
                    color: active ? tokens.actionPrimary : tokens.textPrimary,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Divisor */}
        <View
          style={{
            height: 1,
            backgroundColor: tokens.borderLight,
            marginHorizontal: 20,
            marginVertical: 8,
          }}
        />

        {/* Extras */}
        <View style={{ paddingTop: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              color: tokens.textDisabled,
              textTransform: "uppercase",
              letterSpacing: 1,
              paddingHorizontal: 20,
              paddingBottom: 6,
            }}
          >
            Ferramentas
          </Text>
          {MENU_EXTRAS.map((item) => (
            <TouchableOpacity
              key={item.href}
              onPress={() => navigate(item.href)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingVertical: 11,
                paddingHorizontal: 20,
              }}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={tokens.iconMuted}
              />
              <Text style={{ fontSize: 14, color: tokens.textSecondary }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: tokens.borderLight,
          paddingBottom: insets.bottom + 8,
        }}
      >
        <TouchableOpacity
          onPress={() => navigate("/(app)/modals/settings")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingVertical: 14,
            paddingHorizontal: 20,
          }}
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={22}
            color={tokens.iconMuted}
          />
          <Text style={{ fontSize: 15, color: tokens.textSecondary }}>
            Configurações
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// HEADER UNIVERSAL (aparece em todas as telas)
// ─────────────────────────────────────────────

function AppHeader({
  onOpenDrawer,
  title,
}: {
  onOpenDrawer: () => void;
  title?: string;
}) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  // Título dinâmico baseado na rota
  const getTitle = () => {
    if (title) return title;
    if (pathname === "/" || pathname === "/(app)") return "Início";
    if (pathname.includes("reader")) return "Bíblia";
    if (pathname.includes("plans")) return "Planos";
    if (pathname.includes("progress")) return "Progresso";
    if (pathname.includes("profile")) return "Perfil";
    return "Verbum";
  };

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: tokens.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: tokens.borderLight,
        gap: 12,
      }}
    >
      {/* Botão hambúrguer */}
      <TouchableOpacity
        onPress={onOpenDrawer}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: tokens.bgCard,
          borderWidth: 1,
          borderColor: tokens.borderLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons
          name="menu"
          size={22}
          color={tokens.iconPrimary}
        />
      </TouchableOpacity>

      {/* Título */}
      <Text
        style={{
          flex: 1,
          fontSize: 18,
          fontWeight: "700",
          fontFamily: "serif",
          color: tokens.textPrimary,
        }}
      >
        {getTitle()}
      </Text>

      {/* Botão busca */}
      <TouchableOpacity
        onPress={() => router.push("/(app)/modals/search")}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: tokens.bgCard,
          borderWidth: 1,
          borderColor: tokens.borderLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={tokens.iconPrimary}
        />
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// LAYOUT PRINCIPAL COM DRAWER
// ─────────────────────────────────────────────

export default function AppLayout() {
  const { tokens } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const translateX = useState(new Animated.Value(-DRAWER_WIDTH))[0];

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    Animated.timing(translateX, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  const closeDrawer = useCallback(() => {
    Animated.timing(translateX, {
      toValue: -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  }, [translateX]);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <StatusBar barStyle="dark-content" backgroundColor={tokens.bgPrimary} />

      {/* Header universal */}
      <AppHeader onOpenDrawer={openDrawer} />

      {/* Conteúdo da tela atual (Expo Router renderiza aqui) */}
      <View style={{ flex: 1 }}>
        <Slot />
      </View>

      {/* Overlay escuro quando o drawer está aberto */}
      {isOpen && (
        <Pressable
          onPress={closeDrawer}
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: "rgba(44,24,16,0.45)" },
          ]}
        />
      )}

      {/* Drawer deslizante */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: DRAWER_WIDTH,
          transform: [{ translateX }],
          shadowColor: "#000",
          shadowOffset: { width: 4, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 16,
          zIndex: 999,
        }}
      >
        <DrawerContent onClose={closeDrawer} />
      </Animated.View>
    </View>
  );
}
