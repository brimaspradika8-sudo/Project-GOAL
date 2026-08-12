import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { FONT_FAMILY } from '../goalTheme';
import { useBreakpoint } from '../../lib/responsive';
import ThemeToggle from '../ThemeToggle';
import NotificationCenter from '../shared/NotificationCenter';
import { useNotificationStore } from '../../store/notificationStore';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Beranda', icon: 'home' },
  { href: '/booking', label: 'Booking', icon: 'event-available' },
  { href: '/fields', label: 'Lapangan', icon: 'stadium' },
  { href: '/matches', label: 'Pertandingan', icon: 'sports-soccer' },
];

export default function TopNavbar() {
  const { colors } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const [notifVisible, setNotifVisible] = React.useState(false);
  const { refresh, unreadCount } = useNotificationStore();

  React.useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  if (breakpoint === 'mobile') {
    return <MobileTopNavbar colors={colors} pathname={pathname} router={router} />;
  }

  const unread = unreadCount();

  return (
    <View style={[styles.navbar, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
      <View style={styles.inner}>

        {/* ZONA KIRI — logo, lebar sama dengan zona kanan lewat flex:1 */}
        <View style={styles.zoneLeft}>
          <Pressable onPress={() => router.push('/')}>
            <Text style={[styles.logo, { color: colors.primary }]}>GOAL</Text>
          </Pressable>
        </View>

        {/* ZONA TENGAH — menu, betul-betul center karena kiri & kanan sama lebar (flex:1) */}
        <View style={styles.zoneCenter}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Pressable
                key={item.href}
                style={[styles.navItem, isActive && { borderBottomColor: colors.primary }]}
                onPress={() => router.push(item.href as any)}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={18}
                  color={isActive ? colors.primary : colors.textTertiary}
                />
                <Text style={[styles.navLabel, { color: isActive ? colors.primary : colors.textTertiary }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ZONA KANAN — toggle tema, bell, avatar (urutan sesuai request) */}
        <View style={styles.zoneRight}>
          <ThemeToggle size={18} />
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.surfaceWhite, borderColor: colors.divider }]}
            onPress={() => setNotifVisible(true)}
          >
            <MaterialIcons name="notifications-none" size={20} color={colors.onSurface} />
            {unread > 0 ? <View style={styles.notifBadge} /> : null}
          </Pressable>
          <Pressable
            style={[styles.avatar, { backgroundColor: colors.primaryLight }]}
            onPress={() => router.push('/profile')}
          >
            <MaterialIcons name="person" size={20} color={colors.primary} />
          </Pressable>
        </View>

      </View>
      <NotificationCenter visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </View>
  );
}

function MobileTopNavbar({ colors, pathname, router }: { colors: any; pathname: string; router: any }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (drawerOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false, damping: 20, stiffness: 200 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -280, duration: 200, useNativeDriver: false }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start();
    }
  }, [drawerOpen, slideAnim, backdropAnim]);

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));
  const inactiveColor = colors.textSecondary;

  const navigate = (href: string) => {
    setDrawerOpen(false);
    router.push(href);
  };

  return (
    <>
      <View style={[styles.mobileHeader, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <Pressable style={styles.hamburger} onPress={() => setDrawerOpen(true)} hitSlop={12}>
          <MaterialIcons name="menu" size={22} color={colors.onSurface} />
        </Pressable>
        <Pressable onPress={() => router.push('/')}>
          <Text style={[styles.logo, { color: colors.primary }]}>GOAL</Text>
        </Pressable>
        <View style={styles.mobileActions}>
          <Pressable
            style={[styles.avatar, { backgroundColor: colors.primaryLight }]}
            onPress={() => router.push('/profile')}
          >
            <MaterialIcons name="person" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {drawerOpen && (
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setDrawerOpen(false)} />
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.surfaceContainerLow,
            borderRightColor: colors.outline,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={[styles.drawerHeader, { borderBottomColor: colors.outline }]}>
          <Text style={[styles.drawerLogo, { color: colors.primary }]}>GOAL</Text>
        </View>
        <View style={styles.drawerMenu}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const activeBg = colors.primary + '1A';
            const activeColor = colors.primary;
            return (
              <Pressable
                key={item.href}
                style={[styles.drawerItem, active && { backgroundColor: activeBg }]}
                onPress={() => navigate(item.href)}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={20}
                  color={active ? activeColor : inactiveColor}
                />
                <Text style={[styles.drawerLabel, { color: active ? activeColor : inactiveColor }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
          <View style={[styles.drawerFooter, { borderTopColor: colors.outline }]}>
            <ThemeToggle size={28} />
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    ...(Platform.OS === 'web'
      ? { position: 'sticky' as any, top: 0, zIndex: 100, borderBottomWidth: 1 }
      : {}),
    height: 64,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    paddingHorizontal: 24,
  },
  zoneLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  zoneCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  zoneRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  logo: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  hamburger: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  mobileActions: {
    marginLeft: 'auto' as any,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 90,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 260,
    height: '100%',
    zIndex: 100,
    borderRightWidth: 1,
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    paddingTop: 56,
  },
  drawerLogo: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  drawerMenu: {
    flex: 1,
    padding: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    minHeight: 48,
  },
  drawerLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  drawerFooter: {
    marginTop: 'auto' as any,
    paddingTop: 12,
    borderTopWidth: 1,
    paddingHorizontal: 16,
  },
});
