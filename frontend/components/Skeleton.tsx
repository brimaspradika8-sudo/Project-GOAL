import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, SHADOWS } from './goalTheme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonVenueCard() {
  return (
    <View style={styles.card}>
      <Skeleton height={180} borderRadius={0} />
      <View style={styles.cardBody}>
        <Skeleton width="70%" height={18} borderRadius={6} />
        <Skeleton width="50%" height={14} borderRadius={6} />
        <View style={styles.cardFooter}>
          <Skeleton width={80} height={16} borderRadius={6} />
          <View style={styles.chips}>
            <Skeleton width={50} height={24} borderRadius={6} />
            <Skeleton width={60} height={24} borderRadius={6} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function SkeletonVenueList() {
  return (
    <View style={styles.list}>
      <SkeletonVenueCard />
      <SkeletonVenueCard />
      <SkeletonVenueCard />
    </View>
  );
}

export function SkeletonHorizontalCards() {
  return (
    <View style={styles.hRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.hCard}>
          <Skeleton width={220} height={140} borderRadius={14} />
          <View style={styles.hCardBody}>
            <Skeleton width="80%" height={16} borderRadius={6} />
            <Skeleton width="60%" height={12} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SkeletonProfile() {
  return (
    <View style={styles.profile}>
      <Skeleton width={64} height={64} borderRadius={20} />
      <View style={styles.profileText}>
        <Skeleton width={120} height={18} borderRadius={6} />
        <Skeleton width={180} height={14} borderRadius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.surfaceContainerLow,
  },
  card: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  cardBody: {
    padding: 14,
    gap: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
  },
  list: {
    gap: 0,
  },
  hRow: {
    flexDirection: 'row',
    gap: 12,
    paddingLeft: 4,
  },
  hCard: {
    width: 220,
  },
  hCardBody: {
    padding: 10,
    gap: 8,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  profileText: {
    gap: 8,
  },
});
