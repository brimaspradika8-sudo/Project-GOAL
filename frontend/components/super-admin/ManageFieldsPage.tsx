import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { apiFetch } from '../../lib/apiClient';
import { FONTS, SIZES } from '../goalTheme';
import DashboardHeader from '../shared/DashboardHeader';
import ActiveFieldsPage from './ActiveFieldsPage';
import PendingFieldsPage from './PendingFieldsPage';
import TrashedFieldsPage from './TrashedFieldsPage';
import { useTheme, type ThemeColors } from '../../lib/theme';
import { useIsMobileWeb } from '../../lib/responsive';

type Tab = 'active' | 'pending' | 'trashed';

export default function ManageFieldsPage() {
  const { colors } = useTheme();
  const isMobile = useIsMobileWeb();
  const st = makeStyles(colors, isMobile);
  const params = useLocalSearchParams<{ tab?: string }>();
  const tabParam = params.tab;

  const validTab = (t?: string): t is Tab => t === 'active' || t === 'pending' || t === 'trashed';
  const [activeTab, setActiveTab] = useState<Tab>(validTab(tabParam) ? tabParam : 'active');

  useEffect(() => {
    if (validTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [trashedCount, setTrashedCount] = useState<number | null>(null);

  const fetchCounts = useCallback(async () => {
    try {
      const [activeRes, pendingRes, trashedRes] = await Promise.allSettled([
        apiFetch('/fields', { params: { page: '1' } }),
        apiFetch('/fields/pending/list', { params: { page: '1' } }),
        apiFetch('/fields/trashed/list', { params: { page: '1' } }),
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
        const res = await apiFetch('/fields', { params: { page: '1' } });
        if (res.ok) {
          const d = await res.json().catch(() => ({}));
          setActiveCount(d?.meta?.total ?? (d?.data ?? []).length);
        }
      },
      pending: async () => {
        const res = await apiFetch('/fields/pending/list', { params: { page: '1' } });
        if (res.ok) {
          const d = await res.json().catch(() => ({}));
          setPendingCount(d?.meta?.total ?? (d?.data ?? []).length);
        }
      },
      trashed: async () => {
        const res = await apiFetch('/fields/trashed/list', { params: { page: '1' } });
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
      <DashboardHeader title="Kelola Lapangan" subtitle="Kelola semua data lapangan olahraga" showBack={false} />

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

const makeStyles = (colors: ThemeColors, isMobile: boolean) => StyleSheet.create({
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
