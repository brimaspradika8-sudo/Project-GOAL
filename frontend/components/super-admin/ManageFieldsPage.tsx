import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useFieldValidationSettingsStore } from '../../store/fieldValidationSettingsStore';
import { type FieldValidationSettings } from '../../lib/fieldValidationSettings';

type ValidationErrors = {
  max_name_length: string; max_description_length: string;
  min_price: string; max_price: string; max_image_mb: string;
};
const EMPTY_VERRS: ValidationErrors = { max_name_length: '', max_description_length: '', min_price: '', max_price: '', max_image_mb: '' };

function validateSettings(maxN: string, maxD: string, minP: string, maxP: string, maxI: string): ValidationErrors {
  const e = { ...EMPTY_VERRS };
  const name = parseInt(maxN, 10);
  if (!maxN || isNaN(name)) e.max_name_length = 'Wajib diisi.';
  else if (name < 5) e.max_name_length = 'Minimal 5 karakter.';
  else if (name > 255) e.max_name_length = 'Maksimal 255 karakter.';
  const desc = parseInt(maxD, 10);
  if (!maxD || isNaN(desc)) e.max_description_length = 'Wajib diisi.';
  else if (desc < 10) e.max_description_length = 'Minimal 10 karakter.';
  else if (desc > 5000) e.max_description_length = 'Maksimal 5000 karakter.';
  const minV = parseInt(minP, 10);
  if (!minP || isNaN(minV)) e.min_price = 'Wajib diisi.';
  else if (minV < 0) e.min_price = 'Tidak boleh negatif.';
  const maxV = parseInt(maxP, 10);
  if (!maxP || isNaN(maxV)) e.max_price = 'Wajib diisi.';
  else if (!isNaN(minV) && maxV <= minV) e.max_price = 'Harus lebih besar dari harga minimum.';
  const imgMb = parseInt(maxI, 10);
  if (!maxI || isNaN(imgMb)) e.max_image_mb = 'Wajib diisi.';
  else if (imgMb < 1) e.max_image_mb = 'Minimal 1 MB.';
  else if (imgMb > 20) e.max_image_mb = 'Maksimal 20 MB.';
  return e;
}
function hasVErrors(e: ValidationErrors) { return Object.values(e).some(v => v !== ''); }

type Tab = 'active' | 'pending' | 'trashed';
type SettingsTab = 'validation' | 'sports';

