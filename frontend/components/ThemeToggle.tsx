import React, { useEffect, useRef } from 'react';
import {
  View, TouchableOpacity, Animated, StyleSheet, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

const TRACK_W = 64;
const TRACK_H = 34;
const KNOB_SIZE = 28;
const KNOB_MARGIN = 3;

export default function ThemeToggle({ size }: { size?: number }) {
  const { resolved, toggleTheme, colors } = useTheme();
  const isDark = resolved === 'dark';

  const anim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: false,
      tension: 68,
      friction: 10,
    }).start();
  }, [isDark, anim]);

  const trackBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E2E9E4', '#374151'],
  });

  const knobLeft = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [KNOB_MARGIN, TRACK_W - KNOB_SIZE - KNOB_MARGIN],
  });

  const sunOpacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const moonOpacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
    ]).start();
    toggleTheme();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View
        style={[
          st.track,
          {
            backgroundColor: trackBg,
            transform: [{ scale }],
          },
        ]}
      >
        <Animated.View style={[st.iconWrap, { opacity: sunOpacity }]}>
          <MaterialIcons name="wb-sunny" size={16} color="#F59E0B" />
        </Animated.View>

        <Animated.View style={[st.iconWrap, { opacity: moonOpacity }]}>
          <MaterialIcons name="nightlight-round" size={16} color="#E5E7EB" />
        </Animated.View>

        <Animated.View
          style={[
            st.knob,
            {
              left: knobLeft,
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            },
          ]}
        >
          <Animated.View style={{ opacity: sunOpacity }}>
            <MaterialIcons name="wb-sunny" size={15} color="#F59E0B" />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: moonOpacity, justifyContent: 'center', alignItems: 'center' }]}>
            <MaterialIcons name="nightlight-round" size={15} color="#C4B5FD" />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    position: 'relative',
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  },
  iconWrap: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  knob: {
    position: 'absolute',
    top: KNOB_MARGIN,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 2,
  },
});
