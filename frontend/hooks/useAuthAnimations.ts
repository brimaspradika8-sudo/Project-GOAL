import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';

function prefersReducedMotion(): boolean {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

export function useAuthAnimations() {
  const isWeb = Platform.OS === 'web';
  const progress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bgScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (prefersReducedMotion()) {
      progress.setValue(1);
      pulseAnim.setValue(1);
      bgScaleAnim.setValue(1);
      return;
    }

    progress.setValue(0);
    const progressAnimation = Animated.timing(progress, {
      toValue: 1,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    progressAnimation.start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    let backgroundAnimation: Animated.CompositeAnimation | undefined;

    if (!isWeb) {
      bgScaleAnim.setValue(1.1);
      backgroundAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(bgScaleAnim, {
            toValue: 1.3,
            duration: 12000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bgScaleAnim, {
            toValue: 1.1,
            duration: 12000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      backgroundAnimation.start();
    } else {
      bgScaleAnim.setValue(1);
    }

    return () => {
      progressAnimation.stop();
      pulseAnimation.stop();
      backgroundAnimation?.stop();
    };
  }, [bgScaleAnim, isWeb, progress, pulseAnim]);

  const values = useMemo(() => {
    const headerFade = progress.interpolate({
      inputRange: [0, 0.35],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    const headerSlide = progress.interpolate({
      inputRange: [0, 0.35],
      outputRange: [24, 0],
      extrapolate: 'clamp',
    });
    const cardFade = progress.interpolate({
      inputRange: [0.18, 0.55],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    const cardSlide = progress.interpolate({
      inputRange: [0.18, 0.55],
      outputRange: [32, 0],
      extrapolate: 'clamp',
    });
    const buttonFade = progress.interpolate({
      inputRange: [0.35, 0.75],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    const buttonSlide = progress.interpolate({
      inputRange: [0.35, 0.75],
      outputRange: [20, 0],
      extrapolate: 'clamp',
    });

    return { headerFade, headerSlide, cardFade, cardSlide, buttonFade, buttonSlide };
  }, [progress]);

  return {
    fadeAnim: values.headerFade,
    slideAnim: values.headerSlide,
    ...values,
    pulseAnim,
    bgScaleAnim,
  };
}
