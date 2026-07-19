import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../../app/_layout';
import { API_BASE_URL } from '../../lib/api';

export default function PendingFieldsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFields = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/pending/list`, {
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

  const handleApprove = (id: number, name: string) => {
    Alert.alert('Setujui Lapangan', `Setujui "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Setujui', onPress: async () => {
          const token = await AsyncStorage.getItem(TOKEN_KEY);
          const res = await fetch(`${API_BASE_URL}/fields/${id}/approve`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) { Alert.alert('Berhasil', 'Lapangan disetujui.'); fetchFields(); }
          else Alert.alert('Error', 'Gagal menyetujui.');
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

  if (fields.length === 0) {
    return (
      <View style={st.emptyWrap}>
        <View style={st.emptyIconWrap}>
          <MaterialIcons name="check-circle" size={40} color="#14532d" />
        </View>
        <Text style={st.emptyTitle}>Semua Sudah Diverifikasi</Text>
        <Text style={st.emptyDesc}>Tidak ada lapangan yang menunggu.</Text>
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
          <MaterialIcons name="pending-actions" size={12} color="#a78bfa" />
          <Text style={st.countText}>{fields.length} lapangan pending</Text>
        </View>
      </View>

      {fields.map((f: any) => (
        <TouchableOpacity
          key={f.id}
          style={st.card}
          activeOpacity={0.85}
          onPress={() => router.push(`/venue-detail?id=${f.id}`)}
        >
          <View style={st.cardTop}>
            <View style={st.fieldIconWrap}>
              <MaterialIcons name="stadium" size={20} color="#a78bfa" />
            </View>
            <View style={st.cardTopInfo}>
              <Text style={st.fieldName} numberOfLines={1}>{f.name}</Text>
              <View style={st.sportTag}>
                <MaterialIcons name="sports" size={11} color="#a78bfa" />
                <Text style={st.sportText}>{f.sport_type?.toUpperCase()}</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#334155" />
          </View>

          {f.address && (
            <View style={st.addressRow}>
              <MaterialIcons name="location-on" size={13} color="#475569" />
              <Text style={st.addressText} numberOfLines={1}>{f.address}</Text>
            </View>
          )}

          <TouchableOpacity
            style={st.approveBtn}
            onPress={() => handleApprove(f.id, f.name)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="verified" size={16} color="#fff" />
            <Text style={st.approveBtnText}>Setujui Lapangan</Text>
          </TouchableOpacity>
        </TouchableOpacity>
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
    width: 80, height: 80, borderRadius: 24, backgroundColor: '#052e16',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#166534', marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0' },
  emptyDesc: { fontSize: 13, color: '#475569' },
  headerRow: { flexDirection: 'row', marginBottom: 14 },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2e1065', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#5b21b6',
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#a78bfa' },
  card: {
    backgroundColor: '#0d1117', borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#1e293b',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  fieldIconWrap: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: '#2e1065',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#5b21b6',
  },
  cardTopInfo: { flex: 1 },
  fieldName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9', marginBottom: 5 },
  sportTag: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  sportText: { fontSize: 10, fontWeight: '700', color: '#a78bfa' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  addressText: { fontSize: 12, color: '#475569', flex: 1 },
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#14532d', paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#166534',
  },
  approveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
