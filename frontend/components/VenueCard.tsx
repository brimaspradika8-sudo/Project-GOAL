import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS, FONT_FAMILY } from './goalTheme';
import { SafeImage } from './SafeImage';
import type { Field } from '../store/fieldStore';

const DEFAULT_IMAGES: Record<string, string> = {
  futsal: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
};

const SPORT_LABEL: Record<string, string> = {
  futsal: 'Futsal',
  basketball: 'Basket',
  badminton: 'Badminton',
  mini_soccer: 'Mini Soccer',
  tennis: 'Tenis',
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
  const imgUrl = field.image_url || DEFAULT_IMAGES[field.sport_type] || DEFAULT_IMAGES.default;
  const isApproved = field.status === 'approved';
  const sportLabel = SPORT_LABEL[field.sport_type] || field.sport_type;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/venue-detail', params: { id: String(field.id) } })}
    >
      <View style={styles.imageWrap}>
        <SafeImage source={{ uri: imgUrl }} style={styles.image} resizeMode="cover" fallbackSize={32} />

        <View style={styles.sportPill}>
          <Text style={styles.sportPillText}>{sportLabel}</Text>
        </View>

        {onFavoriteToggle && (
          <TouchableOpacity
            style={styles.favoriteBtn}
            activeOpacity={0.7}
            onPress={() => onFavoriteToggle(field.id)}
          >
            <MaterialIcons
              name={isFavorite ? 'favorite' : 'favorite-border'}
              size={20}
              color={isFavorite ? '#EF4444' : '#9CA3AF'}
            />
          </TouchableOpacity>
        )}

        <View style={styles.ratingBadge}>
          <MaterialIcons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>4.8 (120)</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{field.name}</Text>
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={14} color={COLORS.textTertiary} />
          <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">{field.location}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Mulai dari</Text>
            <View style={styles.priceValueRow}>
              <Text style={styles.price}>{formatPrice(field.price_per_hour)}</Text>
              <Text style={styles.priceUnit}>/jam</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (!isApproved) return;
              router.push({ pathname: '/booking', params: { venueId: String(field.id) } });
            }}
          >
            <Text style={styles.bookBtnText}>Pesan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  imageWrap: {
    height: 150,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  sportPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sportPillText: {
    color: '#FFFFFF',
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
  ratingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  info: {
    padding: 14,
  },
  name: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
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
    color: COLORS.textTertiary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
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
    color: COLORS.textTertiary,
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
    color: COLORS.primary,
  },
  priceUnit: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  bookBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
