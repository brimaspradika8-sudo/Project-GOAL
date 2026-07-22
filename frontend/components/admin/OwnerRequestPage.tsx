import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Alert, TextInput, RefreshControl, Modal,
  Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../../app/_layout';
import { API_BASE_URL, getErrorMessage } from '../../lib/api';
import { COLORS, FONTS, SIZES, SHADOWS } from '../goalTheme';
import { SkeletonCards } from '../Skeleton';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmActionModal from './ConfirmActionModal';

export default function OwnerRequestPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ id: number; visible: boolean }>({ id: 0, visible: false });
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [approveTarget, setApproveTarget] = useState<{ id: number; name: string } | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/owner-requests/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequests(data?.data ?? []);
    } catch {
      Alert.alert('Error', 'Gagal memuat pengajuan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  const onRefresh = () => { setRefreshing(true); fetchRequests(); };

  const reviewRequest = async (id: number, status: 'approved' | 'rejected', reason?: string) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_BASE_URL}/owner-requests/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(getErrorMessage(data, 'Gagal memproses pengajuan.'));
    }
    return data;
  };

  const approveRequest = async (id: number) => {
    setSubmitting(true);
    try {
      await reviewRequest(id, 'approved');
      Alert.alert('Berhasil', 'Pengajuan disetujui!');
      fetchRequests();
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Gagal memproses pengajuan.');
    } finally {
      setSubmitting(false);
    }
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
      Alert.alert('Berhasil', 'Pengajuan disetujui!');
      fetchRequests();
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Gagal memproses pengajuan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      Alert.alert('Alasan wajib diisi', 'Tuliskan alasan penolakan terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    try {
      await reviewRequest(rejectModal.id, 'rejected', reason);
      Alert.alert('Berhasil', 'Pengajuan ditolak.');
      setRejectModal({ id: 0, visible: false });
      setRejectReason('');
      fetchRequests();
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Gagal memproses pengajuan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={st.screen}>
        <DashboardHeader title="Pengajuan Owner" subtitle="Review permohonan owner baru" />
        <SkeletonCards count={3} />
      </View>
    );
  }

  return (
    <>
      <View style={st.screen}>
        <DashboardHeader title="Pengajuan Owner" subtitle="Review permohonan owner baru" />

        <ScrollView
          contentContainerStyle={st.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Count pill */}
          {requests.length > 0 && (
            <View style={st.headerRow}>
              <View style={st.countPill}>
                <MaterialIcons name="pending-actions" size={12} color={COLORS.floodlight} />
                <Text style={st.countText}>{requests.length} menunggu review</Text>
              </View>
            </View>
          )}

          {requests.length === 0 ? (
            <View style={st.emptyWrap}>
              <View style={st.emptyIconWrap}>
                <MaterialIcons name="inventory" size={40} color={COLORS.textTertiary} />
              </View>
              <Text style={st.emptyTitle}>Semua Beres!</Text>
              <Text style={st.emptyDesc}>Tidak ada pengajuan yang menunggu.</Text>
            </View>
          ) : (
            requests.map((r: any) => (
              <View key={r.id} style={st.card}>
                {/* Card header */}
                <View style={st.cardTop}>
                  <View style={st.businessIconWrap}>
                    <MaterialIcons name="store" size={20} color={COLORS.floodlight} />
                  </View>
                  <View style={st.cardTopInfo}>
                    <Text style={st.businessName} numberOfLines={1}>{r.business_name}</Text>
                    <View style={st.pendingBadge}>
                      <View style={st.pulseDot} />
                      <Text style={st.pendingText}>Menunggu</Text>
                    </View>
                  </View>
                </View>

                <View style={st.divider} />

                {/* Detail rows */}
                {[
                  { icon: 'person', label: r.name },
                  { icon: 'mail', label: r.email },
                  { icon: 'location-on', label: r.address },
                  { icon: 'phone', label: r.phone },
                ].map((row, i) => (
                  <View key={i} style={st.detailRow}>
                    <MaterialIcons name={row.icon as any} size={14} color={COLORS.textSecondary} />
                    <Text style={st.detailText} numberOfLines={1}>{row.label}</Text>
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
                    <MaterialIcons name="check-circle" size={16} color={COLORS.onPrimary} />
                    <Text style={st.approveBtnText}>Setujui</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[st.rejectBtn, submitting && st.disabledBtn]}
                    onPress={() => setRejectModal({ id: r.id, visible: true })}
                    activeOpacity={0.8}
                    disabled={submitting}
                  >
                    <MaterialIcons name="cancel" size={16} color={COLORS.error} />
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
          <View style={st.modal}>
            <View style={st.modalHeader}>
              <View style={st.modalIconWrap}>
                <MaterialIcons name="cancel" size={22} color={COLORS.error} />
              </View>
              <Text style={st.modalTitle}>Alasan Penolakan</Text>
            </View>
            <Text style={st.modalSub}>Wajib diisi dan akan dikirim ke pemohon.</Text>
            <TextInput
              style={st.modalInput}
              placeholder="Contoh: Data tidak lengkap..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={st.modalActions}>
              <TouchableOpacity
                style={st.cancelBtn}
                onPress={() => { setRejectModal({ id: 0, visible: false }); setRejectReason(''); }}
              >
                <Text style={st.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.confirmBtn, submitting && { opacity: 0.6 }]}
                onPress={handleReject}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color={COLORS.onPrimary} size="small" />
                  : <Text style={st.confirmText}>Tolak</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Approve Confirm Modal */}
      <ConfirmActionModal
        visible={!!approveTarget}
        title={`Setujui "${approveTarget?.name ?? ''}"?`}
        description="Pengajuan owner akan disetujui dan user akan mendapatkan akses owner."
        icon="check-circle"
        iconColor={COLORS.primary}
        iconBg={COLORS.primaryContainer}
        loading={submitting}
        onCancel={() => setApproveTarget(null)}
        options={[{
          label: 'Setujui',
          icon: 'check',
          onPress: confirmApprove,
        }]}
      />
    </>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SIZES.gutter, paddingBottom: 60 },

  headerRow: { flexDirection: 'row', marginBottom: 14 },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.floodlight + '20', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.floodlight + '50',
  },
  countText: { ...FONTS.labelSm, color: '#92400e' },

  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.outline, marginBottom: 4,
  },
  emptyTitle: { ...FONTS.titleLg, color: COLORS.text },
  emptyDesc: { ...FONTS.bodyMd, color: COLORS.textSecondary },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.outline, ...SHADOWS.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  businessIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: COLORS.floodlight + '20',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.floodlight + '40',
  },
  cardTopInfo: { flex: 1 },
  businessName: { ...FONTS.titleLg, color: COLORS.text, marginBottom: 5 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.floodlight },
  pendingText: { ...FONTS.labelMd, color: '#92400e' },
  divider: { height: 1, backgroundColor: COLORS.outline, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  detailText: { ...FONTS.bodyMd, color: COLORS.textSecondary, flex: 1 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12,
    minHeight: 46,
  },
  approveBtnText: { ...FONTS.titleSm, color: COLORS.onPrimary },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: COLORS.errorContainer, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.error + '30',
    minHeight: 46,
  },
  rejectBtnText: { ...FONTS.titleSm, color: COLORS.error },
  disabledBtn: { opacity: 0.6 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: COLORS.outline, ...SHADOWS.lg,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  modalIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: COLORS.errorContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { ...FONTS.headlineSm, color: COLORS.text },
  modalSub: { ...FONTS.bodySm, color: COLORS.textSecondary, marginBottom: 16, marginLeft: 50 },
  modalInput: {
    backgroundColor: COLORS.surfaceContainerLow, borderRadius: 12, padding: 14,
    color: COLORS.text, fontSize: 14, minHeight: 90,
    textAlignVertical: 'top', marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.outline,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    paddingVertical: 11, paddingHorizontal: 20, borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1, borderColor: COLORS.outline,
    minHeight: 44, justifyContent: 'center',
  },
  cancelText: { ...FONTS.titleSm, color: COLORS.textSecondary },
  confirmBtn: {
    paddingVertical: 11, paddingHorizontal: 24, borderRadius: 10,
    backgroundColor: COLORS.error, minHeight: 44, justifyContent: 'center', alignItems: 'center',
  },
  confirmText: { ...FONTS.titleSm, color: COLORS.onPrimary },
});
