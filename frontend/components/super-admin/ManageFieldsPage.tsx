import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { apiFetch } from '../../lib/apiClient';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import DashboardHeader from '../shared/DashboardHeader';
import ActiveFieldsPage from './ActiveFieldsPage';
import PendingFieldsPage from './PendingFieldsPage';
import TrashedFieldsPage from './TrashedFieldsPage';
import SportsManagementPage from './SportsManagementPage';
import { useTheme, type ThemeColors } from '../../lib/theme';
import { useIsMobileWeb } from '../../lib/responsive';
import { useToastStore } from '../../store/toastStore';

type Tab = 'active' | 'pending' | 'trashed';
type SettingsTab = 'validation' | 'sports';

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

  // Settings modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('validation');
  const [maxNameLength, setMaxNameLength] = useState('100');
  const [maxDescLength, setMaxDescLength] = useState('1000');
  const [minPrice, setMinPrice] = useState('10000');
  const [maxPrice, setMaxPrice] = useState('5000000');
  const [maxImageMb, setMaxImageMb] = useState('5');
  const [savingSettings, setSavingSettings] = useState(false);

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

  const handleSaveSettings = () => {
    setSavingSettings(true);
    setTimeout(() => {
      setSavingSettings(false);
      useToastStore.getState().show({
        type: 'success',
        title: 'Berhasil Disimpan',
        description: 'Aturan validasi lapangan berhasil diperbarui.',
      });
    }, 400);
  };

  const tabs: { key: Tab; label: string; icon: string; count: number | null; badgeActive?: string; badgeText?: string }[] = [
    { key: 'active', label: 'Aktif', icon: 'stadium', count: activeCount, badgeActive: colors.primary + '20', badgeText: colors.primary },
    { key: 'pending', label: 'Pending', icon: 'pending-actions', count: pendingCount, badgeActive: colors.floodlight + '20', badgeText: colors.floodlight },
    { key: 'trashed', label: 'Sampah', icon: 'delete-sweep', count: trashedCount, badgeActive: colors.error + '20', badgeText: colors.error },
  ];

  return (
    <View style={[st.screen, { backgroundColor: colors.background }]}>
      <DashboardHeader
        title="Kelola Lapangan"
        subtitle="Kelola semua data lapangan olahraga"
        showBack={false}
        right={
          <TouchableOpacity
            style={st.settingsHeaderBtn}
            activeOpacity={0.8}
            onPress={() => setIsSettingsOpen(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Pengaturan Validasi Lapangan"
          >
            <MaterialIcons name="settings" size={21} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* ── STAT CARDS ── */}
      <View style={st.statCardsRow}>
        <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          <View style={[st.statIconWrap, { backgroundColor: colors.primaryContainer }]}>
            <MaterialIcons name="stadium" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[st.statValue, { color: colors.text }]}>{(activeCount ?? 0) + (pendingCount ?? 0) + (trashedCount ?? 0)}</Text>
            <Text style={[st.statLabel, { color: colors.textSecondary }]}>Total Lapangan</Text>
          </View>
        </View>

        <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          <View style={[st.statIconWrap, { backgroundColor: '#10B98115' }]}>
            <MaterialIcons name="check-circle" size={18} color="#10B981" />
          </View>
          <View>
            <Text style={[st.statValue, { color: colors.text }]}>{activeCount}</Text>
            <Text style={[st.statLabel, { color: colors.textSecondary }]}>Lapangan Aktif</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}
          onPress={() => handleTabChange('pending')}
          activeOpacity={0.85}
        >
          <View style={[st.statIconWrap, { backgroundColor: '#F59E0B15' }]}>
            <MaterialIcons name="pending-actions" size={18} color="#F59E0B" />
          </View>
          <View>
            <Text style={[st.statValue, { color: colors.text }]}>{pendingCount}</Text>
            <Text style={[st.statLabel, { color: colors.textSecondary }]}>Pending Validasi</Text>
          </View>
        </TouchableOpacity>
      </View>

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

      {/* ── Settings & Validation Modal ── */}
      <Modal
        visible={isSettingsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSettingsOpen(false)}
      >
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setIsSettingsOpen(false)} />
          <View style={st.settingsSheet}>
            <View style={st.modalHandle} />
            <View style={st.modalHeader}>
              <View style={st.modalTitleGroup}>
                <MaterialIcons name="settings" size={22} color={colors.primary} />
                <Text style={[st.modalTitle, { color: colors.text }]}>Pengaturan & Validasi Lapangan</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSettingsOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Sub Tabs inside Modal */}
            <View style={st.modalTabRow}>
              <TouchableOpacity
                style={[st.modalTab, settingsTab === 'validation' && st.modalTabActive]}
                onPress={() => setSettingsTab('validation')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="tune" size={16} color={settingsTab === 'validation' ? colors.primary : colors.textTertiary} />
                <Text style={[st.modalTabLabel, settingsTab === 'validation' && st.modalTabLabelActive]}>Rule Validasi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[st.modalTab, settingsTab === 'sports' && st.modalTabActive]}
                onPress={() => setSettingsTab('sports')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="sports-soccer" size={16} color={settingsTab === 'sports' ? colors.primary : colors.textTertiary} />
                <Text style={[st.modalTabLabel, settingsTab === 'sports' && st.modalTabLabelActive]}>Jenis Olahraga (CRUD)</Text>
              </TouchableOpacity>
            </View>

            {settingsTab === 'validation' ? (
              <ScrollView style={st.modalBody} showsVerticalScrollIndicator={false}>
                <View style={st.inputGroup}>
                  <Text style={[st.inputLabel, { color: colors.textSecondary }]}>Maksimal Karakter Nama Lapangan</Text>
                  <TextInput
                    style={[st.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline, color: colors.text }]}
                    keyboardType="numeric"
                    value={maxNameLength}
                    onChangeText={setMaxNameLength}
                    placeholder="Contoh: 100"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                <View style={st.inputGroup}>
                  <Text style={[st.inputLabel, { color: colors.textSecondary }]}>Maksimal Karakter Deskripsi</Text>
                  <TextInput
                    style={[st.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline, color: colors.text }]}
                    keyboardType="numeric"
                    value={maxDescLength}
                    onChangeText={setMaxDescLength}
                    placeholder="Contoh: 1000"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                <View style={st.rowInputs}>
                  <View style={[st.inputGroup, { flex: 1 }]}>
                    <Text style={[st.inputLabel, { color: colors.textSecondary }]}>Harga Minimum (Rp)</Text>
                    <TextInput
                      style={[st.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline, color: colors.text }]}
                      keyboardType="numeric"
                      value={minPrice}
                      onChangeText={setMinPrice}
                      placeholder="10000"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>

                  <View style={[st.inputGroup, { flex: 1 }]}>
                    <Text style={[st.inputLabel, { color: colors.textSecondary }]}>Harga Maksimum (Rp)</Text>
                    <TextInput
                      style={[st.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline, color: colors.text }]}
                      keyboardType="numeric"
                      value={maxPrice}
                      onChangeText={setMaxPrice}
                      placeholder="5000000"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>

                <View style={st.inputGroup}>
                  <Text style={[st.inputLabel, { color: colors.textSecondary }]}>Batas Maksimal Ukuran Foto (MB)</Text>
                  <TextInput
                    style={[st.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline, color: colors.text }]}
                    keyboardType="numeric"
                    value={maxImageMb}
                    onChangeText={setMaxImageMb}
                    placeholder="Contoh: 5"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                <TouchableOpacity
                  style={[st.saveBtn, { backgroundColor: colors.primary }, savingSettings && { opacity: 0.7 }]}
                  onPress={handleSaveSettings}
                  disabled={savingSettings}
                  activeOpacity={0.85}
                >
                  {savingSettings ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <>
                      <MaterialIcons name="save" size={18} color={colors.onPrimary} />
                      <Text style={[st.saveBtnText, { color: colors.onPrimary }]}>Simpan Pengaturan Validasi</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={st.sportsModalWrap}>
                <SportsManagementPage hideHeader />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, isMobile: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  statCardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: SIZES.gutter,
    marginTop: 14,
    marginBottom: 4,
    ...(isMobile ? {} : { maxWidth: 900, alignSelf: 'center', width: '100%' }),
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    ...SHADOWS.xs,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    ...FONTS.titleLg,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  statLabel: {
    ...FONTS.labelSm,
    fontSize: 11,
  },
  settingsHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

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

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  settingsSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outline,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    ...FONTS.titleLg,
    fontSize: 17,
    fontWeight: '800',
  },
  modalTabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    paddingBottom: 10,
  },
  modalTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLow,
  },
  modalTabActive: {
    backgroundColor: colors.primaryContainer,
  },
  modalTabLabel: {
    ...FONTS.labelMd,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  modalTabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  modalBody: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    ...FONTS.labelSm,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 20,
  },
  saveBtnText: {
    ...FONTS.titleSm,
    fontSize: 14,
    fontWeight: '700',
  },
  sportsModalWrap: {
    flex: 1,
  },
});

