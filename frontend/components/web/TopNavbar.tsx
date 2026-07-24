import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { FONT_FAMILY } from '../goalTheme';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Beranda', icon: 'home' },
  { href: '/booking', label: 'Booking', icon: 'event-available' },
  { href: '/matches', label: 'Match', icon: 'sports-soccer' },
  { href: '/profile', label: 'Profile', icon: 'person' },
];

export default function TopNavbar() {
  const { colors } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={[styles.navbar, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
      <View style={styles.inner}>
        <Pressable style={styles.logoPressable} onPress={() => router.push('/')}>
          <Text style={[styles.logo, { color: colors.primary }]}>GOAL</Text>
        </Pressable>

        <View style={styles.navLinks}>
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
                <Text
                  style={[
                    styles.navLabel,
                    { color: isActive ? colors.primary : colors.textTertiary },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.avatar, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/profile')}
        >
          <MaterialIcons name="person" size={20} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    ...(Platform.OS === 'web'
      ? {
          position: 'sticky' as any,
          top: 0,
          zIndex: 100,
          borderBottomWidth: 1,
        }
      : {}),
    height: 64,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 32,
  },
  logoPressable: {
    marginRight: 40,
  },
  logo: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto' as any,
  },
});
