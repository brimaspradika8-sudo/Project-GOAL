import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../../components/goalTheme';
import { SafeImage } from '../../components/SafeImage';
import { FadeInView } from '../../components/FadeInView';
import { useTheme } from '../../lib/theme';
import { useBookingHistory } from '../../hooks/useBooking';
import { type Booking, type BookingStatus } from '../../services/bookingService';
import { SPORT_LABELS } from '../../lib/fieldValidation';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; bgKey: string; textKey: string; icon: string }> = {
  WAITING_OWNER_APPROVAL: { label: 'Menunggu Persetujuan', bgKey: 'floodlight', textKey: 'floodlight', icon: 'schedule' },
  APPROVED:               { label: 'Disetujui — Bayar Sekarang', bgKey: 'info', textKey: 'info', icon: 'check-circle-outline' },
  WAITING_PAYMENT:        { label: 'Menunggu Pembayaran', bgKey: 'warning', textKey: 'warning', icon: 'payment' },
  CONFIRMED:              { label: 'Booking Aktif', bgKey: 'primary', textKey: 'primary', icon: 'event-available' },
  COMPLETED:              { label: 'Selesai', bgKey: 'textTertiary', textKey: 'textTertiary', icon: 'done-all' },
  CANCELLED:              { label: 'Dibatalkan', bgKey: 'error', textKey: 'error', icon: 'cancel' },
  EXPIRED:                { label: 'Kadaluarsa', bgKey: 'error', textKey: 'error', icon: 'timer-off' },
};

function formatPrice(p: number): string {
  return `Rp${p.toLocaleString('id-ID')}`;
}

