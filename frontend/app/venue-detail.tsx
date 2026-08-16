import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../components/goalTheme';
import { Skeleton } from '../components/Skeleton';
import { FadeInView } from '../components/FadeInView';
import { HorizontalDatePicker } from '../components/booking';
import { VenueHero, VenueInfo, VenueDescription } from '../components/venue';
import { apiFetch } from '../lib/apiClient';
import { useFavoriteStore } from '../store/favoriteStore';
import { useTheme } from '../lib/theme';
import { useIsMobileWeb } from '../lib/responsive';
import type { Field } from '../store/fieldStore';
import { useToastStore } from '../store/toastStore';
import { useBookingStore, MAX_BOOKING_SLOTS } from '../store/bookingStore';
import { useSlots, useNow } from '../hooks/useBooking';
import { EmptyState, ErrorState } from '../components/common';

const SPORT_ICONS: Record<string, string> = {
  futsal: 'sports-soccer',
  basketball: 'sports-basketball',
  badminton: 'sports-tennis',
  volleyball: 'sports-volleyball',
  mini_soccer: 'sports-soccer',
  tennis: 'sports-tennis',
  other: 'sports',
};

const WHITE = '#FFFFFF';

function formatRupiah(price: number | null): string {
  if (price == null) return 'Hubungi';
  return `Rp${price.toLocaleString('id-ID')}`;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

const SLOT_PALETTE: Partial<Record<string, { bg: string; border: string; text: string }>> = {
  BOOKED: { bg: '#FEE2E2', border: '#FCA5A5', text: '#DC2626' },
  BUFFER: { bg: '#FEF3C7', border: '#FBBF24', text: '#B45309' },
  CLOSED: { bg: '#F1F5F9', border: '#E2E8F0', text: '#94A3B8' },
};

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const isMobile = useIsMobileWeb();
  const now = useNow();
  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { hydrate, isFavorite, toggleFavorite } = useFavoriteStore();

  const createBookingRequest = useBookingStore((s) => s.create);
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const today = formatDate(new Date());

  useEffect(() => {
    hydrate().catch(() => {});
  }, [hydrate]);

  const fetchField = useCallback(async () => {
    try {
      const res = await apiFetch(`/fields/${id}`, { skipToken: true });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Lapangan tidak ditemukan');
        throw new Error('Terjadi kesalahan jaringan');
      }
      const body = await res.json();
      const data = body?.data ?? body;
      if (!data || typeof data !== 'object' || data.id == null) {
        throw new Error('Lapangan tidak ditemukan');
      }
      setField(data as Field);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!selectedDate) setSelectedDate(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchField();
  }, [fetchField]);

  const { slotsData, loading: slotsLoading, error: slotsError, refetch: refetchSlots } = useSlots(
    field?.id ?? null,
    selectedDate ?? today,
  );

  const handleDateChange = (iso: string) => {
    if (iso === selectedDate) return;
    Haptics.selectionAsync();
    setSelectedDate(iso);
    setSelectedSlots([]);
  };

  const handleSlotPress = (time: string) => {
    Haptics.selectionAsync();
    setSelectedSlots(prev => {
      let newSlots = [...prev];
      if (newSlots.includes(time)) {
        newSlots = newSlots.filter(s => s !== time);
      } else {
        newSlots.push(time);
      }

      if (newSlots.length > 3) {
        useToastStore.getState().show({ type: 'info', title: 'Maksimal booking 3 jam' });
        return prev;
      }

      if (newSlots.length > 1) {
        const sortedAvailable = slotsData?.slots?.map(s => s.start_time) || [];
        newSlots.sort((a, b) => sortedAvailable.indexOf(a) - sortedAvailable.indexOf(b));

        let consecutive = true;
        for (let i = 1; i < newSlots.length; i++) {
          const idxA = sortedAvailable.indexOf(newSlots[i-1]);
          const idxB = sortedAvailable.indexOf(newSlots[i]);
          if (idxB !== idxA + 1) {
            consecutive = false;
            break;
          }
        }
        
        if (!consecutive) {
          useToastStore.getState().show({ type: 'info', title: 'Silahkan pilih slot yang berurutan' });
          return prev;
        }
      }
      return newSlots;
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchField(), refetchSlots()]);
    setRefreshing(false);
  }, [fetchField, refetchSlots]);

  // ── Derived (hooks must run unconditionally) ─────────────────────────────
  const derivedField = field ?? null;
  const isApproved = derivedField?.status === 'approved';
  const liked = derivedField ? isFavorite(derivedField.id) : false;
  const sportIcon = (SPORT_ICONS[derivedField?.sport_type ?? ''] || 'sports') as React.ComponentProps<typeof MaterialIcons>['name'];
  const images = useMemo(() => {
    const multi = (derivedField?.images ?? []).map((img) => img.image_path).filter(Boolean) as string[];
    if (multi.length > 0) return multi;
    return derivedField?.image_url ? [derivedField.image_url] : [];
  }, [derivedField]);

  const hasSlot = !!isApproved && selectedSlots.length > 0;

  const totalPrice = useMemo(() => {
    if (selectedSlots.length === 0 || !derivedField?.price_per_hour) return null;
    return derivedField.price_per_hour * selectedSlots.length;
  }, [selectedSlots, derivedField]);

  const st = makeStyles(colors, isMobile);

  if (loading) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={st.skeletonHero}>
          <Skeleton width="100%" height={isMobile ? 260 : 420} borderRadius={28} />
        </View>
        <View style={st.skeletonBody}>
          <Skeleton width="58%" height={isMobile ? 26 : 32} borderRadius={8} />
          <Skeleton width="42%" height={15} borderRadius={6} style={{ marginTop: 12 }} />
          <Skeleton width="100%" height={isMobile ? 92 : 108} borderRadius={24} style={{ marginTop: 24 }} />
          <Skeleton width="100%" height={isMobile ? 240 : 300} borderRadius={24} style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  if (error || !field) {
    return (
      <View style={st.centered}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <MaterialIcons name="error-outline" size={48} color={colors.textTertiary} />
        <Text style={st.errorTitle}>{error || 'Lapangan tidak ditemukan'}</Text>
        <Text style={st.errorSubtitle}>
          {error === 'Lapangan tidak ditemukan'
            ? 'Lapangan yang Anda cari tidak tersedia atau telah dihapus.'
            : 'Periksa koneksi internet Anda dan coba lagi.'}
        </Text>
        <View style={st.errorActions}>
          <TouchableOpacity onPress={() => { setLoading(true); setError(null); fetchField(); }} style={[st.retryBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
            <MaterialIcons name="refresh" size={18} color={WHITE} />
            <Text style={[st.retryBtnText, { color: WHITE }]}>Coba lagi</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={[st.retryBtn, { backgroundColor: colors.surfaceContainerHigh }]} activeOpacity={0.8}>
            <Text style={[st.retryBtnText, { color: colors.text }]}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const f = field!;

  async function handleBookNow() {
    if (!hasSlot || !selectedDate || selectedSlots.length === 0) return;

    setSubmitting(true);
    try {
      const durationMin = f.session_duration_minutes ?? 60;
      const slotsApi = selectedSlots.map((time) => {
        const found = slotsData?.slots?.find((s) => s.start_time === time);
        return {
          start_time: time,
          end_time: found?.end_time || addMinutesToTime(time, durationMin),
        };
      });

      const booking = await createBookingRequest({
        field_id: f.id,
        booking_date: selectedDate,
        slots: slotsApi,
        payment_method: 'cash',
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/booking/payment/[id]', params: { id: String(booking.id) } });
    } catch (error: any) {
      const message = error?.message || 'Gagal membuat booking';
      useToastStore.getState().show({
        type: 'error',
        title: 'Gagal membuat booking',
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleToggleFavorite() {
    toggleFavorite(f.id).then((next) => {
      const title = next ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit';
      const description = next
        ? `${f.name} masuk ke daftar lapangan favorit Anda.`
        : `${f.name} sudah dihapus dari daftar favorit Anda.`;
      useToastStore.getState().show({
        type: next ? 'success' : 'info',
        title,
        description,
        durationMs: 2500,
      });
    });
  }

  function renderSlotSection() {
    if (!isApproved) return null;
    const slots = slotsData?.slots ?? [];

    return (
      <View style={st.bookingCard}>
        <Text style={st.bookingTitle}>Pilih Jadwal</Text>
        <HorizontalDatePicker value={selectedDate} onChange={handleDateChange} />

        <Text style={st.bookingHint}>Maksimal {MAX_BOOKING_SLOTS} jam. Ketuk slot berurutan untuk menyewa lebih lama.</Text>

        <View style={st.cardDivider} />

        {slotsLoading ? (
          <View style={st.slotsLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={st.slotsLoadingText}>Memuat jadwal...</Text>
          </View>
        ) : slotsError ? (
          <ErrorState title="Jadwal gagal dimuat" description={slotsError} onRetry={refetchSlots} />
        ) : slots.length === 0 ? (
          <EmptyState icon="event-busy" title="Tidak ada slot tersedia" description="Coba pilih tanggal lain." />
        ) : (
          <View style={st.slotsGrid}>
            {slots.map((slot, i) => {
              const isAvailable = slot.status === 'AVAILABLE';
              const currentDateStr = formatDate(now);
              const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
              const isPast = selectedDate === currentDateStr && slot.start_time < currentTimeStr;
              
              const isSelected = selectedSlots.includes(slot.start_time);
              const disabled = !isAvailable || isPast;
              const palette = SLOT_PALETTE[slot.status] ?? null;

              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={disabled ? 1 : 0.75}
                  disabled={disabled}
                  onPress={() => handleSlotPress(slot.start_time)}
                  style={[
                    st.slotBtn,
                    isSelected && st.slotBtnSelected,
                    !isSelected && !disabled && st.slotBtnAvailable,
                    !isSelected && disabled && st.slotBtnDisabled,
                    !isSelected && !isAvailable && palette
                      ? { backgroundColor: palette.bg, borderColor: palette.border }
                      : null,
                  ]}
                >
                  <Text
                    style={[
                      st.slotTime,
                      isSelected
                        ? { color: WHITE }
                        : !disabled
                          ? { color: colors.primary }
                          : { color: palette?.text ?? colors.textTertiary },
                    ]}
                  >
                    {slot.start_time}
                  </Text>
                  {isSelected ? (
                    <Text style={[st.slotHint, { color: 'rgba(255,255,255,0.9)' }]}>Dipilih</Text>
                  ) : isPast ? (
                    <Text style={[st.slotHint, { color: colors.textTertiary }]}>Lewat</Text>
                  ) : !isAvailable ? (
                    <Text style={[st.slotHint, { color: palette?.text ?? colors.textTertiary }]}>
                      {slot.status === 'BOOKED' ? 'Penuh' : slot.status === 'BUFFER' ? 'Buffer' : 'Tutup'}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  }

  function renderBottomBar() {
    const ctaBtn = (
      <TouchableOpacity
        style={[st.cta, (!hasSlot || submitting) && st.ctaDisabled]}
        onPress={handleBookNow}
        disabled={!hasSlot || submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color={WHITE} size="small" />
        ) : (
          <>
            <MaterialIcons name="calendar-today" size={18} color={hasSlot ? WHITE : colors.textTertiary} />
            <Text style={[st.ctaText, !hasSlot && { color: colors.textTertiary }]}>
              {isApproved ? 'Pesan Sekarang' : 'Tidak tersedia'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );

    if (!isMobile) {
      return (
        <View style={st.floatingWrap} pointerEvents="box-none">
          <View style={st.floatingBar}>
            <View style={st.bottomTotalRow}>
              <Text style={st.bottomLabel}>{hasSlot ? 'Total' : 'Pilih jadwal'}</Text>
              <Text style={[st.bottomAmount, !hasSlot && { color: colors.textTertiary }]}>
                {hasSlot && totalPrice != null ? formatRupiah(totalPrice) : '—'}
              </Text>
            </View>
            {ctaBtn}
          </View>
        </View>
      );
    }

    return (
      <View style={st.bottomBar}>
        <View style={st.bottomTotalRow}>
          <Text style={st.bottomLabel}>{hasSlot ? 'Total' : 'Pilih jadwal'}</Text>
          <Text style={[st.bottomAmount, !hasSlot && { color: colors.textTertiary }]}>
            {hasSlot && totalPrice != null ? formatRupiah(totalPrice) : '—'}
          </Text>
        </View>
        {ctaBtn}
      </View>
    );
  }

  // ── Desktop 2-column layout: gallery LEFT + info RIGHT ────────────────────
  if (!isMobile) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          <View style={st.desktopShell}>
            {/* Back button for desktop */}
            <View style={st.desktopTopBar}>
              <TouchableOpacity style={st.desktopBackBtn} onPress={() => router.back()} activeOpacity={0.8}>
                <MaterialIcons name="arrow-back" size={20} color={colors.text} />
                <Text style={st.desktopBackText}>Kembali</Text>
              </TouchableOpacity>
            </View>

            <View style={st.desktopTwoCol}>
              {/* LEFT — Sticky Image Gallery */}
              <View style={st.desktopLeft}>
                <View style={st.desktopGallerySticky}>
                  <VenueHero
                    images={images}
                    sportIcon={sportIcon}
                    isMobile={false}
                    liked={liked}
                    isApproved={isApproved}
                    onBack={() => router.back()}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </View>
              </View>

              {/* RIGHT — Venue Info + Booking */}
              <View style={st.desktopRight}>
                <FadeInView slideUp={12} duration={320}>
                  <VenueInfo field={f} sportIcon={sportIcon} isMobile={false} />
                </FadeInView>

                <FadeInView delay={60} duration={320}>
                  {renderSlotSection()}
                </FadeInView>

                <FadeInView delay={120} duration={320}>
                  <VenueDescription description={f.description} isMobile={false} />
                </FadeInView>

                <FadeInView delay={180} duration={320}>
                  {renderBottomBar()}
                </FadeInView>

                <View style={{ height: 60 }} />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Mobile layout: vertical stack ─────────────────────────────────────────
  return (
    <View style={st.container}>
      <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        <View style={st.scrollContent}>
          <VenueHero
            images={images}
            sportIcon={sportIcon}
            isMobile={isMobile}
            liked={liked}
            isApproved={isApproved}
            onBack={() => router.back()}
            onToggleFavorite={handleToggleFavorite}
          />

          <View style={st.content}>
            <FadeInView slideUp={12} duration={320}>
              <VenueInfo field={f} sportIcon={sportIcon} isMobile={isMobile} />
            </FadeInView>

            <FadeInView delay={60} duration={320}>
              {renderSlotSection()}
            </FadeInView>

            <FadeInView delay={120} duration={320}>
              <VenueDescription description={f.description} isMobile={isMobile} />
            </FadeInView>

            <View style={{ height: 140 }} />
          </View>
        </View>
      </ScrollView>

      {renderBottomBar()}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], isMobile: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 12,
    padding: 32,
  },
  errorTitle: {
    ...FONTS.headlineSm,
    color: colors.text,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...FONTS.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: SIZES.borderRadius,
  },
  retryBtnText: {
    fontWeight: '700',
  },

  // ── Layout container ──────────────────────────────────────────────────────
  scrollContent: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: isMobile ? 16 : 0,
    paddingTop: isMobile ? (Platform.OS === 'ios' ? 56 : 48) : 40,
    paddingBottom: isMobile ? 0 : 40,
  },
  content: {
    width: '100%',
    maxWidth: isMobile ? undefined : 1000,
    alignSelf: 'center',
    paddingTop: isMobile ? 20 : 36,
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonHero: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: isMobile ? 16 : 0,
    paddingTop: isMobile ? (Platform.OS === 'ios' ? 56 : 48) : 40,
  },
  skeletonBody: {
    width: '100%',
    maxWidth: isMobile ? undefined : 1000,
    alignSelf: 'center',
    paddingHorizontal: isMobile ? 16 : 0,
    paddingTop: isMobile ? 20 : 36,
  },

  // ── Booking card ──────────────────────────────────────────────────────────
  bookingCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 24,
    padding: isMobile ? 24 : 28,
    marginBottom: isMobile ? 20 : 28,
    ...SHADOWS.sm,
  },
  bookingTitle: {
    ...FONTS.headlineSm,
    color: colors.text,
    marginBottom: 16,
    fontSize: isMobile ? undefined : 22,
  },
  bookingHint: {
    ...FONTS.bodySm,
    color: colors.textTertiary,
    marginTop: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 20,
  },

  // ── Slot grid ─────────────────────────────────────────────────────────────
  slotsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  slotsLoadingText: { ...FONTS.bodyMd, color: colors.textSecondary },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  slotBtn: {
    width: '22%',
    maxWidth: 112,
    height: 62,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotBtnAvailable: {
    backgroundColor: colors.surfaceWhite,
    borderColor: colors.primary,
  },
  slotBtnDisabled: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.divider,
    opacity: 0.55,
  },
  slotTime: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700' },
  slotHint: { fontFamily: FONT_FAMILY, fontSize: 10, marginTop: 2 },

  // ── Bottom bar / floating CTA ─────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceWhite,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    ...SHADOWS.xl,
  },
  floatingWrap: {
    alignItems: 'center',
    marginTop: 24,
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    width: 520,
    maxWidth: '92%',
    backgroundColor: colors.surfaceWhite,
    borderRadius: 24,
    paddingLeft: 24,
    paddingRight: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    ...SHADOWS.xl,
  },
  bottomTotalRow: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  bottomLabel: { ...FONTS.bodySm, color: colors.textSecondary },
  bottomAmount: { fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: '700', color: colors.primary },
  cta: {
    height: 52,
    minWidth: 200,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    ...SHADOWS.primary,
  },
  ctaDisabled: {
    backgroundColor: colors.surfaceContainerHigh,
    ...(Platform.OS === 'web'
      ? { boxShadow: 'none' }
      : { shadowOpacity: 0, elevation: 0 }
    ),
  },
  ctaText: { ...FONTS.buttonLg, color: '#FFFFFF' },

  // ── Desktop 2-column layout ───────────────────────────────────────────────
  desktopShell: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  desktopTopBar: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  desktopBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceWhite,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.divider,
    ...SHADOWS.sm,
  },
  desktopBackText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  desktopTwoCol: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'flex-start',
  },
  desktopLeft: {
    flex: 1,
    // position: sticky via web CSS — approximated with a fixed top offset
  },
  desktopGallerySticky: {
    position: 'sticky' as any,
    top: 24,
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  desktopRight: {
    flex: 1,
    minWidth: 0,
  },
});
