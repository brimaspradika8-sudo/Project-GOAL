import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../../../components/goalTheme';
import { useTheme } from '../../../lib/theme';
import { useBookingDetail } from '../../../hooks/useBooking';
import type { Booking } from '../../../services/bookingService';
import PaymentCard from '../../../components/booking/PaymentCard';
import { ErrorState, EmptyState, Loading } from '../../../components/common';
import { SafeImage } from '../../../components/SafeImage';
import { SPORT_LABELS } from '../../../lib/fieldValidation';
import { formatPrice, formatDateDisplay } from '../../../components/booking';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isTerminal(status: Booking['status']): boolean {
  return status === 'REJECTED' || status === 'CANCELLED';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);
  const { colors } = useTheme();
  const st = makeStyles(colors);

  const { booking, loading, error, refetch } = useBookingDetail(bookingId);

  // Already confirmed → go to the success screen.
  useEffect(() => {
    if (booking?.status === 'CONFIRMED') {
      router.replace({ pathname: '/booking-success', params: { id: String(bookingId) } });
    }
  }, [booking?.status, bookingId]);

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({ pathname: '/booking-success', params: { id: String(bookingId) } });
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

  return (
    <View style={st.container}>
      <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <Header title="Pembayaran" />

      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={st.waitingSection}>
          <View style={[st.waitingIconWrap, { backgroundColor: colors.floodlight + '20' }]}>
            <MaterialIcons name="schedule" size={40} color={colors.floodlight} />
          </View>
          <Text style={st.waitingTitle}>Menunggu Persetujuan Owner</Text>
          <Text style={st.waitingDesc}>
            Booking Anda telah terkirim.{'\n'}
            Pemilik lapangan akan mengkonfirmasi permintaan Anda.
          </Text>
        </View>

        {renderSummary(booking)}

        {/* Payment Method */}
        <View style={st.methodCard}>
          <Text style={st.methodTitle}>Metode Pembayaran</Text>
          <PaymentCard
            method="cash"
            title="Cash / Tunai"
            description="Bayar langsung kepada pemilik lapangan saat tiba di venue."
            selected
          />
        </View>

        <View style={st.noteCard}>
          <MaterialIcons name="info-outline" size={16} color={colors.primary} />
          <Text style={st.noteText}>
            Status booking akan berubah menjadi CONFIRMED setelah owner menyetujui permintaan Anda.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Confirm Button */}
      <View style={st.bottomBar}>
        <View style={st.bottomBarInner}>
          <View>
            <Text style={st.bottomLabel}>Total Bayar</Text>
            <Text style={st.bottomAmount}>{formatPrice(booking.total_price)}</Text>
          </View>
          <TouchableOpacity
            style={st.payBtn}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <MaterialIcons name="check" size={20} color={colors.onPrimary} />
            <Text style={st.payBtnText}>Konfirmasi Booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  function renderSummary(booking: Booking) {
    return (
      <View style={st.summaryCard}>
        <View style={st.summaryHeader}>
          <SafeImage source={{ uri: booking.field?.image_url ?? '' }} style={st.summaryImage} fallbackSize={48} />
          <View style={{ flex: 1 }}>
            <Text style={st.summaryFieldName} numberOfLines={1}>
              {booking.field?.name ?? `Field #${booking.field_id}`}
            </Text>
            <Text style={st.summarySport}>
              {SPORT_LABELS[booking.field?.sport_type ?? ''] ?? (booking.field?.sport_type ?? '-')}
            </Text>
            <Text style={st.summaryLocation} numberOfLines={2}>{booking.field?.location ?? '-'}</Text>
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
          <Text style={st.summaryValue}>{Math.round((booking.duration_minutes / 60) * 10) / 10} jam</Text>
        </View>
        <View style={st.summaryRow}>
          <Text style={st.summaryLabel}>Metode</Text>
          <Text style={st.summaryValue}>Cash</Text>
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
      <View style={st.headerInner}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  headerInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    maxWidth: 700, width: '100%', alignSelf: 'center',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  headerTitle: { ...FONTS.headlineSm, color: colors.text },

  scrollContent: { paddingHorizontal: 20, paddingTop: 24, maxWidth: 700, alignSelf: 'center', width: '100%' },

  waitingSection: { alignItems: 'center', marginBottom: 24, paddingVertical: 16 },
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
  summaryImage: { width: 72, height: 72, borderRadius: 16, backgroundColor: colors.surfaceContainer },
  summaryIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryFieldName: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700', color: colors.text },
  summarySport: { ...FONTS.bodySm, color: colors.textSecondary, marginTop: 2 },
  summaryLocation: { ...FONTS.bodySm, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
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
    backgroundColor: colors.surfaceWhite,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1, borderTopColor: colors.divider,
    ...SHADOWS.xl,
  },
  bottomBarInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    maxWidth: 700, width: '100%', alignSelf: 'center', gap: 12,
  },
  bottomLabel: { ...FONTS.bodySm, color: colors.textSecondary },
  bottomAmount: { fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: '700', color: colors.primary },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 24, paddingVertical: 14,
    minWidth: 190, justifyContent: 'center',
    ...SHADOWS.primary,
  },
  payBtnText: { ...FONTS.buttonLg, color: colors.onPrimary },
});
