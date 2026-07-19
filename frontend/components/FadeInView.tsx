import React, { useRef, useEffect } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  slideUp?: number;
}

export function FadeInView({ children, delay = 0, duration = 400, style, slideUp = 16 }: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideUp)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay, duration]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

interface StaggeredListProps {
  children: React.ReactNode[];
  style?: ViewStyle;
  staggerDelay?: number;
}

export function StaggeredList({ children, style, staggerDelay = 80 }: StaggeredListProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <FadeInView key={index} delay={index * staggerDelay} style={style}>
          {child}
        </FadeInView>
      ))}
    </>
  );
}
