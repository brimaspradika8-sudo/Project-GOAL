import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { FONT_FAMILY } from '../goalTheme';

interface CountdownTimerProps {
  expiresAt: string | null;
  onExpired?: () => void;
}

const RING_SIZE = 160;
const STROKE_WIDTH = 10;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getRemainingSeconds(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatTime(s: number): string {
  if (s <= 0) return '00:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function getColor(seconds: number): string {
  if (seconds > 600) return '#059669';
  if (seconds > 300) return '#D97706';
  return '#DC2626';
}

function getLabel(seconds: number): string {
  if (seconds > 600) return 'Waktu tersisa';
  if (seconds > 300) return 'Hampir habis';
  return 'Segera habis!';
}

export default function CountdownTimer({ expiresAt, onExpired }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => (expiresAt ? getRemainingSeconds(expiresAt) : 0));
  const expiredRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!expiresAt) return;
    setRemaining(getRemainingSeconds(expiresAt));
    expiredRef.current = false;
  }, [expiresAt]);

  const isExpired = remaining <= 0;
  const isCritical = remaining > 0 && remaining <= 60;
  const color = getColor(remaining);
  const label = getLabel(remaining);
  const BOOKING_WINDOW = 30 * 60;
  const progress = isExpired ? 0 : Math.min(1, remaining / BOOKING_WINDOW);
  const strokeOffset = CIRCUMFERENCE * (1 - progress);

  useEffect(() => {
    if (isExpired && expiresAt && !expiredRef.current) {
      expiredRef.current = true;
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        onExpired?.();
      });
    }
  }, [isExpired, expiresAt, onExpired, fadeAnim]);

  useEffect(() => {
    const id = setInterval(() => {
      if (expiresAt) setRemaining(getRemainingSeconds(expiresAt));
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    if (isCritical) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => { loop.stop(); pulseAnim.setValue(1); };
    }
    pulseAnim.setValue(1);
  }, [isCritical, pulseAnim]);

  if (!expiresAt) return null;

  return (
    <Animated.View style={[st.container, { opacity: fadeAnim }]}>
      <Text style={[st.label, { color }]}>{label}</Text>

      <Animated.View style={[st.ringWrap, { transform: [{ scale: pulseAnim }] }]}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={color + '18'}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </Svg>

        <View style={st.ringCenter}>
          {isExpired ? (
            <View style={st.expiredWrap}>
              <MaterialIcons name="error-outline" size={24} color={color} />
              <Text style={[st.expiredText, { color }]}>Habis</Text>
            </View>
          ) : (
            <>
              <Text style={[st.time, { color }]}>{formatTime(remaining)}</Text>
            </>
          )}
        </View>
      </Animated.View>

      <Text style={st.hint}>Booking otomatis dibatalkan jika waktu habis</Text>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 20,
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontFamily: FONT_FAMILY,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  sublabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },
  expiredWrap: {
    alignItems: 'center',
    gap: 4,
  },
  expiredText: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
  },
  hint: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
