import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../../lib/auth';
import { API_BASE_URL, DEFAULT_HEADERS } from '../../lib/api';
import { FONTS, SIZES } from '../goalTheme';
import DashboardHeader from '../shared/DashboardHeader';
import ActiveFieldsPage from './ActiveFieldsPage';
import PendingFieldsPage from './PendingFieldsPage';
import TrashedFieldsPage from './TrashedFieldsPage';
import { useTheme, type ThemeColors } from '../../lib/theme';

type Tab = 'active' | 'pending' | 'trashed';

export default function ManageFieldsPage() {
  const { colors } = useTheme();
  const st = makeStyles(colors);
  const [activeTab, setActiveTab] = useState<Tab>('active');

  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [trashedCount, setTrashedCount] = useState<number | null>(null);

  const fetchCounts = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return;
      const headers = { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` };

      const [activeRes, pendingRes, trashedRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/fields?page=1`, { headers }),
        fetch(`${API_BASE_URL}/fields/pending/list?page=1`, { headers }),
        fetch(`${API_BASE_URL}/fields/trashed/list?page=1`, { headers }),
      ]);

      if (activeRes.status === 'fulfilled' && activeRes.value.ok) {
        const d = await activeRes.value.json().catch(() => ({}));
        setActiveCount(d?.meta?.total ?? (d?.data ?? []).length);
      }
      if (pendingRes.status === 'fulfilled' && pendingRes.value.ok) {
        const d = await pendingRes.value.json().catch(() => ({}));
        setPendingCount(d?.meta?.total ?? (d?.data ?? []).length);
      }
      if (trashedRes.status === 'fulfilled' && trashedRes.value.ok) {
        const d = await trashedRes.value.json().catch(() => ({}));
        setTrashedCount(d?.meta?.total ?? (d?.data ?? []).length);
      }
    } catch {}
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const refreshCount = useCallback((tab: Tab) => {
    const fetchers: Record<Tab, () => Promise<void>> = {
      active: async () => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/fields?page=1`, { headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const d = await res.json().catch(() => ({}));
          setActiveCount(d?.meta?.total ?? (d?.data ?? []).length);
        }
      },
      pending: async () => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/fields/pending/list?page=1`, { headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const d = await res.json().catch(() => ({}));
          setPendingCount(d?.meta?.total ?? (d?.data ?? []).length);
        }
      },
      trashed: async () => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/fields/trashed/list?page=1`, { headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const d = await res.json().catch(() => ({}));
          setTrashedCount(d?.meta?.total ?? (d?.data ?? []).length);
        }
      },
    };
    fetchers[tab]();
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    refreshCount(tab);
  };

  const tabs: { key: Tab; label: string; icon: string; count: number | null; badgeActive?: string; badgeText?: string }[] = [
    { key: 'active', label: 'Aktif', icon: 'stadium', count: activeCount, badgeActive: colors.primary + '20', badgeText: colors.primary },
    { key: 'pending', label: 'Pending', icon: 'pending-actions', count: pendingCount, badgeActive: colors.floodlight + '20', badgeText: colors.floodlight },
    { key: 'trashed', label: 'Sampah', icon: 'delete-sweep', count: trashedCount, badgeActive: colors.error + '20', badgeText: colors.error },
  ];

  return (
    <View style={[st.screen, { backgroundColor: colors.background }]}>
      <DashboardHeader title="Kelola Lapangan" subtitle="Kelola semua data lapangan olahraga" />

      <View style={st.tabRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[st.tab, isActive && st.tabActive]}
              onPress={() => handleTabChange(tab.key)}
              activeOpacity={0.75}
            >
              <MaterialIcons name={tab.icon as any} size={15} color={isActive ? colors.primary : colors.textTertiary} />
              <Text style={[st.tabLabel, isActive && st.tabLabelActive]}>{tab.label}</Text>
              {tab.count !== null && tab.count > 0 && (
                <View style={[st.tabBadge, isActive && { backgroundColor: tab.badgeActive }]}>
                  <Text style={[st.tabBadgeText, isActive && { color: tab.badgeText }]}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={st.tabContent}>
        {activeTab === 'active' && <ActiveFieldsPage hideHeader />}
        {activeTab === 'pending' && <PendingFieldsPage hideHeader />}
        {activeTab === 'trashed' && <TrashedFieldsPage />}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1 },

  tabRow: {
    flexDirection: 'row', gap: 10,
    marginHorizontal: SIZES.gutter, marginTop: 10, marginBottom: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 11, borderRadius: 12,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.outline,
  },
  tabActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '60' },
  tabLabel: { ...FONTS.titleSm, color: colors.textTertiary },
  tabLabelActive: { color: colors.primary },
  tabBadge: {
    backgroundColor: colors.surfaceContainerHigh, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center',
  },
  tabBadgeText: { ...FONTS.labelSm, color: colors.textSecondary },

  tabContent: { flex: 1 },
});
