import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../components/goalTheme';
import { useTheme } from '../lib/theme';
import { useBookingPolling, useBookingDetail } from '../hooks/useBooking';
import { cancelBooking, type Booking } from '../services/bookingService';
import { useToastStore } from '../store/toastStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(p: number): string {
  return `Rp${p.toLocaleString('id-ID')}`;
}

function formatDateDisplay(d: string): string {
  if (!d) return '-';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Pulsing Animation ────────────────────────────────────────────────────────

function PulsingCircle({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.25, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [opacity, scale]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 96, height: 96, borderRadius: 48,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        }}
      />
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingWaitingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);
  const { colors } = useTheme();
  const showToast = useToastStore((s) => s.show);
  const st = makeStyles(colors);
  const [cancelling, setCancelling] = useState(false);

  // Load initial booking data
  const { booking: initialBooking, loading } = useBookingDetail(bookingId);

  // Poll for status changes
  const { booking: polledBooking } = useBookingPolling({
    bookingId,
    targetStatuses: ['CONFIRMED', 'CANCELLED', 'EXPIRED', 'REJECTED'],
    onStatusChange: (b) => {
      if (b.status === 'CONFIRMED') {
        router.replace({ pathname: '/booking-payment', params: { id: String(b.id) } });
      } else if (b.status === 'CANCELLED' || b.status === 'EXPIRED' || b.status === 'REJECTED') {
        showToast({
          type: 'error',
          title: b.status === 'EXPIRED' ? 'Booking kadaluarsa' : 'Booking dibatalkan',
          description: 'Silakan buat booking baru',
        });
        router.replace('/(tabs)/booking');
      }
    },
    interval: 5000,
  });

  const booking: Booking | null = polledBooking ?? initialBooking;

  const handleCancel = useCallback(async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      await cancelBooking(booking.id, 'Tidak jadi bermain');
      showToast({ type: 'info', title: 'Booking dibatalkan', description: 'Booking Anda telah dibatalkan.' });
      router.replace('/(tabs)/booking');
    } catch {
      showToast({ type: 'error', title: 'Gagal membatalkan', description: 'Coba lagi nanti.' });
    } finally {
      setCancelling(false);
    }
  }, [booking, showToast]);

  if (loading && !booking) {
    return (
      <View style={st.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={st.container}>
      <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={st.header}>
        <View style={{ width: 40 }} />
        <Text style={st.headerTitle}>Status Booking</Text>
        <TouchableOpacity style={st.closeBtn} onPress={() => router.replace('/(tabs)/booking')}>
          <MaterialIcons name="home" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Waiting Animation */}
        <View style={st.animSection}>
          <View style={st.iconOuter}>
            <PulsingCircle color={colors.floodlight + '35'} />
            <View style={[st.iconCircle, { backgroundColor: colors.floodlight + '16' }]}>
              <MaterialIcons name="schedule" size={56} color={colors.floodlight} />
            </View>
          </View>
          <Text style={st.waitTitle}>Menunggu Konfirmasi Owner</Text>
          <Text style={st.waitDesc}>
            Permintaan booking Anda telah terkirim.{'\n'}
            Owner lapangan akan segera mengkonfirmasi.
          </Text>
        </View>

        {/* Status Badge */}
        <View style={st.statusBadgeWrap}>
          <View style={[st.statusBadge, { backgroundColor: colors.floodlight + '14', borderColor: colors.floodlight + '40' }]}>
            <ActivityIndicator size="small" color={colors.floodlight} />
            <Text style={[st.statusBadgeText, { color: colors.floodlight }]}>MENUNGGU KONFIRMASI OWNER</Text>
          </View>
        </View>

        {/* Booking Info Card */}
        {booking && (
          <View style={st.infoCard}>
            <Text style={st.infoCardTitle}>Detail Pesanan</Text>

            <View style={st.infoRow}>
              <View style={[st.infoIconWrap, { backgroundColor: colors.primaryContainer }]}>
                <MaterialIcons name="stadium" size={18} color={colors.primary} />
              </View>
              <View style={st.infoRowText}>
                <Text style={st.infoLabel}>Lapangan</Text>
                <Text style={st.infoValue}>{booking.field?.name ?? `Field #${booking.field_id}`}</Text>
              </View>
            </View>

            <View style={st.infoDivider} />

            <View style={st.infoRow}>
              <View style={[st.infoIconWrap, { backgroundColor: colors.primaryContainer }]}>
                <MaterialIcons name="event" size={18} color={colors.primary} />
              </View>
              <View style={st.infoRowText}>
                <Text style={st.infoLabel}>Tanggal</Text>
                <Text style={st.infoValue}>{formatDateDisplay(booking.booking_date)}</Text>
              </View>
            </View>

            <View style={st.infoDivider} />

            <View style={st.infoRow}>
              <View style={[st.infoIconWrap, { backgroundColor: colors.primaryContainer }]}>
                <MaterialIcons name="access-time" size={18} color={colors.primary} />
              </View>
              <View style={st.infoRowText}>
                <Text style={st.infoLabel}>Jam</Text>
                <Text style={st.infoValue}>{booking.start_time} – {booking.end_time}</Text>
              </View>
            </View>

            <View style={st.infoDivider} />

            <View style={st.infoRow}>
              <View style={[st.infoIconWrap, { backgroundColor: colors.primaryContainer }]}>
                <MaterialIcons name="payments" size={18} color={colors.primary} />
              </View>
              <View style={st.infoRowText}>
                <Text style={st.infoLabel}>Total</Text>
                <Text style={[st.infoValue, { color: colors.primary, fontWeight: '700', fontSize: 17 }]}>{formatPrice(booking.total_price)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Polling Hint */}
        <View style={st.hintCard}>
          <MaterialIcons name="info-outline" size={16} color={colors.primary} />
          <Text style={st.hintText}>
            Halaman ini otomatis diperbarui setiap 5 detik. Anda tidak perlu melakukan apapun.
          </Text>
        </View>

        {/* Cancel Button */}
        {booking && (booking.status === 'WAITING_CONFIRMATION' || booking.status === 'CONFIRMED') && (
          <TouchableOpacity
            style={[st.cancelBtn, cancelling && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={cancelling}
            activeOpacity={0.8}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Text style={st.cancelBtnText}>Batalkan Booking</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerTitle: { ...FONTS.headlineSm, color: colors.text },
  closeBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainer },

  scrollContent: { paddingHorizontal: 20, paddingTop: 28, alignItems: 'stretch', maxWidth: 480, alignSelf: 'center', width: '100%' },

  animSection: { alignItems: 'center', marginBottom: 32, paddingVertical: 12 },
  iconOuter: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    position: 'absolute',
  },
  waitTitle: { fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 12, textAlign: 'center' },
  waitDesc: { ...FONTS.bodyMd, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  statusBadgeWrap: { alignItems: 'center', marginBottom: 28 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: SIZES.borderRadiusFull, borderWidth: 1.2,
  },
  statusBadgeText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },

  infoCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 14,
    ...SHADOWS.sm,
  },
  infoCardTitle: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  infoIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  infoRowText: { flex: 1 },
  infoLabel: { ...FONTS.bodySm, color: colors.textSecondary, marginBottom: 3 },
  infoValue: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '600', color: colors.text },
  infoDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 10 },

  hintCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.primaryContainer,
    borderRadius: SIZES.borderRadius, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: colors.primary + '20',
  },
  hintText: { ...FONTS.bodySm, color: colors.textSecondary, flex: 1, lineHeight: 18, fontWeight: '500' },

  cancelBtn: {
    borderWidth: 1.5, borderColor: colors.error + '60',
    borderRadius: SIZES.borderRadius,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: colors.error + '04',
  },
  cancelBtnText: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '600', color: colors.error },
});
