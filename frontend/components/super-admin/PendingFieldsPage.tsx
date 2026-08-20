import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  RefreshControl, Modal, TextInput,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getErrorMessage } from '../../lib/api';
import { apiFetch } from '../../lib/apiClient';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import { SkeletonCards } from '../Skeleton';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import SelectCheckbox from '../shared/SelectCheckbox';
import BulkActionBar from '../shared/BulkActionBar';
import { useToastStore } from '../../store/toastStore';
import { useTheme } from '../../lib/theme';
import { useIsMobileWeb } from '../../lib/responsive';

export default function PendingFieldsPage({ hideHeader }: { hideHeader?: boolean } = {}) {
  const { colors, resolved } = useTheme();
  const isMobile = useIsMobileWeb();
  const st = useMemo(() => makeStyles(colors, resolved, isMobile), [colors, resolved, isMobile]);
  const cardSurface = colors.surface;
  const softSurface = resolved === 'dark' ? colors.surfaceContainerHigh : colors.surfaceContainerLow;
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [approveTarget, setApproveTarget] = useState<{ id: number; name: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkTarget, setBulkTarget] = useState<null | 'approve' | 'reject'>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const fetchFields = useCallback(async () => {
    try {
      const res = await apiFetch('/fields/pending/list');
      const data = await res.json().catch(() => ({}));
      setFields(data?.data ?? []);
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Gagal memuat data.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFields(); }, [fetchFields]);
  const onRefresh = () => { setRefreshing(true); fetchFields(); };

  const reviewField = async (id: number, status: 'approved' | 'rejected', reason?: string) => {
    const res = await apiFetch(`/fields/${id}/approve`, {
      method: 'POST',
      body: { status, ...(reason ? { reason } : {}) },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(getErrorMessage(data, status === 'approved' ? 'Gagal menyetujui lapangan.' : 'Gagal menolak lapangan.'));
    }

    return data;
  };

  const handleApprove = (id: number, name: string) => {
    setApproveTarget({ id, name });
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    setSubmittingId(approveTarget.id);
    try {
      await reviewField(approveTarget.id, 'approved');
      setApproveTarget(null);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Lapangan disetujui.' });
      fetchFields();
    } catch (e: any) {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: e.message || 'Gagal menyetujui lapangan.' });
    } finally {
      setSubmittingId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      useToastStore.getState().show({ type: 'error', title: 'Alasan wajib diisi', description: 'Tuliskan alasan penolakan terlebih dahulu.' });
      return;
    }

    setSubmittingId(rejectTarget.id);
    try {
      await reviewField(rejectTarget.id, 'rejected', reason);
      setRejectTarget(null);
      setRejectReason('');
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Lapangan ditolak.' });
      fetchFields();
    } catch (e: any) {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: e.message || 'Gagal menolak lapangan.' });
    } finally {
      setSubmittingId(null);
    }
  };

  // ── BULK ────────────────────────────────────────────────
  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = fields.map(f => f.id);
    setSelected(prev => {
      const allPicked = visibleIds.length > 0 && visibleIds.every(id => prev.has(id));
      if (allPicked) return new Set();
      return new Set(visibleIds);
    });
  };

  const confirmBulkApprove = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    setBulkError(null);
    try {
      const res = await apiFetch('/fields/bulk-approve', {
        method: 'POST',
        body: { ids: Array.from(selected), status: 'approved' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBulkError(getErrorMessage(data, 'Gagal menyetujui lapangan.'));
        return;
      }
      setBulkTarget(null);
      setSelected(new Set());
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: data.message || 'Lapangan disetujui.' });
      fetchFields();
    } catch {
      setBulkError('Tidak dapat terhubung ke server.');
    } finally {
      setBulkLoading(false);
    }
  };

  const confirmBulkReject = async () => {
    if (selected.size === 0) return;
    const reason = rejectReason.trim();
    if (!reason) {
      useToastStore.getState().show({ type: 'error', title: 'Alasan wajib diisi', description: 'Tuliskan alasan penolakan terlebih dahulu.' });
      return;
    }
    setBulkLoading(true);
    setBulkError(null);
    try {
      const res = await apiFetch('/fields/bulk-approve', {
        method: 'POST',
        body: { ids: Array.from(selected), status: 'rejected', reason },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBulkError(getErrorMessage(data, 'Gagal menolak lapangan.'));
        return;
      }
      setBulkTarget(null);
      setSelected(new Set());
      setRejectReason('');
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: data.message || 'Lapangan ditolak.' });
      fetchFields();
    } catch {
      setBulkError('Tidak dapat terhubung ke server.');
    } finally {
      setBulkLoading(false);
    }
  };

  const onRejectConfirm = () => {
    if (bulkTarget === 'reject') confirmBulkReject(); else confirmReject();
  };

  const closeRejectModal = () => {
    setRejectTarget(null);
    setBulkTarget(null);
    setRejectReason('');
  };

  if (loading) {
    return (
      <View style={[st.screen, { backgroundColor: colors.background }]}>
        {!hideHeader && <DashboardHeader title="Persetujuan Lapangan" subtitle="Verifikasi lapangan baru" showBack={false} />}
        <SkeletonCards count={3} />
      </View>
    );
  }

  return (
    <>
      <View style={[st.screen, { backgroundColor: colors.background }]}>
        {!hideHeader && (
          <DashboardHeader
            title="Persetujuan Lapangan"
            subtitle="Verifikasi lapangan baru"
            showBack={false}
          />
        )}

        <ScrollView
          style={st.scroll}
          contentContainerStyle={st.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {fields.length > 0 && (
            <View style={st.headerRow}>
              <View style={[st.countPill, { backgroundColor: colors.warningMuted, borderColor: colors.warning + '50' }]}>
                <MaterialIcons name="pending-actions" size={12} color={colors.warning} />
                <Text style={[st.countText, { color: colors.warning }]}>{fields.length} lapangan pending</Text>
              </View>
            </View>
          )}

          {fields.length === 0 ? (
            <View style={st.emptyWrap}>
              <View style={[st.emptyIconWrap, { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '30' }]}>
                <MaterialIcons name="check-circle" size={40} color={colors.primary} />
              </View>
              <Text style={[st.emptyTitle, { color: colors.text }]}>Semua Sudah Diverifikasi</Text>
              <Text style={[st.emptyDesc, { color: colors.textSecondary }]}>Tidak ada lapangan yang menunggu.</Text>
            </View>
          ) : (
            fields.map((f: any) => (
              <TouchableOpacity
                key={f.id}
                style={[st.card, { backgroundColor: cardSurface, borderColor: colors.outline }, selected.has(f.id) && { borderColor: colors.primary }]}
                activeOpacity={0.85}
                onPress={() => router.push(`/venue-detail?id=${f.id}`)}
              >
                <View style={st.cardTop}>
                  <View style={[st.fieldIconWrap, { backgroundColor: colors.warningMuted, borderColor: colors.warning + '50' }]}>
                    <MaterialIcons name="stadium" size={20} color={colors.warning} />
                  </View>
                  <View style={st.cardTopInfo}>
                    <Text style={[st.fieldName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{f.name}</Text>
                    <View style={st.sportTag}>
                      <MaterialIcons name="sports" size={11} color={colors.warning} />
                      <Text style={[st.sportText, { color: colors.warning }]}>{f.sport_type?.toUpperCase()}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => toggleSelect(f.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.7} style={st.checkbox}>
                    <SelectCheckbox selected={selected.has(f.id)} colors={colors} size={20} />
                  </TouchableOpacity>
                </View>

                {f.location && (
                  <View style={st.addressRow}>
                    <MaterialIcons name="location-on" size={13} color={colors.textSecondary} />
                    <Text style={[st.addressText, { color: colors.textSecondary }]} numberOfLines={1}>{f.location}</Text>
                  </View>
                )}

                <View style={st.actionRow}>
                  <TouchableOpacity
                    style={[st.approveBtn, submittingId === f.id && st.disabledBtn]}
                    onPress={() => handleApprove(f.id, f.name)}
                    activeOpacity={0.8}
                    disabled={submittingId === f.id}
                  >
                    <MaterialIcons name="verified" size={16} color={colors.onPrimary} />
                    <Text style={st.approveBtnText}>{submittingId === f.id ? 'Menyetujui...' : 'Setujui'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[st.rejectBtn, submittingId === f.id && st.disabledBtn]}
                    onPress={() => { setRejectTarget({ id: f.id, name: f.name }); setRejectReason(''); }}
                    activeOpacity={0.8}
                    disabled={submittingId === f.id}
                  >
                    <MaterialIcons name="cancel" size={16} color={colors.error} />
                    <Text style={[st.rejectBtnText, { color: colors.error }]}>{submittingId === f.id ? 'Menunggu...' : 'Tolak'}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <BulkActionBar
          count={selected.size}
          allSelected={fields.length > 0 && fields.every(f => selected.has(f.id))}
          onSelectAll={toggleSelectAll}
          onClear={() => setSelected(new Set())}
          actions={[
            { label: 'Setujui', icon: 'verified', color: colors.primary, onPress: () => { setBulkError(null); setBulkTarget('approve'); } },
            { label: 'Tolak', icon: 'cancel', color: colors.error, onPress: () => { setBulkError(null); setBulkTarget('reject'); setRejectReason(''); } },
          ]}
        />
      </View>

      <Modal visible={!!rejectTarget || bulkTarget === 'reject'} transparent animationType="fade" onRequestClose={closeRejectModal}>
        <View style={st.modalOverlay}>
          <View style={[st.rejectModal, { backgroundColor: cardSurface, borderColor: colors.outline }]}>
            <View style={st.rejectHeader}>
              <View style={[st.rejectIconWrap, { backgroundColor: colors.errorContainer }]}>
                <MaterialIcons name="cancel" size={22} color={colors.error} />
              </View>
              <Text style={[st.rejectTitle, { color: colors.text }]}>Alasan Penolakan</Text>
            </View>
            <Text style={[st.rejectSubtitle, { color: colors.textSecondary }]}>
              {bulkTarget === 'reject'
                ? `Alasan ini akan berlaku untuk ${selected.size} lapangan yang dipilih.`
                : 'Alasan ini akan disimpan saat lapangan ditolak.'}
            </Text>
            <TextInput
              style={[st.rejectInput, { backgroundColor: softSurface, color: colors.text, borderColor: colors.outline }]}
              placeholder="Contoh: Data lapangan belum lengkap..."
              placeholderTextColor={colors.textTertiary}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={st.rejectActions}>
              <TouchableOpacity
                style={[st.cancelBtn, { backgroundColor: softSurface, borderColor: colors.outline }]}
                onPress={closeRejectModal}
              >
                <Text style={[st.cancelBtnText, { color: colors.textSecondary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.confirmRejectBtn, (submittingId !== null || bulkLoading) && st.disabledBtn]}
                onPress={onRejectConfirm}
                disabled={submittingId !== null || bulkLoading}
              >
                <Text style={st.confirmRejectText}>{bulkTarget === 'reject' ? 'Tolak Lapangan Terpilih' : 'Tolak Lapangan'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Approve Confirm Modal */}
      <ConfirmDialog
        visible={!!approveTarget}
        title={`Setujui "${approveTarget?.name ?? ''}"?`}
        description="Lapangan akan disetujui dan terlihat oleh semua pengguna."
        icon="check-circle"
        iconColor={colors.primary}
        iconBg={colors.primaryContainer}
        loading={submittingId !== null}
        onCancel={() => setApproveTarget(null)}
        confirmLabel="Setujui Lapangan"
        onConfirm={confirmApprove}
      />

      {/* Bulk Approve Confirm Modal */}
      <ConfirmDialog
        visible={bulkTarget === 'approve'}
        title={`Setujui ${selected.size} lapangan terpilih?`}
        description="Semua lapangan terpilih akan disetujui dan terlihat oleh semua pengguna."
        icon="check-circle"
        iconColor={colors.primary}
        iconBg={colors.primaryContainer}
        loading={bulkLoading}
        error={bulkError}
        onCancel={() => setBulkTarget(null)}
        confirmLabel="Setujui Bersama"
        onConfirm={confirmBulkApprove}
      />
    </>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], resolved: 'light' | 'dark', isMobile: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: {
    padding: SIZES.gutter,
    paddingBottom: 24,
    ...(isMobile
      ? {}
      : {
          maxWidth: 1200,
          alignSelf: 'center',
          width: '100%',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
        }),
  },
  scroll: { flex: 1 },

  checkbox: { padding: 4 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, width: '100%' },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.warningMuted, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.warning + '40',
  },
  countText: { ...FONTS.labelSm, color: colors.onWarning },

  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 12, width: '100%' },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.primary + '30', marginBottom: 4,
  },
  emptyTitle: { ...FONTS.titleLg, color: colors.text },
  emptyDesc: { ...FONTS.bodyMd, color: colors.textSecondary },

  card: {
    backgroundColor: colors.surface, borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.outline, ...SHADOWS.sm,
    ...(isMobile
      ? { width: '100%' }
      : {
          width: 'calc(33.333% - 11px)' as any,
          minWidth: 320,
          maxWidth: 380,
          marginBottom: 0,
        }),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  fieldIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: colors.warningMuted, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.warning + '40',
  },
  cardTopInfo: { flex: 1 },
  fieldName: { ...FONTS.titleLg, color: colors.text, marginBottom: 5 },
  sportTag: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  sportText: { ...FONTS.labelSm, color: colors.onWarning },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  addressText: { ...FONTS.bodySm, color: colors.textSecondary, flex: 1 },

  approveBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12,
    minHeight: 46,
  },
  approveBtnText: { ...FONTS.titleSm, color: colors.onPrimary },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.errorContainer,
    borderColor: colors.error + '30',
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, minHeight: 46,
  },
  rejectBtnText: { ...FONTS.titleSm },
  disabledBtn: { opacity: 0.6 },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 24 },
  rejectModal: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    ...SHADOWS.lg,
  },
  rejectHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  rejectIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  rejectTitle: { ...FONTS.headlineSm },
  rejectSubtitle: { ...FONTS.bodySm, marginBottom: 16, marginLeft: 50 },
  rejectInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  rejectActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    paddingVertical: 11, paddingHorizontal: 20, borderRadius: 10,
    borderWidth: 1,
    minHeight: 44, justifyContent: 'center',
  },
  cancelBtnText: { ...FONTS.titleSm },
  confirmRejectBtn: {
    paddingVertical: 11, paddingHorizontal: 24, borderRadius: 10,
    backgroundColor: colors.error, minHeight: 44, justifyContent: 'center', alignItems: 'center',
  },
  confirmRejectText: { ...FONTS.titleSm, color: colors.onPrimary },
});
