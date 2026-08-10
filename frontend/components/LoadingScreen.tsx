import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useTheme } from '../lib/theme';
import { GridLoader } from './Skeleton';

type LoadingScreenProps = {
  message?: string;
};

export default function LoadingScreen({ message = 'Memeriksa sesi' }: LoadingScreenProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const glowSize = Math.min(320, width * 0.85);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 180,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [progress]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.glowTop, { width: glowSize, height: glowSize, borderRadius: glowSize / 2, backgroundColor: colors.primary }]} />
      <View style={[styles.glowBottom, { width: glowSize * 1.1, height: glowSize * 1.1, borderRadius: (glowSize * 1.1) / 2, backgroundColor: colors.info }]} />

      <View style={styles.brandWrap}>
        <Text style={[styles.logo, { color: colors.primary, textShadowColor: colors.primary }]}>GOAL</Text>
        <Text style={[styles.logoSub, { color: colors.textTertiary }]}>Game Organizer & Arena League</Text>
      </View>

      <View style={[styles.loaderCard, { borderColor: colors.borderSubtle, backgroundColor: colors.bgElevated }]}>
        <GridLoader />

        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>{message}</Text>

        <View style={[styles.progressTrack, { backgroundColor: colors.primaryMuted }]}>
          <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.primary }]} />
        </View>

        <View style={styles.loadingMeta}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingHint, { color: colors.textSecondary }]}>Mohon tunggu sebentar</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: -90,
    opacity: 0.12,
  },
  glowBottom: {
    position: 'absolute',
    right: -110,
    bottom: -130,
    opacity: 0.09,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logo: {
    fontSize: 44,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: 2,
    textShadowRadius: 18,
  },
  logoSub: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  loaderCard: {
    width: '100%',
    maxWidth: 560,
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 30,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: 4,
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 18,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  loadingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  loadingHint: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
