import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

interface BackgroundPatternProps {
  variant?: 'login' | 'register' | 'auth';
}

export function BackgroundPattern({ variant = 'login' }: BackgroundPatternProps) {
  const { width } = useWindowDimensions();
  const base = Math.min(340, width * 0.9);

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.circle1, { width: base * 0.82, height: base * 0.82, borderRadius: (base * 0.82) / 2 }]} />
      <View style={[styles.circle2, { width: base, height: base, borderRadius: base / 2 }]} />
      <View style={[styles.circle3, { width: base * 0.53, height: base * 0.53, borderRadius: (base * 0.53) / 2 }]} />
      {variant === 'register' && <View style={[styles.circle4, { width: base * 0.65, height: base * 0.65, borderRadius: (base * 0.65) / 2 }]} />}
      <View style={styles.dotsContainer}>
        {Array.from({ length: 7 }).map((_, row) => (
          <View key={row} style={styles.dotRow}>
            {Array.from({ length: 5 }).map((_, col) => (
              <View
                key={col}
                style={[styles.dot, { opacity: 0.03 + (row + col) * 0.006 }]}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.smallCircle1} />
      <View style={styles.smallCircle2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -100,
    right: -80,
    backgroundColor: '#007a4f',
    opacity: 0.04,
  },
  circle2: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    backgroundColor: '#00449d',
    opacity: 0.035,
  },
  circle3: {
    position: 'absolute',
    top: '35%',
    right: -50,
    backgroundColor: '#00A651',
    opacity: 0.03,
  },
  circle4: {
    position: 'absolute',
    bottom: '25%',
    left: -70,
    backgroundColor: '#007a4f',
    opacity: 0.03,
  },
  dotsContainer: {
    position: 'absolute',
    top: '18%',
    left: 28,
  },
  dotRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007a4f',
    marginRight: 14,
  },
  smallCircle1: {
    position: 'absolute',
    top: '60%',
    left: '10%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00449d',
    opacity: 0.025,
  },
  smallCircle2: {
    position: 'absolute',
    top: '15%',
    left: '60%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00A651',
    opacity: 0.02,
  },
});
