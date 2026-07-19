import React, { useRef } from 'react';
import {
  Pressable,
  Animated,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface ScaleButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  activeScale?: number;
  haptic?: boolean;
  children: React.ReactNode;
}

export function ScaleButton({
  onPress,
  disabled = false,
  style,
  activeScale = 0.97,
  haptic = true,
  children,
}: ScaleButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
