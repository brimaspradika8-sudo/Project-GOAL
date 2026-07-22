import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../../app/_layout';
import { API_BASE_URL } from '../../lib/api';
import { COLORS, FONTS, SIZES, SHADOWS } from '../goalTheme';
import DashboardHeader from '../shared/DashboardHeader';
import { SkeletonCards } from '../Skeleton';

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  confirmed: { label: 'Terkonfirmasi', bg: COLORS.primaryContainer, color: COLORS.primary, icon: 'check-circle' },
  pending:   { label: 'Menunggu',      bg: COLORS.floodlight + '20', color: '#92400e', icon: 'schedule' },
  completed: { label: 'Selesai',       bg: COLORS.surfaceContainerHigh, color: COLORS.textSecondary, icon: 'done-all' },
  cancelled: { label: 'Dibatalkan',    bg: COLORS.errorContainer, color: COLORS.error, icon: 'cancel' },
};

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed'>('all');

  const fetchBookings = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/owner/bookings`, {
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        setBookings([]);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setBookings(data?.data ?? []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  const onRefresh = () => { setRefreshing(true); fetchBookings(); };

  const filteredBookings = bookings.filter(b =>
    activeTab === 'all' || b.status === activeTab
  );

  const TABS = [
    { key: 'all',       label: 'Semua' },
    { key: 'pending',   label: 'Menunggu' },
    { key: 'confirmed', label: 'Terkonfirmasi' },
  ] as const;

  return (
    <View style={st.screen}>
      <DashboardHeader title="Daftar Booking" subtitle="Pantau dan kelola jadwal lapangan Anda" />
      
      {/* Tab filter */}
      <View style={st.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[st.tabBtn, activeTab === t.key && st.tabBtnActive]}
            onPress={() => setActiveTab(t.key)}
            activeOpacity={0.75}
          >
            <Text style={[st.tabText, activeTab === t.key && st.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={st.loadingWrap}>
          <SkeletonCards count={3} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={st.contentList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredBookings.length === 0 ? (
            <View style={st.emptyWrap}>
              <View style={st.emptyIcon}>
                <MaterialIcons name="event-busy" size={40} color={COLORS.textTertiary} />
              </View>
              <Text style={st.emptyTitle}>Tidak ada booking</Text>
              <Text style={st.emptyDesc}>Belum ada booking dengan status ini.</Text>
            </View>
          ) : (
            filteredBookings.map((b: any) => {
              const status = STATUS_CFG[b.status] || STATUS_CFG.pending;
              const priceStr = b.total_price
                ? `Rp${Number(b.total_price).toLocaleString('id-ID')}`
                : '-';
              const fieldName = b.field?.name ?? b.field_name ?? '-';
              const renterName = b.user?.name ?? b.renter_name ?? '-';
              const renterPhone = b.user?.profile?.phone ?? b.renter_phone ?? '';
              const bookingDate = b.booking_date ?? b.date ?? '-';
              const startTime = b.start_time ?? '';
              const endTime = b.end_time ?? '';
              const timeStr = startTime && endTime ? `${startTime} - ${endTime}` : startTime || '-';
              const code = b.code ?? b.id ?? '-';

              return (
                <View key={b.id} style={st.card}>
                  <View style={st.cardHeader}>
                    <View style={st.headerLeft}>
                      <View style={st.iconWrap}>
                        <MaterialIcons name="receipt-long" size={16} color={COLORS.primary} />
                      </View>
                      <Text style={st.bookingCode}>{code}</Text>
                    </View>
                    <View style={[st.statusBadge, { backgroundColor: status.bg, borderColor: status.color + '44' }]}>
                      <MaterialIcons name={status.icon as any} size={11} color={status.color} />
                      <Text style={[st.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>

                  <View style={st.detailGrid}>
                    <View style={st.detailCol}>
                      <View style={st.detailLabelWrap}>
                        <MaterialIcons name="person" size={12} color={COLORS.textSecondary} />
                        <Text style={st.detailLabel}>Penyewa</Text>
                      </View>
                      <Text style={st.detailVal}>{renterName}</Text>
                      {renterPhone ? <Text style={st.detailSub}>{renterPhone}</Text> : null}
                    </View>
                    <View style={st.colDivider} />
                    <View style={st.detailCol}>
                      <View style={st.detailLabelWrap}>
                        <MaterialIcons name="stadium" size={12} color={COLORS.textSecondary} />
                        <Text style={st.detailLabel}>Lapangan</Text>
                      </View>
                      <Text style={st.detailVal}>{fieldName}</Text>
                    </View>
                  </View>

                  <View style={st.scheduleRow}>
                    <View style={st.scheduleItem}>
                      <MaterialIcons name="event" size={14} color={COLORS.textSecondary} />
                      <Text style={st.scheduleText}>{bookingDate}</Text>
                    </View>
                    {timeStr !== '-' && (
                      <><View style={st.scheduleDot} />
                      <View style={st.scheduleItem}>
                        <MaterialIcons name="schedule" size={14} color={COLORS.textSecondary} />
                        <Text style={st.scheduleText}>{timeStr}</Text>
                      </View></>
                    )}
                    <View style={st.pricePill}>
                      <Text style={st.priceText}>{priceStr}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: SIZES.gutter,
    paddingVertical: 12, gap: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.outline,
  },
  tabBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1, borderColor: COLORS.outline,
  },
  tabBtnActive: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primary + '60' },
  tabText: { ...FONTS.labelMd, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },
  loadingWrap: { padding: SIZES.gutter, paddingTop: 16 },
  contentList: { padding: SIZES.gutter, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.outline,
  },
  emptyTitle: { ...FONTS.titleLg, color: COLORS.text },
  emptyDesc: { ...FONTS.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.outline, ...SHADOWS.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  bookingCode: { ...FONTS.titleLg, color: COLORS.text, letterSpacing: 0.5 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
  },
  statusText: { ...FONTS.labelSm },
  detailGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.outline,
  },
  detailCol: { flex: 1 },
  colDivider: { width: 1, backgroundColor: COLORS.outline, marginHorizontal: 14 },
  detailLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  detailLabel: { ...FONTS.labelSm, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailVal: { ...FONTS.titleMd, color: COLORS.text, marginBottom: 2 },
  detailSub: { ...FONTS.bodySm, color: COLORS.textSecondary },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scheduleText: { ...FONTS.labelMd, color: COLORS.text },
  scheduleDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.outline, marginHorizontal: 10 },
  pricePill: {
    marginLeft: 'auto',
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  priceText: { ...FONTS.titleMd, color: COLORS.primary },
});
