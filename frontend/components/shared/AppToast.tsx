import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../goalTheme';

export type ToastType = 'success' | 'error' | 'info';

interface AppToastProps {
  visible: boolean;
  type?: ToastType;
  title: string;
  description?: string;
  onDismiss: () => void;
  durationMs?: number;
}

const ICON_BY_TYPE: Record<ToastType, keyof typeof MaterialIcons.glyphMap> = {
  success: 'check-circle',
  error: 'error',
  info: 'info',
};

const ACCENT_BY_TYPE: Record<ToastType, string> = {
  success: COLORS.primary,
  error: COLORS.error,
  info: COLORS.floodlight,
};

export default function AppToast({
  visible, type = 'success', title, description, onDismiss, durationMs = 3000,
}: AppToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) { opacity.setValue(0); return; }
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true })
        .start(() => onDismiss());
    }, durationMs);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[st.wrap, { opacity }]}>
      <View style={[st.iconWrap, { backgroundColor: ACCENT_BY_TYPE[type] + '1A' }]}>
        <MaterialIcons name={ICON_BY_TYPE[type]} size={20} color={ACCENT_BY_TYPE[type]} />
      </View>
      <View style={st.textWrap}>
        <Text style={st.title}>{title}</Text>
        {description ? <Text style={st.desc}>{description}</Text> : null}
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={8} style={st.closeBtn}>
        <MaterialIcons name="close" size={18} color={COLORS.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  wrap: {
    position: 'absolute', top: 50, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1, borderColor: COLORS.outline,
    paddingVertical: 12, paddingHorizontal: 12, zIndex: 999,
    ...SHADOWS.md,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  textWrap: { flex: 1 },
  title: { ...FONTS.bodyMd, color: COLORS.text, fontWeight: '700' },
  desc: { ...FONTS.bodySm, color: COLORS.textSecondary, marginTop: 1 },
  closeBtn: { padding: 4 },
});
