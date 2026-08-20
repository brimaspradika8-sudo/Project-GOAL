import React, { useEffect, useRef, useState } from 'react';
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
  app_ready: 'Menyiapkan data arena...',
};

const SPORTS_TIPS = [
  '💡 Tips: Slot lapangan malam hari (19:00 - 22:00) paling cepat dipesan.',
  '⚽ Did you know: Bermain futsal 1 jam dapat membakar hingga 600 kalori.',
  '🏆 Tips: Kamu bisa membatalkan pesanan sesuai kebijakan arena masing-masing.',
  '👟 Tips: Pastikan gunakan sepatu outsole berbahan karet untuk arena sintetis.',
];

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
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [tipIndex, setTipIndex] = useState(0);
  const tipFadeAnim = useRef(new Animated.Value(1)).current;

  // Rotation & Bounce Loop
  useEffect(() => {
    // Bounce loop (450ms down, 450ms up)
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 480,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 480,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
          useNativeDriver: true,
        }),
      ])
    );

    // Continuous 360deg Rotation loop
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    bounceLoop.start();
    rotateLoop.start();

    return () => {
      bounceLoop.stop();
      rotateLoop.stop();
    };
  }, [bounceAnim, rotateAnim]);

  // Progress Bar Animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, progressAnim]);

  // Rotate Tips every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(tipFadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setTipIndex((prev) => (prev + 1) % SPORTS_TIPS.length);
        Animated.timing(tipFadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [tipFadeAnim]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Bouncing Ball Interpolations
  const ballTranslateY = bounceAnim.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [-42, 0, 3], // Membal dari atas ke lantai
  });

  const ballScaleY = bounceAnim.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 0.82], // Effek menyet (squish) saat menabrak lantai
  });

  const ballScaleX = bounceAnim.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 1.16],
  });

  const ballRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Shadow Interpolations (skala & opacity bertambah saat bola di lantai)
  const shadowScaleX = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1.1],
  });

  const shadowOpacity = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.55],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Glows */}
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

      {/* Brand Header */}
      <View style={styles.brandWrap}>
        {/* 3D Bouncing Sports Ball Loader */}
        <View style={styles.bouncingStage}>
          <Animated.View
            style={[
              styles.ballContainer,
              {
                backgroundColor: colors.primaryContainer,
                borderColor: colors.primary + '40',
                transform: [
                  { translateY: ballTranslateY },
                  { scaleX: ballScaleX },
                  { scaleY: ballScaleY },
                ],
              },
            ]}
          >
            <Animated.View style={{ transform: [{ rotate: ballRotate }] }}>
              <MaterialIcons name="sports-soccer" size={36} color={colors.primary} />
            </Animated.View>
          </Animated.View>

          {/* Dynamic Bouncing Shadow */}
          <Animated.View
            style={[
              styles.ballShadow,
              {
                backgroundColor: resolved === 'dark' ? '#000000' : colors.primary,
                opacity: shadowOpacity,
                transform: [{ scaleX: shadowScaleX }],
              },
            ]}
          />
        </View>

        <Text style={[styles.logo, { color: colors.primary }]}>GOAL</Text>
        <Text style={[styles.logoSub, { color: colors.textSecondary }]}>Game Organizer & Arena League</Text>
      </View>

      {/* Card Loading Progress */}
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

            {/* Rotating Sports Tips */}
            <Animated.View style={[styles.tipBox, { opacity: tipFadeAnim, backgroundColor: colors.surfaceContainerLow }]}>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                {SPORTS_TIPS[tipIndex]}
              </Text>
            </Animated.View>
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
    marginBottom: 24,
  },
  bouncingStage: {
    height: 95,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  ballContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  ballShadow: {
    width: 48,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
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
    paddingVertical: 24,
    paddingHorizontal: 24,
    ...SHADOWS.md,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 18,
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
    marginTop: 10,
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
  tipBox: {
    width: '100%',
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  tipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
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
