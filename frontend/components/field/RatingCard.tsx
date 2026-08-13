import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

export default function RatingCard({ rating = 4.8, reviews = 128 }: { rating?: number; reviews?: number }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceWhite, borderColor: colors.divider }]}>
      <MaterialIcons name="star" size={16} color={colors.floodlight} />
      <Text style={[styles.rating, { color: colors.text }]}>{rating.toFixed(1)}</Text>
      <Text style={[styles.reviews, { color: colors.textTertiary }]}>({reviews})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    ...typography.labelMd,
  },
  reviews: {
    ...typography.bodySm,
  },
});
