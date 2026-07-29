import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle, FlatList } from 'react-native';
import { SHADOWS } from './goalTheme';
import { useTheme } from '../lib/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
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
        { width, height, borderRadius, opacity, backgroundColor: colors.surfaceContainerLow },
        style,
      ]}
    />
  );
}

export function SkeletonVenueCard() {
  const { colors } = useTheme();
  return (
    <View style={[st.card, { backgroundColor: colors.surfaceWhite, borderColor: colors.divider }]}>
      <Skeleton height={180} borderRadius={0} />
      <View style={st.cardBody}>
        <Skeleton width="70%" height={18} borderRadius={6} />
        <Skeleton width="50%" height={14} borderRadius={6} />
        <View style={st.cardFooter}>
          <Skeleton width={80} height={16} borderRadius={6} />
          <View style={st.chips}>
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
    <View style={st.list}>
      <SkeletonVenueCard />
      <SkeletonVenueCard />
      <SkeletonVenueCard />
    </View>
  );
}

export function SkeletonHorizontalCards() {
  return (
    <FlatList
      horizontal
      data={[1, 2, 3]}
      keyExtractor={(item) => String(item)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={st.hRow}
      renderItem={() => (
        <View style={st.hCard}>
          <Skeleton width={180} height={140} borderRadius={14} />
          <View style={st.hCardBody}>
            <Skeleton width="80%" height={16} borderRadius={6} />
            <Skeleton width="60%" height={12} borderRadius={6} />
          </View>
        </View>
      )}
    />
  );
}

export function SkeletonProfile() {
  return (
    <View style={st.profile}>
      <Skeleton width={64} height={64} borderRadius={20} />
      <View style={st.profileText}>
        <Skeleton width={120} height={18} borderRadius={6} />
        <Skeleton width={180} height={14} borderRadius={6} />
      </View>
    </View>
  );
}

/** Satu baris item list (untuk halaman admin/owner) */
export function SkeletonListItem() {
  const { colors } = useTheme();
  return (
    <View style={[st.listItem, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
      <Skeleton width={44} height={44} borderRadius={13} />
      <View style={st.listItemBody}>
        <Skeleton width="65%" height={14} borderRadius={6} />
        <Skeleton width="45%" height={11} borderRadius={6} />
      </View>
      <Skeleton width={60} height={30} borderRadius={8} />
    </View>
  );
}

/** N buah SkeletonListItem — digunakan sebagai pengganti ActivityIndicator */
export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <View style={st.cardsList}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
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
    gap: 12,
    paddingLeft: 4,
  },
  hCard: {
    width: 180,
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
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  listItemBody: {
    flex: 1,
    gap: 8,
  },
  cardsList: {
    padding: 16,
    paddingTop: 8,
  },
});
