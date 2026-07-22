import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfileStore } from '../../store/profileStore';
import { TOKEN_KEY } from '../_layout';
import { API_BASE_URL } from '../../lib/api';
import { useTheme } from '../../lib/theme';

export default function AdminTabLayout() {
  const profile = useProfileStore((s) => s.profile);
  const { colors } = useTheme();
  const role = profile?.role || '';
  const isSuperAdmin = role === 'super_admin';

  const [ownerRequestBadge, setOwnerRequestBadge] = useState<number | undefined>(undefined);
  const [pendingFieldsBadge, setPendingFieldsBadge] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) return;
        const headers = {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        };

        const reqRes = await fetch(`${API_BASE_URL}/owner-requests/pending`, { headers });
        if (reqRes.ok) {
          const reqData = await reqRes.json().catch(() => ({}));
          const count = (reqData?.data ?? []).length;
          setOwnerRequestBadge(count > 0 ? count : undefined);
        }

        if (isSuperAdmin) {
          const fieldsRes = await fetch(`${API_BASE_URL}/fields/pending/list`, { headers });
          if (fieldsRes.ok) {
            const fieldsData = await fieldsRes.json().catch(() => ({}));
            const count = (fieldsData?.data ?? []).length;
            setPendingFieldsBadge(count > 0 ? count : undefined);
          }
        }
      } catch {}
    };
    fetchBadges();
  }, [isSuperAdmin]);

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
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="owner-requests"
        options={{
          title: 'Pengajuan',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="inventory" size={24} color={color} />
          ),
          tabBarBadge: ownerRequestBadge,
          tabBarBadgeStyle: ownerRequestBadge ? styles.badge : undefined,
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="pending-fields"
        options={{
          title: 'Lapangan',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="stadium" size={24} color={color} />
          ),
          href: isSuperAdmin ? undefined : null,
          tabBarBadge: isSuperAdmin ? pendingFieldsBadge : undefined,
          tabBarBadgeStyle: isSuperAdmin && pendingFieldsBadge ? styles.badge : undefined,
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
      {/* Hide legacy screens */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    fontFamily: 'Montserrat',
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
