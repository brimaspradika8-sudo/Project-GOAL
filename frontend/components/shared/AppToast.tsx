import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import { useTheme } from '../../lib/theme';
import { getAlertPalette, type AlertType } from './alertPalette';

export type ToastType = AlertType;

interface AppToastProps {
  visible: boolean;
  type?: ToastType;
  title: string;
  description?: string;
  onDismiss: () => void;
  durationMs?: number;
}

export default function AppToast({
  visible, type = 'success', title, description, onDismiss, durationMs = 3000,
}: AppToastProps) {
  const { colors, resolved } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const palette = getAlertPalette(type, colors, resolved);
  const st = makeStyles(colors);

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
    <Animated.View
      style={[
        st.wrap,
        { backgroundColor: palette.background, borderColor: palette.border, opacity },
      ]}
    >
      <View style={[st.accentBar, { backgroundColor: palette.accent }]} />
      <View style={[st.iconWrap, { backgroundColor: palette.accent + '1A' }]}>
        <MaterialIcons name={palette.icon} size={20} color={palette.accent} />
      </View>
      <View style={st.textWrap}>
        <Text style={[st.title, { color: palette.text }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        {description ? <Text style={[st.desc, { color: palette.text }]} numberOfLines={2} ellipsizeMode="tail">{description}</Text> : null}
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={8} style={st.closeBtn}>
        <MaterialIcons name="close" size={18} color={palette.accent} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  wrap: {
    position: 'absolute', top: 50, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderLeftWidth: 0,
    paddingVertical: 12, paddingLeft: 14, paddingRight: 12, zIndex: 999,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  accentBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 4,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  textWrap: { flex: 1 },
  title: { ...FONTS.bodyMd, fontWeight: '700' },
  desc: { ...FONTS.bodySm, opacity: 0.85, marginTop: 1 },
  closeBtn: { padding: 4 },
});
