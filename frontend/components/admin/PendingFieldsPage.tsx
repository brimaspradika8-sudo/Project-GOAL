import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  RefreshControl, Modal, TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../../lib/auth';
import { API_BASE_URL, getErrorMessage, DEFAULT_HEADERS } from '../../lib/api';
import { COLORS, FONTS, SIZES, SHADOWS } from '../goalTheme';
import { SkeletonCards } from '../Skeleton';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useToastStore } from '../../store/toastStore';
import { useTheme } from '../../lib/theme';

export default function PendingFieldsPage({ hideHeader }: { hideHeader?: boolean } = {}) {
  const { colors, resolved } = useTheme();
  const cardSurface = resolved === 'dark' ? '#1E293B' : colors.surface;
  const softSurface = resolved === 'dark' ? colors.surfaceContainerHigh : colors.surfaceContainerLow;
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [approveTarget, setApproveTarget] = useState<{ id: number; name: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchFields = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/pending/list`, {
        headers: {
          ...DEFAULT_HEADERS,
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

  const reviewField = async (id: number, status: 'approved' | 'rejected', reason?: string) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_BASE_URL}/fields/${id}/approve`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
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

  if (loading) {
    return (
      <View style={[st.screen, { backgroundColor: colors.background }]}>
        {!hideHeader && <DashboardHeader title="Persetujuan Lapangan" subtitle="Verifikasi lapangan baru" />}
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
          />
        )}

        <ScrollView
          contentContainerStyle={st.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {fields.length > 0 && (
            <View style={st.headerRow}>
              <View style={[st.countPill, { backgroundColor: resolved === 'dark' ? '#2A1F5E' : COLORS.purpleBg, borderColor: resolved === 'dark' ? '#4C1D95' : COLORS.purpleBorder }]}>
                <MaterialIcons name="pending-actions" size={12} color={COLORS.purpleIcon} />
                <Text style={st.countText}>{fields.length} lapangan pending</Text>
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
                style={[st.card, { backgroundColor: cardSurface, borderColor: colors.outline }]}
                activeOpacity={0.85}
                onPress={() => router.push(`/venue-detail?id=${f.id}`)}
              >
                <View style={st.cardTop}>
                  <View style={[st.fieldIconWrap, { backgroundColor: resolved === 'dark' ? '#2A1F5E' : COLORS.purpleBg, borderColor: resolved === 'dark' ? '#4C1D95' : COLORS.purpleBorder }]}>
                    <MaterialIcons name="stadium" size={20} color={COLORS.purpleIcon} />
                  </View>
                  <View style={st.cardTopInfo}>
                    <Text style={[st.fieldName, { color: colors.text }]} numberOfLines={1}>{f.name}</Text>
                    <View style={st.sportTag}>
                      <MaterialIcons name="sports" size={11} color={COLORS.purpleIcon} />
                      <Text style={st.sportText}>{f.sport_type?.toUpperCase()}</Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
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
                    <MaterialIcons name="verified" size={16} color={COLORS.onPrimary} />
                    <Text style={st.approveBtnText}>{submittingId === f.id ? 'Menyetujui...' : 'Setujui'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[st.rejectBtn, { backgroundColor: resolved === 'dark' ? '#2A1F26' : colors.errorContainer, borderColor: colors.error + '30' }, submittingId === f.id && st.disabledBtn]}
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
      </View>

      <Modal visible={!!rejectTarget} transparent animationType="fade" onRequestClose={() => setRejectTarget(null)}>
        <View style={st.modalOverlay}>
          <View style={[st.rejectModal, { backgroundColor: cardSurface, borderColor: colors.outline }]}>
            <View style={st.rejectHeader}>
              <View style={[st.rejectIconWrap, { backgroundColor: resolved === 'dark' ? '#3B1A1A' : COLORS.errorLight }]}>
                <MaterialIcons name="cancel" size={22} color={COLORS.error} />
              </View>
              <Text style={[st.rejectTitle, { color: colors.text }]}>Alasan Penolakan</Text>
            </View>
            <Text style={[st.rejectSubtitle, { color: colors.textSecondary }]}>
              Alasan ini akan disimpan saat lapangan ditolak.
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
                onPress={() => { setRejectTarget(null); setRejectReason(''); }}
              >
                <Text style={[st.cancelBtnText, { color: colors.textSecondary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.confirmRejectBtn, submittingId !== null && st.disabledBtn]}
                onPress={confirmReject}
                disabled={submittingId !== null}
              >
                <Text style={st.confirmRejectText}>Tolak Lapangan</Text>
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
        iconColor={COLORS.primary}
        iconBg={COLORS.primaryContainer}
        loading={submittingId !== null}
        onCancel={() => setApproveTarget(null)}
        confirmLabel="Setujui Lapangan"
        onConfirm={confirmApprove}
      />
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
    backgroundColor: COLORS.purpleBg, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.purpleBorder,
  },
  countText: { ...FONTS.labelSm, color: COLORS.purpleText },
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
    backgroundColor: COLORS.purpleBg, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.purpleBorder,
  },
  cardTopInfo: { flex: 1 },
  fieldName: { ...FONTS.titleLg, color: COLORS.text, marginBottom: 5 },
  sportTag: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  sportText: { ...FONTS.labelSm, color: COLORS.purpleText },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  addressText: { ...FONTS.bodySm, color: COLORS.textSecondary, flex: 1 },

  approveBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12,
    minHeight: 46,
  },
  approveBtnText: { ...FONTS.titleSm, color: COLORS.onPrimary },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, minHeight: 46,
  },
  rejectBtnText: { ...FONTS.titleSm },
  disabledBtn: { opacity: 0.6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
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
    backgroundColor: COLORS.error, minHeight: 44, justifyContent: 'center', alignItems: 'center',
  },
  confirmRejectText: { ...FONTS.titleSm, color: COLORS.onPrimary },

  modalHeaderBar: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.outline,
  },
  closeBtn: { padding: 4 },
  modalHeaderTitle: { ...FONTS.headlineSm, color: COLORS.text },
});
