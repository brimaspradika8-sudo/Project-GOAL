import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONT_FAMILY } from './goalTheme';
import { useTheme } from '../lib/theme';
import { getAlertPalette } from './shared/alertPalette';

export type ToastType = 'success' | 'error' | 'info';

interface ToastData {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: number) => void }) {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const { colors, resolved } = useTheme();
  const palette = getAlertPalette(toast.type, colors, resolved);
  const accent = palette.accent;

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(toast.id));
  }, [opacityAnim, onDismiss, scaleAnim, slideAnim, toast.id]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    const duration = toast.duration || 3500;
    const timer = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(timer);
  }, [dismiss, opacityAnim, scaleAnim, slideAnim, toast.duration]);

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.toastCard, { backgroundColor: colors.inverseSurface }]}>
        <View style={[styles.iconContainer, { backgroundColor: accent + '1A' }]}>
          <MaterialIcons name={palette.icon} size={22} color={accent} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.inverseOnSurface }]} numberOfLines={1} ellipsizeMode="tail">{toast.title}</Text>
          {toast.message ? (
            <Text style={[styles.message, { color: colors.inverseOnSurface + 'B3' }]} numberOfLines={2} ellipsizeMode="tail">{toast.message}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={dismiss}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.closeButton, { backgroundColor: colors.inverseOnSurface + '1F' }]}
        >
          <MaterialIcons name="close" size={16} color={colors.inverseOnSurface + 'B3'} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

let nextId = 0;
const listeners: Set<() => void> = new Set();
let state: { toasts: ToastData[] } = { toasts: [] };

function notify() {
  listeners.forEach((fn) => fn());
}

export const Toast = {
  show(type: ToastType, title: string, message?: string, duration?: number) {
    const id = nextId++;
    state.toasts = [...state.toasts, { id, type, title, message, duration }];
    notify();
  },
  success(title: string, message?: string) {
    Toast.show('success', title, message);
  },
  error(title: string, message?: string) {
    Toast.show('error', title, message);
  },
  info(title: string, message?: string) {
    Toast.show('info', title, message);
  },
};

export function ToastProvider() {
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const listener = () => forceUpdate();
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const dismiss = useCallback((id: number) => {
    state.toasts = state.toasts.filter((t) => t.id !== id);
    notify();
  }, []);

  if (state.toasts.length === 0) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {state.toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 8,
    left: 14,
    right: 14,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContainer: {
    width: '100%',
    marginBottom: 8,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 16px rgba(0,0,0,0.25)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 }
    ),
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  message: {
    fontSize: 12,
    marginTop: 1,
    fontFamily: FONT_FAMILY,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
