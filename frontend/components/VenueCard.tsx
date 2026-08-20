import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SIZES, SHADOWS, FONT_FAMILY } from './goalTheme';
import { SafeImage } from './SafeImage';
import { SPORT_LABELS } from '../lib/fieldValidation';
import { useTheme } from '../lib/theme';
import { useToastStore } from '../store/toastStore';
import { useFavoriteStore } from '../store/favoriteStore';
import { formatCurrency } from '../lib/format';

import type { Field } from '../store/fieldStore';

import { getSportBadgeStyle } from '../utils/sportBadge';

const SPORT_ICONS: Record<string, string> = {
  futsal: 'sports-soccer',
  basketball: 'sports-basketball',
  badminton: 'sports-tennis',
  volleyball: 'sports-volleyball',
  mini_soccer: 'sports-soccer',
  tennis: 'sports-tennis',
  other: 'sports',
};

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
  const badgeStyle = getSportBadgeStyle(field.sport_type);
  const sportIcon = badgeStyle.icon;
  const { hydrate, isFavorite: checkFavorite, toggleFavorite } = useFavoriteStore();
  const isLiked = checkFavorite(field.id) || isFavorite;

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);

  const images = useMemo(() => {
    if (field.images && field.images.length > 0) {
      return field.images.map((img) => img.image_path).filter(Boolean);
    }
    return field.image_url ? [field.image_url] : [];
  }, [field]);

  useEffect(() => {
    hydrate().catch(() => {});
  }, [hydrate]);

  return (
    <TouchableOpacity
      style={st.card}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/venue-detail', params: { id: String(field.id) } })}
    >
      <View
        style={st.imageWrap}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - cardWidth) > 1) {
            setCardWidth(w);
          }
        }}
      >
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const contentOffset = e.nativeEvent.contentOffset.x;
              const layoutWidth = e.nativeEvent.layoutMeasurement.width;
              if (layoutWidth > 0) {
                const index = Math.round(contentOffset / layoutWidth);
                if (index !== activeImgIndex && index >= 0 && index < images.length) {
                  setActiveImgIndex(index);
                }
              }
            }}
            scrollEventThrottle={16}
            style={st.imageScroll}
          >
            {images.map((url, idx) => (
              <View key={`${url}-${idx}`} style={[st.imageSlide, cardWidth > 0 ? { width: cardWidth } : null]}>
                <SafeImage source={{ uri: url }} style={st.image} resizeMode="cover" fallbackSize={32} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={st.imagePlaceholder}>
            <MaterialIcons name={sportIcon} size={40} color={colors.primary} />
            <Text style={st.imagePlaceholderText}>Belum ada foto</Text>
          </View>
        )}

        <View
          style={[
            st.sportPill,
            {
              backgroundColor: badgeStyle.bg,
              borderColor: badgeStyle.border,
            },
          ]}
        >
          <MaterialIcons name={badgeStyle.icon} size={12} color={badgeStyle.color} style={{ marginRight: 4 }} />
          <Text style={[st.sportPillText, { color: badgeStyle.color }]}>{sportLabel}</Text>
        </View>

        {images.length > 1 && (
          <View style={st.imageBadge}>
            <MaterialIcons name="photo-camera" size={12} color="#FFF" />
            <Text style={st.imageBadgeText}>
              {activeImgIndex + 1}/{images.length}
            </Text>
          </View>
        )}

        {images.length > 1 && (
          <View style={st.dotsContainer}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[st.dot, i === activeImgIndex ? st.dotActive : st.dotInactive]}
              />
            ))}
          </View>
        )}

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
            color={isLiked ? colors.favorite : colors.textTertiary}
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
              <Text style={st.price}>{formatCurrency(field.price_per_hour)}</Text>
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
                  description: 'Lapangan ini masih menunggu persetujuan super admin.',
                  durationMs: 3000,
                });
                return;
              }
              router.push({ pathname: '/venue-detail', params: { id: String(field.id) } });
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
    height: 146,
    position: 'relative',
    backgroundColor: colors.surfaceContainer,
  },
  imageScroll: {
    flex: 1,
  },
  imageSlide: {
    height: 146,
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
  imageBadge: {
    position: 'absolute',
    top: 10,
    right: 50,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageBadgeText: {
    color: '#FFF',
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 12,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 5,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  sportPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  sportPillText: {
    color: colors.onPrimary,
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: 11,
  },
  name: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
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
    marginVertical: 6,
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
    fontSize: 15,
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
    paddingHorizontal: 13,
    paddingVertical: 5,
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
