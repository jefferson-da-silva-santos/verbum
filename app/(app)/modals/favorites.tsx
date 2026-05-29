/**
 * VERBUM — Modal: Favorites
 * Lista de versículos salvos como favoritos.
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import { useAuthContext } from '../../../src/context/AuthContext';
import { favoriteRepo } from '../../../src/database/repositories';
import type { Favorite } from '../../../src/database/types';
import { formatVerseRef } from '../../../src/utils/formatters';
import { relativeDate } from '../../../src/utils/dateUtils';

export default function FavoritesModal() {
  const { tokens } = useTheme();
  const { user } = useAuthContext();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const favs = await favoriteRepo.findAll(user.id, { limit: 200 });
    setFavorites(favs);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = (fav: Favorite) => {
    Alert.alert(
      'Remover favorito',
      `Remover ${formatVerseRef(fav.bookName, fav.chapterNumber, fav.verseNumber)} dos favoritos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await favoriteRepo.remove(fav.userId, fav.bookSlug, fav.chapterNumber, fav.verseNumber);
            setFavorites(prev => prev.filter(f => f.id !== fav.id));
          },
        },
      ],
    );
  };

  const handleOpen = (fav: Favorite) => {
    router.push(`/(app)/modals/chapter-reader?bookSlug=${fav.bookSlug}&chapter=${fav.chapterNumber}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bgPrimary }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={tokens.iconPrimary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>
          Favoritos
        </Text>
        <Text style={{ fontSize: 13, color: tokens.textTertiary }}>{favorites.length}</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item: fav }) => (
          <TouchableOpacity
            onPress={() => handleOpen(fav)}
            style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderLight, gap: 6 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: tokens.actionPrimary, letterSpacing: 0.4 }}>
                  {fav.bookName} {fav.chapterNumber}:{fav.verseNumber}
                </Text>
                <Text
                  numberOfLines={3}
                  style={{ fontSize: 14, color: tokens.textPrimary, lineHeight: 22, fontFamily: 'serif' }}
                >
                  {fav.verseText}
                </Text>
                <Text style={{ fontSize: 11, color: tokens.textDisabled }}>
                  {relativeDate(fav.createdAt)} · {fav.bibleVersion.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleRemove(fav)} style={{ padding: 8, marginLeft: 8 }}>
                <MaterialCommunityIcons name="heart" size={20} color={tokens.error} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ padding: 48, alignItems: 'center', gap: 16 }}>
              <MaterialCommunityIcons name="heart-outline" size={52} color={tokens.iconMuted} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: tokens.textPrimary, textAlign: 'center' }}>
                Nenhum favorito ainda
              </Text>
              <Text style={{ fontSize: 14, color: tokens.textSecondary, textAlign: 'center', lineHeight: 22 }}>
                Faça long press em qualquer versículo no leitor e toque em Favoritar.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}