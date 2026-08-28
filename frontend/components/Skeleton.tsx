import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle, FlatList, Platform } from 'react-native';
import { SHADOWS } from './goalTheme';
import { useTheme } from '../lib/theme';

const GRID_LOADER_DELAYS = [200, 300, 400, 100, 200, 300, 0, 100, 200];

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
      <Skeleton height={176} borderRadius={0} />
      <View style={st.cardBody}>
        <Skeleton width="70%" height={18} borderRadius={6} />
        <Skeleton width="54%" height={14} borderRadius={6} />
        <View style={st.cardFooter}>
          <Skeleton width={80} height={16} borderRadius={6} />
          <View style={st.chips}>
            <Skeleton width={52} height={24} borderRadius={12} />
            <Skeleton width={64} height={24} borderRadius={12} />
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
      <Skeleton width={68} height={68} borderRadius={20} />
      <View style={st.profileText}>
        <Skeleton width={132} height={18} borderRadius={6} />
        <Skeleton width={176} height={14} borderRadius={6} />
      </View>
    </View>
  );
}

export function SkeletonHero() {
  return (
    <View style={st.hero}>
      <View style={st.heroTop}>
        <Skeleton width={96} height={16} borderRadius={6} />
        <Skeleton width={76} height={16} borderRadius={999} />
      </View>
      <Skeleton width="78%" height={24} borderRadius={8} />
      <Skeleton width="90%" height={14} borderRadius={6} />
      <Skeleton width="70%" height={14} borderRadius={6} />
    </View>
  );
}

export function SkeletonFilterBar() {
  return (
    <View style={st.filterRow}>
      <Skeleton width="68%" height={52} borderRadius={16} />
      <Skeleton width={92} height={52} borderRadius={16} />
    </View>
  );
}

export function GridLoader() {
  const { colors } = useTheme();
  const rotation = useRef(new Animated.Value(0)).current;
  const scales = useRef(Array.from({ length: 9 }, () => new Animated.Value(1))).current;

  useEffect(() => {
    const rotationAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    );
    const scaleAnimations = scales.map((scale, index) => Animated.loop(
      Animated.sequence([
        Animated.delay(GRID_LOADER_DELAYS[index]),
        Animated.timing(scale, { toValue: 0.15, duration: 455, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 845, useNativeDriver: true }),
      ])
    ));

    rotationAnimation.start();
    scaleAnimations.forEach((animation) => animation.start());
    return () => {
      rotationAnimation.stop();
      scaleAnimations.forEach((animation) => animation.stop());
    };
  }, [rotation, scales]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={st.gridLoaderWrap}>
      <Animated.View style={[st.gridLoader, { transform: [{ rotate }] }]}>
        {scales.map((scale, index) => (
          <Animated.View
            key={index}
            style={[st.gridLoaderCircle, { backgroundColor: colors.primary, transform: [{ scale }] }]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

/** Satu baris item list (untuk halaman super admin/owner) */
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
  hero: {
    borderRadius: 18,
    padding: 18,
    gap: 12,
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  gridLoaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  gridLoader: {
    width: 80,
    height: 80,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    overflow: 'hidden',
    borderRadius: 40,
  },
  gridLoaderCircle: {
    width: 24,
    height: 24,
    borderRadius: 11,
    elevation: 2,
    ...(Platform.OS === 'web'
      ? { boxShadow: '2px 2px 3px rgba(255, 255, 255, 0.35)' }
      : {
          shadowColor: '#FFFFFF',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 0.35,
          shadowRadius: 3,
        }),
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
