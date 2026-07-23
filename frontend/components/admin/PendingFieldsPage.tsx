import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  RefreshControl, Modal, TextInput, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from '../../lib/secureStorage';
import { TOKEN_KEY } from '../../app/_layout';
import { API_BASE_URL, getErrorMessage } from '../../lib/api';
import { COLORS, FONTS, SIZES, SHADOWS } from '../goalTheme';
import { SkeletonCards } from '../Skeleton';
import DashboardHeader from '../shared/DashboardHeader';
import TrashedFieldsPage from './TrashedFieldsPage';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useToastStore } from '../../store/toastStore';

export default function PendingFieldsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [showTrashedModal, setShowTrashedModal] = useState(false);
  const [approveTarget, setApproveTarget] = useState<{ id: number; name: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const fetchFields = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/pending/list`, {
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
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

  const approveField = async (id: number) => {
    setSubmittingId(id);
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(getErrorMessage(data, 'Gagal menyetujui lapangan.'));
      }

      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Lapangan disetujui.' });
      fetchFields();
    } catch (e: any) {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: e.message || 'Gagal menyetujui lapangan.' });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleApprove = (id: number, name: string) => {
    setApproveTarget({ id, name });
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    setSubmittingId(approveTarget.id);
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/${approveTarget.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(getErrorMessage(data, 'Gagal menyetujui lapangan.'));
      }

      setApproveTarget(null);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Lapangan disetujui.' });
      fetchFields();
    } catch (e: any) {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: e.message || 'Gagal menyetujui lapangan.' });
    } finally {
      setSubmittingId(null);
    }
  };

  const openReject = (id: number, name: string) => {
    setRejectTarget({ id, name });
    setRejectReason('');
    setRejectError(null);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setRejectError('Alasan penolakan wajib diisi.');
      return;
    }
    setRejectLoading(true);
    setRejectError(null);
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/${rejectTarget.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'rejected', reason: rejectReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(getErrorMessage(data, 'Gagal menolak lapangan.'));
      }

      setRejectTarget(null);
      setRejectReason('');
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Lapangan ditolak.' });
      fetchFields();
    } catch (e: any) {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: e.message || 'Gagal menolak lapangan.' });
    } finally {
      setRejectLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={st.screen}>
        <DashboardHeader title="Persetujuan Lapangan" subtitle="Verifikasi lapangan baru" />
        <SkeletonCards count={3} />
      </View>
    );
  }

  return (
    <>
      <View style={st.screen}>
        <DashboardHeader
          title="Persetujuan Lapangan"
          subtitle="Verifikasi lapangan baru"
          right={
            <TouchableOpacity
              style={st.trashedBtn}
              onPress={() => setShowTrashedModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="delete-outline" size={20} color={COLORS.onPrimary} />
            </TouchableOpacity>
          }
        />

        <ScrollView
          contentContainerStyle={st.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {fields.length > 0 && (
            <View style={st.headerRow}>
              <View style={st.countPill}>
                <MaterialIcons name="pending-actions" size={12} color="#6d28d9" />
                <Text style={st.countText}>{fields.length} lapangan pending</Text>
              </View>
              <TouchableOpacity
                style={st.trashedLink}
                onPress={() => setShowTrashedModal(true)}
              >
                <MaterialIcons name="delete-sweep" size={16} color={COLORS.textSecondary} />
                <Text style={st.trashedLinkText}>Lihat Terhapus</Text>
              </TouchableOpacity>
            </View>
          )}

          {fields.length === 0 ? (
            <View style={st.emptyWrap}>
              <View style={st.emptyIconWrap}>
                <MaterialIcons name="check-circle" size={40} color={COLORS.primary} />
              </View>
              <Text style={st.emptyTitle}>Semua Sudah Diverifikasi</Text>
              <Text style={st.emptyDesc}>Tidak ada lapangan yang menunggu.</Text>

              <TouchableOpacity
                style={st.trashedOutlineBtn}
                onPress={() => setShowTrashedModal(true)}
              >
                <MaterialIcons name="delete-outline" size={18} color={COLORS.textSecondary} />
                <Text style={st.trashedOutlineText}>Lihat Lapangan Terhapus</Text>
              </TouchableOpacity>
            </View>
          ) : (
            fields.map((f: any) => (
              <TouchableOpacity
                key={f.id}
                style={st.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/venue-detail?id=${f.id}`)}
              >
                <View style={st.cardTop}>
                  <View style={st.fieldIconWrap}>
                    <MaterialIcons name="stadium" size={20} color="#6d28d9" />
                  </View>
                  <View style={st.cardTopInfo}>
                    <Text style={st.fieldName} numberOfLines={1}>{f.name}</Text>
                    <View style={st.sportTag}>
                      <MaterialIcons name="sports" size={11} color="#6d28d9" />
                      <Text style={st.sportText}>{f.sport_type?.toUpperCase()}</Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
                </View>

                {f.location && (
                  <View style={st.addressRow}>
                    <MaterialIcons name="location-on" size={13} color={COLORS.textSecondary} />
                    <Text style={st.addressText} numberOfLines={1}>{f.location}</Text>
                  </View>
                )}

                <View style={st.btnRow}>
                  <TouchableOpacity
                    style={[st.rejectBtn, submittingId === f.id && st.disabledBtn]}
                    onPress={() => openReject(f.id, f.name)}
                    activeOpacity={0.8}
                    disabled={submittingId === f.id}
                  >
                    <MaterialIcons name="close" size={16} color={COLORS.error} />
                    <Text style={st.rejectBtnText}>Tolak</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[st.approveBtn, submittingId === f.id && st.disabledBtn]}
                    onPress={() => handleApprove(f.id, f.name)}
                    activeOpacity={0.8}
                    disabled={submittingId === f.id}
                  >
                    <MaterialIcons name="verified" size={16} color={COLORS.onPrimary} />
                    <Text style={st.approveBtnText}>{submittingId === f.id ? 'Menyetujui...' : 'Setujui'}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* Trashed Fields Modal */}
      <Modal visible={showTrashedModal} animationType="slide" onRequestClose={() => setShowTrashedModal(false)}>
        <View style={st.modalHeaderBar}>
          <TouchableOpacity onPress={() => setShowTrashedModal(false)} style={st.closeBtn}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={st.modalHeaderTitle}>Lapangan Terhapus</Text>
        </View>
        <TrashedFieldsPage />
      </Modal>

      {/* Approve Confirm Modal */}
      <ConfirmDialog
        visible={!!approveTarget}
        title={`Setujui "${approveTarget?.name ?? ''}"?`}
        description="Lapangan akan disetujui dan terlihat oleh semua pengguna."
        icon="check-circle"
        iconColor={COLORS.primary}
        iconBg={COLORS.primaryContainer}
        loading={submittingId !== null}
        onCancel={() => setApproveTarget(null)}
        confirmLabel="Setujui Lapangan"
        onConfirm={confirmApprove}
      />

      {/* Reject Modal */}
      <Modal visible={!!rejectTarget} transparent animationType="slide" onRequestClose={() => setRejectTarget(null)}>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setRejectTarget(null)} />
          <View style={st.sheet}>
            <View style={st.sheetHandle} />
            <View style={st.sheetHeader}>
              <View style={[st.sheetIconWrap, { backgroundColor: COLORS.errorContainer }]}>
                <MaterialIcons name="cancel" size={20} color={COLORS.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.sheetTitle}>Tolak Lapangan</Text>
                <Text style={st.sheetSubtitle}>{rejectTarget?.name}</Text>
              </View>
            </View>

            {rejectError ? (
              <View style={st.errorBox}>
                <MaterialIcons name="error-outline" size={14} color={COLORS.error} />
                <Text style={st.errorText}>{rejectError}</Text>
              </View>
            ) : null}

            <Text style={st.fieldLabel}>Alasan Penolakan</Text>
            <TextInput
              style={st.reasonInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Contoh: Foto tidak sesuai, harga tidak wajar..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={st.sheetActions}>
              <TouchableOpacity style={st.cancelBtn} onPress={() => setRejectTarget(null)}>
                <Text style={st.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.submitRejectBtn, rejectLoading && { opacity: 0.6 }]}
                onPress={confirmReject}
                disabled={rejectLoading}
              >
                <Text style={st.submitRejectText}>{rejectLoading ? 'Menolak...' : 'Tolak Lapangan'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SIZES.gutter, paddingBottom: 60 },

  trashedBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#ede9fe', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#c4b5fd',
  },
  countText: { ...FONTS.labelSm, color: '#6d28d9' },
  trashedLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trashedLinkText: { ...FONTS.labelSm, color: COLORS.textSecondary },

  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primary + '30', marginBottom: 4,
  },
  emptyTitle: { ...FONTS.titleLg, color: COLORS.text },
  emptyDesc: { ...FONTS.bodyMd, color: COLORS.textSecondary },
  trashedOutlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: COLORS.outline,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 12,
    backgroundColor: COLORS.surface,
  },
  trashedOutlineText: { ...FONTS.titleSm, color: COLORS.textSecondary },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.outline, ...SHADOWS.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  fieldIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#c4b5fd',
  },
  cardTopInfo: { flex: 1 },
  fieldName: { ...FONTS.titleLg, color: COLORS.text, marginBottom: 5 },
  sportTag: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  sportText: { ...FONTS.labelSm, color: '#6d28d9' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  addressText: { ...FONTS.bodySm, color: COLORS.textSecondary, flex: 1 },

  approveBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12,
    minHeight: 46,
  },
  approveBtnText: { ...FONTS.titleSm, color: COLORS.onPrimary },
  btnRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.errorContainer, paddingVertical: 12, borderRadius: 12,
    minHeight: 46, borderWidth: 1, borderColor: COLORS.error + '30',
  },
  rejectBtnText: { ...FONTS.titleSm, color: COLORS.error },
  disabledBtn: { opacity: 0.6 },

  modalHeaderBar: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.outline,
  },
  closeBtn: { padding: 4 },
  modalHeaderTitle: { ...FONTS.headlineSm, color: COLORS.text },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1, borderColor: COLORS.outline,
  },
  sheetHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: COLORS.outline, alignSelf: 'center', marginBottom: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  sheetIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetTitle: { ...FONTS.headlineSm, color: COLORS.text },
  sheetSubtitle: { ...FONTS.bodySm, color: COLORS.textSecondary, marginTop: 2 },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.errorContainer, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: COLORS.error + '30' },
  errorText: { ...FONTS.bodySm, color: COLORS.error, flex: 1 },

  fieldLabel: { ...FONTS.labelSm, color: COLORS.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  reasonInput: {
    backgroundColor: COLORS.surfaceContainerLow, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: COLORS.outline,
    color: COLORS.text, fontSize: 14, minHeight: 80, marginBottom: 14,
  },

  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', borderWidth: 1, borderColor: COLORS.outline },
  cancelText: { ...FONTS.titleSm, color: COLORS.textSecondary },
  submitRejectBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: COLORS.error, alignItems: 'center' },
  submitRejectText: { ...FONTS.titleSm, color: '#FFFFFF' },
});
