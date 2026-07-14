import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

type LoadingScreenProps = {
  message?: string;
};

export default function LoadingScreen({ message = 'Menyiapkan arena' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.brandWrap}>
        <Text style={styles.logo}>GOAL</Text>
        <Text style={styles.logoSub}>Game Organizer & Arena League</Text>
      </View>

      <View style={styles.loaderCard}>
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
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4be277',
    opacity: 0.12,
  },
  glowBottom: {
    position: 'absolute',
    right: -110,
    bottom: -130,
    width: 320,
    height: 320,
    borderRadius: 160,
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
    maxWidth: 280,
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
