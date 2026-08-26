import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Modal, TextInput,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../goalTheme';
import DashboardHeader from '../shared/DashboardHeader';
import { SkeletonCards } from '../Skeleton';
import { useTheme, type ThemeColors } from '../../lib/theme';
import { useToastStore } from '../../store/toastStore';
import {
  ownerApproveBooking,
  ownerConfirmPaymentBooking,
  ownerRejectBooking,
  ownerCompleteBooking,
  getOwnerBookings,
  createOwnerManualBooking,
  getSlots,
  formatBookingCode,
  type Booking,
} from '../../services/bookingService';
import { apiFetch } from '../../lib/apiClient';
import { useIsMobileWeb } from '../../lib/responsive';
import { ErrorState } from '../common';
import { formatCurrency } from '../../lib/format';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  bg: string;
  color: string;
  icon: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDateShort(d: string): string {
  if (!d) return '-';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Reject Modal ──────────────────────────────────────────────────────────────

function RejectModal({
  visible,
  onClose,
  onConfirm,
  loading,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
  colors: any;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!visible) setReason('');
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[rmStyles.overlay]}>
        <View style={[rmStyles.sheet, { backgroundColor: colors.surfaceWhite ?? colors.surface }]}>
          <View style={rmStyles.handle} />
          <Text style={[rmStyles.title, { color: colors.text }]}>Tolak Booking</Text>
          <Text style={[rmStyles.subtitle, { color: colors.textSecondary }]}>
            Berikan alasan penolakan (opsional) agar penyewa dapat memahami keputusan Anda.
          </Text>
          <TextInput
            style={[rmStyles.input, { borderColor: colors.outline ?? colors.divider, color: colors.text, backgroundColor: colors.surfaceContainer }]}
            placeholder="Contoh: Lapangan sudah penuh di jam tersebut"
            placeholderTextColor={colors.textTertiary}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />
          <View style={rmStyles.btnRow}>
            <TouchableOpacity
              style={[rmStyles.cancelBtn, { borderColor: colors.outline ?? colors.divider }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[rmStyles.cancelBtnText, { color: colors.textSecondary }]}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[rmStyles.confirmBtn, { backgroundColor: colors.error }]}
              onPress={() => onConfirm(reason)}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={rmStyles.confirmBtnText}>Tolak Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const rmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontFamily: FONT_FAMILY, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  input: {
    borderWidth: 1, borderRadius: 12,
    padding: 14, fontFamily: FONT_FAMILY, fontSize: 14,
    textAlignVertical: 'top', minHeight: 90,
    marginBottom: 20,
  },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, alignItems: 'center',
  },
  cancelBtnText: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '600' },
  confirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Time Filter Types & Helper ────────────────────────────────────────────────

type ActiveTab = 'ACTIVE' | 'HISTORY';
type TimeFilter = 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'YEAR';

const ACTIVE_STATUSES = ['WAITING_CONFIRMATION', 'CONFIRMED', 'PAID'];
const HISTORY_STATUSES = ['COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'];

const TIME_FILTER_OPTIONS: { id: TimeFilter; label: string }[] = [
  { id: 'ALL', label: 'Semua' },
  { id: 'TODAY', label: 'Hari Ini' },
  { id: 'YESTERDAY', label: 'Kemarin' },
  { id: 'WEEK', label: '1 Minggu' },
  { id: 'MONTH', label: '1 Bulan' },
  { id: 'YEAR', label: '1 Tahun' },
];

function isWithinTimeFilter(bookingDateStr: string, filter: TimeFilter): boolean {
  if (filter === 'ALL') return true;
  if (!bookingDateStr) return false;

  const dateClean = bookingDateStr.includes('T') ? bookingDateStr : `${bookingDateStr}T00:00:00`;
  const bDate = new Date(dateClean);
  if (isNaN(bDate.getTime())) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === 'TODAY') {
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    return bDate >= todayStart && bDate < tomorrowStart;
  }

  if (filter === 'YESTERDAY') {
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    return bDate >= yesterdayStart && bDate < todayStart;
  }

  if (filter === 'WEEK') {
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return bDate >= weekAgo;
  }

  if (filter === 'MONTH') {
    const monthAgo = new Date(todayStart);
    monthAgo.setDate(monthAgo.getDate() - 30);
    return bDate >= monthAgo;
  }

  if (filter === 'YEAR') {
    const yearAgo = new Date(todayStart);
    yearAgo.setDate(yearAgo.getDate() - 365);
    return bDate >= yearAgo;
  }

  return true;
}

