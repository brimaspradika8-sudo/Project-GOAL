import React, { useCallback, useState } from 'react';
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
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../../components/goalTheme';
import { SafeImage } from '../../components/SafeImage';
import { FadeInView } from '../../components/FadeInView';
import { useTheme } from '../../lib/theme';
import { useIsMobileWeb } from '../../lib/responsive';
import { useBookingHistory } from '../../hooks/useBooking';
import { type Booking, type BookingStatus } from '../../services/bookingService';
import { SPORT_LABELS } from '../../lib/fieldValidation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#10B981';
const PRIMARY_LIGHT = '#D1FAE5';
const YELLOW = '#F59E0B';
const YELLOW_LIGHT = '#FEF3C7';
const RED = '#EF4444';
const RED_LIGHT = '#FEE2E2';
const GRAY = '#6B7280';
const GRAY_LIGHT = '#F3F4F6';
const WHITE = '#FFFFFF';

type TabKey = 'aktif' | 'riwayat';

const ACTIVE_STATUSES: BookingStatus[] = ['WAITING_CONFIRMATION', 'CONFIRMED'];
const PAST_STATUSES: BookingStatus[] = ['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'];

// ─── Status Badge Config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, {
  label: string;
  dot: string;
  bg: string;
  text: string;
}> = {
  WAITING_CONFIRMATION: { label: 'Menunggu Konfirmasi', dot: '🟡', bg: YELLOW_LIGHT, text: YELLOW },
  CONFIRMED:            { label: 'Dikonfirmasi',         dot: '🟢', bg: PRIMARY_LIGHT, text: PRIMARY },
  COMPLETED:            { label: 'Selesai',              dot: '⚪', bg: GRAY_LIGHT,    text: GRAY },
  REJECTED:             { label: 'Ditolak',              dot: '🔴', bg: RED_LIGHT,     text: RED },
  CANCELLED:            { label: 'Dibatalkan',           dot: '🔴', bg: RED_LIGHT,     text: RED },
  EXPIRED:              { label: 'Kadaluarsa',           dot: '🔴', bg: RED_LIGHT,     text: RED },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(p: number): string {
  return `Rp${p.toLocaleString('id-ID')}`;
}

function formatDateDisplay(d: string): string {
  if (!d) return '-';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDuration(minutes: number): string {
  if (!minutes) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} jam ${m} menit`;
  if (h > 0) return `${h} jam`;
  return `${m} menit`;
}

// ─── Status Badge Component ───────────────────────────────────────────────────

function StatusBadge({ status, colors, resolved }: { status: BookingStatus, colors: any, resolved: any }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.EXPIRED;
  const badgeSt = makeBadgeSt(colors, resolved);
  return (
    <View style={[badgeSt.pill, { backgroundColor: cfg.bg }]}>
      <Text style={badgeSt.dot}>{cfg.dot}</Text>
      <Text style={[badgeSt.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const makeBadgeSt = (colors: any, resolved: any) => StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dot: { fontSize: 10 },
  label: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', letterSpacing: 0.1 },
});

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onPress,
  colors,
  resolved,
}: {
  booking: Booking;
  onPress: () => void;
  colors: any;
  resolved: any;
}) {
  const cardSt = makeCardSt(colors, resolved);
  const sportLabel = SPORT_LABELS[booking.field?.sport_type ?? ''] ?? (booking.field?.sport_type ?? '');
  const imageUri = booking.field?.image_url ?? '';

  return (
    <TouchableOpacity
      style={cardSt.wrapper}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* ── Left: venue image ── */}
      <View style={cardSt.imageWrap}>
        <SafeImage
          source={{ uri: imageUri }}
          style={cardSt.image}
          fallbackSize={32}
        />
      </View>

      {/* ── Right: info ── */}
      <View style={cardSt.body}>
        {/* Status badge */}
        <StatusBadge status={booking.status} colors={colors} resolved={resolved} />

        {/* Venue name */}
        <Text style={cardSt.fieldName} numberOfLines={1}>
          {booking.field?.name ?? `Lapangan #${booking.field_id}`}
        </Text>

        {/* Sport type */}
        {!!sportLabel && (
          <Text style={cardSt.sport} numberOfLines={1}>{sportLabel}</Text>
        )}

        {/* Date & time */}
        <View style={cardSt.metaCol}>
          <View style={cardSt.metaRow}>
            <Text style={cardSt.metaIcon}>📅</Text>
            <Text style={cardSt.metaText}>{formatDateDisplay(booking.booking_date)}</Text>
          </View>
          <View style={cardSt.metaRow}>
            <Text style={cardSt.metaIcon}>⏰</Text>
            <Text style={cardSt.metaText}>{booking.start_time} – {booking.end_time}</Text>
          </View>
        </View>

        {/* Footer: price + detail button */}
        <View style={cardSt.footer}>
          <Text style={cardSt.price}>{formatPrice(booking.total_price)}</Text>
          <TouchableOpacity style={cardSt.detailBtn} onPress={onPress} activeOpacity={0.8}>
            <Text style={cardSt.detailBtnText}>Lihat Detail</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeCardSt = (colors: any, resolved: any) => StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  imageWrap: {
    width: 110,
    height: 'auto',
  },
  image: {
    width: 110,
    height: '100%',
    minHeight: 150,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  fieldName: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  sport: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaCol: { gap: 3, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaIcon: { fontSize: 12 },
  metaText: { fontFamily: FONT_FAMILY, fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  price: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: PRIMARY,
  },
  detailBtn: {
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  detailBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
  },
});

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab, colors, resolved }: { tab: TabKey, colors: any, resolved: any }) {
  const emptySt = makeEmptySt(colors, resolved);
  const isActive = tab === 'aktif';
  return (
    <FadeInView>
      <View style={emptySt.container}>
        <View style={emptySt.iconWrap}>
          <MaterialIcons
            name={isActive ? 'event-busy' : 'history'}
            size={52}
            color={PRIMARY}
          />
        </View>
        <Text style={emptySt.title}>
          {isActive ? 'Belum ada booking aktif' : 'Belum ada riwayat booking'}
        </Text>
        <Text style={emptySt.subtitle}>
          {isActive
            ? 'Yuk cari lapangan dan mulai bermain!'
            : 'Semua riwayat booking kamu akan muncul di sini.'}
        </Text>
        {isActive && (
          <TouchableOpacity
            style={emptySt.btn}
            onPress={() => router.push('/(tabs)/fields')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="search" size={16} color={WHITE} />
            <Text style={emptySt.btnText}>Cari Lapangan</Text>
          </TouchableOpacity>
        )}
      </View>
    </FadeInView>
  );
}

const makeEmptySt = (colors: any, resolved: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  btnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: WHITE,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BookingTabScreen() {
  const { colors, resolved } = useTheme();
  const st = makeStyles(colors, resolved);
  const isMobile = useIsMobileWeb();
  const { bookings, loading, refreshing, error, refresh } = useBookingHistory();
  const [activeTab, setActiveTab] = useState<TabKey>('aktif');

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  const upcoming = bookings.filter(b => ACTIVE_STATUSES.includes(b.status));
  const history  = bookings.filter(b => PAST_STATUSES.includes(b.status));
  const displayed = activeTab === 'aktif' ? upcoming : history;

  function navigateToBooking(b: Booking) {
    if (b.status === 'WAITING_CONFIRMATION') {
      router.push({ pathname: '/booking/payment/[id]', params: { id: String(b.id) } });
    } else if (b.status === 'CONFIRMED') {
      router.push({ pathname: '/booking-success', params: { id: String(b.id) } });
    }
    // COMPLETED, REJECTED, CANCELLED, EXPIRED — no navigation for now
  }

  return (
    <View style={[st.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* ── Header ── */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <Text style={st.headerTitle}>My Booking</Text>
          <Text style={st.headerSubtitle}>Lihat dan kelola semua booking kamu</Text>
        </View>
        {/* A3: Sembunyikan CTA saat tab aktif kosong (mencegah duplikasi dengan EmptyState) */}
        {!(displayed.length === 0 && activeTab === 'aktif') && (
          <TouchableOpacity
            style={st.headerCta}
            onPress={() => router.push('/(tabs)/fields')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="add" size={18} color={WHITE} />
            <Text style={st.headerCtaText}>Cari Lapangan</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Tab Bar ── */}
      <View style={st.tabBarOuter}>
        {/* A2: Wrapper agar tab bar sejajar dengan konten di desktop */}
        <View style={[
          st.tabBarConstraint,
          !isMobile && { maxWidth: 720, alignSelf: 'center', width: '100%' },
        ]}>
          <View style={st.tabBarInner}>
            {(['aktif', 'riwayat'] as TabKey[]).map(tab => {
              const isActive = activeTab === tab;
              const count = tab === 'aktif' ? upcoming.length : history.length;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[st.tabBtn, isActive && st.tabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[st.tabLabel, isActive && st.tabLabelActive]}>
                    {tab === 'aktif' ? 'Aktif' : 'Riwayat'}
                  </Text>
                  {count > 0 && (
                    <View style={[st.tabBadge, isActive ? st.tabBadgeActive : st.tabBadgeInactive]}>
                      <Text style={[st.tabBadgeText, isActive ? { color: PRIMARY } : { color: GRAY }]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={[st.loadingText, { color: colors.textSecondary }]}>Memuat booking...</Text>
        </View>
      ) : error ? (
        <View style={st.center}>
          <View style={st.errorIconWrap}>
            <MaterialIcons name="wifi-off" size={40} color={RED} />
          </View>
          <Text style={st.errorTitle}>Gagal memuat data</Text>
          <Text style={[st.errorMsg, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={st.retryBtn} onPress={refresh} activeOpacity={0.85}>
            <MaterialIcons name="refresh" size={16} color={WHITE} />
            <Text style={st.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            st.scrollContent,
            !isMobile && { maxWidth: 720, alignSelf: 'center', width: '100%' },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={PRIMARY}
              colors={[PRIMARY]}
            />
          }
        >
          {displayed.length === 0 ? (
            <EmptyState tab={activeTab} colors={colors} resolved={resolved} />
          ) : (
            <FadeInView>
              {displayed.map((b, i) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onPress={() => navigateToBooking(b)}
                  colors={colors}
                  resolved={resolved}
                />
              ))}
            </FadeInView>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* ── Floating CTA (mobile only) ── */}
      {isMobile && !loading && !error && displayed.length > 0 && (
        <View style={st.floatingWrap} pointerEvents="box-none">
          <TouchableOpacity
            style={st.floatingBtn}
            onPress={() => router.push('/(tabs)/fields')}
            activeOpacity={0.9}
          >
            <MaterialIcons name="search" size={20} color={WHITE} />
            <Text style={st.floatingBtnText}>+ Cari Lapangan</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: any, resolved: any) => StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 16,
    // A1: colors.card tidak ada di ThemeColors → pakai colors.surface
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    // A1: colors.border tidak ada di ThemeColors → pakai colors.outline
    borderBottomColor: colors.outline,
  },
  headerLeft: { gap: 2 },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  headerCtaText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: WHITE,
  },

  // Tab bar
  tabBarOuter: {
    // A1: colors.card tidak ada → pakai colors.surface
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    // A1: colors.border tidak ada → pakai colors.outline
    borderBottomColor: colors.outline,
  },
  // A2: Container untuk constraint max-width tab bar di desktop
  tabBarConstraint: {},
  tabBarInner: {
    flexDirection: 'row',
    backgroundColor: resolved === 'dark' ? colors.outline : '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: PRIMARY,
    ...SHADOWS.sm,
  },
  tabLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: GRAY,
  },
  tabLabelActive: {
    color: WHITE,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeInactive: {
    backgroundColor: resolved === 'dark' ? '#374151' : '#E5E7EB',
  },
  tabBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // States
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 32,
  },
  loadingText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: RED_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  errorTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  errorMsg: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 4,
  },
  retryText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: WHITE,
  },

  // Floating button
  floatingWrap: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 50,
    ...SHADOWS.lg,
  },
  floatingBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
});
