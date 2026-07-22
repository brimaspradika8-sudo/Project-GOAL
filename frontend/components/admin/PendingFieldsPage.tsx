import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Alert, RefreshControl, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../../app/_layout';
import { API_BASE_URL, getErrorMessage } from '../../lib/api';
import { COLORS, FONTS, SIZES, SHADOWS } from '../goalTheme';
import { SkeletonCards } from '../Skeleton';
import DashboardHeader from '../shared/DashboardHeader';
import TrashedFieldsPage from './TrashedFieldsPage';
import ConfirmActionModal from './ConfirmActionModal';

export default function PendingFieldsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [showTrashedModal, setShowTrashedModal] = useState(false);
  const [approveTarget, setApproveTarget] = useState<{ id: number; name: string } | null>(null);

  const fetchFields = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/pending/list`, {
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      setFields(data?.data ?? []);
    } catch {
      Alert.alert('Error', 'Gagal memuat data.');
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
      const token = await AsyncStorage.getItem(TOKEN_KEY);
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

      Alert.alert('Berhasil', 'Lapangan disetujui.');
      fetchFields();
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Gagal menyetujui lapangan.');
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
      const token = await AsyncStorage.getItem(TOKEN_KEY);
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
      Alert.alert('Berhasil', 'Lapangan disetujui.');
      fetchFields();
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Gagal menyetujui lapangan.');
    } finally {
      setSubmittingId(null);
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

                <TouchableOpacity
                  style={[st.approveBtn, submittingId === f.id && st.disabledBtn]}
                  onPress={() => handleApprove(f.id, f.name)}
                  activeOpacity={0.8}
                  disabled={submittingId === f.id}
                >
                  <MaterialIcons name="verified" size={16} color={COLORS.onPrimary} />
                  <Text style={st.approveBtnText}>{submittingId === f.id ? 'Menyetujui...' : 'Setujui Lapangan'}</Text>
                </TouchableOpacity>
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
      <ConfirmActionModal
        visible={!!approveTarget}
        title={`Setujui "${approveTarget?.name ?? ''}"?`}
        description="Lapangan akan disetujui dan terlihat oleh semua pengguna."
        icon="check-circle"
        iconColor={COLORS.primary}
        iconBg={COLORS.primaryContainer}
        loading={submittingId !== null}
        onCancel={() => setApproveTarget(null)}
        options={[{
          label: 'Setujui Lapangan',
          icon: 'verified',
          onPress: confirmApprove,
        }]}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12,
    minHeight: 46,
  },
  approveBtnText: { ...FONTS.titleSm, color: COLORS.onPrimary },
  disabledBtn: { opacity: 0.6 },

  modalHeaderBar: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.outline,
  },
  closeBtn: { padding: 4 },
  modalHeaderTitle: { ...FONTS.headlineSm, color: COLORS.text },
});
