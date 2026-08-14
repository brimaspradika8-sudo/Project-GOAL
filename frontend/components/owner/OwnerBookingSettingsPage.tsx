import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DashboardHeader from '../shared/DashboardHeader';
import AlertBox from '../shared/AlertBox';
import ConfirmDialog from '../shared/ConfirmDialog';
import { FONTS, SHADOWS, SIZES } from '../goalTheme';
import { useTheme, type ThemeColors } from '../../lib/theme';
import { apiFetch } from '../../lib/apiClient';
import { getErrorMessage } from '../../lib/api';
import { useToastStore } from '../../store/toastStore';
import { useIsMobileWeb } from '../../lib/responsive';

type FieldPrice = {
  id: number;
  field_id: number;
  start_time: string;
  end_time: string;
  price: number;
};

type OwnerField = {
  id: number;
  name: string;
  location?: string | null;
  status: string;
  open_time?: string | null;
  close_time?: string | null;
  session_duration_minutes?: number | null;
  buffer_duration_minutes?: number | null;
  prices?: FieldPrice[];
};

type PriceForm = {
  start_time: string;
  end_time: string;
  price: string;
};

const SESSION_OPTIONS = [30, 60, 90, 120];
const BUFFER_OPTIONS = [0, 15, 30, 45];
const DEFAULT_PRICE_FORM: PriceForm = { start_time: '07:00', end_time: '17:00', price: '' };

