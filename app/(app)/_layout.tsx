/**
 * VERBUM — app/(app)/_layout.tsx  [CORRIGIDO]
 *
 * FIX: O AppHeader agora é ocultado automaticamente quando o usuário
 * está no Modo Púlpito ou no Leitor (telas que precisam de tela cheia).
 * Isso elimina a barra "≡ Verbum 🔍" aparecendo por cima dessas telas.
 */

import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Pressable,
  Animated, Dimensions, StyleSheet, StatusBar, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Slot, router, usePathname } from 'expo-router';
import { MaterialCommunityIcons }    from '@expo/vector-icons';

import { useTheme }       from '../../src/context/ThemeContext';
import { useAuthContext } from '../../src/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(300, SCREEN_WIDTH * 0.78);

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

// Rotas onde o AppHeader DEVE ser ocultado (precisam de tela cheia)
const FULLSCREEN_ROUTES = [
  'pulpit-mode',
  'chapter-reader',
];

// ─── Menu ───────────────────────────────────────────────────────────

const MAIN_ITEMS = [
  { label: 'Início',     icon: 'home-outline'      as IconName, iconFocus: 'home'              as IconName, href: '/(app)' },
  { label: 'Bíblia',    icon: 'book-open-outline'  as IconName, iconFocus: 'book-open-variant' as IconName, href: '/(app)/reader' },
  { label: 'Planos',    icon: 'calendar-outline'   as IconName, iconFocus: 'calendar'          as IconName, href: '/(app)/plans' },
  { label: 'Progresso', icon: 'chart-bar-stacked'  as IconName, iconFocus: 'chart-bar-stacked' as IconName, href: '/(app)/progress' },
];

const STUDENT_ITEMS = [
  { label: 'Favoritos',  icon: 'heart-outline'         as IconName, href: '/(app)/modals/favorites' },
  { label: 'Diário',     icon: 'notebook-heart-outline' as IconName, href: '/(app)/modals/diary-list' },
  { label: 'Conquistas', icon: 'trophy-outline'         as IconName, href: '/(app)/modals/achievements' },
];

const PREACHER_ITEMS = [
  { label: 'Caderno do Pregador', icon: 'notebook-outline'          as IconName, href: '/(app)/modals/sermon-list',           color: '#8B6340' },
  { label: 'Mapas Temáticos',     icon: 'transit-connection-variant' as IconName, href: '/(app)/modals/thematic-maps',          color: '#4A7C59' },
  { label: 'Exposições Guiadas',  icon: 'book-search-outline'        as IconName, href: '/(app)/modals/study-notes-list',       color: '#4A5C8B' },
  { label: 'Conexões Proféticas', icon: 'arrow-collapse-right'       as IconName, href: '/(app)/modals/prophetic-connections',  color: '#7A4A8B' },
];

// ─── Drawer ─────────────────────────────────────────────────────────

