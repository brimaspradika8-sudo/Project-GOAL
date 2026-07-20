import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  RefreshControl, Alert, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// DUMMY DATA
const DUMMY_BOOKINGS = [
  {
    id: 1, code: 'BK-12093', 
    renter_name: 'Budi Santoso', renter_phone: '081234567890',
    field_name: 'Lapangan Futsal A', sport_type: 'futsal',
    date: '2026-07-20', time: '18:00 - 20:00',
    price: 350000, status: 'pending'
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
  active: { label: 'Terkonfirmasi', bg: 'rgba(6,78,59,0.4)', color: '#34d399', icon: 'check-circle' },
  pending: { label: 'Menunggu', bg: 'rgba(69,26,3,0.5)', color: '#f59e0b', icon: 'schedule' },
  completed: { label: 'Selesai', bg: 'rgba(30,58,138,0.4)', color: '#60a5fa', icon: 'done-all' },
  cancelled: { label: 'Dibatalkan', bg: 'rgba(69,10,10,0.5)', color: '#f87171', icon: 'cancel' },
};

export default function OwnerBookingsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active'>('all');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000); // dummy delay
  };

  const handleConfirm = (code: string) => {
    Alert.alert('Konfirmasi Booking', `Apakah Anda yakin ingin mengonfirmasi ${code}? \n\n(Catatan: Fitur ini menggunakan dummy data)`, [
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
      {/* App Header Emulation */}
      <View style={st.headerBar}>
        <Text style={st.pageTitle}>Daftar Booking</Text>
        <Text style={st.pageSubtitle}>Pantau dan kelola jadwal lapangan Anda.</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.tabScroll}>
          <TouchableOpacity style={[st.tabBtn, activeTab === 'all' && st.tabActive]} onPress={() => setActiveTab('all')}>
            <Text style={[st.tabText, activeTab === 'all' && st.tabTextActive]}>Semua</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.tabBtn, activeTab === 'pending' && st.tabActive]} onPress={() => setActiveTab('pending')}>
            <View style={[st.dot, { backgroundColor: '#f59e0b' }]} />
            <Text style={[st.tabText, activeTab === 'pending' && st.tabTextActive]}>Menunggu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.tabBtn, activeTab === 'active' && st.tabActive]} onPress={() => setActiveTab('active')}>
            <View style={[st.dot, { backgroundColor: '#34d399' }]} />
            <Text style={[st.tabText, activeTab === 'active' && st.tabTextActive]}>Terkonfirmasi</Text>
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
              <MaterialIcons name="event-busy" size={40} color="#334155" />
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
                    <View style={st.iconWrap}>
                      <MaterialIcons name="receipt-long" size={16} color="#60a5fa" />
                    </View>
                    <Text style={st.bookingCode}>{b.code}</Text>
                  </View>
                  <View style={[st.statusBadge, { backgroundColor: status.bg, borderColor: status.color + '44' }]}>
                    <MaterialIcons name={status.icon as any} size={11} color={status.color} />
                    <Text style={[st.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={st.detailGrid}>
                  <View style={st.detailCol}>
                    <View style={st.detailLabelWrap}>
                      <MaterialIcons name="person" size={12} color="#64748b" />
                      <Text style={st.detailLabel}>Penyewa</Text>
                    </View>
                    <Text style={st.detailVal}>{b.renter_name}</Text>
                    <Text style={st.detailSub}>{b.renter_phone}</Text>
                  </View>
                  
                  <View style={st.colDivider} />

                  <View style={st.detailCol}>
                    <View style={st.detailLabelWrap}>
                      <MaterialIcons name="stadium" size={12} color="#64748b" />
                      <Text style={st.detailLabel}>Lapangan</Text>
                    </View>
                    <Text style={st.detailVal}>{b.field_name}</Text>
                    <Text style={st.detailSub}>{b.sport_type.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={st.scheduleRow}>
                  <View style={st.scheduleItem}>
                    <MaterialIcons name="event" size={14} color="#94a3b8" />
                    <Text style={st.scheduleText}>{b.date}</Text>
                  </View>
                  <View style={st.scheduleDot} />
                  <View style={st.scheduleItem}>
                    <MaterialIcons name="schedule" size={14} color="#94a3b8" />
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
                      <Text style={st.approveBtnText}>Konfirmasi Penyatuan</Text>
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
  container: { flex: 1, backgroundColor: '#090d14' }, // deeper dark
  
  headerBar: {
    paddingTop: 16, paddingBottom: 0,
    backgroundColor: '#0d121c',
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc', paddingHorizontal: 20, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#64748b', paddingHorizontal: 20, marginBottom: 16 },

  tabScroll: { paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: '#1e293b',
  },
  tabActive: { backgroundColor: '#1e293b', borderColor: '#334155' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#f1f5f9' },
  
  contentList: { padding: 20, paddingBottom: 100 },
  
  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#0d121c', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#f1f5f9' },
  emptyDesc: { fontSize: 14, color: '#475569', textAlign: 'center' },
  
  card: {
    backgroundColor: '#0d121c', borderRadius: 20, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: '#1e293b',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(96,165,250,0.1)', justifyContent: 'center', alignItems: 'center' },
  bookingCode: { fontSize: 16, fontWeight: '800', color: '#e2e8f0', letterSpacing: 0.5 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  
  detailGrid: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' },
  detailCol: { flex: 1 },
  colDivider: { width: 1, backgroundColor: '#1e293b', marginHorizontal: 14 },
  detailLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailVal: { fontSize: 14, fontWeight: '700', color: '#e2e8f0', marginBottom: 2 },
  detailSub: { fontSize: 12, color: '#94a3b8' },
  
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scheduleText: { fontSize: 13, fontWeight: '600', color: '#e2e8f0' },
  scheduleDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#475569', marginHorizontal: 10 },
  pricePill: { marginLeft: 'auto', backgroundColor: 'rgba(74,222,128,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)' },
  priceText: { fontSize: 14, fontWeight: '800', color: '#4ade80' },
  
  actions: { flexDirection: 'row', gap: 10, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#064e3b', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#166534' },
  approveBtnText: { color: '#4ade80', fontSize: 14, fontWeight: '700' },
  rejectBtn: { width: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#450a0a', borderRadius: 12, borderWidth: 1, borderColor: '#7f1d1d' },
});
