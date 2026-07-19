import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  RefreshControl, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// DUMMY DATA FOR NOW — because backend booking endpoint is not implemented yet
const DUMMY_BOOKINGS = [
  {
    id: 1, code: 'BK-12093', 
    renter_name: 'Budi Santoso', renter_phone: '081234567890',
    field_name: 'Lapangan Futsal A', sport_type: 'futsal',
    date: '2026-07-20', time: '18:00 - 20:00',
    price: 350000, status: 'pending' // pending, active, completed, cancelled
  },
  {
    id: 2, code: 'BK-12094', 
    renter_name: 'Andi Wijaya', renter_phone: '081298765432',
    field_name: 'Minisoccer Premium', sport_type: 'minisoccer',
    date: '2026-07-21', time: '15:00 - 17:00',
    price: 500000, status: 'active'
  },
];

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  active: { label: 'Terkonfirmasi', bg: '#064e3b', color: '#34d399', icon: 'check-circle' },
  pending: { label: 'Menunggu', bg: '#451a03', color: '#f59e0b', icon: 'schedule' },
  completed: { label: 'Selesai', bg: '#1e3a8a', color: '#60a5fa', icon: 'done-all' },
  cancelled: { label: 'Dibatalkan', bg: '#450a0a', color: '#f87171', icon: 'cancel' },
};

export default function OwnerBookingsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active'>('all');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000); // dummy delay
  };

  const handleConfirm = (code: string) => {
    Alert.alert('Konfirmasi Booking', `Apakah Anda yakin ingin mengonfirmasi ${code}? \n\n(Catatan: Fitur ini menggunakan dummy data karena endpoint belum ada)`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Konfirmasi', onPress: () => Alert.alert('Sukses', 'Booking dikonfirmasi (Simulasi).') }
    ]);
  };

  const handleCancel = (code: string) => {
    Alert.alert('Batalkan Booking', `Apakah Anda yakin ingin membatalkan ${code}? \n\n(Catatan: Fitur ini menggunakan dummy data)`, [
      { text: 'Tutup', style: 'cancel' },
      { text: 'Batalkan', style: 'destructive', onPress: () => Alert.alert('Dibatalkan', 'Booking dibatalkan (Simulasi).') }
    ]);
  };

  const filteredBookings = DUMMY_BOOKINGS.filter(b => activeTab === 'all' || b.status === activeTab);

  return (
    <View style={st.container}>
      <View style={st.headerBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.tabScroll}>
          <TouchableOpacity 
            style={[st.tabBtn, activeTab === 'all' && st.tabActive]} 
            onPress={() => setActiveTab('all')}
          >
            <Text style={[st.tabText, activeTab === 'all' && st.tabTextActive]}>Semua</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[st.tabBtn, activeTab === 'pending' && st.tabActive]} 
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[st.tabText, activeTab === 'pending' && { color: '#f59e0b' }]}>Menunggu</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[st.tabBtn, activeTab === 'active' && st.tabActive]} 
            onPress={() => setActiveTab('active')}
          >
            <Text style={[st.tabText, activeTab === 'active' && { color: '#34d399' }]}>Terkonfirmasi</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={st.contentList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" />}
        showsVerticalScrollIndicator={false}
      >
        {filteredBookings.length === 0 ? (
          <View style={st.emptyWrap}>
            <View style={st.emptyIcon}>
              <MaterialIcons name="event-busy" size={40} color="#1e293b" />
            </View>
            <Text style={st.emptyTitle}>Tidak ada booking</Text>
            <Text style={st.emptyDesc}>Belum ada booking dengan status ini.</Text>
          </View>
        ) : (
          filteredBookings.map((b) => {
            const status = STATUS_CFG[b.status] || STATUS_CFG.pending;
            const priceStr = `Rp${b.price.toLocaleString('id-ID')}`;
            
            return (
              <View key={b.id} style={st.card}>
                <View style={st.cardHeader}>
                  <View style={st.headerLeft}>
                    <Text style={st.bookingCode}>{b.code}</Text>
                  </View>
                  <View style={[st.statusBadge, { backgroundColor: status.bg, borderColor: status.color + '44' }]}>
                    <MaterialIcons name={status.icon as any} size={11} color={status.color} />
                    <Text style={[st.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={st.divider} />

                <View style={st.detailGrid}>
                  <View style={st.detailCol}>
                    <Text style={st.detailLabel}>Penyewa</Text>
                    <Text style={st.detailVal}>{b.renter_name}</Text>
                    <Text style={st.detailSub}>{b.renter_phone}</Text>
                  </View>
                  <View style={st.detailCol}>
                    <Text style={st.detailLabel}>Lapangan</Text>
                    <Text style={st.detailVal}>{b.field_name}</Text>
                    <Text style={st.detailSub}>{b.sport_type.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={st.scheduleRow}>
                  <View style={st.scheduleItem}>
                    <MaterialIcons name="event" size={14} color="#64748b" />
                    <Text style={st.scheduleText}>{b.date}</Text>
                  </View>
                  <View style={st.scheduleDot} />
                  <View style={st.scheduleItem}>
                    <MaterialIcons name="schedule" size={14} color="#64748b" />
                    <Text style={st.scheduleText}>{b.time}</Text>
                  </View>
                  <View style={st.pricePill}>
                    <Text style={st.priceText}>{priceStr}</Text>
                  </View>
                </View>

                {b.status === 'pending' && (
                  <View style={st.actions}>
                    <TouchableOpacity style={st.approveBtn} activeOpacity={0.8} onPress={() => handleConfirm(b.code)}>
                      <MaterialIcons name="check" size={16} color="#fff" />
                      <Text style={st.approveBtnText}>Konfirmasi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={st.rejectBtn} activeOpacity={0.8} onPress={() => handleCancel(b.code)}>
                      <MaterialIcons name="close" size={16} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                )}
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
  
  headerBar: {
    backgroundColor: '#0d1117', borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  tabScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  tabBtn: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#0d1117',
  },
  tabActive: { backgroundColor: '#1e293b' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#f1f5f9' },
  
  contentList: { padding: 16, paddingBottom: 60 },
  
  emptyWrap: { alignItems: 'center', marginTop: 100, gap: 10 },
  emptyIcon: { width: 70, height: 70, borderRadius: 20, backgroundColor: '#0d1117', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  emptyDesc: { fontSize: 13, color: '#475569', textAlign: 'center' },
  
  card: {
    backgroundColor: '#0d1117', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#1e293b',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookingCode: { fontSize: 16, fontWeight: '800', color: '#f1f5f9', letterSpacing: 0.5 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 14 },
  
  detailGrid: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailVal: { fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 2 },
  detailSub: { fontSize: 12, color: '#94a3b8' },
  
  scheduleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 10, borderRadius: 12 },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scheduleText: { fontSize: 12, fontWeight: '600', color: '#cbd5e1' },
  scheduleDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#475569', marginHorizontal: 8 },
  pricePill: { marginLeft: 'auto', backgroundColor: '#052e16', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#166534' },
  priceText: { fontSize: 12, fontWeight: '700', color: '#4ade80' },
  
  actions: { flexDirection: 'row', gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1e293b' },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#14532d', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#166534' },
  approveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  rejectBtn: { width: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2d0f0f', borderRadius: 10, borderWidth: 1, borderColor: '#7f1d1d' },
});
