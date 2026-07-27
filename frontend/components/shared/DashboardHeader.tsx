import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SHADOWS } from '../goalTheme';
import ThemeToggle from '../ThemeToggle';
import { useTheme } from '../../lib/theme';
import NotificationCenter from './NotificationCenter';
import { useNotificationStore } from '../../store/notificationStore';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  titleColor?: string;
}

export default function DashboardHeader({
  title,
  subtitle,
  right,
  showBack = true,
  onBack,
  titleColor,
}: DashboardHeaderProps) {
  const { colors, resolved } = useTheme();
  const insets = useSafeAreaInsets();
  const headerBackground = resolved === 'dark' ? '#064E3B' : colors.primary;
  const headerTextColor = '#FFFFFF';
  const headerSubtextColor = 'rgba(255,255,255,0.82)';
  const backButtonBackground = resolved === 'dark' ? 'rgba(255,255,255,0.16)' : colors.surface;
  const backButtonIcon = resolved === 'dark' ? '#FFFFFF' : colors.primary;

  const [notifVisible, setNotifVisible] = useState(false);
  const { hydrate, unreadCount } = useNotificationStore();

  useEffect(() => {
    hydrate().catch(() => {});
  }, [hydrate]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/(tabs)');
    }
  };

  return (
    <>
      <View style={[st.wrap, { backgroundColor: headerBackground, paddingTop: insets.top + 8 }]}>
        <View style={st.blobTopLeft} />
        <View style={st.blobBottomRight} />

        <View style={st.content}>
          {showBack ? (
            <TouchableOpacity
              style={[st.backBtn, { backgroundColor: backButtonBackground }]}
              activeOpacity={0.8}
              onPress={handleBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="arrow-back" size={20} color={backButtonIcon} />
            </TouchableOpacity>
          ) : null}

          <View style={st.textGroup}>
            <Text style={[st.title, { color: titleColor ?? headerTextColor }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[st.subtitle, { color: headerSubtextColor }]} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View style={st.rightSlot}>
            {right}
            <TouchableOpacity
              style={st.notifBtn}
              activeOpacity={0.8}
              onPress={() => setNotifVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="notifications" size={22} color={headerTextColor} />
              {unreadCount() > 0 ? <View style={st.notifBadge} /> : null}
            </TouchableOpacity>
            <ThemeToggle />
          </View>
        </View>
      </View>

      <NotificationCenter visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </>
  );
}

const st = StyleSheet.create({
  wrap: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 }),
  },
  blobTopLeft: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -30,
    right: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    ...SHADOWS.xs,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    ...FONTS.headlineMd,
  },
  subtitle: {
    ...FONTS.bodyMd,
    marginTop: 4,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 12,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});
