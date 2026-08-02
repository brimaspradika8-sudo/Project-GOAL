import { Tabs, usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';
import { FONT_FAMILY } from '../../components/goalTheme';
import Sidebar, { SidebarItem } from '../../components/web/Sidebar';
import MobileWebHeader from '../../components/web/MobileWebHeader';
import { useBreakpoint } from '../../lib/responsive';
import { useProfileStore } from '../../store/profileStore';

export default function OwnerTabLayout() {
  const profile = useProfileStore((s) => s.profile);
  const profileLoading = useProfileStore((s) => s.loading);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const breakpoint = useBreakpoint();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (profileLoading) return;
    if (!profile) {
      router.replace('/login');
      return;
    }
    if (profile.role !== 'owner') {
      router.replace(profile.role === 'super_admin' ? '/(admin)/dashboard' : '/(tabs)');
    }
  }, [profile, profileLoading, router]);

  const sidebarItems: SidebarItem[] = [
    { href: '/(owner)/fields', label: 'Kelola Lapangan', icon: 'stadium' },
    { href: '/(owner)/bookings', label: 'Kelola Booking', icon: 'receipt-long' },
    { href: '/(owner)/revenue', label: 'Kelola Pendapatan', icon: 'bar-chart' },
    { href: '/(owner)/profile', label: 'Profile', icon: 'person' },
  ];

  const ownerRoutes = ['/(owner)/fields', '/(owner)/bookings', '/(owner)/revenue', '/(owner)/profile'];
  const activeRoute = ownerRoutes.find(r => pathname.startsWith(r)) || '/(owner)/fields';

  if (isWeb && breakpoint === 'mobile') {
    return (
      <View style={[styles.webRootMobile, { backgroundColor: colors.background }]}>
        <MobileWebHeader
          title="Owner Panel"
          accentColor={colors.primary}
          items={sidebarItems}
          activeRoute={activeRoute}
          onNavigate={(href) => router.push(href as any)}
        />
        <View style={[styles.webContent, { backgroundColor: colors.background }]}>
          <Tabs
            tabBar={() => null}
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textTertiary,
              tabBarLabelStyle: styles.tabLabel,
              tabBarItemStyle: styles.tabItem,
            }}
          >
            <Tabs.Screen
              name="fields"
              options={{
                title: 'Lapangan',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="stadium" size={24} color={color} />
                ),
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen
              name="bookings"
              options={{
                title: 'Booking',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="receipt-long" size={24} color={color} />
                ),
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen
              name="revenue"
              options={{
                title: 'Pendapatan',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="bar-chart" size={24} color={color} />
                ),
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profil',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="person" size={24} color={color} />
                ),
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen name="index" options={{ href: null }} />
          </Tabs>
        </View>
      </View>
    );
  }

  if (isWeb) {
    return (
      <View style={[styles.webRoot, { backgroundColor: colors.background }]}>
        <Sidebar
          title="Owner Panel"
          accentColor={colors.primary}
          items={sidebarItems}
        />
        <View style={[styles.webContent, { backgroundColor: colors.background }]}>
          <Tabs
            tabBar={() => null}
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textTertiary,
              tabBarLabelStyle: styles.tabLabel,
              tabBarItemStyle: styles.tabItem,
            }}
          >
            <Tabs.Screen
              name="fields"
              options={{
                title: 'Lapangan',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="stadium" size={24} color={color} />
                ),
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen
              name="bookings"
              options={{
                title: 'Booking',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="receipt-long" size={24} color={color} />
                ),
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen
              name="revenue"
              options={{
                title: 'Pendapatan',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="bar-chart" size={24} color={color} />
                ),
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profil',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="person" size={24} color={color} />
                ),
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen name="index" options={{ href: null }} />
          </Tabs>
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.outline, height: 64 + insets.bottom, paddingTop: 8, paddingBottom: insets.bottom + 8 }],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="fields"
        options={{
          title: 'Lapangan',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="stadium" size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="receipt-long" size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="revenue"
        options={{
          title: 'Pendapatan',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="bar-chart" size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    flexDirection: 'row',
    height: '100%' as any,
  },
  webRootMobile: {
    flex: 1,
    height: '100%' as any,
  },
  webContent: {
    flex: 1,
  },
  tabBar: {
    borderTopWidth: 0,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 -2px 8px rgba(0,0,0,0.08)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 8 }
    ),
  },
  tabLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabItem: { paddingVertical: 4 },
});
