import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const BALL_SIZE = 28;
const ARC_WIDTH = Math.min(width * 0.6, 220);
const CENTER_X = ARC_WIDTH / 2;
const ARC_HEIGHT = 100;

// One juggling ball that follows a parabolic arc
const JugglingBall = ({
  color,
  shadowColor,
  delay,
  label,
}: {
  color: string;
  shadowColor: string;
  delay: number;
  label: string;
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stagger the start
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  // Parabolic X: moves left → right across the arc
  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, CENTER_X, ARC_WIDTH - BALL_SIZE],
  });

  // Parabolic Y: goes up then comes back down (arc shape)
  const translateY = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [ARC_HEIGHT, 0, ARC_HEIGHT],
  });

  // Scale slightly when at top (in air)
  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.1, 0.8],
  });

  // Opacity: slightly dim when on the "ground"
  const opacity = progress.interpolate({
    inputRange: [0, 0.15, 0.5, 0.85, 1],
    outputRange: [0.5, 1, 1, 1, 0.5],
  });

  return (
    <Animated.View
      style={[
        styles.ball,
        {
          backgroundColor: color,
          shadowColor,
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <Text style={styles.ballLabel}>{label}</Text>
    </Animated.View>
  );
};

// Shadow/squash on ground beneath each ball
const BallShadow = ({
  delay,
  offset,
}: {
  delay: number;
  offset: number;
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const shadowWidth = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [20, 8, 20],
  });

  const shadowOpacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.1, 0.5],
  });

  const shadowX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [offset, offset + CENTER_X - 4, offset + ARC_WIDTH - BALL_SIZE],
  });

  return (
    <Animated.View
      style={[
        styles.shadow,
        {
          opacity: shadowOpacity,
          width: shadowWidth,
          transform: [{ translateX: shadowX }],
        },
      ]}
    />
  );
};

export default function LoadingScreen() {
  // Slow pulse for logo text
  const logoScale = useRef(new Animated.Value(1)).current;
  // Fade in on mount
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Dots animation for "Loading..."
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();

    // Logo pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.06,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Bouncing dots
    const animateDot = (dot: Animated.Value, delay: number) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: -8,
              duration: 350,
              easing: Easing.out(Easing.quad),
              useNativeDriver: false,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 350,
              easing: Easing.in(Easing.quad),
              useNativeDriver: false,
            }),
            Animated.delay(300),
          ])
        ).start();
      }, delay);
    };

    animateDot(dot1, 0);
    animateDot(dot2, 180);
    animateDot(dot3, 360);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background glow orbs */}
      <View style={[styles.glowOrb, styles.glowOrb1]} />
      <View style={[styles.glowOrb, styles.glowOrb2]} />

      {/* Logo */}
      <Animated.View style={{ transform: [{ scale: logoScale }], marginBottom: 8 }}>
        <Text style={styles.logo}>G</Text>
        <Text style={styles.logoAccent}>O</Text>
        <Text style={styles.logo}>AL</Text>
      </Animated.View>
      <Text style={styles.logoSub}>Game Organizer &amp; Arena League</Text>

      {/* Juggling Animation Container */}
      <View style={styles.jugglingContainer}>
        {/* The balls */}
        <View style={styles.ballsArea}>
          <JugglingBall color="#4be277" shadowColor="#4be277" delay={0} label="⚽" />
          <JugglingBall color="#38bdf8" shadowColor="#38bdf8" delay={400} label="🏀" />
          <JugglingBall color="#f59e0b" shadowColor="#f59e0b" delay={800} label="🎾" />
        </View>

        {/* Ground line */}
        <View style={styles.groundLine} />

        {/* Shadows */}
        <View style={styles.shadowsArea}>
          <BallShadow delay={0} offset={0} />
          <BallShadow delay={400} offset={0} />
          <BallShadow delay={800} offset={0} />
        </View>
      </View>

      {/* Loading text with bouncing dots */}
      <View style={styles.loadingRow}>
        <Text style={styles.loadingText}>Loading</Text>
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]}>
          <Text style={styles.dotText}>.</Text>
        </Animated.View>
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]}>
          <Text style={styles.dotText}>.</Text>
        </Animated.View>
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]}>
          <Text style={styles.dotText}>.</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f0a',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Glow orbs for ambient background
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.12,
  },
  glowOrb1: {
    width: 300,
    height: 300,
    backgroundColor: '#4be277',
    top: -60,
    left: -80,
  },
  glowOrb2: {
    width: 250,
    height: 250,
    backgroundColor: '#38bdf8',
    bottom: -40,
    right: -60,
  },

  // Logo
  logo: {
    fontSize: 52,
    fontWeight: '900',
    color: '#4be277',
    fontStyle: 'italic',
    letterSpacing: 3,
    textShadowColor: 'rgba(75,226,119,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    textAlign: 'center',
    lineHeight: 56,
  },
  logoAccent: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff',
    fontStyle: 'italic',
    letterSpacing: 3,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    textAlign: 'center',
    lineHeight: 56,
  },
  logoSub: {
    fontSize: 11,
    color: '#4b7b56',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 48,
    marginTop: 4,
  },

  // Juggling area
  jugglingContainer: {
    width: ARC_WIDTH,
    height: ARC_HEIGHT + BALL_SIZE + 20,
    marginBottom: 32,
  },
  ballsArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ARC_WIDTH,
    height: ARC_HEIGHT + BALL_SIZE,
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  ballLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
  groundLine: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(75,226,119,0.15)',
    borderRadius: 2,
  },
  shadowsArea: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    width: ARC_WIDTH,
    height: 10,
  },
  shadow: {
    position: 'absolute',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 6,
    bottom: 0,
  },

  // Loading text row
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  loadingText: {
    fontSize: 14,
    color: '#4b7b56',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dot: {
    marginBottom: 0,
  },
  dotText: {
    fontSize: 18,
    color: '#4be277',
    fontWeight: '800',
    lineHeight: 20,
  },
});
