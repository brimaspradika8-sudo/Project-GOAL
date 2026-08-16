import React, { useState } from 'react';
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
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../../components/goalTheme';
import { useTheme } from '../../lib/theme';
import { useBookingDetail } from '../../hooks/useBooking';
import { cancelBooking } from '../../services/bookingService';
import { BookingStatusBadge, isExpiredReason, formatPrice, formatDateDisplay } from '../../components/booking';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { ErrorState, Loading } from '../../components/common';
import { SafeImage } from '../../components/SafeImage';
import { SPORT_LABELS } from '../../lib/fieldValidation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  const hours = minutes / 60;
  return (Math.round(hours * 10) / 10) + ' jam';
}

interface TimelineEntry {
  icon: string;
  label: string;
  value: string;
  color: string;
  error?: boolean;
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, colors }: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function Timeline({ entries, colors }: {
  entries: TimelineEntry[];
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  if (entries.length === 0) return null;
  return (
    <View style={[styles.timelineCard, { backgroundColor: colors.surfaceWhite, borderColor: colors.divider }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Riwayat Status</Text>
      {entries.map((e, i) => (
        <View key={i} style={styles.timelineRow}>
          <View style={[styles.timelineIcon, { backgroundColor: e.error ? colors.errorContainer : colors.primaryContainer }]}>
            <MaterialIcons name={e.icon as any} size={16} color={e.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.timelineLabel, { color: colors.text }]}>{e.label}</Text>
            <Text style={[styles.timelineValue, { color: colors.textSecondary }]}>{e.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingDetailScreen() {
  const params = useLocalSearchParams<{ id?: string; booking_id?: string }>();
  const rawId = params.id ?? params.booking_id;
  const bookingId = rawId && !Number.isNaN(Number(rawId)) ? Number(rawId) : null;
  const { colors } = useTheme();
  const st = makeStyles(colors);

  const { booking, loading, error, refetch } = useBookingDetail(bookingId);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    if (!booking) return;
    setCancelling(true);
    try {
      await cancelBooking(booking.id, 'Dibatalkan oleh pengguna');
      setConfirmCancel(false);
      await refetch();
    } catch {
      // Keep dialog open to surface the error; user can dismiss.
    } finally {
      setCancelling(false);
    }
  }

  function navigatePrimary() {
    if (!booking) return;
    if (booking.status === 'WAITING_CONFIRMATION') {
      router.push({ pathname: '/booking/payment/[id]', params: { id: String(booking.id) } });
    } else if (booking.status === 'CONFIRMED') {
      router.push({ pathname: '/booking-success', params: { id: String(booking.id) } });
    }
  }

  if (loading) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header title="Detail Booking" />
        <Loading message="Memuat detail booking..." />
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header title="Detail Booking" />
        <ErrorState
          title="Data booking tidak bisa dimuat"
          description={error ?? 'Booking tidak ditemukan.'}
          onRetry={refetch}
        />
      </View>
    );
  }

  const expired = booking.status === 'CANCELLED' && isExpiredReason(booking.cancel_reason);
  const sportLabel = SPORT_LABELS[booking.field?.sport_type ?? ''] ?? (booking.field?.sport_type ?? '-');

  const timeline: TimelineEntry[] = [
    {
      icon: 'event',
      label: 'Booking dibuat',
      value: formatDateTime(booking.created_at),
      color: colors.primary,
    },
  ];

  if (booking.approved_at || booking.confirmed_at) {
    timeline.push({
      icon: 'check-circle',
      label: 'Dikonfirmasi owner',
      value: formatDateTime(booking.confirmed_at ?? booking.approved_at),
      color: colors.primary,
    });
  }
  if (booking.completed_at) {
    timeline.push({
      icon: 'flag',
      label: 'Booking selesai',
      value: formatDateTime(booking.completed_at),
      color: colors.textSecondary,
    });
  }
  if (booking.rejected_at) {
    timeline.push({
      icon: 'cancel',
      label: 'Ditolak owner',
      value: booking.rejection_reason
        ? `${formatDateTime(booking.rejected_at)} — ${booking.rejection_reason}`
        : formatDateTime(booking.rejected_at),
      color: colors.error,
      error: true,
    });
  }
  if (booking.cancelled_at) {
    timeline.push({
      icon: 'cancel',
      label: expired ? 'Kadaluarsa otomatis' : 'Dibatalkan',
      value: booking.cancel_reason
        ? `${formatDateTime(booking.cancelled_at)} — ${booking.cancel_reason}`
        : formatDateTime(booking.cancelled_at),
      color: colors.error,
      error: true,
    });
  }

  const showActions = booking.status === 'WAITING_CONFIRMATION' || booking.status === 'CONFIRMED';

  return (
    <View style={st.container}>
      <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <Header title="Detail Booking" />

      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>

        <BookingStatusBadge status={booking.status} reason={booking.cancel_reason} />

        {expired && (
          <View style={[st.noteCard, { backgroundColor: colors.surfaceContainer }]}>
            <MaterialIcons name="hourglass-disabled" size={16} color={colors.textSecondary} />
            <Text style={[st.noteText, { color: colors.textSecondary }]}>
              Booking ini kadaluarsa karena tidak dikonfirmasi sebelum batas waktu.
            </Text>
          </View>
        )}
        {booking.status === 'REJECTED' && booking.rejection_reason && (
          <View style={[st.noteCard, { backgroundColor: colors.errorContainer }]}>
            <MaterialIcons name="info-outline" size={16} color={colors.error} />
            <Text style={[st.noteText, { color: colors.text }]}>
              Alasan penolakan: {booking.rejection_reason}
            </Text>
          </View>
        )}

        {/* Venue summary */}
        <View style={[st.summaryCard, { backgroundColor: colors.surfaceWhite, borderColor: colors.divider }]}>
          <View style={st.summaryHeader}>
            <SafeImage source={{ uri: booking.field?.image_url ?? '' }} style={st.summaryImage} fallbackSize={44} />
            <View style={{ flex: 1 }}>
              <Text style={[st.summaryFieldName, { color: colors.text }]} numberOfLines={1}>
                {booking.field?.name ?? `Lapangan #${booking.field_id}`}
              </Text>
              <Text style={[st.summarySport, { color: colors.textSecondary }]}>{sportLabel}</Text>
              {!!booking.field?.location && (
                <Text style={[st.summaryLocation, { color: colors.textSecondary }]} numberOfLines={2}>
                  {booking.field.location}
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <InfoRow label="Tanggal" value={formatDateDisplay(booking.booking_date)} colors={colors} />
          <InfoRow label="Jam" value={`${booking.start_time} – ${booking.end_time}`} colors={colors} />
          <InfoRow label="Durasi" value={formatDuration(booking.duration_minutes)} colors={colors} />
          <InfoRow label="Metode Pembayaran" value="Cash" colors={colors} />
          <InfoRow label="No. Booking" value={`#${booking.id}`} colors={colors} />

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Harga</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatPrice(booking.total_price)}</Text>
          </View>
        </View>

        <Timeline entries={timeline} colors={colors} />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Bottom actions ── */}
      {showActions && (
        <View style={st.bottomBar}>
          {booking.status === 'WAITING_CONFIRMATION' && (
            <TouchableOpacity
              style={st.cancelBtn}
              onPress={() => setConfirmCancel(true)}
              activeOpacity={0.85}
              disabled={cancelling}
            >
              <MaterialIcons name="close" size={20} color={colors.error} />
              <Text style={[st.cancelBtnText, { color: colors.error }]}>Batal</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={st.payBtn}
            onPress={navigatePrimary}
            activeOpacity={0.85}
          >
            <MaterialIcons name={booking.status === 'CONFIRMED' ? 'receipt-long' : 'payment'} size={20} color={colors.onPrimary} />
            <Text style={st.payBtnText}>
              {booking.status === 'CONFIRMED' ? 'Lihat Pembayaran' : 'Lanjut Pembayaran'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmDialog
        visible={confirmCancel}
        title="Batalkan Booking?"
        description={`${booking.field?.name ?? `Lapangan #${booking.field_id}`} — ${formatDateDisplay(booking.booking_date)}, ${booking.start_time} – ${booking.end_time}`}
        destructive
        confirmLabel="Ya, Batalkan"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => { if (!cancelling) setConfirmCancel(false); }}
      />
    </View>
  );
}

function Header({ title }: { title: string }) {
  const { colors } = useTheme();
  const st = makeStyles(colors);
  return (
    <View style={st.header}>
      <TouchableOpacity style={st.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
        <MaterialIcons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[st.headerTitle, { color: colors.text }]}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

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
  headerTitle: { ...FONTS.headlineSm },

  scrollContent: {
    paddingHorizontal: 20, paddingTop: 20, maxWidth: 480, alignSelf: 'center', width: '100%',
  },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: SIZES.borderRadius, padding: 14, marginTop: 14,
  },
  noteText: { ...FONTS.bodySm, flex: 1, lineHeight: 18 },

  summaryCard: {
    borderRadius: SIZES.borderRadiusLg,
    padding: 18, marginTop: 16, marginBottom: 16,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  summaryImage: { width: 64, height: 64, borderRadius: 14, backgroundColor: colors.surfaceContainer },
  summaryFieldName: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700' },
  summarySport: { ...FONTS.bodySm, marginTop: 2 },
  summaryLocation: { ...FONTS.bodySm, marginTop: 4, lineHeight: 18 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceWhite,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1, borderTopColor: colors.divider,
    ...SHADOWS.xl,
  },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.error,
    borderRadius: SIZES.borderRadius,
    paddingVertical: 14, paddingHorizontal: 20,
  },
  cancelBtnText: { ...FONTS.buttonLg, fontWeight: '600' },
  payBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary,
    borderRadius: SIZES.borderRadius,
    paddingVertical: 14,
    ...SHADOWS.primary,
  },
  payBtnText: { ...FONTS.buttonLg, color: colors.onPrimary },
});

// Shared style fragment referenced inside the component tree
const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  infoLabel: { ...FONTS.bodyMd, flex: 1 },
  infoValue: { ...FONTS.bodyMd, fontWeight: '600', textAlign: 'right', flex: 2 },
  divider: { height: 1, marginVertical: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...FONTS.bodyMd, fontWeight: '500' },
  totalValue: { fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: '800' },
  timelineCard: {
    borderRadius: SIZES.borderRadiusLg,
    padding: 18, marginBottom: 16,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  sectionTitle: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', marginBottom: 14 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  timelineIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  timelineLabel: { ...FONTS.bodyMd, fontWeight: '600' },
  timelineValue: { ...FONTS.bodySm, marginTop: 2, lineHeight: 18 },
});
