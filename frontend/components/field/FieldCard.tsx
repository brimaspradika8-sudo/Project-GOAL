import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeImage } from '../SafeImage';
import { radius, shadows, spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';
import { SPORT_LABELS } from '../../lib/fieldValidation';
import type { Field } from '../../store/fieldStore';
import FacilityBadge from './FacilityBadge';
import RatingCard from './RatingCard';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop';

function formatPrice(price: number | null): string {
  if (price == null) return 'Hubungi';
  return `Rp${price.toLocaleString('id-ID')}`;
}

interface FieldCardProps {
  field: Field;
}

export default function FieldCard({ field }: FieldCardProps) {
  const { colors } = useTheme();
  const sportLabel = SPORT_LABELS[field.sport_type] ?? field.sport_type;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.card, { backgroundColor: colors.surfaceWhite, borderColor: colors.divider }]}
      onPress={() => router.push({ pathname: '/venue-detail', params: { id: String(field.id) } })}
    >
      <View style={styles.imageWrap}>
        <SafeImage source={{ uri: field.image_url || FALLBACK_IMAGE }} style={styles.image} resizeMode="cover" fallbackSize={38} />
        <View style={styles.imageShade} />
        <View style={styles.topRow}>
          <View style={[styles.sportPill, { backgroundColor: colors.primary }]}>
            <Text style={[styles.sportText, { color: colors.onPrimary }]}>{sportLabel}</Text>
          </View>
          <RatingCard />
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{field.name}</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={14} color={colors.textTertiary} />
              <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>{field.location}</Text>
            </View>
          </View>
          <View style={styles.priceBlock}>
            <Text style={[styles.priceLabel, { color: colors.textTertiary }]}>Mulai</Text>
            <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(field.price_per_hour)}</Text>
          </View>
        </View>
        <View style={styles.facilities}>
          <FacilityBadge label="Parking" icon="local-parking" />
          <FacilityBadge label="Lighting" icon="lightbulb" />
          <FacilityBadge label="Locker" icon="inventory-2" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  imageWrap: {
    height: 190,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.14)',
  },
  topRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  sportText: {
    ...typography.labelMd,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.titleLg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  location: {
    flex: 1,
    ...typography.bodySm,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    ...typography.bodySm,
  },
  price: {
    ...typography.titleMd,
  },
  facilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
