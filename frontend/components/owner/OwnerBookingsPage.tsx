import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Modal, TextInput,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../goalTheme';
import DashboardHeader from '../shared/DashboardHeader';
import { SkeletonCards } from '../Skeleton';
import { useTheme } from '../../lib/theme';
import { useToastStore } from '../../store/toastStore';
import {
  ownerApproveBooking,
  ownerConfirmPaymentBooking,
  ownerRejectBooking,
  ownerCompleteBooking,
  getOwnerBookings,
  type Booking,
} from '../../services/bookingService';
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

// ─── Booking Card ──────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  statusCfg,
  onApprove,
  onReject,
  onConfirmPayment,
  onComplete,
  loadingAction,
  colors,
  resolved,
}: {
  booking: Booking;
  statusCfg: Record<string, StatusConfig>;
  onApprove: (id: number) => void;
  onReject: (b: Booking) => void;
  onConfirmPayment: (id: number) => void;
  onComplete: (id: number) => void;
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
  const needsComplete = booking.status === 'PAID';

  return (
    <View style={[styles.card, { backgroundColor: cardSurface, borderColor: colors.outline ?? colors.divider }]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
            <MaterialIcons name="receipt-long" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.bookingCode, { color: colors.text }]} numberOfLines={1}>
            #{booking.id}
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

      {needsComplete && (
        <TouchableOpacity
          style={[styles.cashBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => onComplete(booking.id)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="done-all" size={16} color="#fff" />
              <Text style={[styles.cashBtnText, { color: '#fff' }]}>Tandai Selesai</Text>
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

  const filteredBookings = [...bookings].sort((a, b) => {
    return new Date(b.created_at ?? b.booking_date).getTime() - new Date(a.created_at ?? a.booking_date).getTime();
  });

  // ── Actions ─────────────────────────────────────────────────────────────────

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

  const handleComplete = useCallback(async (id: number) => {
    setLoadingAction(id);
    try {
      await ownerCompleteBooking(id);
      showToast({ type: 'success', title: 'Booking selesai', description: 'Status booking berubah menjadi COMPLETED.' });
      fetchBookings();
    } catch {
      showToast({ type: 'error', title: 'Gagal', description: 'Coba lagi nanti.' });
    } finally {
      setLoadingAction(null);
    }
  }, [fetchBookings, showToast]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={[st.screen, { backgroundColor: colors.background }]}>
      <DashboardHeader
        title="Daftar Booking"
        subtitle="Pantau dan kelola jadwal lapangan Anda"
        showBack={false}
      />

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredBookings.length === 0 ? (
            <View style={st.emptyWrap}>
              <View style={[st.emptyIcon, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outline ?? colors.divider }]}>
                <MaterialIcons name="event-busy" size={40} color={colors.textTertiary} />
              </View>
              <Text style={[st.emptyTitle, { color: colors.text }]}>Tidak ada booking</Text>
              <Text style={[st.emptyDesc, { color: colors.textSecondary }]}>
                Belum ada booking dengan status ini.
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
                onComplete={handleComplete}
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

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], resolved: 'light' | 'dark', isMobile: boolean) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },

    tabRow: {
      paddingHorizontal: SIZES.gutter,
      paddingVertical: 12,
      gap: 8,
      borderBottomWidth: 1,
    },
    tabBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1,
    },
    tabBtnActive: {},
    tabText: { ...FONTS.labelMd },
    tabTextActive: { fontWeight: '700' },
    tabCount: {
      minWidth: 18, height: 18, borderRadius: 9,
      paddingHorizontal: 4,
      alignItems: 'center', justifyContent: 'center',
    },
    tabCountText: { fontSize: 10, fontFamily: FONT_FAMILY, fontWeight: '700' },

    loadingWrap: { padding: SIZES.gutter, paddingTop: 16 },
    contentList: { padding: SIZES.gutter, paddingBottom: 100 },

    emptyWrap: { alignItems: 'center', marginTop: 80, gap: 12 },
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
