import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, TextInput, RefreshControl, Modal,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../../app/_layout';
import { API_BASE_URL } from '../../lib/api';

export default function OwnerRequestPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ id: number; visible: boolean }>({ id: 0, visible: false });
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      const message = data.errors
        ? Object.values(data.errors).flat().join(' ')
        : data.message || 'Gagal memproses pengajuan.';
      throw new Error(message);
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
    if (Platform.OS === 'web') {
      if (window.confirm(`Setujui pengajuan dari "${name}"?`)) {
        approveRequest(id);
      }
      return;
    }

    Alert.alert('Setujui Pengajuan', `Setujui pengajuan dari "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Setujui', onPress: () => approveRequest(id) },
    ]);
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
      <View style={st.loadingWrap}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={st.loadingText}>Memuat pengajuan...</Text>
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View style={st.emptyWrap}>
        <View style={st.emptyIconWrap}>
          <MaterialIcons name="inventory" size={40} color="#1e293b" />
        </View>
        <Text style={st.emptyTitle}>Semua Beres!</Text>
        <Text style={st.emptyDesc}>Tidak ada pengajuan yang menunggu.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={st.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" colors={['#4ade80']} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={st.headerRow}>
          <View style={st.countPill}>
            <MaterialIcons name="pending-actions" size={12} color="#f59e0b" />
            <Text style={st.countText}>{requests.length} menunggu review</Text>
          </View>
        </View>

        {requests.map((r: any) => (
          <View key={r.id} style={st.card}>
            {/* Card header */}
            <View style={st.cardTop}>
              <View style={st.businessIconWrap}>
                <MaterialIcons name="store" size={20} color="#f59e0b" />
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
                <MaterialIcons name={row.icon as any} size={14} color="#475569" />
                <Text style={st.detailText} numberOfLines={1}>{row.label}</Text>
              </View>
            ))}

            {/* Actions */}
            <View style={st.actions}>
              <TouchableOpacity style={st.approveBtn} onPress={() => handleApprove(r.id, r.name)} activeOpacity={0.8}>
                <MaterialIcons name="check-circle" size={16} color="#fff" />
                <Text style={st.approveBtnText}>Setujui</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.rejectBtn} onPress={() => setRejectModal({ id: r.id, visible: true })} activeOpacity={0.8}>
                <MaterialIcons name="cancel" size={16} color="#f87171" />
                <Text style={st.rejectBtnText}>Tolak</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={rejectModal.visible} transparent animationType="fade" onRequestClose={() => setRejectModal({ id: 0, visible: false })}>
        <View style={st.modalOverlay}>
          <View style={st.modal}>
            <View style={st.modalHeader}>
              <View style={st.modalIconWrap}>
                <MaterialIcons name="cancel" size={22} color="#f87171" />
              </View>
              <Text style={st.modalTitle}>Alasan Penolakan</Text>
            </View>
            <Text style={st.modalSub}>Opsional — akan dikirim ke pemohon.</Text>
            <TextInput
              style={st.modalInput}
              placeholder="Contoh: Data tidak lengkap..."
              placeholderTextColor="#334155"
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={st.modalActions}>
              <TouchableOpacity style={st.cancelBtn} onPress={() => { setRejectModal({ id: 0, visible: false }); setRejectReason(''); }}>
                <Text style={st.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.confirmBtn, submitting && { opacity: 0.6 }]} onPress={handleReject} disabled={submitting}>
                <Text style={st.confirmText}>{submitting ? 'Menolak...' : 'Tolak'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 80 },
  loadingText: { color: '#475569', fontSize: 14 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 100 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: '#0d1117',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b', marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0' },
  emptyDesc: { fontSize: 13, color: '#475569' },
  headerRow: { flexDirection: 'row', marginBottom: 14 },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#451a03', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#92400e',
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
  card: {
    backgroundColor: '#0d1117', borderRadius: 18, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#1e293b',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  businessIconWrap: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: '#451a03',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#92400e',
  },
  cardTopInfo: { flex: 1 },
  businessName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9', marginBottom: 5 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#f59e0b' },
  pendingText: { fontSize: 11, fontWeight: '600', color: '#f59e0b' },
  divider: { height: 1, backgroundColor: '#1e293b', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  detailText: { fontSize: 13, color: '#94a3b8', flex: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#14532d', paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderColor: '#166534',
  },
  approveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#2d0f0f', paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderColor: '#7f1d1d',
  },
  rejectBtnText: { color: '#f87171', fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#0d1117', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  modalIconWrap: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: '#2d0f0f',
    justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#f1f5f9' },
  modalSub: { fontSize: 12, color: '#475569', marginBottom: 16, marginLeft: 50 },
  modalInput: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14, color: '#e2e8f0',
    fontSize: 14, minHeight: 90, textAlignVertical: 'top', marginBottom: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingVertical: 11, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#1e293b' },
  cancelText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  confirmBtn: { paddingVertical: 11, paddingHorizontal: 24, borderRadius: 10, backgroundColor: '#7f1d1d' },
  confirmText: { color: '#fca5a5', fontSize: 14, fontWeight: '700' },
});
