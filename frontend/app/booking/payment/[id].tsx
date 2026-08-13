import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../../../components/goalTheme';
import { useTheme } from '../../../lib/theme';
import { useBookingDetail, useBookingPolling } from '../../../hooks/useBooking';
import { confirmPayment, type Booking } from '../../../services/bookingService';
import { useToastStore } from '../../../store/toastStore';
import { SPORT_LABELS } from '../../../lib/fieldValidation';
import { getErrorMessage } from '../../../lib/api';
import PaymentCard, { type PaymentMethod } from '../../../components/booking/PaymentCard';
import { ErrorState, EmptyState, Loading } from '../../../components/common';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(p: number): string {
  return `Rp${p.toLocaleString('id-ID')}`;
}

function formatDateDisplay(d: string): string {
  if (!d) return '-';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function isTerminal(status: Booking['status']): boolean {
  return status === 'REJECTED' || status === 'CANCELLED' || status === 'EXPIRED';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);
  const { colors } = useTheme();
  const showToast = useToastStore((s) => s.show);
  const st = makeStyles(colors);

  const { booking, loading, error, refetch } = useBookingDetail(bookingId);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Poll while waiting for the owner's approval.
  const waitingForApproval = booking?.status === 'WAITING_OWNER_APPROVAL';
  useBookingPolling({
    bookingId,
    targetStatuses: ['APPROVED'],
    onStatusChange: () => { refetch(); },
    enabled: waitingForApproval,
  });

  // Already confirmed → show the success / e-ticket screen.
  useEffect(() => {
    if (booking?.status === 'CONFIRMED') {
      router.replace({ pathname: '/booking-success', params: { id: String(bookingId) } });
    }
  }, [booking?.status, bookingId]);

  const handlePay = async () => {
    if (!booking) return;
    setPaying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await confirmPayment(bookingId);
      const updated = res.data ?? (res as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/booking-success', params: { id: String(updated.id) } });
    } catch (e: any) {
      const msg = getErrorMessage(e?.data ?? e, 'Pembayaran gagal. Coba lagi.');
      showToast({ type: 'error', title: 'Gagal', description: msg });
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header title="Pembayaran" />
        <Loading message="Memuat data booking..." />
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header title="Pembayaran" />
        <ErrorState
          title="Data booking tidak bisa dimuat"
          description={error ?? 'Booking tidak ditemukan.'}
          onRetry={refetch}
        />
      </View>
    );
  }

  if (isTerminal(booking.status)) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header title="Pembayaran" />
        <EmptyState
          icon="cancel"
          title="Booking tidak aktif"
          description={`Booking ini berstatus ${booking.status.replace(/_/g, ' ').toLowerCase()}.`}
          actionLabel="Kembali"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  // Waiting for the owner to approve the request.
  if (waitingForApproval) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header title="Pembayaran" />

        <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={st.waitingSection}>
            <View style={[st.waitingIconWrap, { backgroundColor: colors.floodlight + '20' }]}>
              <ActivityIndicator size="large" color={colors.floodlight} />
            </View>
            <Text style={st.waitingTitle}>Menunggu Persetujuan Owner</Text>
            <Text style={st.waitingDesc}>
              Pemilik lapangan akan menyetujui booking Anda.{'\n'}
              Status akan diperbarui otomatis di layar ini.
            </Text>
          </View>

          {renderSummary(booking)}

          <View style={st.noteCard}>
            <MaterialIcons name="info-outline" size={16} color={colors.primary} />
            <Text style={st.noteText}>
              Anda dapat membatalkan booking ini sebelum disetujui dari halaman daftar booking.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // Ready to pay (status APPROVED).
  return (
    <View style={st.container}>
      <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <Header title="Pembayaran" />

      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={st.statusBadgeWrap}>
          <View style={[st.statusBadge, { backgroundColor: colors.floodlight + '20', borderColor: colors.floodlight }]}>
            <MaterialIcons name="check-circle" size={16} color={colors.floodlight} />
            <Text style={[st.statusBadgeText, { color: colors.floodlight }]}>BOOKING DISETUJUI OWNER</Text>
          </View>
        </View>

        {renderSummary(booking)}

        {/* Payment Method */}
        <View style={st.methodCard}>
          <Text style={st.methodTitle}>Metode Pembayaran</Text>
          <View style={st.methodList}>
            <PaymentCard
              method="cash"
              title="Cash di Tempat"
              description="Bayar langsung saat tiba di venue."
              selected={paymentMethod === 'cash'}
              onPress={() => setPaymentMethod('cash')}
            />
            <PaymentCard
              method="transfer"
              title="Transfer Bank"
              description="Akan tersedia setelah rekening venue dikonfigurasi."
              selected={paymentMethod === 'transfer'}
              disabled
            />
            <PaymentCard
              method="ewallet"
              title="E-Wallet"
              description="Akan tersedia segera."
              selected={paymentMethod === 'ewallet'}
              disabled
            />
          </View>
        </View>

        <View style={st.noteCard}>
          <MaterialIcons name="info-outline" size={16} color={colors.primary} />
          <Text style={st.noteText}>
            Bayar tunai saat tiba di lapangan. Datang 10 menit sebelum waktu bermain. Booking akan dikonfirmasi setelah pembayaran ini.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Pay Button */}
      <View style={st.bottomBar}>
        <View>
          <Text style={st.bottomLabel}>Total Bayar</Text>
          <Text style={st.bottomAmount}>{formatPrice(booking.total_price)}</Text>
        </View>
        <TouchableOpacity
          style={[st.payBtn, paying && { opacity: 0.6 }]}
          onPress={handlePay}
          disabled={paying}
          activeOpacity={0.85}
        >
          {paying ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <>
              <MaterialIcons name="check" size={20} color={colors.onPrimary} />
              <Text style={st.payBtnText}>Bayar Sekarang</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  function renderSummary(booking: Booking) {
    return (
      <View style={st.summaryCard}>
        <View style={st.summaryHeader}>
          <View style={[st.summaryIconWrap, { backgroundColor: colors.primaryContainer }]}>
            <MaterialIcons name="stadium" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.summaryFieldName} numberOfLines={1}>
              {booking.field?.name ?? `Field #${booking.field_id}`}
            </Text>
            <Text style={st.summarySport}>
              {SPORT_LABELS[booking.field?.sport_type ?? ''] ?? (booking.field?.sport_type ?? '-')}
            </Text>
          </View>
        </View>

        <View style={st.summaryDivider} />

        <View style={st.summaryRow}>
          <Text style={st.summaryLabel}>Tanggal</Text>
          <Text style={st.summaryValue}>{formatDateDisplay(booking.booking_date)}</Text>
        </View>
        <View style={st.summaryRow}>
          <Text style={st.summaryLabel}>Jam</Text>
          <Text style={st.summaryValue}>{booking.start_time} – {booking.end_time}</Text>
        </View>
        <View style={st.summaryRow}>
          <Text style={st.summaryLabel}>Durasi</Text>
          <Text style={st.summaryValue}>{Math.round(booking.duration_minutes / 60 * 10) / 10} jam</Text>
        </View>
        <View style={st.summaryRow}>
          <Text style={st.summaryLabel}>Lokasi</Text>
          <Text style={[st.summaryValue, { flex: 2 }]} numberOfLines={2}>{booking.field?.location ?? '-'}</Text>
        </View>

        <View style={st.summaryDivider} />

        <View style={st.totalRow}>
          <Text style={st.totalLabel}>Total Pembayaran</Text>
          <Text style={st.totalValue}>{formatPrice(booking.total_price)}</Text>
        </View>
      </View>
    );
  }
}

