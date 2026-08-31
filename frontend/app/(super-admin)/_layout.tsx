import { Tabs, usePathname, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '../../store/profileStore';
import { USER_ROLES } from '../../types/roles';
import { useTheme } from '../../lib/theme';
import { apiFetch } from '../../lib/apiClient';
import { FONT_FAMILY } from '../../components/goalTheme';
import Sidebar, { isSidebarRouteActive, SidebarItem } from '../../components/web/Sidebar';
import MobileWebHeader from '../../components/web/MobileWebHeader';
import { useBreakpoint } from '../../lib/responsive';

export default function AdminTabLayout() {
  const profile = useProfileStore((s) => s.profile);
  const profileLoading = useProfileStore((s) => s.loading);
  const { colors } = useTheme();
  const role = profile?.role || '';
  const isSuperAdmin = role === USER_ROLES.SUPER_ADMIN;
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
    if (profile.role !== USER_ROLES.SUPER_ADMIN) {
      router.replace(profile.role === USER_ROLES.OWNER ? '/(owner)' : '/(tabs)');
    }
  }, [profile, profileLoading, router]);

  const [ownerRequestBadge, setOwnerRequestBadge] = useState<number | undefined>(undefined);
  const [manageFieldsBadge, setManageFieldsBadge] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const reqRes = await apiFetch('/owner-requests/pending');
        if (reqRes.ok) {
          const reqData = await reqRes.json().catch(() => ({}));
          const count = (reqData?.data ?? []).length;
          setOwnerRequestBadge(count > 0 ? count : undefined);
        }

        if (isSuperAdmin) {
          const fieldsRes = await apiFetch('/fields/pending/list');
          if (fieldsRes.ok) {
            const fieldsData = await fieldsRes.json().catch(() => ({}));
            const count = (fieldsData?.data ?? []).length;
            setManageFieldsBadge(count > 0 ? count : undefined);
          }
        }
      } catch {}
    };
    fetchBadges();
  }, [isSuperAdmin]);

  const sidebarItems: SidebarItem[] = [
    { href: '/(super-admin)/users', label: 'Kelola Pengguna', icon: 'people-alt', badge: ownerRequestBadge, section: 'MANAJEMEN' },
    ...(isSuperAdmin ? [
      { href: '/(super-admin)/manage-fields', label: 'Kelola Lapangan', icon: 'stadium', badge: manageFieldsBadge, section: 'MANAJEMEN' },
      { href: '/(super-admin)/sports', label: 'Jenis Olahraga', icon: 'sports-soccer', section: 'MANAJEMEN' },
    ] : []),
    { href: '/(super-admin)/help-center', label: 'Pusat Bantuan', icon: 'help-outline', section: 'DUKUNGAN' },
    { href: '/(super-admin)/profile', label: 'Profil Admin', icon: 'person', section: 'AKUN' },
  ];

  const activeRoute = sidebarItems.find((item) => isSidebarRouteActive(pathname, item.href))?.href || '/(super-admin)/users';

  if (isWeb && breakpoint === 'mobile') {
    return (
      <View style={[styles.webRootMobile, { backgroundColor: colors.background }]}>
        <MobileWebHeader
          title="Super admin panel"
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
              name="users"
              options={{
                title: 'Pengguna',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="people-alt" size={24} color={color} />
                ),
                tabBarBadge: ownerRequestBadge,
                tabBarBadgeStyle: ownerRequestBadge ? styles.badge : undefined,
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen
              name="owner-requests"
              options={{
                href: null,
              }}
            />
            <Tabs.Screen
              name="manage-fields"
              options={{
                title: 'Lapangan',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="stadium" size={24} color={color} />
                ),
                href: isSuperAdmin ? undefined : null,
                tabBarBadge: isSuperAdmin ? manageFieldsBadge : undefined,
                tabBarBadgeStyle: isSuperAdmin && manageFieldsBadge ? styles.badge : undefined,
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen
              name="sports"
              options={{
                href: null,
              }}
            />
            <Tabs.Screen
              name="audit-logs"
              options={{
                href: null,
              }}
            />
            <Tabs.Screen
              name="help-center"
              options={{
                href: null,
              }}
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
            <Tabs.Screen name="dashboard" options={{ href: null }} />
          </Tabs>
        </View>
      </View>
    );
  }

  if (isWeb) {
    return (
      <View style={[styles.webRoot, { backgroundColor: colors.background }]}>
        <Sidebar
          title="Super admin panel"
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
              name="users"
              options={{
                title: 'Pengguna',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="people-alt" size={24} color={color} />
                ),
                tabBarBadge: ownerRequestBadge,
                tabBarBadgeStyle: ownerRequestBadge ? styles.badge : undefined,
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen
              name="owner-requests"
              options={{
                href: null,
              }}
            />
            <Tabs.Screen
              name="manage-fields"
              options={{
                title: 'Lapangan',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="stadium" size={24} color={color} />
                ),
                href: isSuperAdmin ? undefined : null,
                tabBarBadge: isSuperAdmin ? manageFieldsBadge : undefined,
                tabBarBadgeStyle: isSuperAdmin && manageFieldsBadge ? styles.badge : undefined,
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen
              name="sports"
              options={{
                href: null,
              }}
            />
            <Tabs.Screen
              name="audit-logs"
              options={{
                href: null,
              }}
            />
            <Tabs.Screen
              name="help-center"
              options={{
                title: 'Pusat Bantuan',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="help-outline" size={24} color={color} />
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
            <Tabs.Screen name="dashboard" options={{ href: null }} />
          </Tabs>
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.outline }],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="users"
        options={{
          title: 'Pengguna',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="people-alt" size={24} color={color} />
          ),
          tabBarBadge: ownerRequestBadge,
          tabBarBadgeStyle: ownerRequestBadge ? styles.badge : undefined,
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="owner-requests"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="manage-fields"
        options={{
          title: 'Lapangan',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="stadium" size={24} color={color} />
          ),
          href: isSuperAdmin ? undefined : null,
          tabBarBadge: isSuperAdmin ? manageFieldsBadge : undefined,
          tabBarBadgeStyle: isSuperAdmin && manageFieldsBadge ? styles.badge : undefined,
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="sports"
        options={{
          title: 'Olahraga',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="sports-soccer" size={24} color={color} />
          ),
          href: isSuperAdmin ? undefined : null,
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
      <Tabs.Screen name="dashboard" options={{ href: null }} />
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
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
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
  badge: {
    backgroundColor: '#E0533D',
    fontSize: 10,
    minWidth: 16,
    height: 16,
  },
});