export default function OwnerBookingSettingsPage() {
  const { colors } = useTheme();
  const st = makeStyles(colors);
  const isMobile = useIsMobileWeb();
  const [fields, setFields] = useState<OwnerField[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceModal, setPriceModal] = useState<{ fieldId: number; price?: FieldPrice } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FieldPrice | null>(null);
  const [priceForm, setPriceForm] = useState<PriceForm>(DEFAULT_PRICE_FORM);
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedId) ?? fields[0] ?? null,
    [fields, selectedId],
  );

  const [schedule, setSchedule] = useState({
    open_time: '07:00',
    close_time: '23:00',
    session_duration_minutes: 60,
    buffer_duration_minutes: 0,
  });

  const loadFields = useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch('/fields/my/list');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(getErrorMessage(data, 'Gagal memuat konfigurasi lapangan.'));
        return;
      }
      const loadedFields = Array.isArray(data?.data) ? data.data : [];
      setFields(loadedFields);
      setSelectedId((current) => current ?? loadedFields[0]?.id ?? null);
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadFields(); }, [loadFields]);

  useEffect(() => {
    if (!selectedField) return;
    setSchedule({
      open_time: selectedField.open_time ?? '07:00',
      close_time: selectedField.close_time ?? '23:00',
      session_duration_minutes: selectedField.session_duration_minutes ?? 60,
      buffer_duration_minutes: selectedField.buffer_duration_minutes ?? 0,
    });
  }, [selectedField]);

  const refresh = () => {
    setRefreshing(true);
    loadFields();
  };

  const updateSelectedField = (updated: OwnerField) => {
    setFields((current) => current.map((field) => field.id === updated.id ? updated : field));
  };

  const saveSchedule = async () => {
    if (!selectedField) return;
    setScheduleSaving(true);
    setError(null);
    try {
      const res = await apiFetch(`/owner/fields/${selectedField.id}/schedule`, {
        method: 'PATCH',
        body: schedule,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(getErrorMessage(data, 'Gagal menyimpan jadwal.'));
        return;
      }
      updateSelectedField(data.data);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Konfigurasi jadwal disimpan.' });
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const openPriceModal = (fieldId: number, price?: FieldPrice) => {
    setPriceModal({ fieldId, price });
    setPriceForm(price ? {
      start_time: price.start_time,
      end_time: price.end_time,
      price: String(price.price),
    } : DEFAULT_PRICE_FORM);
    setPriceError(null);
  };

  const savePrice = async () => {
    if (!priceModal) return;
    setPriceSaving(true);
    setPriceError(null);
    const body = {
      start_time: priceForm.start_time,
      end_time: priceForm.end_time,
      price: Number(priceForm.price.replace(/\D/g, '')),
    };
    try {
      const path = priceModal.price
        ? `/owner/prices/${priceModal.price.id}`
        : `/owner/fields/${priceModal.fieldId}/prices`;
      const res = await apiFetch(path, {
        method: priceModal.price ? 'PUT' : 'POST',
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPriceError(getErrorMessage(data, 'Gagal menyimpan harga.'));
        return;
      }
      await loadFields();
      setPriceModal(null);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Harga lapangan disimpan.' });
    } catch {
      setPriceError('Gagal terhubung ke server.');
    } finally {
      setPriceSaving(false);
    }
  };

  const confirmDeletePrice = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(`/owner/prices/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        useToastStore.getState().show({ type: 'error', title: 'Gagal', description: 'Gagal menghapus harga.' });
        return;
      }
      await loadFields();
      setDeleteTarget(null);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Harga lapangan dihapus.' });
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: 'Gagal terhubung ke server.' });
    }
  };

  if (loading) {
    return (
      <View style={st.screen}>
        <DashboardHeader title="Booking Settings" subtitle="Konfigurasi jadwal dan harga lapangan" showBack={false} />
        <ActivityIndicator color={colors.primary} style={st.loader} />
      </View>
    );
  }

  return (
    <View style={st.screen}>
      <DashboardHeader title="Booking Settings" subtitle="Konfigurasi jadwal dan harga lapangan" showBack={false} />
      <ScrollView
        contentContainerStyle={[
          st.content,
          !isMobile && { maxWidth: 900, alignSelf: 'center', width: '100%' }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {error ? <AlertBox type="error" title={error} style={st.alert} /> : null}

        {fields.length === 0 ? (
          <View style={st.empty}>
            <MaterialIcons name="stadium" size={42} color={colors.textTertiary} />
            <Text style={st.emptyTitle}>Belum ada lapangan</Text>
            <Text style={st.emptyText}>Tambahkan lapangan terlebih dahulu sebelum mengatur booking.</Text>
          </View>
        ) : (
          <>
            <Text style={st.sectionLabel}>Lapangan</Text>
            {isMobile ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.fieldTabs}>
                {fields.map((field) => {
                  const active = selectedField?.id === field.id;
                  return (
                    <TouchableOpacity key={field.id} style={[st.fieldTab, active && st.fieldTabActive, { width: 180 }]} onPress={() => setSelectedId(field.id)}>
                      <Text style={[st.fieldTabTitle, active && st.fieldTabTitleActive]} numberOfLines={1}>{field.name}</Text>
                      <Text style={[st.fieldTabMeta, active && st.fieldTabMetaActive]}>{field.status}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={[st.fieldTabs, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                {fields.map((field) => {
                  const active = selectedField?.id === field.id;
                  return (
                    <TouchableOpacity key={field.id} style={[st.fieldTab, active && st.fieldTabActive, { minWidth: 180, flex: 1, maxWidth: 220 }]} onPress={() => setSelectedId(field.id)}>
                      <Text style={[st.fieldTabTitle, active && st.fieldTabTitleActive]} numberOfLines={1}>{field.name}</Text>
                      <Text style={[st.fieldTabMeta, active && st.fieldTabMetaActive]}>{field.status}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {selectedField ? (
              <>
                <View style={st.panel}>
                  <View style={st.panelHeader}>
                    <View>
                      <Text style={st.panelTitle}>Operating Hours</Text>
                      <Text style={st.panelSubtitle}>{selectedField.name}</Text>
                    </View>
                    <MaterialIcons name="schedule" size={22} color={colors.primary} />
                  </View>

                  <View style={st.grid}>
                    <TimeInput label="Open Time" value={schedule.open_time} onChangeText={(value) => setSchedule((prev) => ({ ...prev, open_time: value }))} st={st} colors={colors} />
                    <TimeInput label="Close Time" value={schedule.close_time} onChangeText={(value) => setSchedule((prev) => ({ ...prev, close_time: value }))} st={st} colors={colors} />
                  </View>

                  <OptionGroup
                    label="Session Duration"
                    options={SESSION_OPTIONS}
                    value={schedule.session_duration_minutes}
                    suffix="menit"
                    onChange={(value) => setSchedule((prev) => ({ ...prev, session_duration_minutes: value }))}
                    st={st}
                  />

                  <OptionGroup
                    label="Buffer Time"
                    options={BUFFER_OPTIONS}
                    value={schedule.buffer_duration_minutes}
                    suffix="menit"
                    onChange={(value) => setSchedule((prev) => ({ ...prev, buffer_duration_minutes: value }))}
                    st={st}
                  />

                  <TouchableOpacity style={[st.primaryBtn, scheduleSaving && st.disabled]} onPress={saveSchedule} disabled={scheduleSaving}>
                    {scheduleSaving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={st.primaryBtnText}>Simpan Jadwal</Text>}
                  </TouchableOpacity>
                </View>

                <View style={st.panel}>
                  <View style={st.panelHeader}>
                    <View>
                      <Text style={st.panelTitle}>Dynamic Pricing</Text>
                      <Text style={st.panelSubtitle}>Harga berdasarkan rentang jam</Text>
                    </View>
                    <TouchableOpacity style={st.iconBtn} onPress={() => openPriceModal(selectedField.id)}>
                      <MaterialIcons name="add" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  {(selectedField.prices ?? []).length === 0 ? (
                    <Text style={st.muted}>Belum ada harga dinamis untuk lapangan ini.</Text>
                  ) : (
                    (selectedField.prices ?? []).map((price) => (
                      <View key={price.id} style={st.priceRow}>
                        <View>
                          <Text style={st.priceTime}>{price.start_time} - {price.end_time}</Text>
                          <Text style={st.priceValue}>Rp{Number(price.price).toLocaleString('id-ID')}</Text>
                        </View>
                        <View style={st.priceActions}>
                          <TouchableOpacity style={st.smallBtn} onPress={() => openPriceModal(selectedField.id, price)}>
                            <MaterialIcons name="edit" size={18} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity style={st.smallBtn} onPress={() => setDeleteTarget(price)}>
                            <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <PriceModal
        visible={!!priceModal}
        editing={!!priceModal?.price}
        form={priceForm}
        setForm={setPriceForm}
        error={priceError}
        loading={priceSaving}
        onClose={() => setPriceModal(null)}
        onSubmit={savePrice}
        st={st}
        colors={colors}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Hapus harga?"
        description={deleteTarget ? `${deleteTarget.start_time} - ${deleteTarget.end_time}` : ''}
        destructive
        confirmLabel="Hapus"
        onConfirm={confirmDeletePrice}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

function TimeInput({ label, value, onChangeText, st, colors }: { label: string; value: string; onChangeText: (value: string) => void; st: ReturnType<typeof makeStyles>; colors: ThemeColors }) {
  return (
    <View style={st.inputWrap}>
      <Text style={st.inputLabel}>{label}</Text>
      <View style={st.inputRow}>
        <MaterialIcons name="access-time" size={18} color={colors.textSecondary} />
        <TextInput value={value} onChangeText={onChangeText} placeholder="07:00" placeholderTextColor={colors.textTertiary} style={st.input} />
      </View>
    </View>
  );
}

function OptionGroup({ label, options, value, suffix, onChange, st }: { label: string; options: number[]; value: number; suffix: string; onChange: (value: number) => void; st: ReturnType<typeof makeStyles> }) {
  return (
    <View style={st.optionBlock}>
      <Text style={st.inputLabel}>{label}</Text>
      <View style={st.optionRow}>
        {options.map((option) => {
          const active = option === value;
          return (
            <TouchableOpacity key={option} style={[st.optionChip, active && st.optionChipActive]} onPress={() => onChange(option)}>
              <Text style={[st.optionText, active && st.optionTextActive]}>{option} {suffix}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function PriceModal({ visible, editing, form, setForm, error, loading, onClose, onSubmit, st, colors }: {
  visible: boolean;
  editing: boolean;
  form: PriceForm;
  setForm: React.Dispatch<React.SetStateAction<PriceForm>>;
  error: string | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
  st: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={st.sheet}>
          <View style={st.sheetHeader}>
            <Text style={st.panelTitle}>{editing ? 'Edit Harga' : 'Tambah Harga'}</Text>
            <TouchableOpacity style={st.iconBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {error ? <AlertBox type="error" title={error} style={st.alert} /> : null}
          <View style={st.grid}>
            <TimeInput label="Start Time" value={form.start_time} onChangeText={(value) => setForm((prev) => ({ ...prev, start_time: value }))} st={st} colors={colors} />
            <TimeInput label="End Time" value={form.end_time} onChangeText={(value) => setForm((prev) => ({ ...prev, end_time: value }))} st={st} colors={colors} />
          </View>
          <View style={st.inputWrap}>
            <Text style={st.inputLabel}>Price</Text>
            <View style={st.inputRow}>
              <MaterialIcons name="payments" size={18} color={colors.textSecondary} />
              <TextInput value={form.price} onChangeText={(value) => setForm((prev) => ({ ...prev, price: value }))} placeholder="120000" placeholderTextColor={colors.textTertiary} keyboardType="numeric" style={st.input} />
            </View>
          </View>
          <TouchableOpacity style={[st.primaryBtn, loading && st.disabled]} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={st.primaryBtnText}>Simpan Harga</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: 40 },
  content: { padding: SIZES.gutter, paddingBottom: 80 },
  alert: { marginBottom: 14 },
  sectionLabel: { ...FONTS.labelSm, color: colors.textSecondary, marginBottom: 10, textTransform: 'uppercase' },
  fieldTabs: { gap: 10, paddingBottom: 16 },
  fieldTab: { padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline },
  fieldTabActive: { borderColor: colors.primary, backgroundColor: colors.primaryContainer },
  fieldTabTitle: { ...FONTS.titleSm, color: colors.text },
  fieldTabTitleActive: { color: colors.onPrimaryContainer },
  fieldTabMeta: { ...FONTS.bodySm, color: colors.textSecondary, marginTop: 4, textTransform: 'capitalize' },
  fieldTabMetaActive: { color: colors.primary },
  panel: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.outline, padding: 16, marginBottom: 16, ...SHADOWS.xs },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  panelTitle: { ...FONTS.headlineSm, color: colors.text },
  panelSubtitle: { ...FONTS.bodySm, color: colors.textSecondary, marginTop: 2 },
  grid: { flexDirection: Platform.OS === 'web' ? 'row' : 'column', gap: 12 },
  inputWrap: { flex: 1, marginBottom: 16 },
  inputLabel: { ...FONTS.labelSm, color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 46, borderRadius: 10, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.outline, paddingHorizontal: 12 },
  input: { flex: 1, color: colors.text, ...FONTS.bodyMd, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}) },
  optionBlock: { marginBottom: 16 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.outline },
  optionChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { ...FONTS.labelMd, color: colors.textSecondary },
  optionTextActive: { color: colors.onPrimary },
  primaryBtn: { minHeight: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryBtnText: { ...FONTS.buttonMd, color: colors.onPrimary },
  disabled: { opacity: 0.6 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.outline },
  muted: { ...FONTS.bodyMd, color: colors.textSecondary },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.outline },
  priceTime: { ...FONTS.titleSm, color: colors.text },
  priceValue: { ...FONTS.bodyMd, color: colors.primary, marginTop: 2 },
  priceActions: { flexDirection: 'row', gap: 8 },
  smallBtn: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerLow },
  empty: { alignItems: 'center', gap: 10, paddingTop: 60 },
  emptyTitle: { ...FONTS.titleLg, color: colors.text },
  emptyText: { ...FONTS.bodyMd, color: colors.textSecondary, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxWidth: 560, width: '100%', alignSelf: 'center', ...(Platform.OS === 'web' ? { borderRadius: 12, marginTop: 'auto', marginBottom: 'auto' } : {}) },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
});
