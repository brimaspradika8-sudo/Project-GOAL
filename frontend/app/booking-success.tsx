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
import { ErrorState } from '../components/common';
import { formatPrice, formatDateDisplay } from '../components/booking';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  const hours = minutes / 60;
  return (Math.round(hours * 10) / 10) + ' jam';
}

// ─── Success Check Animation ──────────────────────────────────────────────────

function SuccessCheck({ color, colors }: { color: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.checkOuter}>
      <Animated.View style={[
        styles.checkRing,
        { 
          transform: [{ rotate: rotation }],
          borderColor: color,
        },
      ]} />
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.checkCircle, { backgroundColor: color }]}>
          <MaterialIcons name="check" size={56} color="#fff" />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  checkOuter: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  checkRing: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2,
  },
  checkCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Summary Row ──────────────────────────────────────────────────────────────

function SummaryRow({ label, value, colors }: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={s.row}>
      <Text style={[s.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[s.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  rowLabel: { ...FONTS.bodyMd, flex: 1 },
  rowValue: { ...FONTS.bodyMd, fontWeight: '600', textAlign: 'right', flex: 2 },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingSuccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);
  const { colors } = useTheme();
  const st = makeStyles(colors);

  const { booking, loading, error, refetch } = useBookingDetail(bookingId);

  if (loading) {
    return (
      <View style={st.centered}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={st.centered}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <ErrorState
          title="Data booking gagal dimuat"
          description={error ?? 'Booking tidak ditemukan.'}
          onRetry={refetch}
        />
        <TouchableOpacity style={[st.primaryBtn, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={() => router.replace('/(tabs)/booking')} activeOpacity={0.85}>
          <Text style={[st.primaryBtnText, { color: colors.onPrimary }]}>Ke Daftar Booking</Text>
        </TouchableOpacity>
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
          <SuccessCheck color={colors.primary} colors={colors} />
          <View style={st.successMeta}>
            <Text style={st.bookingRef}>Booking #{booking?.id}</Text>
            <Text style={[st.bookingRef, { color: colors.textSecondary, fontSize: 13 }]}>Kode referensi untuk kuitansi</Text>
          </View>
          <Text style={st.successTitle}>Booking Berhasil Dibuat</Text>
          <Text style={st.successDesc}>
            Permintaan booking Anda telah terkirim ke pemilik lapangan.{'\n'}Tunggu notifikasi persetujuan.
          </Text>
        </View>

        {/* Status Card */}
        <View style={[st.statusCard, { backgroundColor: colors.floodlight + '12', borderColor: colors.floodlight + '40' }]}>
          <View style={[st.statusIconWrap, { backgroundColor: colors.floodlight + '20' }]}>
            <MaterialIcons name="schedule" size={22} color={colors.onWarning ?? '#B45309'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[st.statusTitle, { color: colors.onWarning ?? '#B45309', fontWeight: '700' }]}>Menunggu Persetujuan Owner</Text>
            <Text style={[st.statusDesc, { color: colors.textSecondary, marginTop: 3 }]}>
              Pemilik lapangan akan segera merespons permintaan Anda.
            </Text>
          </View>
        </View>

        {/* Booking Summary */}
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

          <SummaryRow label="Tanggal" value={formatDateDisplay(booking.booking_date)} colors={colors} />
          <SummaryRow label="Jam" value={`${booking.start_time} – ${booking.end_time}`} colors={colors} />
          <SummaryRow label="Durasi" value={formatDuration(booking.duration_minutes)} colors={colors} />
          <SummaryRow label="Metode Pembayaran" value="Cash" colors={colors} />

          <View style={st.summaryDivider} />

          <View style={st.totalRow}>
            <Text style={st.totalLabel}>Total Harga</Text>
            <Text style={st.totalValue}>{formatPrice(booking.total_price)}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={[st.infoCard, { backgroundColor: colors.primaryContainer }]}>
          <MaterialIcons name="info-outline" size={16} color={colors.primary} />
          <Text style={[st.infoText, { color: colors.textSecondary }]}>
            Pembayaran dilakukan secara cash langsung kepada pemilik lapangan saat tiba di venue.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={st.actions}>
          <TouchableOpacity
            style={[st.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/(tabs)/booking')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="event-available" size={20} color={colors.onPrimary} />
            <Text style={[st.primaryBtnText, { color: colors.onPrimary }]}>Lihat Booking</Text>
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

  successSection: { alignItems: 'center', marginBottom: 32, paddingVertical: 8 },
  successMeta: { alignItems: 'center', gap: 4, marginVertical: 18, marginBottom: 12 },
  bookingRef: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: colors.primary },
  successTitle: { fontFamily: FONT_FAMILY, fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 10, textAlign: 'center' },
  successDesc: { ...FONTS.bodyMd, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 320 },

  statusCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    borderRadius: SIZES.borderRadiusLg, borderWidth: 1,
    padding: 16, marginBottom: 20,
  },
  statusIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  statusTitle: { fontFamily: FONT_FAMILY, fontSize: 15 },
  statusDesc: { ...FONTS.bodySm, lineHeight: 18 },

  summaryCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: colors.divider,
    ...SHADOWS.sm,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  summaryIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  summaryFieldName: { fontFamily: FONT_FAMILY, fontSize: 17, fontWeight: '700', color: colors.text },
  summarySport: { ...FONTS.bodySm, color: colors.textSecondary, marginTop: 3 },
  summaryDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: FONT_FAMILY, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  totalValue: { fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: '800', color: colors.primary },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: SIZES.borderRadius, padding: 16, marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  infoText: { ...FONTS.bodySm, flex: 1, lineHeight: 18, color: colors.textSecondary },

  actions: { gap: 12, marginTop: 8 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 54, borderRadius: SIZES.borderRadius,
    ...SHADOWS.primary,
  },
  primaryBtnText: { ...FONTS.buttonLg, fontWeight: '600' },
});
