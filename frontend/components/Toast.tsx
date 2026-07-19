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

export type ToastType = 'success' | 'error' | 'info';

interface ToastData {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

const TOAST_CONFIG: Record<ToastType, {
  cardBg: string;
  iconBg: string;
  iconColor: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  titleColor: string;
  messageColor: string;
  closeBg: string;
}> = {
  error: {
    cardBg: '#232531',
    iconBg: 'rgba(255,255,255,0.06)',
    iconColor: '#d65563',
    icon: 'error-outline',
    titleColor: '#ffffff',
    messageColor: '#6b7280',
    closeBg: 'rgba(255,255,255,0.08)',
  },
  success: {
    cardBg: '#232531',
    iconBg: 'rgba(255,255,255,0.06)',
    iconColor: '#4ade80',
    icon: 'check-circle-outline',
    titleColor: '#ffffff',
    messageColor: '#6b7280',
    closeBg: 'rgba(255,255,255,0.08)',
  },
  info: {
    cardBg: '#232531',
    iconBg: 'rgba(255,255,255,0.06)',
    iconColor: '#60a5fa',
    icon: 'info-outline',
    titleColor: '#ffffff',
    messageColor: '#6b7280',
    closeBg: 'rgba(255,255,255,0.08)',
  },
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: number) => void }) {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const config = TOAST_CONFIG[toast.type];

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
      <View style={[styles.toastCard, { backgroundColor: config.cardBg }]}>
        <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
          <MaterialIcons name={config.icon} size={22} color={config.iconColor} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.titleColor }]}>{toast.title}</Text>
          {toast.message ? (
            <Text style={[styles.message, { color: config.messageColor }]}>{toast.message}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={dismiss}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.closeButton, { backgroundColor: config.closeBg }]}
        >
          <MaterialIcons name="close" size={16} color="#6b7280" />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
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
    fontFamily: 'Montserrat',
  },
  message: {
    fontSize: 12,
    marginTop: 1,
    fontFamily: 'Montserrat',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
