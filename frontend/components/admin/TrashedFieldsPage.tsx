import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../../app/_layout';
import { API_BASE_URL } from '../../lib/api';

export default function TrashedFieldsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFields = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/trashed/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
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

  const handleRestore = (id: number, name: string) => {
    Alert.alert('Pulihkan Lapangan', `Pulihkan "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Pulihkan', onPress: async () => {
          const token = await AsyncStorage.getItem(TOKEN_KEY);
          const res = await fetch(`${API_BASE_URL}/fields/${id}/restore`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) { Alert.alert('Berhasil', 'Lapangan dipulihkan.'); fetchFields(); }
          else Alert.alert('Error', 'Gagal memulihkan.');
        },
      },
    ]);
  };

  const handleForceDelete = (id: number, name: string) => {
    Alert.alert('Hapus Permanen', `Hapus permanen "${name}"? Tidak bisa dibatalkan.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          const token = await AsyncStorage.getItem(TOKEN_KEY);
          const res = await fetch(`${API_BASE_URL}/fields/${id}/force`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) { Alert.alert('Berhasil', 'Lapangan dihapus permanen.'); fetchFields(); }
          else Alert.alert('Error', 'Gagal menghapus.');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={st.loadingWrap}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={st.loadingText}>Memuat sampah...</Text>
      </View>
    );
  }

  if (fields.length === 0) {
    return (
      <View style={st.emptyWrap}>
        <View style={st.emptyIconWrap}>
          <MaterialIcons name="delete-sweep" size={40} color="#334155" />
        </View>
        <Text style={st.emptyTitle}>Tempat Sampah Kosong</Text>
        <Text style={st.emptyDesc}>Tidak ada lapangan yang dihapus.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={st.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" colors={['#4ade80']} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={st.headerRow}>
        <View style={st.countPill}>
          <MaterialIcons name="auto-delete" size={12} color="#f87171" />
          <Text style={st.countText}>{fields.length} lapangan terhapus</Text>
        </View>
        <Text style={st.warningText}>Hati-hati — hapus permanen tidak bisa dikembalikan</Text>
      </View>

      {fields.map((f: any) => (
        <View key={f.id} style={st.card}>
          <View style={st.cardMain}>
            <View style={st.fieldIconWrap}>
              <MaterialIcons name="delete" size={20} color="#f87171" />
            </View>
            <View style={st.cardInfo}>
              <Text style={st.fieldName} numberOfLines={1}>{f.name}</Text>
              <View style={st.tagRow}>
                {f.sport_type && (
                  <View style={st.sportTag}>
                    <Text style={st.sportText}>{f.sport_type.toUpperCase()}</Text>
                  </View>
                )}
                <View style={st.deletedTag}>
                  <Text style={st.deletedText}>Dihapus</Text>
                </View>
              </View>
            </View>
          </View>

          {f.deleted_at && (
            <View style={st.deletedRow}>
              <MaterialIcons name="schedule" size={12} color="#475569" />
              <Text style={st.deletedAt}>Dihapus: {new Date(f.deleted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            </View>
          )}

          <View style={st.actions}>
            <TouchableOpacity style={st.restoreBtn} onPress={() => handleRestore(f.id, f.name)} activeOpacity={0.8}>
              <MaterialIcons name="restore" size={16} color="#4ade80" />
              <Text style={st.restoreBtnText}>Pulihkan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.deleteBtn} onPress={() => handleForceDelete(f.id, f.name)} activeOpacity={0.8}>
              <MaterialIcons name="delete-forever" size={16} color="#f87171" />
              <Text style={st.deleteBtnText}>Hapus Permanen</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
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
  headerRow: { marginBottom: 14 },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2d0f0f', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#7f1d1d', alignSelf: 'flex-start', marginBottom: 6,
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#f87171' },
  warningText: { fontSize: 11, color: '#475569' },
  card: {
    backgroundColor: '#0d1117', borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#1e293b',
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  fieldIconWrap: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: '#2d0f0f',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#7f1d1d',
  },
  cardInfo: { flex: 1 },
  fieldName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9', marginBottom: 6 },
  tagRow: { flexDirection: 'row', gap: 6 },
  sportTag: {
    backgroundColor: '#1e293b', borderRadius: 5, paddingVertical: 2, paddingHorizontal: 7,
  },
  sportText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  deletedTag: {
    backgroundColor: '#2d0f0f', borderRadius: 5, paddingVertical: 2, paddingHorizontal: 7,
    borderWidth: 1, borderColor: '#7f1d1d',
  },
  deletedText: { fontSize: 10, fontWeight: '700', color: '#f87171' },
  deletedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  deletedAt: { fontSize: 11, color: '#475569' },
  actions: { flexDirection: 'row', gap: 10 },
  restoreBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#052e16', paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderColor: '#166534',
  },
  restoreBtnText: { color: '#4ade80', fontSize: 13, fontWeight: '700' },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#2d0f0f', paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderColor: '#7f1d1d',
  },
  deleteBtnText: { color: '#f87171', fontSize: 13, fontWeight: '700' },
});
