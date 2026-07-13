import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export function useAuthAnimations() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bgScaleAnim = useRef(new Animated.Value(1.1)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(100);

    const fadeAnimRef = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const pulseAnimRef = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const bgAnimRef = Animated.loop(
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

    fadeAnimRef.start();
    pulseAnimRef.start();
    bgAnimRef.start();

    return () => {
      fadeAnimRef.stop();
      pulseAnimRef.stop();
      bgAnimRef.stop();
    };
  }, []);

  return { fadeAnim, slideAnim, pulseAnim, bgScaleAnim };
}
