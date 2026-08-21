import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, SHADOWS } from '../goalTheme';
import { useTheme } from '../../lib/theme';
import { useIsMobileWeb } from '../../lib/responsive';
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
  const isMobile = useIsMobileWeb();
  const insets = useSafeAreaInsets();
  const st = makeStyles(colors, isMobile);
  const headerBackground = resolved === 'dark' ? colors.primaryContainer : colors.primary;
  const headerTextColor = '#FFFFFF';
  const headerSubtextColor = resolved === 'dark' ? colors.onPrimaryContainer : 'rgba(255,255,255,0.82)';
  const backButtonBackground = resolved === 'dark' ? colors.surfaceContainerHighest : colors.surface;
  const backButtonIcon = resolved === 'dark' ? colors.onPrimaryContainer : colors.primary;

  const [notifVisible, setNotifVisible] = useState(false);
  const hasUnread = useNotificationStore((s) => s.items.some((n) => !n.read));
  const refresh = useNotificationStore((s) => s.refresh);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

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
            <Text style={[st.title, { color: titleColor ?? headerTextColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
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
              <MaterialIcons name="notifications" size={isMobile ? 19 : 22} color={headerTextColor} />
              {hasUnread ? <View style={st.notifBadge} /> : null}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <NotificationCenter visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], isMobile: boolean) => StyleSheet.create({
  wrap: {
    paddingBottom: isMobile ? 12 : 16,
    paddingHorizontal: isMobile ? 14 : 20,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    zIndex: 1,
    gap: isMobile ? 4 : 8,
  },
  backBtn: {
    width: isMobile ? 36 : 44,
    height: isMobile ? 36 : 44,
    borderRadius: isMobile ? 18 : 22,
    backgroundColor: colors.surfaceWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isMobile ? 8 : 12,
    ...SHADOWS.xs,
  },
  textGroup: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    ...FONTS.headlineMd,
    ...(isMobile ? { fontSize: 18, lineHeight: 22 } : {}),
  },
  subtitle: {
    ...FONTS.bodySm,
    marginTop: 2,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isMobile ? 6 : 10,
    marginLeft: isMobile ? 4 : 8,
    flexShrink: 0,
    paddingTop: 2,
  },
  notifBtn: {
    width: isMobile ? 32 : 38,
    height: isMobile ? 32 : 38,
    borderRadius: isMobile ? 16 : 19,
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
