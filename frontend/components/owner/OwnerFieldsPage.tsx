import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../../app/_layout';
import { API_BASE_URL } from '../../lib/api';

const IMG_PLACEHOLDER = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop';

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  approved: { label: 'Aktif', bg: '#064e3b', color: '#34d399' },
  pending: { label: 'Menunggu', bg: '#451a03', color: '#f59e0b' },
  rejected: { label: 'Ditolak', bg: '#450a0a', color: '#f87171' },
};

export default function OwnerFieldsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFields = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/my/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFields(data?.data ?? []);
    } catch {
      Alert.alert('Error', 'Gagal memuat data lapangan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFields(); }, [fetchFields]);
  const onRefresh = () => { setRefreshing(true); fetchFields(); };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Hapus Lapangan', `Hapus lapangan "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          const token = await AsyncStorage.getItem(TOKEN_KEY);
          const res = await fetch(`${API_BASE_URL}/fields/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) { Alert.alert('Berhasil', 'Lapangan dihapus.'); fetchFields(); }
          else Alert.alert('Error', 'Gagal menghapus lapangan.');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={st.loadingWrap}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={st.loadingText}>Memuat lapangan...</Text>
      </View>
    );
  }

  return (
    <View style={st.container}>
      <View style={st.headerBar}>
        <View style={st.statsWrap}>
          <MaterialIcons name="stadium" size={14} color="#4ade80" />
          <Text style={st.statsText}>{fields.length} Lapangan</Text>
        </View>
        <TouchableOpacity style={st.addBtn} activeOpacity={0.8} onPress={() => Alert.alert('Segera Hadir', 'Form tambah lapangan akan segera tersedia.')}>
          <MaterialIcons name="add-circle" size={16} color="#fff" />
          <Text style={st.addBtnText}>Lapan Baru</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={st.contentList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" />}
        showsVerticalScrollIndicator={false}
      >
        {fields.length === 0 ? (
          <View style={st.emptyWrap}>
            <View style={st.emptyIcon}>
              <MaterialIcons name="sports-soccer" size={40} color="#1e293b" />
            </View>
            <Text style={st.emptyTitle}>Belum ada lapangan</Text>
            <Text style={st.emptyDesc}>Ketuk Lapan Baru untuk mulai menyewakan venue Anda.</Text>
          </View>
        ) : (
          fields.map((f: any) => {
            const status = STATUS_CFG[f.status] || STATUS_CFG.pending;
            const img = f.image_url || IMG_PLACEHOLDER;
            const priceStr = f.price_per_hour ? `Rp${f.price_per_hour.toLocaleString('id-ID')}` : 'Hubungi';
            
            return (
              <View key={f.id} style={st.card}>
                <Image source={{ uri: img }} style={st.cardImg} />
                <View style={st.cardOverlay}>
                  <View style={[st.statusBadge, { backgroundColor: status.bg }]}>
                    <View style={[st.statusDot, { backgroundColor: status.color }]} />
                    <Text style={[st.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
                
                <View style={st.cardBody}>
                  <View style={st.cardTop}>
                    <Text style={st.name} numberOfLines={1}>{f.name}</Text>
                    <Text style={st.price}>{priceStr}<Text style={st.priceSub}>/jam</Text></Text>
                  </View>
                  
                  <View style={st.detailRow}>
                    <MaterialIcons name="location-on" size={13} color="#64748b" />
                    <Text style={st.detailText} numberOfLines={1}>{f.location || f.address || '-'}</Text>
                  </View>
                  
                  <View style={st.detailRow}>
                    <MaterialIcons name="sports" size={13} color="#64748b" />
                    <Text style={st.detailText}>{f.sport_type?.toUpperCase()}</Text>
                  </View>

                  <View style={st.actions}>
                    <TouchableOpacity style={st.editBtn} activeOpacity={0.8} onPress={() => Alert.alert('Segera Hadir', 'Halaman edit dalam pengembangan.')}>
                      <MaterialIcons name="edit" size={15} color="#4ade80" />
                      <Text style={st.editBtnText}>Edit Data</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={st.delBtn} activeOpacity={0.8} onPress={() => handleDelete(f.id, f.name)}>
                      <MaterialIcons name="delete" size={15} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c10' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#475569', fontSize: 13 },
  
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0d1117',
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  statsWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#052e16', paddingVertical: 5, paddingHorizontal: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#166534',
  },
  statsText: { fontSize: 11, fontWeight: '700', color: '#4ade80' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#4ade80', paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: 10,
  },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#064e3b' },
  
  contentList: { padding: 16, paddingBottom: 60 },
  
  emptyWrap: { alignItems: 'center', marginTop: 100, gap: 10 },
  emptyIcon: { width: 70, height: 70, borderRadius: 20, backgroundColor: '#0d1117', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  emptyDesc: { fontSize: 13, color: '#475569', textAlign: 'center', paddingHorizontal: 20 },
  
  card: {
    backgroundColor: '#0d1117', borderRadius: 16, marginBottom: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b',
  },
  cardImg: { width: '100%', height: 130 },
  cardOverlay: { position: 'absolute', top: 12, right: 12 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  
  cardBody: { padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 15, fontWeight: '700', color: '#f1f5f9', flex: 1, marginRight: 10 },
  price: { fontSize: 13, fontWeight: '800', color: '#4ade80' },
  priceSub: { fontSize: 10, fontWeight: '500', color: '#64748b' },
  
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  detailText: { fontSize: 12, color: '#64748b', flex: 1 },
  
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#064e3b', paddingVertical: 10, borderRadius: 10 },
  editBtnText: { color: '#4ade80', fontSize: 12, fontWeight: '700' },
  delBtn: { width: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2d0f0f', borderRadius: 10 },
});
