import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS, SHADOWS } from '../goalTheme';
import { useTheme } from '../../lib/theme';
import * as Haptics from 'expo-haptics';

interface AnimatedDeleteButtonProps {
  onPress: () => void;
  size?: number; // default 44 (standar touch target, jangan di bawah 44 untuk mobile)
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnimatedDeleteButton({
  onPress,
  size = 44,
}: AnimatedDeleteButtonProps) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const pillWidth = size + 64;

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: [size, pillWidth] });
  const bgColor = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.surfaceStrong, colors.error] });
  const iconY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.26] });
  const iconScale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const textOpacity = progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, 1] });
  const textY = progress.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] });

  const animate = useCallback(
    (to: number) => {
      progress.stopAnimation();
      Animated.timing(progress, {
        toValue: to,
        duration: 260,
        easing: to === 1 ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [progress],
  );

  const expand = useCallback(() => animate(1), [animate]);
  const collapse = useCallback(() => animate(0), [animate]);

  const handlePressIn = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    expand();
  }, [expand]);

  const handlePress = useCallback(() => {
    collapse();
    onPress();
  }, [collapse, onPress]);

  useEffect(() => () => progress.stopAnimation(), [progress]);

  const webHoverProps = Platform.OS === 'web'
    ? ({ onMouseEnter: expand, onMouseLeave: collapse } as any)
    : {};

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Hapus"
      onPress={handlePress}
      onHoverIn={expand}
      onHoverOut={collapse}
      onPressIn={handlePressIn}
      onPressOut={collapse}
      onBlur={collapse}
      {...webHoverProps}
      style={[
        styles.base,
        { width, height: size, borderRadius: size / 2, backgroundColor: bgColor },
      ]}
    >
      <Animated.View
        style={[
          styles.textWrap,
          { opacity: textOpacity, transform: [{ translateY: textY }] },
        ]}
      >
        <Text style={styles.label}>Hapus</Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.iconWrap,
          { transform: [{ translateY: iconY }, { scale: iconScale }] },
        ]}
      >
        <MaterialIcons name="delete" size={Math.round(size * 0.4)} color="#FFFFFF" />
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    cursor: 'pointer',
    ...SHADOWS.md,
  },
  textWrap: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  iconWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    ...FONTS.buttonMd,
    fontWeight: '700',
  },
});
