import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SIZES, SHADOWS, FONT_FAMILY } from './goalTheme';
import { SafeImage } from './SafeImage';
import { SPORT_LABELS } from '../lib/fieldValidation';
import { useTheme } from '../lib/theme';
import { useToastStore } from '../store/toastStore';
import { useFavoriteStore } from '../store/favoriteStore';

import type { Field } from '../store/fieldStore';

const SPORT_ICONS: Record<string, string> = {
  futsal: 'sports-soccer',
  basketball: 'sports-basketball',
  badminton: 'sports-tennis',
  volleyball: 'sports-volleyball',
  mini_soccer: 'sports-soccer',
  tennis: 'sports-tennis',
  other: 'sports',
};

function formatPrice(price: number | null): string {
  if (price == null) return 'Hubungi';
  return `Rp${price.toLocaleString('id-ID')}`;
}

interface VenueCardProps {
  field: Field;
  onFavoriteToggle?: (id: number) => void;
  isFavorite?: boolean;
}

export default function VenueCard({ field, onFavoriteToggle, isFavorite = false }: VenueCardProps) {
  const { colors } = useTheme();
  const st = makeStyles(colors);
  const hasImage = !!field.image_url;
  const isApproved = field.status === 'approved';
  const sportLabel = SPORT_LABELS[field.sport_type] || field.sport_type;
  const sportIcon = (SPORT_ICONS[field.sport_type] || 'sports') as React.ComponentProps<typeof MaterialIcons>['name'];
  const { hydrate, isFavorite: checkFavorite, toggleFavorite } = useFavoriteStore();
  const isLiked = checkFavorite(field.id) || isFavorite;

  useEffect(() => {
    hydrate().catch(() => {});
  }, [hydrate]);

  return (
    <TouchableOpacity
      style={st.card}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/venue-detail', params: { id: String(field.id) } })}
    >
      <View style={st.imageWrap}>
        {hasImage ? (
          <SafeImage source={{ uri: field.image_url! }} style={st.image} resizeMode="cover" fallbackSize={32} />
        ) : (
          <View style={st.imagePlaceholder}>
            <MaterialIcons name={sportIcon} size={40} color={colors.primary} />
            <Text style={st.imagePlaceholderText}>Belum ada foto</Text>
          </View>
        )}

        <View style={st.sportPill}>
          <Text style={st.sportPillText}>{sportLabel}</Text>
        </View>

        <TouchableOpacity
          style={st.favoriteBtn}
          activeOpacity={0.7}
          onPress={async (event) => {
            event.stopPropagation();
            const next = await toggleFavorite(field.id);
            onFavoriteToggle?.(field.id);

            const title = next ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit';
            const description = next
              ? `${field.name} masuk ke daftar lapangan favorit Anda.`
              : `${field.name} sudah dihapus dari daftar favorit Anda.`;

            useToastStore.getState().show({
              type: next ? 'success' : 'info',
              title,
              description,
              durationMs: 2500,
            });
          }}
        >
          <MaterialIcons
            name={isLiked ? 'favorite' : 'favorite-border'}
            size={20}
            color={isLiked ? '#EF4444' : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      <View style={st.info}>
        <Text style={st.name} numberOfLines={1} ellipsizeMode="tail">{field.name}</Text>
        <View style={st.locationRow}>
          <MaterialIcons name="location-on" size={14} color={colors.textTertiary} />
          <Text style={st.location} numberOfLines={1} ellipsizeMode="tail">{field.location}</Text>
        </View>

        <View style={st.divider} />

        <View style={st.priceRow}>
          <View>
            <Text style={st.priceLabel}>Mulai dari</Text>
            <View style={st.priceValueRow}>
              <Text style={st.price}>{formatPrice(field.price_per_hour)}</Text>
              <Text style={st.priceUnit}>/jam</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[st.bookBtn, !isApproved && st.bookBtnDisabled]}
            activeOpacity={0.8}
            onPress={() => {
              if (!isApproved) {
                useToastStore.getState().show({
                  type: 'info',
                  title: 'Belum Tersedia',
                  description: 'Lapangan ini masih menunggu persetujuan admin.',
                  durationMs: 3000,
                });
                return;
              }
              router.push({ pathname: '/(tabs)/booking', params: { venueId: String(field.id) } });
            }}
          >
            <Text style={[st.bookBtnText, !isApproved && st.bookBtnTextDisabled]}>
              {isApproved ? 'Pesan' : 'Belum Tersedia'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  imageWrap: {
    height: 190,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  imagePlaceholderText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: colors.textTertiary,
  },
  sportPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sportPillText: {
    color: colors.onPrimary,
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: 14,
  },
  name: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: colors.textTertiary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: colors.textTertiary,
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  price: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  priceUnit: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: colors.textTertiary,
  },
  bookBtn: {
    backgroundColor: colors.primary,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  bookBtnDisabled: {
    backgroundColor: colors.surfaceStrong,
  },
  bookBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  bookBtnTextDisabled: {
    color: colors.textTertiary,
  },
});
