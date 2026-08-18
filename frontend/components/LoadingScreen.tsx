import React from 'react';
import { StyleSheet, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { FONT_FAMILY } from './goalTheme';

export type BootStep = 'auth_check' | 'profile_fetch' | 'app_ready';

const STEP_PERCENT: Record<BootStep, number> = {
  auth_check: 33,
  profile_fetch: 67,
  app_ready: 100,
};

const STEP_LABEL: Record<BootStep, string> = {
  auth_check: 'Memeriksa autentikasi',
  profile_fetch: 'Memuat profil pengguna',
  app_ready: 'Menyiapkan data aplikasi',
};

type LoadingScreenProps = {
  currentStep?: BootStep | null;
  error?: string | null;
  onRetry?: () => void;
};

export default function LoadingScreen({ currentStep = 'auth_check', error = null, onRetry }: LoadingScreenProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const glowSize = Math.min(320, width * 0.85);

  const pct = currentStep ? STEP_PERCENT[currentStep] : 0;
  const label = currentStep ? STEP_LABEL[currentStep] : '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.glowTop, { width: glowSize, height: glowSize, borderRadius: glowSize / 2, backgroundColor: colors.primary }]} />
      <View style={[styles.glowBottom, { width: glowSize * 1.1, height: glowSize * 1.1, borderRadius: (glowSize * 1.1) / 2, backgroundColor: colors.info }]} />

      <View style={styles.brandWrap}>
        <Text style={[styles.logo, { color: colors.primary, textShadowColor: colors.primary }]}>GOAL</Text>
        <Text style={[styles.logoSub, { color: colors.textTertiary }]}>Game Organizer & Arena League</Text>
      </View>

      <View style={[styles.card, { borderColor: colors.borderSubtle, backgroundColor: colors.bgElevated }]}>
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Memuat aplikasi</Text>

            <View style={styles.barSection}>
              <View style={[styles.track, { backgroundColor: colors.borderSubtle }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: colors.primary,
                      width: `${pct}%` as any,
                    },
                  ]}
                />
              </View>
              <View style={styles.barFooter}>
                <Text style={[styles.pctText, { color: colors.primary }]}>{pct}%</Text>
                <Text style={[styles.stepText, { color: colors.textSecondary }]}>{label}</Text>
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
    fontFamily: FONT_FAMILY,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: 2,
    textShadowRadius: 18,
  },
  logoSub: {
    fontSize: 11,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  card: {
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
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 24,
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
    fontSize: 13,
    fontWeight: '800',
  },
  stepText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
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
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorDesc: {
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
