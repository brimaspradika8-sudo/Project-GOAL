import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, useWindowDimensions, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

export type BootStep = 'auth_check' | 'profile_fetch' | 'app_ready';

const STEPS: { key: BootStep; label: string }[] = [
  { key: 'auth_check', label: 'Memeriksa autentikasi' },
  { key: 'profile_fetch', label: 'Memuat profil pengguna' },
  { key: 'app_ready', label: 'Menyiapkan data aplikasi' },
];

function StepIndicator({ status, colors }: { status: 'done' | 'active' | 'pending'; colors: any }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status !== 'active') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [status, pulseAnim]);

  const size = 20;

  if (status === 'done') {
    return (
      <View style={[styles.stepIcon, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary }]}>
        <MaterialIcons name="check" size={13} color={colors.onPrimary} />
      </View>
    );
  }

  if (status === 'active') {
    return (
      <Animated.View
        style={[
          styles.stepIcon,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2.5,
            borderColor: colors.primary,
            backgroundColor: 'transparent',
            opacity: pulseAnim,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.stepIcon,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: colors.borderSubtle,
          backgroundColor: 'transparent',
        },
      ]}
    />
  );
}

type LoadingScreenProps = {
  currentStep?: BootStep | null;
  error?: string | null;
  onRetry?: () => void;
};

export default function LoadingScreen({ currentStep = 'auth_check', error = null, onRetry }: LoadingScreenProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const glowSize = Math.min(320, width * 0.85);

  const activeIndex = currentStep ? STEPS.findIndex((s) => s.key === currentStep) : -1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.glowTop, { width: glowSize, height: glowSize, borderRadius: glowSize / 2, backgroundColor: colors.primary }]} />
      <View style={[styles.glowBottom, { width: glowSize * 1.1, height: glowSize * 1.1, borderRadius: (glowSize * 1.1) / 2, backgroundColor: colors.info }]} />

      <View style={styles.brandWrap}>
        <Text style={[styles.logo, { color: colors.primary, textShadowColor: colors.primary }]}>GOAL</Text>
        <Text style={[styles.logoSub, { color: colors.textTertiary }]}>Game Organizer & Arena League</Text>
      </View>

      <View style={[styles.loaderCard, { borderColor: colors.borderSubtle, backgroundColor: colors.bgElevated }]}>
        {error ? (
          <>
            <View style={[styles.errorIconWrap, { backgroundColor: `${colors.error}15` }]}>
              <MaterialIcons name="cloud-off" size={32} color={colors.error} />
            </View>
            <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Koneksi terputus</Text>
            <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={({ pressed }) => [styles.retryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
            >
              <MaterialIcons name="refresh" size={15} color={colors.onPrimary} />
              <Text style={[styles.retryText, { color: colors.onPrimary }]}>Coba Lagi</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.stepsTitle, { color: colors.textPrimary }]}>Memuat aplikasi</Text>
            <View style={styles.stepsList}>
              {STEPS.map((step, idx) => {
                let status: 'done' | 'active' | 'pending' = 'pending';
                if (activeIndex >= 0) {
                  if (idx < activeIndex) status = 'done';
                  else if (idx === activeIndex) status = 'active';
                }
                return (
                  <View key={step.key} style={styles.stepRow}>
                    <StepIndicator status={status} colors={colors} />
                    <Text
                      style={[
                        styles.stepLabel,
                        {
                          color: status === 'done' ? colors.textPrimary : status === 'active' ? colors.textPrimary : colors.textTertiary,
                          fontWeight: status === 'active' ? '700' : '500',
                        },
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 30,
    paddingHorizontal: 28,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepsList: {
    alignSelf: 'stretch',
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    marginTop: 20,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