function formatDateDisplay(d: string): string {
  if (!d) return '-';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ACTIVE_STATUSES: BookingStatus[] = ['WAITING_OWNER_APPROVAL', 'APPROVED', 'WAITING_PAYMENT', 'CONFIRMED'];
const PAST_STATUSES: BookingStatus[] = ['COMPLETED', 'CANCELLED', 'EXPIRED'];

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({ booking, colors, onPress }: {
  booking: Booking;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
}) {
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.EXPIRED;
  const accentColor = (colors as any)[cfg.textKey] ?? colors.textTertiary;
  const accentBg = accentColor + '18';
  const sportLabel = SPORT_LABELS[booking.field?.sport_type ?? ''] ?? (booking.field?.sport_type ?? '');

  return (
    <TouchableOpacity style={[st.card, { backgroundColor: colors.surfaceWhite }]} onPress={onPress} activeOpacity={0.8}>
      {/* Image strip */}
      <View style={st.cardImageWrap}>
        <SafeImage source={{ uri: booking.field?.image_url ?? '' }} style={st.cardImage} fallbackSize={28} />
        <View style={[st.cardStatusBadge, { backgroundColor: accentBg, borderColor: accentColor }]}>
          <MaterialIcons name={cfg.icon as any} size={10} color={accentColor} />
          <Text style={[st.cardStatusText, { color: accentColor }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={st.cardBody}>
        <Text style={[st.cardFieldName, { color: colors.text }]} numberOfLines={1}>
          {booking.field?.name ?? `Field #${booking.field_id}`}
        </Text>
        <Text style={[st.cardSport, { color: colors.textSecondary }]} numberOfLines={1}>{sportLabel}</Text>

        <View style={st.cardMeta}>
          <View style={st.cardMetaItem}>
            <MaterialIcons name="event" size={13} color={colors.primary} />
            <Text style={[st.cardMetaText, { color: colors.textSecondary }]}>{formatDateDisplay(booking.booking_date)}</Text>
          </View>
          <View style={st.cardMetaItem}>
            <MaterialIcons name="access-time" size={13} color={colors.primary} />
            <Text style={[st.cardMetaText, { color: colors.textSecondary }]}>{booking.start_time} – {booking.end_time}</Text>
          </View>
        </View>

        <View style={st.cardFooter}>
          <Text style={[st.cardPrice, { color: colors.primary }]}>{formatPrice(booking.total_price)}</Text>
          <View style={[st.cardActionBtn, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[st.cardActionText, { color: colors.primary }]}>
              {booking.status === 'APPROVED' ? 'Bayar →' :
               booking.status === 'WAITING_OWNER_APPROVAL' ? 'Menunggu →' :
               'Detail →'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: SIZES.borderRadiusLg,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  cardImageWrap: { width: 92, position: 'relative' },
  cardImage: { width: 92, height: '100%' },
  cardStatusBadge: {
    position: 'absolute', bottom: 6, left: 4, right: 4,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 5, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  cardStatusText: { fontFamily: FONT_FAMILY, fontSize: 8, fontWeight: '800', letterSpacing: 0.2, flex: 1 },
  cardBody: { flex: 1, padding: 12, gap: 4 },
  cardFieldName: { ...FONTS.titleMd },
  cardSport: { ...FONTS.bodySm },
  cardMeta: { gap: 4, marginTop: 4 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { ...FONTS.bodySm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  cardPrice: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700' },
  cardActionBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  cardActionText: { ...FONTS.labelMd },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BookingTabScreen() {
  const { colors, resolved } = useTheme();
  const styles = makeStyles(colors);
  const { bookings, loading, refreshing, error, refresh } = useBookingHistory();

  // Refresh when tab comes into focus
  useFocusEffect(useCallback(() => {
    refresh();
  }, []));

  const upcoming = bookings.filter(b => ACTIVE_STATUSES.includes(b.status));
  const history  = bookings.filter(b => PAST_STATUSES.includes(b.status));

  function navigateToBooking(b: Booking) {
    if (b.status === 'WAITING_OWNER_APPROVAL') {
      router.push({ pathname: '/booking-waiting', params: { id: String(b.id) } });
    } else if (b.status === 'APPROVED') {
      router.push({ pathname: '/booking-payment', params: { id: String(b.id) } });
    } else if (b.status === 'CONFIRMED') {
      router.push({ pathname: '/booking-success', params: { id: String(b.id) } });
    }
    // COMPLETED, CANCELLED, EXPIRED → no navigation for now
  }

  function renderEmpty(message: string) {
    return (
      <View style={styles.emptyBox}>
        <MaterialIcons name="event-busy" size={40} color={colors.textTertiary} />
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Booking</Text>
        <TouchableOpacity
          style={[styles.newBookingBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/fields')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add" size={18} color={colors.onPrimary} />
          <Text style={[styles.newBookingText, { color: colors.onPrimary }]}>Booking Baru</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Memuat booking...</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingCenter}>
          <MaterialIcons name="error-outline" size={40} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={refresh}>
            <Text style={[styles.retryText, { color: colors.onPrimary }]}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Upcoming Bookings */}
          <FadeInView>
            <Text style={styles.sectionTitle}>Booking Aktif</Text>
            {upcoming.length === 0
              ? renderEmpty('Tidak ada booking aktif.\nMulai pesan lapangan sekarang!')
              : upcoming.map(b => (
                  <BookingCard key={b.id} booking={b} colors={colors} onPress={() => navigateToBooking(b)} />
                ))
            }
          </FadeInView>

          {/* History */}
          {history.length > 0 && (
            <FadeInView delay={100}>
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Riwayat</Text>
              {history.map(b => (
                <BookingCard key={b.id} booking={b} colors={colors} onPress={() => {}} />
              ))}
            </FadeInView>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 14,
    backgroundColor: colors.background,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  headerTitle: { fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: '700', color: colors.text },
  newBookingBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: SIZES.borderRadius,
  },
  newBookingText: { ...FONTS.labelMd },

  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },

  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { ...FONTS.bodyMd },
  errorText: { ...FONTS.bodyMd, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: SIZES.borderRadius },
  retryText: { ...FONTS.buttonMd },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
    backgroundColor: colors.surfaceContainer,
    borderRadius: SIZES.borderRadiusLg,
    marginBottom: 8,
  },
  emptyText: { ...FONTS.bodyMd, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
