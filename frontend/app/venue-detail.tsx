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
import * as Linking from 'expo-linking';
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../components/goalTheme';
import { Skeleton } from '../components/Skeleton';
import { FadeInView } from '../components/FadeInView';
import { HeroCarousel, HorizontalDatePicker } from '../components/booking';
import { apiFetch } from '../lib/apiClient';
import { useFavoriteStore } from '../store/favoriteStore';
import { useTheme } from '../lib/theme';
import { useIsMobileWeb } from '../lib/responsive';
import type { Field } from '../store/fieldStore';
import { useToastStore } from '../store/toastStore';
import { SPORT_LABELS } from '../lib/fieldValidation';
import { useBookingStore, MAX_BOOKING_SLOTS, slotDurationMinutes, sortSlots, isSlotPast } from '../store/bookingStore';
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

function pricePerHourLabel(price: number | null): string {
  if (price == null) return 'Hubungi';
  return `Rp${price.toLocaleString('id-ID')}/jam`;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
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
  const [descExpanded, setDescExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { hydrate, isFavorite, toggleFavorite } = useFavoriteStore();

  const setStoreField = useBookingStore((s) => s.setField);
  const setBookingId = useBookingStore((s) => s.setBookingId);
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
      setStoreField(data as Field);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [id, setStoreField]);

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
      const slotsApi = selectedSlots.map((time) => {
        const found = slotsData?.slots?.find(s => s.start_time === time);
        return {
          start_time: time,
          end_time: found?.end_time || '',
        };
      });

      const booking = await createBookingRequest({
        field_id: f.id,
        booking_date: selectedDate,
        slots: slotsApi,
        payment_method: 'cash',
      });

      setBookingId(booking.id);
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

  function renderHero() {
    return (
      <View style={st.heroShell}>
        <HeroCarousel images={images} height={isMobile ? 260 : 420} radius={28} sportIcon={sportIcon} />
        <TouchableOpacity style={st.glassBtnLeft} onPress={() => router.back()} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back" size={isMobile ? 22 : 24} color={WHITE} />
        </TouchableOpacity>
        <TouchableOpacity
          style={st.glassBtnRight}
          activeOpacity={0.8}
          onPress={async () => {
            const next = await toggleFavorite(f.id);
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
          }}
        >
          <MaterialIcons name={liked ? 'favorite' : 'favorite-border'} size={isMobile ? 22 : 24} color={liked ? '#F87171' : WHITE} />
        </TouchableOpacity>
        {!isApproved && (
          <View style={st.statusBadge}>
            <Text style={st.statusBadgeText}>Menunggu Persetujuan</Text>
          </View>
        )}
      </View>
    );
  }

  function renderInfo() {
    return (
      <View style={st.infoCard}>
        <Text style={st.venueName} numberOfLines={2} ellipsizeMode="tail">{f.name}</Text>
        <View style={st.metaRow}>
          <MaterialIcons name={sportIcon} size={isMobile ? 15 : 17} color={colors.primary} />
          <Text style={st.metaText}>{SPORT_LABELS[f.sport_type] ?? f.sport_type}</Text>
        </View>
        <View style={st.metaRow}>
          <MaterialIcons name="location-on" size={isMobile ? 15 : 17} color={colors.textTertiary} />
          <Text style={[st.metaText, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{f.location}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              const q = encodeURIComponent(`${f.name} ${f.location}`);
              Linking.openURL(`https://www.google.com/maps/search/${q}`);
            }}
          >
            <Text style={st.mapLink}>Buka Maps</Text>
          </TouchableOpacity>
        </View>
        <View style={st.priceRow}>
          <View>
            <Text style={st.priceLabel}>Harga Sewa</Text>
            <Text style={st.price}>{pricePerHourLabel(f.price_per_hour)}</Text>
          </View>
          {f.owner?.name ? (
            <View style={st.ownerBlock}>
              <Text style={st.ownerLabel}>Dikelola oleh</Text>
              <Text style={st.ownerText} numberOfLines={1}>{f.owner.name}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
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

  function renderDescription() {
    const desc = f.description?.trim();
    const canExpand = !!desc && desc.length > 110;
    return (
      <View style={st.descCard}>
        <Text style={st.descTitle}>Tentang Lapangan</Text>
        <Text
          style={st.descText}
          numberOfLines={descExpanded ? undefined : 3}
        >
          {desc || 'Belum ada deskripsi'}
        </Text>
        {canExpand && (
          <TouchableOpacity activeOpacity={0.7} onPress={() => setDescExpanded((v) => !v)} style={st.readMoreBtn}>
            <Text style={st.readMoreText}>{descExpanded ? 'Tutup' : 'Lihat Selengkapnya'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  function renderBottomBar() {
    const ctaBtn = (
      <TouchableOpacity
        style={[st.cta, !hasSlot && st.ctaDisabled]}
        onPress={handleBookNow}
        disabled={!hasSlot}
        activeOpacity={0.85}
      >
        <MaterialIcons name="calendar-today" size={18} color={hasSlot ? WHITE : colors.textTertiary} />
        <Text style={[st.ctaText, !hasSlot && { color: colors.textTertiary }]}>
          {isApproved ? 'Pesan Sekarang' : 'Tidak tersedia'}
        </Text>
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
          {renderHero()}

          <View style={st.content}>
            <FadeInView slideUp={12} duration={320}>
              {renderInfo()}
            </FadeInView>

            <FadeInView delay={60} duration={320}>
              {renderSlotSection()}
            </FadeInView>

            <FadeInView delay={120} duration={320}>
              {renderDescription()}
            </FadeInView>

            <View style={{ height: isMobile ? 140 : 120 }} />
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

  // ── Hero + glass overlay ──────────────────────────────────────────────────
  heroShell: {
    position: 'relative',
    width: '100%',
  },
  glassBtnLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: isMobile ? 40 : 44,
    height: isMobile ? 40 : 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any)
      : {}),
  },
  glassBtnRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: isMobile ? 40 : 44,
    height: isMobile ? 40 : 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any)
      : {}),
  },
  statusBadge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#F59E0B',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: WHITE,
  },

  // ── Detail card ───────────────────────────────────────────────────────────
  infoCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 24,
    padding: isMobile ? 24 : 28,
    marginBottom: isMobile ? 20 : 28,
    ...SHADOWS.sm,
  },
  venueName: {
    fontFamily: FONT_FAMILY,
    fontSize: isMobile ? 22 : 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    ...FONTS.bodyMd,
    color: colors.textSecondary,
    fontSize: isMobile ? undefined : 16,
  },
  mapLink: {
    ...FONTS.labelMd,
    color: colors.primary,
    fontSize: isMobile ? undefined : 15,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: isMobile ? 14 : 16,
    marginTop: isMobile ? 10 : 12,
  },
  priceLabel: {
    ...FONTS.bodySm,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  price: {
    fontFamily: FONT_FAMILY,
    fontSize: isMobile ? 20 : 24,
    fontWeight: '700',
    color: colors.primary,
  },
  ownerBlock: {
    alignItems: 'flex-end',
    flex: 1,
  },
  ownerLabel: {
    ...FONTS.bodySm,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  ownerText: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
    fontSize: isMobile ? undefined : 15,
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

  // ── Description card ──────────────────────────────────────────────────────
  descCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 24,
    padding: isMobile ? 24 : 28,
    ...SHADOWS.sm,
  },
  descTitle: {
    ...FONTS.headlineSm,
    color: colors.text,
    marginBottom: 12,
    fontSize: isMobile ? undefined : 22,
  },
  descText: {
    ...FONTS.bodyMd,
    color: colors.textSecondary,
    lineHeight: 22,
    fontSize: isMobile ? undefined : 16,
  },
  readMoreBtn: {
    marginTop: 8,
  },
  readMoreText: {
    ...FONTS.labelMd,
    color: colors.primary,
  },

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
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
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
  ctaText: { ...FONTS.buttonLg, color: WHITE },
});
