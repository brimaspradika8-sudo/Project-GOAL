import React, { useEffect, useRef } from 'react';
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
import { useBookingDetail } from '../hooks/useBooking';
import { SPORT_LABELS } from '../lib/fieldValidation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(p: number): string {
  return `Rp${p.toLocaleString('id-ID')}`;
}

function formatDateDisplay(d: string): string {
  if (!d) return '-';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Success Check Animation ──────────────────────────────────────────────────

function SuccessCheck({ color }: { color: string }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.checkCircle, { backgroundColor: color }]}>
        <MaterialIcons name="check" size={52} color="#fff" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  checkCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Ticket Row ───────────────────────────────────────────────────────────────

function TicketRow({ label, value, highlight = false, colors }: {
  label: string;
  value: string;
  highlight?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
      <Text style={{ fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800', color: colors.textTertiary, letterSpacing: 0.5, flex: 1 }}>
        {label}
      </Text>
      <Text style={[{ fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '600', color: highlight ? colors.primary : colors.text, textAlign: 'right', flex: 2 }]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingSuccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);
  const { colors } = useTheme();
  const st = makeStyles(colors);

  const { booking, loading } = useBookingDetail(bookingId);

  if (loading || !booking) {
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
        <Text style={st.headerTitle}>Booking Berhasil</Text>
        <TouchableOpacity style={st.closeBtn} onPress={() => router.replace('/(tabs)/booking')}>
          <MaterialIcons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Success Section */}
        <View style={st.successSection}>
          <SuccessCheck color={colors.primary} />
          <Text style={st.successTitle}>Pembayaran Berhasil!</Text>
          <Text style={st.successDesc}>
            Booking Anda telah dikonfirmasi.{'\n'}Selamat bermain! 🎉
          </Text>
        </View>

        {/* Ticket Card */}
        <View style={st.ticketCard}>
          {/* Ticket Header */}
          <View style={st.ticketHeader}>
            <View style={st.ticketLogoRow}>
              <View style={[st.ticketLogoIcon, { backgroundColor: colors.primaryContainer }]}>
                <MaterialIcons name="sports-soccer" size={14} color={colors.primary} />
              </View>
              <Text style={[st.ticketLogo, { color: colors.primary }]}>GOAL</Text>
            </View>
            <View style={[st.ticketBadge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[st.ticketBadgeText, { color: colors.primary }]}>CONFIRMED</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={st.ticketDivider}>
            <View style={[st.ticketHole, { backgroundColor: colors.background }]} />
            <View style={[st.ticketDividerLine, { borderColor: colors.outlineVariant }]} />
            <View style={[st.ticketHole, { backgroundColor: colors.background }]} />
          </View>

          {/* Ticket Body */}
          <View style={st.ticketBody}>
            <TicketRow label="LAPANGAN" value={booking.field?.name ?? `Field #${booking.field_id}`} colors={colors} />
            <View style={{ height: 10 }} />
            <TicketRow label="OLAHRAGA" value={SPORT_LABELS[booking.field?.sport_type ?? ''] ?? (booking.field?.sport_type ?? '-')} colors={colors} />
            <View style={{ height: 10 }} />
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <View style={{ flex: 1 }}>
                <TicketRow label="TANGGAL" value={formatDateDisplay(booking.booking_date)} colors={colors} />
              </View>
            </View>
            <View style={{ height: 10 }} />
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <View style={{ flex: 1 }}>
                <TicketRow label="JAM" value={`${booking.start_time} – ${booking.end_time}`} colors={colors} />
              </View>
              <View style={{ flex: 1 }}>
                <TicketRow label="TOTAL" value={formatPrice(booking.total_price)} highlight colors={colors} />
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={st.ticketDivider}>
            <View style={[st.ticketHole, { backgroundColor: colors.background }]} />
            <View style={[st.ticketDividerLine, { borderColor: colors.outlineVariant }]} />
            <View style={[st.ticketHole, { backgroundColor: colors.background }]} />
          </View>

          {/* QR Footer */}
          <View style={st.ticketFooter}>
            <MaterialIcons name="qr-code-2" size={72} color={colors.textTertiary} />
            <Text style={[st.qrText, { color: colors.textTertiary }]}>Tunjukkan saat tiba di lapangan</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={[st.infoCard, { backgroundColor: colors.primaryContainer }]}>
          <MaterialIcons name="info-outline" size={16} color={colors.primary} />
          <Text style={[st.infoText, { color: colors.textSecondary }]}>
            Datang 10 menit sebelum waktu bermain. Tunjukkan booking ini kepada petugas lapangan.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={st.actions}>
          <TouchableOpacity
            style={[st.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace({ pathname: '/e-ticket', params: { id: String(bookingId) } })}
            activeOpacity={0.85}
          >
            <Text style={[st.primaryBtnText, { color: colors.onPrimary }]}>Lihat E-Ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.secondaryBtn, { borderColor: colors.primary, backgroundColor: colors.surfaceWhite }]}
            onPress={() => router.replace('/(tabs)/booking')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="event-available" size={20} color={colors.primary} />
            <Text style={[st.secondaryBtnText, { color: colors.primary }]}>Lihat Semua Booking</Text>
          </TouchableOpacity>
        </View>

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

  scrollContent: { paddingHorizontal: 20, paddingTop: 32, maxWidth: 480, alignSelf: 'center', width: '100%' },

  successSection: { alignItems: 'center', marginBottom: 28 },
  successTitle: { fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8, textAlign: 'center' },
  successDesc: { ...FONTS.bodyMd, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  ticketCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusXl,
    borderWidth: 1, borderColor: colors.divider,
    overflow: 'hidden',
    marginBottom: 16,
    ...SHADOWS.lg,
  },
  ticketHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18,
  },
  ticketLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ticketLogoIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  ticketLogo: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  ticketBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ticketBadgeText: { fontSize: 10, fontWeight: '800', fontFamily: FONT_FAMILY, letterSpacing: 0.5 },
  ticketDivider: { flexDirection: 'row', alignItems: 'center' },
  ticketHole: { width: 20, height: 20, borderRadius: 10 },
  ticketDividerLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1 },
  ticketBody: { padding: 18 },
  ticketFooter: { padding: 18, alignItems: 'center', gap: 6 },
  qrText: { ...FONTS.bodySm },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: SIZES.borderRadius, padding: 14, marginBottom: 20,
  },
  infoText: { ...FONTS.bodySm, flex: 1, lineHeight: 18 },

  actions: { gap: 12 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 50, borderRadius: SIZES.borderRadius, borderWidth: 1.5, gap: 8,
  },
  secondaryBtnText: { ...FONTS.buttonMd },
  primaryBtn: {
    height: 50, borderRadius: SIZES.borderRadius,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.primary,
  },
  primaryBtnText: { ...FONTS.buttonMd },
});
