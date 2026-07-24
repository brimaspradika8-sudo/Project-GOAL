import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator, useWindowDimensions } from 'react-native';

type LoadingScreenProps = {
  message?: string;
};

export default function LoadingScreen({ message = 'Menyiapkan arena' }: LoadingScreenProps) {
  const { width } = useWindowDimensions();
  const glowSize = Math.min(320, width * 0.85);

  return (
    <View style={styles.container}>
      <View style={[styles.glowTop, { width: glowSize, height: glowSize, borderRadius: glowSize / 2 }]} />
      <View style={[styles.glowBottom, { width: glowSize * 1.1, height: glowSize * 1.1, borderRadius: (glowSize * 1.1) / 2 }]} />

      <View style={styles.brandWrap}>
        <Text style={styles.logo}>GOAL</Text>
        <Text style={styles.logoSub}>Game Organizer & Arena League</Text>
      </View>

      <View style={[styles.loaderCard, { maxWidth: Math.min(280, width * 0.75) }]}>
        <View style={styles.ball}>
          <Text style={styles.ballIcon}>⚽</Text>
        </View>

        <View style={styles.loadingRow}>
          <Text style={styles.loadingText}>{message}</Text>
          <ActivityIndicator size="small" color="#4be277" />
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
    backgroundColor: '#101310',
    paddingHorizontal: 28,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: -90,
    backgroundColor: '#4be277',
    opacity: 0.12,
  },
  glowBottom: {
    position: 'absolute',
    right: -110,
    bottom: -130,
    backgroundColor: '#38bdf8',
    opacity: 0.09,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 34,
  },
  logo: {
    color: '#4be277',
    fontSize: 52,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: 2,
    textShadow: '0px 0px 18px rgba(75,226,119,0.45)',
  },
  logoSub: {
    color: '#9db7a0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  loaderCard: {
    width: '100%',
    minHeight: 178,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(24,31,24,0.82)',
    overflow: 'hidden',
    paddingVertical: 28,
  },
  ball: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4be277',
    boxShadow: '0px 8px 18px rgba(75,226,119,0.35)',
    elevation: 10,
  },
  ballIcon: {
    fontSize: 36,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    gap: 10,
  },
  loadingText: {
    color: '#dfe8df',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