// ─── Booking Card ──────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  statusCfg,
  onApprove,
  onReject,
  onConfirmPayment,
  loadingAction,
  colors,
  resolved,
}: {
  booking: Booking;
  statusCfg: Record<string, StatusConfig>;
  onApprove: (id: number) => void;
  onReject: (b: Booking) => void;
  onConfirmPayment: (id: number) => void;
  loadingAction: number | null;
  colors: any;
  resolved: 'light' | 'dark';
}) {
  const softSurface = resolved === 'dark' ? colors.surfaceContainerHigh : colors.surfaceContainerLow;
  const cardSurface = colors.surface;

  const status = statusCfg[booking.status] ?? statusCfg['WAITING_CONFIRMATION'];
  const priceStr = formatCurrency(booking.total_price);
  const fieldName = booking.field?.name ?? `Field #${booking.field_id}`;
  const renterName = booking.user?.name ?? '-';
  const bookingDate = booking.booking_date ?? '-';
  const timeStr = booking.start_time && booking.end_time
    ? `${booking.start_time} – ${booking.end_time}`
    : booking.start_time || '-';

  const isLoading = loadingAction === booking.id;
  const needsApproval = booking.status === 'WAITING_CONFIRMATION';
  const needsPaymentConfirm = booking.status === 'CONFIRMED';

  return (
    <View style={[styles.card, { backgroundColor: cardSurface, borderColor: colors.outline ?? colors.divider }]}>
      {/* Clickable Card Body -> Navigate to Booking Detail */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/booking-detail/${booking.id}`)}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
              <MaterialIcons name="receipt-long" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.bookingCode, { color: colors.text }]} numberOfLines={1}>
              {formatBookingCode(booking)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.color + '44' }]}>
            <MaterialIcons name={status.icon as any} size={11} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Renter + Field */}
        <View style={[styles.detailGrid, { backgroundColor: softSurface, borderColor: colors.outline ?? colors.divider }]}>
          <View style={styles.detailCol}>
            <View style={styles.detailLabelWrap}>
              <MaterialIcons name="person" size={12} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Penyewa</Text>
            </View>
            <Text style={[styles.detailVal, { color: colors.text }]}>{renterName}</Text>
          </View>
          <View style={[styles.colDivider, { backgroundColor: colors.outline ?? colors.divider }]} />
          <View style={styles.detailCol}>
            <View style={styles.detailLabelWrap}>
              <MaterialIcons name="stadium" size={12} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Lapangan</Text>
            </View>
            <Text style={[styles.detailVal, { color: colors.text }]} numberOfLines={1}>{fieldName}</Text>
          </View>
        </View>

        {/* Schedule + Price */}
        <View style={[styles.scheduleGrid, { backgroundColor: softSurface, borderColor: colors.outline ?? colors.divider }]}>
          <View style={styles.scheduleRow}>
            <MaterialIcons name="event" size={14} color={colors.textSecondary} />
            <Text style={[styles.scheduleText, { color: colors.text }]}>{formatDateShort(bookingDate)}</Text>
          </View>
          <View style={styles.scheduleDot} />
          <View style={styles.scheduleRow}>
            <MaterialIcons name="schedule" size={14} color={colors.textSecondary} />
            <Text style={[styles.scheduleText, { color: colors.text }]}>{timeStr}</Text>
          </View>
          <View style={[styles.pricePill, { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '30' }]}>
            <Text style={[styles.priceText, { color: colors.primary }]}>{priceStr}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      {needsApproval && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn, { borderColor: colors.error }]}
            onPress={() => onReject(booking)}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <MaterialIcons name="close" size={16} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Tolak</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn, { backgroundColor: colors.primary }]}
            onPress={() => onApprove(booking.id)}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="check" size={16} color="#fff" />
                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Terima Booking</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {needsPaymentConfirm && (
        <TouchableOpacity
          style={[styles.cashBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => onConfirmPayment(booking.id)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="payments" size={16} color="#fff" />
              <Text style={[styles.cashBtnText, { color: '#fff' }]}>Konfirmasi Pembayaran</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function OwnerBookingsPage() {
  const { colors, resolved } = useTheme();
  const showToast = useToastStore((s) => s.show);
  const isMobile = useIsMobileWeb();
  const st = React.useMemo(() => makeStyles(colors, resolved, isMobile), [colors, resolved, isMobile]);

  const statusCfg: Record<string, StatusConfig> = {
    WAITING_CONFIRMATION: { label: 'Menunggu Konfirmasi', bg: colors.floodlight + '22', color: colors.onWarning ?? '#B45309', icon: 'schedule' },
    CONFIRMED:            { label: 'Terkonfirmasi',       bg: colors.primaryContainer,  color: colors.primary,                 icon: 'verified' },
    PAID:                 { label: 'Sudah Dibayar',       bg: colors.primaryContainer,  color: colors.primary,                 icon: 'payments' },
    COMPLETED:            { label: 'Selesai',             bg: colors.surfaceContainerHigh, color: colors.textSecondary,        icon: 'done-all' },
    REJECTED:             { label: 'Ditolak',             bg: colors.errorContainer,    color: colors.error,                   icon: 'cancel' },
    CANCELLED:            { label: 'Dibatalkan',          bg: colors.errorContainer,    color: colors.error,                   icon: 'cancel' },
    EXPIRED:              { label: 'Kadaluarsa',          bg: colors.errorContainer,    color: colors.error,                   icon: 'timer-off' },
  };

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAction, setLoadingAction] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tab & Time filter states
  const [activeTab, setActiveTab] = useState<ActiveTab>('ACTIVE');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const fetchBookings = useCallback(async () => {
    setError(null);
    try {
      const data = await getOwnerBookings();
      setBookings(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat data booking');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchBookings(); }, [fetchBookings]);

  // Counts for tabs
  const activeCount = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)).length;
  const historyCount = bookings.filter((b) => HISTORY_STATUSES.includes(b.status)).length;

  // Filtered & sorted bookings
  const filteredBookings = bookings
    .filter((b) => {
      const isCorrectTab = activeTab === 'ACTIVE'
        ? ACTIVE_STATUSES.includes(b.status)
        : HISTORY_STATUSES.includes(b.status);
      if (!isCorrectTab) return false;

      return isWithinTimeFilter(b.booking_date ?? b.created_at ?? '', timeFilter);
    })
    .sort((a, b) => {
      return new Date(b.created_at ?? b.booking_date).getTime() - new Date(a.created_at ?? a.booking_date).getTime();
    });

  const handleApprove = useCallback(async (id: number) => {
    setLoadingAction(id);
    try {
      await ownerApproveBooking(id);
      showToast({ type: 'success', title: 'Booking diterima', description: 'Status booking berubah menjadi CONFIRMED.' });
      fetchBookings();
    } catch {
      showToast({ type: 'error', title: 'Gagal menerima booking', description: 'Coba lagi nanti.' });
    } finally {
      setLoadingAction(null);
    }
  }, [fetchBookings, showToast]);

  const handleConfirmPayment = useCallback(async (id: number) => {
    setLoadingAction(id);
    try {
      await ownerConfirmPaymentBooking(id);
      showToast({ type: 'success', title: 'Pembayaran dikonfirmasi', description: 'Status booking berubah menjadi PAID dan slot terkunci.' });
      fetchBookings();
    } catch (e: any) {
      showToast({ type: 'error', title: 'Gagal mengonfirmasi pembayaran', description: e?.message || 'Coba lagi nanti.' });
    } finally {
      setLoadingAction(null);
    }
  }, [fetchBookings, showToast]);

  const handleRejectConfirm = useCallback(async (reason: string) => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await ownerRejectBooking(rejectTarget.id, reason);
      showToast({ type: 'info', title: 'Booking ditolak', description: 'Penyewa telah diberitahu.' });
      setRejectTarget(null);
      fetchBookings();
    } catch {
      showToast({ type: 'error', title: 'Gagal menolak', description: 'Coba lagi nanti.' });
    } finally {
      setRejecting(false);
    }
  }, [rejectTarget, fetchBookings, showToast]);

  return (
    <View style={[st.screen, { backgroundColor: colors.background }]}>
      <DashboardHeader
        title="Daftar Booking"
        subtitle="Pantau dan kelola jadwal lapangan Anda"
        showBack={false}
        right={
          <TouchableOpacity
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(255,255,255,0.18)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={0.8}
            onPress={() => router.push('/(owner)/booking-settings')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="settings" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Main Tabs (Booking Aktif vs Riwayat Booking) */}
      <View style={[st.tabRow, { borderColor: colors.outline ?? colors.divider }]}>
        <TouchableOpacity
          style={[
            st.tabBtn,
            activeTab === 'ACTIVE' && [st.tabBtnActive, { backgroundColor: colors.primaryContainer, borderColor: colors.primary }],
            activeTab !== 'ACTIVE' && { borderColor: colors.outline ?? colors.divider, backgroundColor: colors.surface },
          ]}
          onPress={() => setActiveTab('ACTIVE')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="flash-on"
            size={16}
            color={activeTab === 'ACTIVE' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              st.tabText,
              { color: activeTab === 'ACTIVE' ? colors.primary : colors.textSecondary },
              activeTab === 'ACTIVE' && st.tabTextActive,
            ]}
          >
            Booking Aktif
          </Text>
          <View
            style={[
              st.tabCount,
              { backgroundColor: activeTab === 'ACTIVE' ? colors.primary : colors.surfaceContainerHigh },
            ]}
          >
            <Text
              style={[
                st.tabCountText,
                { color: activeTab === 'ACTIVE' ? colors.onPrimary : colors.textSecondary },
              ]}
            >
              {activeCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            st.tabBtn,
            activeTab === 'HISTORY' && [st.tabBtnActive, { backgroundColor: colors.primaryContainer, borderColor: colors.primary }],
            activeTab !== 'HISTORY' && { borderColor: colors.outline ?? colors.divider, backgroundColor: colors.surface },
          ]}
          onPress={() => setActiveTab('HISTORY')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="history"
            size={16}
            color={activeTab === 'HISTORY' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              st.tabText,
              { color: activeTab === 'HISTORY' ? colors.primary : colors.textSecondary },
              activeTab === 'HISTORY' && st.tabTextActive,
            ]}
          >
            Riwayat Booking
          </Text>
          <View
            style={[
              st.tabCount,
              { backgroundColor: activeTab === 'HISTORY' ? colors.primary : colors.surfaceContainerHigh },
            ]}
          >
            <Text
              style={[
                st.tabCountText,
                { color: activeTab === 'HISTORY' ? colors.onPrimary : colors.textSecondary },
              ]}
            >
              {historyCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Time Range Filter Pills */}
      <View style={st.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.filterScroll}
        >
          {TIME_FILTER_OPTIONS.map((opt) => {
            const isSelected = timeFilter === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  st.filterPill,
                  isSelected
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.surface, borderColor: colors.outline ?? colors.divider },
                ]}
                onPress={() => setTimeFilter(opt.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    st.filterPillText,
                    { color: isSelected ? colors.onPrimary : colors.textSecondary },
                    isSelected && { fontWeight: '700' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={st.loadingWrap}>
          <SkeletonCards count={3} />
        </View>
      ) : error ? (
        <ErrorState title="Booking gagal dimuat" description={error} onRetry={fetchBookings} />
      ) : (
        <ScrollView
          contentContainerStyle={[
            st.contentList,
            !isMobile && { maxWidth: 900, alignSelf: 'center', width: '100%' }
          ]}
          style={{ backgroundColor: colors.background }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={resolved === 'dark' ? colors.surfaceContainerHigh : '#FFFFFF'}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredBookings.length === 0 ? (
            <View style={st.emptyWrap}>
              <View style={[st.emptyIcon, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline }]}>
                <MaterialIcons name="event-busy" size={40} color={colors.textTertiary} />
              </View>
              <Text style={[st.emptyTitle, { color: colors.text }]}>Tidak ada booking</Text>
              <Text style={[st.emptyDesc, { color: colors.textSecondary }]}>
                {activeTab === 'ACTIVE'
                  ? 'Belum ada booking aktif saat ini.'
                  : 'Belum ada riwayat booking pada filter ini.'}
              </Text>
            </View>
          ) : (
            filteredBookings.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                statusCfg={statusCfg}
                onApprove={handleApprove}
                onReject={setRejectTarget}
                onConfirmPayment={handleConfirmPayment}
                loadingAction={loadingAction}
                colors={colors}
                resolved={resolved}
              />
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Reject Modal */}
      <RejectModal
        visible={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        loading={rejecting}
        colors={colors}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (colors: ThemeColors, resolved: 'light' | 'dark', isMobile: boolean) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },

    tabRow: {
      flexDirection: 'row',
      paddingHorizontal: SIZES.gutter,
      paddingVertical: 12,
      gap: 10,
      borderBottomWidth: 1,
      ...(isMobile ? {} : { maxWidth: 900, alignSelf: 'center', width: '100%' }),
    },
    tabBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 14,
      borderWidth: 1,
    },
    tabBtnActive: {},
    tabText: { ...FONTS.labelMd, fontSize: 13 },
    tabTextActive: { fontWeight: '700' },
    tabCount: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabCountText: { fontSize: 11, fontFamily: FONT_FAMILY, fontWeight: '700' },

    filterSection: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline ?? colors.divider,
      backgroundColor: colors.background,
      ...(isMobile ? {} : { maxWidth: 900, alignSelf: 'center', width: '100%' }),
    },
    filterScroll: {
      paddingHorizontal: SIZES.gutter,
      gap: 8,
    },
    filterPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterPillText: {
      ...FONTS.labelSm,
      fontSize: 12,
    },

    loadingWrap: { padding: SIZES.gutter, paddingTop: 16, ...(isMobile ? {} : { maxWidth: 900, alignSelf: 'center', width: '100%' }) },
    contentList: { padding: SIZES.gutter, paddingTop: 16, paddingBottom: 100, ...(isMobile ? {} : { maxWidth: 900, alignSelf: 'center', width: '100%' }) },

    emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
    emptyIcon: {
      width: 80, height: 80, borderRadius: 24,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1,
    },
    emptyTitle: { ...FONTS.titleLg },
    emptyDesc: { ...FONTS.bodyMd, textAlign: 'center' },
  });

const styles = StyleSheet.create({
  card: {
    borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  bookingCode: { fontFamily: FONT_FAMILY, fontSize: 17, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  statusText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700' },

  detailGrid: {
    flexDirection: 'row',
    borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1,
  },
  detailCol: { flex: 1 },
  colDivider: { width: 1, marginHorizontal: 16 },
  detailLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  detailLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  detailVal: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700' },

  scheduleGrid: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, padding: 14, marginBottom: 14,
    borderWidth: 1, flexWrap: 'wrap', gap: 6,
    justifyContent: 'space-between',
  },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scheduleText: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500' },
  scheduleDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginHorizontal: 2 },
  pricePill: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 12, borderWidth: 1.2,
  },
  priceText: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '800' },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 13, borderRadius: 12,
  },
  rejectBtn: { borderWidth: 1.5, backgroundColor: 'transparent' },
  approveBtn: {},
  actionBtnText: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700' },

  cashBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.2,
  },
  cashBtnText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700' },
});