export default function ManageFieldsPage() {
  const { colors } = useTheme();
  const isMobile = useIsMobileWeb();
  const st = useMemo(() => makeStyles(colors, isMobile), [colors, isMobile]);
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

  // Validation settings state from store
  const { settings: globalSettings, fetchSettings, updateSettings } = useFieldValidationSettingsStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('validation');
  const [maxNameLength, setMaxNameLength] = useState(String(globalSettings.max_name_length));
  const [maxDescLength, setMaxDescLength] = useState(String(globalSettings.max_description_length));
  const [minPrice, setMinPrice] = useState(String(globalSettings.min_price));
  const [maxPrice, setMaxPrice] = useState(String(globalSettings.max_price));
  const [maxImageMb, setMaxImageMb] = useState(String(globalSettings.max_image_mb));
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(EMPTY_VERRS);
  const [touchedSettings, setTouchedSettings] = useState(false);

  const applySettingsToForm = useCallback((s: FieldValidationSettings) => {
    if (s.max_name_length) setMaxNameLength(String(s.max_name_length));
    if (s.max_description_length) setMaxDescLength(String(s.max_description_length));
    if (s.min_price !== undefined) setMinPrice(String(s.min_price));
    if (s.max_price !== undefined) setMaxPrice(String(s.max_price));
    if (s.max_image_mb) setMaxImageMb(String(s.max_image_mb));
  }, []);

  const loadSettings = useCallback((force = false) => {
    setLoadingSettings(true);
    fetchSettings(force)
      .then((s) => {
        if (s) applySettingsToForm(s);
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, [fetchSettings, applySettingsToForm]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

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

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(() => {
      fetchCounts();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

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

  const handleChange = (setter: (v: string) => void, field: keyof ValidationErrors, value: string) => {
    setter(value);
    if (touchedSettings) {
      const n = { n: field === 'max_name_length' ? value : maxNameLength, d: field === 'max_description_length' ? value : maxDescLength, minP: field === 'min_price' ? value : minPrice, maxP: field === 'max_price' ? value : maxPrice, i: field === 'max_image_mb' ? value : maxImageMb };
      setValidationErrors(validateSettings(n.n, n.d, n.minP, n.maxP, n.i));
    }
  };

  const handleSaveSettings = async () => {
    setTouchedSettings(true);
    const errs = validateSettings(maxNameLength, maxDescLength, minPrice, maxPrice, maxImageMb);
    setValidationErrors(errs);
    if (hasVErrors(errs)) { setSettingsError('Periksa kembali isian yang belum valid.'); return; }
    setSettingsError(null);
    setSavingSettings(true);
    try {
      await updateSettings({
        max_name_length: parseInt(maxNameLength, 10),
        max_description_length: parseInt(maxDescLength, 10),
        min_price: parseInt(minPrice, 10),
        max_price: parseInt(maxPrice, 10),
        max_image_mb: parseInt(maxImageMb, 10),
      });
      useToastStore.getState().show({ type: 'success', title: 'Berhasil Disimpan', description: 'Aturan validasi lapangan berhasil diperbarui.' });
      setIsSettingsOpen(false); setTouchedSettings(false); setValidationErrors(EMPTY_VERRS);
    } catch (err: any) {
      const msg = err.message || 'Gagal menyimpan aturan validasi.';
      setSettingsError(msg);
      useToastStore.getState().show({ type: 'error', title: 'Gagal Menyimpan', description: msg });
    } finally { setSavingSettings(false); }
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false); setTouchedSettings(false); setSettingsError(null);
    setValidationErrors(EMPTY_VERRS); loadSettings();
  };

  const tabs: { key: Tab; label: string; icon: string; count: number | null }[] = [
    { key: 'active', label: 'Aktif', icon: 'stadium', count: activeCount },
    { key: 'pending', label: 'Pending', icon: 'pending-actions', count: pendingCount },
    { key: 'trashed', label: 'Sampah', icon: 'delete-sweep', count: trashedCount },
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
          <View style={st.statCardHead}>
            <View style={[st.statIconWrap, { backgroundColor: colors.primaryContainer }]}>
              <MaterialIcons name="stadium" size={18} color={colors.primary} />
            </View>
            <Text style={[st.statValue, { color: colors.text }]}>{(activeCount ?? 0) + (pendingCount ?? 0) + (trashedCount ?? 0)}</Text>
          </View>
          <Text style={[st.statLabel, { color: colors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Total Lapangan</Text>
        </View>

        <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          <View style={st.statCardHead}>
            <View style={[st.statIconWrap, { backgroundColor: '#10B98118' }]}>
              <MaterialIcons name="check-circle" size={18} color="#10B981" />
            </View>
            <Text style={[st.statValue, { color: colors.text }]}>{activeCount ?? 0}</Text>
          </View>
          <Text style={[st.statLabel, { color: colors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Lapangan Aktif</Text>
        </View>

        <TouchableOpacity
          style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}
          onPress={() => handleTabChange('pending')}
          activeOpacity={0.85}
        >
          <View style={st.statCardHead}>
            <View style={[st.statIconWrap, { backgroundColor: '#F59E0B18' }]}>
              <MaterialIcons name="pending-actions" size={18} color="#F59E0B" />
            </View>
            <Text style={[st.statValue, { color: colors.text }]}>{pendingCount ?? 0}</Text>
          </View>
          <Text style={[st.statLabel, { color: colors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Pending Validasi</Text>
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
              activeOpacity={0.8}
            >
              <MaterialIcons name={tab.icon as any} size={16} color={isActive ? colors.primary : colors.textTertiary} />
              <Text style={[st.tabLabel, isActive && st.tabLabelActive]}>{tab.label}</Text>
              {tab.count !== null && tab.count > 0 && (
                <View style={[st.tabBadge, isActive && st.tabBadgeActive]}>
                  <Text style={[st.tabBadgeText, isActive && { color: colors.primary }]}>{tab.count}</Text>
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

      {/* ── Settings Modal ── */}
      <Modal visible={isSettingsOpen} transparent animationType="slide" onRequestClose={handleCloseSettings}>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={handleCloseSettings} />
          <View style={[st.settingsSheet, { backgroundColor: colors.surface }]}>
            <View style={[st.modalHandle, { backgroundColor: colors.outline }]} />
            {/* Header */}
            <View style={st.modalHeader}>
              <View style={st.modalTitleGroup}>
                <View style={[st.modalIconBg, { backgroundColor: colors.primaryContainer }]}>
                  <MaterialIcons name="settings" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[st.modalTitle, { color: colors.text }]}>Pengaturan Validasi</Text>
                  <Text style={[st.modalSubtitle, { color: colors.textSecondary }]}>Konfigurasi aturan input lapangan</Text>
                </View>
              </View>
              <TouchableOpacity style={[st.modalCloseBtn, { backgroundColor: colors.surfaceContainerLow }]} onPress={handleCloseSettings} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {/* Sub Tabs */}
            <View style={[st.modalTabRow, { borderBottomColor: colors.outline }]}>
              <TouchableOpacity style={[st.modalTab, settingsTab === 'validation' && [st.modalTabActive, { borderColor: colors.primary }]]} onPress={() => setSettingsTab('validation')} activeOpacity={0.8}>
                <MaterialIcons name="tune" size={15} color={settingsTab === 'validation' ? colors.primary : colors.textTertiary} />
                <Text style={[st.modalTabLabel, { color: settingsTab === 'validation' ? colors.primary : colors.textTertiary }]}>Rule Validasi</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.modalTab, settingsTab === 'sports' && [st.modalTabActive, { borderColor: colors.primary }]]} onPress={() => setSettingsTab('sports')} activeOpacity={0.8}>
                <MaterialIcons name="sports-soccer" size={15} color={settingsTab === 'sports' ? colors.primary : colors.textTertiary} />
                <Text style={[st.modalTabLabel, { color: settingsTab === 'sports' ? colors.primary : colors.textTertiary }]}>Jenis Olahraga</Text>
              </TouchableOpacity>
            </View>
            {settingsTab === 'validation' ? (
              <ScrollView style={st.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {loadingSettings ? (
                  <View style={st.loadingWrap}><ActivityIndicator size="small" color={colors.primary} /><Text style={[st.loadingText, { color: colors.textSecondary }]}>Memuat pengaturan...</Text></View>
                ) : (
                  <>
                    {settingsError ? (
                      <View style={[st.errorBanner, { backgroundColor: colors.errorContainer, borderColor: colors.error + '50' }]}>
                        <MaterialIcons name="error-outline" size={16} color={colors.error} />
                        <Text style={[st.errorBannerText, { color: colors.error }]}>{settingsError}</Text>
                      </View>
                    ) : null}
                    {/* Teks Section */}
                    <View style={[st.sectionCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline }]}>
                      <View style={[st.sectionHeader, { borderBottomColor: colors.outline }]}>
                        <MaterialIcons name="text-fields" size={16} color={colors.primary} />
                        <Text style={[st.sectionTitle, { color: colors.text }]}>Panjang Teks</Text>
                      </View>
                      <SettingInput label="Maks. Karakter Nama" hint="Batas: 5 - 255 karakter" icon="badge"
                        value={maxNameLength} error={validationErrors.max_name_length}
                        onChangeText={(v) => handleChange(setMaxNameLength, 'max_name_length', v)} colors={colors} st={st} />
                      <SettingInput label="Maks. Karakter Deskripsi" hint="Batas: 10 - 5000 karakter" icon="notes"
                        value={maxDescLength} error={validationErrors.max_description_length}
                        onChangeText={(v) => handleChange(setMaxDescLength, 'max_description_length', v)} colors={colors} st={st} />
                    </View>
                    {/* Harga Section */}
                    <View style={[st.sectionCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline }]}>
                      <View style={[st.sectionHeader, { borderBottomColor: colors.outline }]}>
                        <MaterialIcons name="payments" size={16} color={colors.primary} />
                        <Text style={[st.sectionTitle, { color: colors.text }]}>Rentang Harga (Rp)</Text>
                      </View>
                      <View style={st.rowInputs}>
                        <View style={{ flex: 1 }}>
                          <SettingInput label="Harga Minimum" hint="Min: Rp 0" icon="arrow-downward"
                            value={minPrice} error={validationErrors.min_price}
                            onChangeText={(v) => handleChange(setMinPrice, 'min_price', v)} colors={colors} st={st} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <SettingInput label="Harga Maksimum" hint="Harus > harga minimum" icon="arrow-upward"
                            value={maxPrice} error={validationErrors.max_price}
                            onChangeText={(v) => handleChange(setMaxPrice, 'max_price', v)} colors={colors} st={st} />
                        </View>
                      </View>
                    </View>
                    {/* Foto Section */}
                    <View style={[st.sectionCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline }]}>
                      <View style={[st.sectionHeader, { borderBottomColor: colors.outline }]}>
                        <MaterialIcons name="photo-camera" size={16} color={colors.primary} />
                        <Text style={[st.sectionTitle, { color: colors.text }]}>Batas Foto</Text>
                      </View>
                      <SettingInput label="Ukuran Maks. Foto" hint="Batas: 1 - 20 MB" icon="photo-size-select-large"
                        value={maxImageMb} error={validationErrors.max_image_mb}
                        onChangeText={(v) => handleChange(setMaxImageMb, 'max_image_mb', v)} colors={colors} st={st} />
                    </View>
                    <TouchableOpacity style={[st.saveBtn, { backgroundColor: colors.primary }, savingSettings && { opacity: 0.7 }]} onPress={handleSaveSettings} disabled={savingSettings} activeOpacity={0.85}>
                      {savingSettings
                        ? <ActivityIndicator size="small" color={colors.onPrimary} />
                        : <><MaterialIcons name="save" size={18} color={colors.onPrimary} /><Text style={[st.saveBtnText, { color: colors.onPrimary }]}>Simpan Pengaturan</Text></>
                      }
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            ) : (
              <View style={st.sportsModalWrap}><SportsManagementPage hideHeader /></View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Sub-component ────────────────────────────────────────────────────────────
function SettingInput({ label, hint, icon, value, error, onChangeText, colors, st }: {
  label: string; hint: string; icon: string; value: string; error: string;
  onChangeText: (v: string) => void; colors: ThemeColors; st: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={st.inputGroup}>
      <Text style={[st.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[st.inputWrap, { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.outline }]}>
        <MaterialIcons name={icon as any} size={16} color={error ? colors.error : colors.textTertiary} style={st.inputIcon} />
        <TextInput style={[st.input, { color: colors.text }]} keyboardType="numeric" value={value} onChangeText={onChangeText} placeholder="—" placeholderTextColor={colors.textTertiary} />
      </View>
      {error ? <Text style={[st.inputError, { color: colors.error }]}>{error}</Text> : <Text style={[st.inputHint, { color: colors.textTertiary }]}>{hint}</Text>}
    </View>
  );
}

const makeStyles = (colors: ThemeColors, isMobile: boolean) => StyleSheet.create({
  screen: { flex: 1 },
  statCardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: SIZES.gutter,
    marginTop: 14,
    marginBottom: 6,
    ...(isMobile ? {} : { maxWidth: 1200, alignSelf: 'center', width: '100%' }),
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  statCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    ...FONTS.titleLg,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    ...FONTS.labelSm,
    fontSize: 11,
    fontWeight: '600',
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
    flexDirection: 'row',
    padding: 5,
    marginHorizontal: SIZES.gutter,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outline,
    ...SHADOWS.xs,
    ...(isMobile ? {} : { maxWidth: 1200, alignSelf: 'center', width: '100%' }),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: colors.surfaceWhite,
    ...SHADOWS.sm,
  },
  tabLabel: {
    ...FONTS.titleSm,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  tabBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: colors.primaryContainer,
  },
  tabBadgeText: {
    ...FONTS.labelSm,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  tabContent: { flex: 1 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  settingsSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: isMobile ? 16 : 28, paddingTop: 14, paddingBottom: 8,
    maxHeight: '92%', maxWidth: isMobile ? undefined : 680, width: '100%', alignSelf: 'center', flex: 1, ...SHADOWS.lg,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  modalIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { ...FONTS.titleLg, fontSize: 16, fontWeight: '800' },
  modalSubtitle: { ...FONTS.labelSm, fontSize: 11, marginTop: 1 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalTabRow: { flexDirection: 'row', gap: 8, marginBottom: 16, borderBottomWidth: 1, paddingBottom: 12 },
  modalTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: colors.surfaceContainerLow },
  modalTabActive: { backgroundColor: colors.primaryContainer },
  modalTabLabel: { ...FONTS.labelMd, fontWeight: '600', fontSize: 13 },
  modalBody: { flex: 1 },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 32 },
  loadingText: { ...FONTS.labelMd, fontSize: 13 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  errorBannerText: { ...FONTS.labelMd, fontSize: 13, flex: 1 },
  sectionCard: { borderRadius: 16, borderWidth: 1, padding: isMobile ? 14 : 18, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1 },
  sectionTitle: { ...FONTS.titleSm, fontSize: 13, fontWeight: '700' },
  inputGroup: { marginBottom: 12 },
  inputLabel: { ...FONTS.labelSm, fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, overflow: 'hidden' },
  inputIcon: { paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 11, paddingRight: 14, fontSize: 14, fontWeight: '600' },
  inputError: { ...FONTS.labelSm, fontSize: 11, marginTop: 4, fontWeight: '600' },
  inputHint: { ...FONTS.labelSm, fontSize: 11, marginTop: 4 },
  rowInputs: { flexDirection: 'row', gap: 10 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 16, marginTop: 4, marginBottom: 20,
  },
  saveBtnText: { ...FONTS.titleSm, fontSize: 15, fontWeight: '700' },
  sportsModalWrap: {
    flex: 1,
  },
});

