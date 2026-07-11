import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type LoadingScreenProps = {
  message?: string;
};

export default function LoadingScreen({ message = 'Menyiapkan arena' }: LoadingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.96)).current;
  const ballRotate = useRef(new Animated.Value(0)).current;
  const ballLift = useRef(new Animated.Value(0)).current;
  const scanX = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.35)).current;
  const dot2 = useRef(new Animated.Value(0.35)).current;
  const dot3 = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loops: Animated.CompositeAnimation[] = [];

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.04,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.96,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const ballLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ballLift, {
            toValue: -18,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballLift, {
            toValue: 0,
            duration: 420,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(ballRotate, {
          toValue: 1,
          duration: 840,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanX, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scanX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    const makeDotLoop = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.35,
            duration: 360,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(360 - delay),
        ])
      );

    loops.push(logoLoop, ballLoop, scanLoop, makeDotLoop(dot1, 0), makeDotLoop(dot2, 140), makeDotLoop(dot3, 280));
    loops.forEach((loop) => loop.start());

    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [ballLift, ballRotate, dot1, dot2, dot3, fadeAnim, logoScale, scanX]);

  const rotate = ballRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scanTranslate = scanX.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <Animated.View style={[styles.brandWrap, { transform: [{ scale: logoScale }] }]}>
        <Text style={styles.logo}>GOAL</Text>
        <Text style={styles.logoSub}>Game Organizer & Arena League</Text>
      </Animated.View>

      <View style={styles.loaderCard}>
        <Animated.View
          style={[
            styles.ball,
            {
              transform: [
                { translateY: ballLift },
                { rotate },
              ],
            },
          ]}
        >
          <MaterialIcons name="sports-soccer" size={42} color="#06140a" />
        </Animated.View>

        <View style={styles.fieldLine}>
          <Animated.View style={[styles.scanLine, { transform: [{ translateX: scanTranslate }] }]} />
        </View>

        <View style={styles.loadingRow}>
          <Text style={styles.loadingText}>{message}</Text>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
      </View>
    </Animated.View>
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
    textShadowColor: 'rgba(75,226,119,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
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
    shadowColor: '#4be277',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  fieldLine: {
    width: 170,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(75,226,119,0.16)',
    marginTop: 18,
    overflow: 'hidden',
  },
  scanLine: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4be277',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
  },
  loadingText: {
    color: '#dfe8df',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginRight: 8,
    textTransform: 'uppercase',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#4be277',
    marginHorizontal: 2,
  },
});
