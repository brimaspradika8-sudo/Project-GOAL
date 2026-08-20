import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, useWindowDimensions, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { FONT_FAMILY, SHADOWS } from './goalTheme';

export type BootStep = 'auth_check' | 'profile_fetch' | 'app_ready';

const STEP_PERCENT: Record<BootStep, number> = {
  auth_check: 35,
  profile_fetch: 70,
  app_ready: 100,
};

const STEP_LABEL: Record<BootStep, string> = {
  auth_check: 'Memeriksa autentikasi...',
  profile_fetch: 'Memuat profil pengguna...',
  app_ready: 'Menyiapkan data aplikasi...',
};

type LoadingScreenProps = {
  currentStep?: BootStep | null;
  error?: string | null;
  onRetry?: () => void;
};

export default function LoadingScreen({ currentStep = 'auth_check', error = null, onRetry }: LoadingScreenProps) {
  const { width } = useWindowDimensions();
  const { colors, resolved } = useTheme();
  const glowSize = Math.min(360, width * 0.9);

  const pct = currentStep ? STEP_PERCENT[currentStep] : 0;
  const label = currentStep ? STEP_LABEL[currentStep] : '';

  const progressAnim = useRef(new Animated.Value(pct)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, progressAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.glowTop,
          { width: glowSize, height: glowSize, borderRadius: glowSize / 2, backgroundColor: colors.primary },
        ]}
      />
      <View
        style={[
          styles.glowBottom,
          { width: glowSize * 1.1, height: glowSize * 1.1, borderRadius: (glowSize * 1.1) / 2, backgroundColor: colors.info },
        ]}
      />

      <View style={styles.brandWrap}>
        <Animated.View
          style={[
            styles.brandIconBadge,
            {
              backgroundColor: colors.primaryContainer,
              borderColor: colors.primary + '30',
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <MaterialIcons name="sports-soccer" size={32} color={colors.primary} />
        </Animated.View>

        <Text style={[styles.logo, { color: colors.primary }]}>GOAL</Text>
        <Text style={[styles.logoSub, { color: colors.textSecondary }]}>Game Organizer & Arena League</Text>
      </View>

      <View
        style={[
          styles.card,
          {
            borderColor: colors.divider,
            backgroundColor: resolved === 'dark' ? colors.surfaceContainer : colors.surfaceWhite,
          },
        ]}
      >
        {error ? (
          <>
            <View style={[styles.errorIconWrap, { backgroundColor: colors.errorContainer }]}>
              <MaterialIcons name="cloud-off" size={32} color={colors.error} />
            </View>
            <Text style={[styles.errorTitle, { color: colors.text }]}>Koneksi Terputus</Text>
            <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <MaterialIcons name="refresh" size={16} color={colors.onPrimary} />
              <Text style={[styles.retryText, { color: colors.onPrimary }]}>Coba Lagi</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.text }]}>MEMUAT APLIKASI</Text>

            <View style={styles.barSection}>
              <View style={[styles.track, { backgroundColor: colors.divider }]}>
                <Animated.View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: colors.primary,
                      width: animatedWidth,
                    },
                  ]}
                />
              </View>
              <View style={styles.barFooter}>
                <Text style={[styles.stepText, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.pctText, { color: colors.primary }]}>{pct}%</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glowTop: {
    position: 'absolute',
    top: -140,
    left: -100,
    opacity: 0.1,
  },
  glowBottom: {
    position: 'absolute',
    right: -120,
    bottom: -140,
    opacity: 0.08,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  logo: {
    fontSize: 42,
    fontFamily: FONT_FAMILY,
    fontWeight: '900',
    letterSpacing: 3,
  },
  logoSub: {
    fontSize: 11,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 24,
    ...SHADOWS.md,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 20,
    textAlign: 'center',
  },
  barSection: {
    width: '100%',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  barFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  pctText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
  },
  stepText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 20,
    ...SHADOWS.sm,
  },
  retryText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
