import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { FONT_FAMILY, SHADOWS } from '../goalTheme';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export default function Loading({
  message = 'Memuat data...',
  fullScreen = false,
  icon = 'sports-soccer',
}: LoadingProps) {
  const { colors, resolved } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    rotateLoop.start();

    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
    };
  }, [pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.wrap, fullScreen && styles.fullScreenWrap]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: resolved === 'dark' ? colors.surfaceContainer : colors.surfaceWhite,
            borderColor: colors.divider,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                backgroundColor: colors.primary + '18',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.iconBadge,
              {
                backgroundColor: colors.primaryContainer,
                borderColor: colors.primary + '35',
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <MaterialIcons name={icon} size={26} color={colors.primary} />
          </Animated.View>
        </View>

        <View style={styles.textRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullScreenWrap: {
    flex: 1,
    paddingVertical: 60,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 36,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    minWidth: 220,
    ...SHADOWS.md,
  },
  iconContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