function Header({ title }: { title: string }) {
  const { colors } = useTheme();
  const st = makeStyles(colors);
  return (
    <View style={st.header}>
      <TouchableOpacity style={st.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
        <MaterialIcons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={st.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  headerTitle: { ...FONTS.headlineSm, color: colors.text },

  scrollContent: { paddingHorizontal: 20, paddingTop: 24, maxWidth: 480, alignSelf: 'center', width: '100%' },

  statusBadgeWrap: { alignItems: 'center', marginBottom: 24 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: SIZES.borderRadiusFull, borderWidth: 1,
  },
  statusBadgeText: { ...FONTS.labelMd, fontWeight: '700', letterSpacing: 0.5 },

  waitingSection: { alignItems: 'center', marginBottom: 24, paddingVertical: 24 },
  waitingIconWrap: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  waitingTitle: { ...FONTS.headlineSm, color: colors.text, textAlign: 'center', marginBottom: 8 },
  waitingDesc: { ...FONTS.bodyMd, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  summaryCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: colors.divider,
    ...SHADOWS.sm,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  summaryIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryFieldName: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700', color: colors.text },
  summarySport: { ...FONTS.bodySm, color: colors.textSecondary, marginTop: 2 },
  summaryDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 12 },
  summaryLabel: { ...FONTS.bodyMd, color: colors.textSecondary, flex: 1 },
  summaryValue: { ...FONTS.bodyMd, color: colors.text, fontWeight: '600', textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...FONTS.titleMd, color: colors.text },
  totalValue: { fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: '700', color: colors.primary },

  methodCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: colors.divider,
    ...SHADOWS.sm,
  },
  methodTitle: { ...FONTS.headlineSm, color: colors.text, marginBottom: 14 },
  methodList: { gap: 10 },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.primaryContainer,
    borderRadius: SIZES.borderRadius, padding: 14, marginBottom: 20,
  },
  noteText: { ...FONTS.bodySm, color: colors.textSecondary, flex: 1, lineHeight: 18 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceWhite,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1, borderTopColor: colors.divider,
    ...SHADOWS.xl,
  },
  bottomLabel: { ...FONTS.bodySm, color: colors.textSecondary },
  bottomAmount: { fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: '700', color: colors.primary },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 24, paddingVertical: 14,
    minWidth: 180, justifyContent: 'center',
    ...SHADOWS.primary,
  },
  payBtnText: { ...FONTS.buttonLg, color: colors.onPrimary },
});
