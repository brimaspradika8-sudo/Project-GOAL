import React from 'react';
import { View, StyleSheet } from 'react-native';

interface BackgroundPatternProps {
  variant?: 'login' | 'register' | 'auth';
}

export function BackgroundPattern({ variant = 'login' }: BackgroundPatternProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />
      {variant === 'register' && <View style={styles.circle4} />}
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
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#007a4f',
    opacity: 0.04,
  },
  circle2: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: '#00449d',
    opacity: 0.035,
  },
  circle3: {
    position: 'absolute',
    top: '35%',
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#00A651',
    opacity: 0.03,
  },
  circle4: {
    position: 'absolute',
    bottom: '25%',
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
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