function DrawerContent({ onClose }: { onClose: () => void }) {
  const { tokens } = useTheme();
  const { user }   = useAuthContext();
  const insets     = useSafeAreaInsets();
  const pathname   = usePathname();

  const navigate = (href: string) => {
    onClose();
    setTimeout(() => router.push(href as any), 150);
  };

  const isActive = (href: string) =>
    pathname === href || (href === '/(app)' && (pathname === '/' || pathname === '/(app)'));

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <Text style={{ fontSize: 20, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary }}>Verbum</Text>
        <Text style={{ fontSize: 10, color: tokens.textTertiary, letterSpacing: 2, textTransform: 'uppercase' }}>a Palavra</Text>
        {user && (
          <TouchableOpacity onPress={() => navigate('/(app)/profile')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: tokens.actionPrimary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.actionPrimaryText }}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: tokens.textPrimary }} numberOfLines={1}>{user.name}</Text>
              <Text style={{ fontSize: 11, color: tokens.textTertiary }} numberOfLines={1}>{user.email}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 8 }}>
          {MAIN_ITEMS.map(item => {
            const active = isActive(item.href);
            return (
              <TouchableOpacity key={item.href} onPress={() => navigate(item.href)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: active ? tokens.actionPrimary + '15' : 'transparent', borderLeftWidth: active ? 3 : 0, borderLeftColor: tokens.actionPrimary }}>
                <MaterialCommunityIcons name={active ? item.iconFocus : item.icon} size={22} color={active ? tokens.actionPrimary : tokens.iconSecondary} />
                <Text style={{ fontSize: 15, fontWeight: active ? '700' : '400', color: active ? tokens.actionPrimary : tokens.textPrimary }}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 1, backgroundColor: tokens.borderLight, marginHorizontal: 20, marginVertical: 8 }} />

        <Text style={{ fontSize: 10, fontWeight: '600', color: tokens.textDisabled, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 20, paddingBottom: 6 }}>Ferramentas</Text>
        {STUDENT_ITEMS.map(item => (
          <TouchableOpacity key={item.href} onPress={() => navigate(item.href)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11, paddingHorizontal: 20 }}>
            <MaterialCommunityIcons name={item.icon} size={20} color={tokens.iconMuted} />
            <Text style={{ fontSize: 14, color: tokens.textSecondary }}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 1, backgroundColor: tokens.borderLight, marginHorizontal: 20, marginVertical: 8 }} />

        <Text style={{ fontSize: 10, fontWeight: '600', color: tokens.textDisabled, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 20, paddingBottom: 6 }}>Estudo e Ministério</Text>
        {PREACHER_ITEMS.map(item => (
          <TouchableOpacity key={item.href} onPress={() => navigate(item.href)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 20 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: item.color + '20', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: tokens.textPrimary }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ borderTopWidth: 1, borderTopColor: tokens.borderLight, paddingBottom: insets.bottom + 8 }}>
        <TouchableOpacity onPress={() => navigate('/(app)/modals/settings')} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 20 }}>
          <MaterialCommunityIcons name="cog-outline" size={22} color={tokens.iconMuted} />
          <Text style={{ fontSize: 15, color: tokens.textSecondary }}>Configurações</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Header ─────────────────────────────────────────────────────────

function AppHeader({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const { tokens } = useTheme();
  const insets     = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 4, paddingBottom: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.bgPrimary, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, gap: 8 }}>
      <TouchableOpacity onPress={onOpenDrawer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: tokens.bgCard, borderWidth: 1, borderColor: tokens.borderLight, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name="menu" size={20} color={tokens.iconPrimary} />
      </TouchableOpacity>
      <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', fontFamily: 'serif', color: tokens.textPrimary }}>Verbum</Text>
      <TouchableOpacity onPress={() => router.push('/(app)/modals/search')}
        style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: tokens.bgCard, borderWidth: 1, borderColor: tokens.borderLight, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name="magnify" size={20} color={tokens.iconPrimary} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────

export default function AppLayout() {
  const { tokens }          = useTheme();
  const pathname            = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const translateX          = useState(new Animated.Value(-DRAWER_WIDTH))[0];

  // FIX: oculta o AppHeader nas rotas que precisam de tela cheia
  const isFullscreen = FULLSCREEN_ROUTES.some(route =>
    pathname.includes(route),
  );

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    Animated.timing(translateX, { toValue: 0, duration: 260, useNativeDriver: true }).start();
  }, [translateX]);

  const closeDrawer = useCallback(() => {
    Animated.timing(translateX, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }).start(() => setIsOpen(false));
  }, [translateX]);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      <StatusBar
        barStyle={isFullscreen ? 'light-content' : 'dark-content'}
        backgroundColor={isFullscreen ? '#000' : tokens.bgPrimary}
      />

      {/* AppHeader: visível apenas em telas normais */}
      {!isFullscreen && <AppHeader onOpenDrawer={openDrawer} />}

      <View style={{ flex: 1 }}>
        <Slot />
      </View>

      {isOpen && (
        <Pressable onPress={closeDrawer} style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(44,24,16,0.45)' }]} />
      )}

      <Animated.View style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: DRAWER_WIDTH,
        transform: [{ translateX }],
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 16,
        zIndex: 999,
      }}>
        <DrawerContent onClose={closeDrawer} />
      </Animated.View>
    </View>
  );
}