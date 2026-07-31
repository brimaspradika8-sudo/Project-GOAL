import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import { useTheme } from '../../lib/theme';

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

export default function AppToast({
  visible, type = 'success', title, description, onDismiss, durationMs = 3000,
}: AppToastProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  const ACCENT_BY_TYPE: Record<ToastType, string> = {
    success: colors.primary,
    error: colors.error,
    info: colors.floodlight,
  };

  useEffect(() => {
    if (!visible) { opacity.setValue(0); return; }
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true })
        .start(() => onDismiss());
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onDismiss, opacity, visible]);

  if (!visible) return null;

  const accent = ACCENT_BY_TYPE[type];

  return (
    <Animated.View style={[
      st.wrap,
      {
        opacity,
        backgroundColor: colors.surface,
        borderColor: colors.outline,
        ...(Platform.OS === 'web'
          ? { boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }
          : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 }),
      },
    ]}>
      <View style={[st.iconWrap, { backgroundColor: accent + '20' }]}>
        <MaterialIcons name={ICON_BY_TYPE[type]} size={20} color={accent} />
      </View>
      <View style={st.textWrap}>
        <Text style={[st.title, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        {description ? <Text style={[st.desc, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">{description}</Text> : null}
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={8} style={st.closeBtn}>
        <MaterialIcons name="close" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  wrap: {
    position: 'absolute', top: 50, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 12, zIndex: 999,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  textWrap: { flex: 1 },
  title: { ...FONTS.bodyMd, fontWeight: '700' },
  desc: { ...FONTS.bodySm, marginTop: 1 },
  closeBtn: { padding: 4 },
});
