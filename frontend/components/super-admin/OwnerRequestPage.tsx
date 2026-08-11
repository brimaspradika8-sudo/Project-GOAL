import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, RefreshControl, Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getErrorMessage } from '../../lib/api';
import { apiFetch } from '../../lib/apiClient';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import { SkeletonCards } from '../Skeleton';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useToastStore } from '../../store/toastStore';
import { useTheme } from '../../lib/theme';

export default function OwnerRequestPage() {
  const { colors, resolved } = useTheme();
  const st = makeStyles(colors, resolved);
  const cardSurface = colors.surface;
  const softSurface = resolved === 'dark' ? colors.surfaceContainerHigh : colors.surfaceContainerLow;
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ id: number; visible: boolean }>({ id: 0, visible: false });
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [approveTarget, setApproveTarget] = useState<{ id: number; name: string } | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await apiFetch('/owner-requests/pending');
      const data = await res.json();
      setRequests(data?.data ?? []);
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Gagal memuat pengajuan.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  const onRefresh = () => { setRefreshing(true); fetchRequests(); };

  const reviewRequest = async (id: number, status: 'approved' | 'rejected', reason?: string) => {
    const res = await apiFetch(`/owner-requests/${id}/review`, {
      method: 'POST',
      body: { status, ...(reason ? { reason } : {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(getErrorMessage(data, 'Gagal memproses pengajuan.'));
    }
    return data;
  };

  const handleApprove = (id: number, name: string) => {
    setApproveTarget({ id, name });
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    setSubmitting(true);
    try {
      await reviewRequest(approveTarget.id, 'approved');
      setApproveTarget(null);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Pengajuan disetujui!' });
      fetchRequests();
    } catch (e: any) {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: e.message || 'Gagal memproses pengajuan.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      useToastStore.getState().show({ type: 'error', title: 'Alasan wajib diisi', description: 'Tuliskan alasan penolakan terlebih dahulu.' });
      return;
    }
    setSubmitting(true);
    try {
      await reviewRequest(rejectModal.id, 'rejected', reason);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Pengajuan ditolak.' });
      setRejectModal({ id: 0, visible: false });
      setRejectReason('');
      fetchRequests();
    } catch (e: any) {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: e.message || 'Gagal memproses pengajuan.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[st.screen, { backgroundColor: colors.background }]}>
        <DashboardHeader title="Pengajuan Owner" subtitle="Review permohonan owner baru" showBack={false} />
        <SkeletonCards count={3} />
      </View>
    );
  }

  return (
    <>
      <View style={[st.screen, { backgroundColor: colors.background }]}>
        <DashboardHeader title="Pengajuan Owner" subtitle="Review permohonan owner baru" showBack={false} />

        <ScrollView
          contentContainerStyle={st.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Count pill */}
          {requests.length > 0 && (
            <View style={st.headerRow}>
              <View style={[st.countPill, { backgroundColor: colors.floodlight + '20', borderColor: colors.floodlight + '50' }]}>
                <MaterialIcons name="pending-actions" size={12} color={colors.floodlight} />
                <Text style={[st.countText, { color: colors.warning }]}>{requests.length} menunggu review</Text>
              </View>
            </View>
          )}

          {requests.length === 0 ? (
            <View style={st.emptyWrap}>
              <View style={[st.emptyIconWrap, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outline }]}>
                <MaterialIcons name="inventory" size={40} color={colors.textTertiary} />
              </View>
              <Text style={[st.emptyTitle, { color: colors.text }]}>Semua Beres!</Text>
              <Text style={[st.emptyDesc, { color: colors.textSecondary }]}>Tidak ada pengajuan yang menunggu.</Text>
            </View>
          ) : (
            requests.map((r: any) => (
              <View key={r.id} style={[st.card, { backgroundColor: cardSurface, borderColor: colors.outline }]}>
                {/* Card header */}
                <View style={st.cardTop}>
                  <View style={[st.businessIconWrap, { backgroundColor: colors.floodlight + '20', borderColor: colors.floodlight + '40' }]}>
                    <MaterialIcons name="store" size={20} color={colors.floodlight} />
                  </View>
                  <View style={st.cardTopInfo}>
                    <Text style={[st.businessName, { color: colors.text }]} numberOfLines={1}>{r.business_name}</Text>
                    <View style={st.pendingBadge}>
                      <View style={st.pulseDot} />
                      <Text style={[st.pendingText, { color: colors.warning }]}>Menunggu</Text>
                    </View>
                  </View>
                </View>

                <View style={[st.divider, { backgroundColor: colors.outline }]} />

                {/* Detail rows */}
                {[
                  { icon: 'person', label: r.name },
                  { icon: 'mail', label: r.email },
                  { icon: 'location-on', label: r.address },
                  { icon: 'phone', label: r.phone },
                ].map((row, i) => (
                  <View key={i} style={st.detailRow}>
                    <MaterialIcons name={row.icon as any} size={14} color={colors.textSecondary} />
                    <Text style={[st.detailText, { color: colors.textSecondary }]} numberOfLines={1}>{row.label}</Text>
                  </View>
                ))}

                {/* Actions */}
                <View style={st.actions}>
                  <TouchableOpacity
                    style={[st.approveBtn, submitting && st.disabledBtn]}
                    onPress={() => handleApprove(r.id, r.name)}
                    activeOpacity={0.8}
                    disabled={submitting}
                  >
                    <MaterialIcons name="check-circle" size={16} color={colors.onPrimary} />
                    <Text style={st.approveBtnText}>Setujui</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[st.rejectBtn, submitting && st.disabledBtn]}
                    onPress={() => setRejectModal({ id: r.id, visible: true })}
                    activeOpacity={0.8}
                    disabled={submitting}
                  >
                    <MaterialIcons name="cancel" size={16} color={colors.error} />
                    <Text style={st.rejectBtnText}>Tolak</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Reject Modal */}
      <Modal visible={rejectModal.visible} transparent animationType="fade" onRequestClose={() => setRejectModal({ id: 0, visible: false })}>
        <View style={st.modalOverlay}>
          <View style={[st.modal, { backgroundColor: cardSurface, borderColor: colors.outline }]}>
            <View style={st.modalHeader}>
              <View style={[st.modalIconWrap, { backgroundColor: colors.errorContainer }]}>
                <MaterialIcons name="cancel" size={22} color={colors.error} />
              </View>
              <Text style={[st.modalTitle, { color: colors.text }]}>Alasan Penolakan</Text>
            </View>
            <Text style={[st.modalSub, { color: colors.textSecondary }]}>Wajib diisi dan akan dikirim ke pemohon.</Text>
            <TextInput
              style={[st.modalInput, { backgroundColor: softSurface, color: colors.text, borderColor: colors.outline }]}
              placeholder="Contoh: Data tidak lengkap..."
              placeholderTextColor={colors.textTertiary}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
              maxLength={500}
            />
            <View style={st.modalActions}>
              <TouchableOpacity
                style={[st.cancelBtn, { backgroundColor: softSurface, borderColor: colors.outline }]}
                onPress={() => { setRejectModal({ id: 0, visible: false }); setRejectReason(''); }}
              >
                <Text style={[st.cancelText, { color: colors.textSecondary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.confirmBtn, submitting && { opacity: 0.6 }]}
                onPress={handleReject}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color={colors.onPrimary} size="small" />
                  : <Text style={st.confirmText}>Tolak</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Approve Confirm Modal */}
      <ConfirmDialog
        visible={!!approveTarget}
        title={`Setujui "${approveTarget?.name ?? ''}"?`}
        description="Pengajuan owner akan disetujui dan user akan mendapatkan akses owner."
        icon="check-circle"
        iconColor={colors.primary}
        iconBg={colors.primaryContainer}
        loading={submitting}
        onCancel={() => setApproveTarget(null)}
        confirmLabel="Setujui"
        onConfirm={confirmApprove}
      />
    </>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], resolved: 'light' | 'dark') => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: SIZES.gutter, paddingBottom: 60 },

  headerRow: { flexDirection: 'row', marginBottom: 14 },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.floodlight + '20', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.floodlight + '50',
  },
  countText: { ...FONTS.labelSm, color: colors.onWarning },

  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.outline, marginBottom: 4,
  },
  emptyTitle: { ...FONTS.titleLg, color: colors.text },
  emptyDesc: { ...FONTS.bodyMd, color: colors.textSecondary },

  card: {
    backgroundColor: colors.surface, borderRadius: 18, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: colors.outline, ...SHADOWS.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  businessIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: colors.floodlight + '20',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.floodlight + '40',
  },
  cardTopInfo: { flex: 1 },
  businessName: { ...FONTS.titleLg, color: colors.text, marginBottom: 5 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.floodlight },
  pendingText: { ...FONTS.labelMd, color: colors.onWarning },
  divider: { height: 1, backgroundColor: colors.outline, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  detailText: { ...FONTS.bodyMd, color: colors.textSecondary, flex: 1 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12,
    minHeight: 46,
  },
  approveBtnText: { ...FONTS.titleSm, color: colors.onPrimary },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: colors.errorContainer, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: colors.error + '30',
    minHeight: 46,
  },
  rejectBtnText: { ...FONTS.titleSm, color: colors.error },
  disabledBtn: { opacity: 0.6 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: {
    backgroundColor: colors.surface, borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: colors.outline, ...SHADOWS.lg,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  modalIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: colors.errorContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { ...FONTS.headlineSm, color: colors.text },
  modalSub: { ...FONTS.bodySm, color: colors.textSecondary, marginBottom: 16, marginLeft: 50 },
  modalInput: {
    backgroundColor: colors.surfaceContainerLow, borderRadius: 12, padding: 14,
    color: colors.text, fontSize: 14, minHeight: 90,
    textAlignVertical: 'top', marginBottom: 16,
    borderWidth: 1, borderColor: colors.outline,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    paddingVertical: 11, paddingHorizontal: 20, borderRadius: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1, borderColor: colors.outline,
    minHeight: 44, justifyContent: 'center',
  },
  cancelText: { ...FONTS.titleSm, color: colors.textSecondary },
  confirmBtn: {
    paddingVertical: 11, paddingHorizontal: 24, borderRadius: 10,
    backgroundColor: colors.error, minHeight: 44, justifyContent: 'center', alignItems: 'center',
  },
  confirmText: { ...FONTS.titleSm, color: colors.onPrimary },
});
