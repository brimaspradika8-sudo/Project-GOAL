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
import { SafeImage } from '../../../components/SafeImage';
import { FadeInView } from '../../../components/FadeInView';
import { HorizontalDatePicker } from '../../../components/booking';
import { useTheme } from '../../../lib/theme';
import { useSlots } from '../../../hooks/useBooking';
import { getFieldDetail } from '../../../services/bookingService';
import { useBookingStore } from '../../../store/bookingStore';
import { useToastStore } from '../../../store/toastStore';
import { getErrorMessage } from '../../../lib/api';
import { SPORT_LABELS } from '../../../lib/fieldValidation';
import { EmptyState, ErrorState } from '../../../components/common';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function formatDateDisplay(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function formatRupiah(price: number | null): string {
  if (price == null) return 'Hubungi';
  return `Rp${price.toLocaleString('id-ID')}`;
}

function pricePerHourLabel(price: number | null): string {
  if (price == null) return 'Hubungi';
  return `Rp${price.toLocaleString('id-ID')}/jam`;
}

const DURATION_OPTIONS = [
  { label: '1 Jam', minutes: 60 },
  { label: '2 Jam', minutes: 120 },
  { label: '3 Jam', minutes: 180 },
];

const WHITE = '#FFFFFF';
const MUTED_TEXT = '#64748B';

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingCreateScreen() {
  const params = useLocalSearchParams<{
    fieldId: string;
    fieldName?: string;
    price?: string;
    image?: string;
    location?: string;
  }>();
  const fieldIdNumber = Number(params.fieldId);
  const { colors } = useTheme();
  const showToast = useToastStore((s) => s.show);
  const st = makeStyles(colors);

  // ── Booking flow state (Zustand) ─────────────────────────────────────────
  const selectedField = useBookingStore((s) => s.selectedField);
  const setField = useBookingStore((s) => s.setField);
  const selectedDate = useBookingStore((s) => s.selectedDate);
  const setDate = useBookingStore((s) => s.setDate);
  const selectedSlot = useBookingStore((s) => s.selectedSlots[0]);
  const setSlot = useBookingStore((s) => s.setSlot);
  const clearSlots = useBookingStore((s) => s.clearSlots);
  const durationMinutes = useBookingStore((s) => s.durationMinutes);
  const setDuration = useBookingStore((s) => s.setDuration);
  const setTotalPrice = useBookingStore((s) => s.setTotalPrice);
  const setBookingId = useBookingStore((s) => s.setBookingId);
  const create = useBookingStore((s) => s.create);

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const today = formatDate(new Date());

  // ── Field: render instantly from route params, refresh in background ─────
  useEffect(() => {
    let cancelled = false;

    if (!selectedField && params.fieldName) {
      setField({
        id: fieldIdNumber,
        name: params.fieldName,
        sport_type: '',
        location: params.location ?? '',
        description: null,
        price_per_hour: params.price ? Number(params.price) : null,
        image_url: params.image || null,
        status: 'approved',
        approved_at: null,
        created_at: '',
        updated_at: '',
      });
    }

    (async () => {
      setFieldError(null);
      try {
        const data = await getFieldDetail(fieldIdNumber);
        if (!cancelled) setField(data);
      } catch (e: any) {
        if (!cancelled && !selectedField) {
          setFieldError(e?.message || 'Gagal memuat detail lapangan');
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldIdNumber]);

  // Default tanggal hari ini
  useEffect(() => {
    if (!selectedDate) setDate(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Slots (dipicu saat tanggal berubah) ───────────────────────────────────
  const { slotsData, loading: slotsLoading, error: slotsError, refetch: refetchSlots } = useSlots(fieldIdNumber, selectedDate ?? today);

  const handleDateChange = (iso: string) => {
    if (iso === selectedDate) return;
    Haptics.selectionAsync();
    setDate(iso);
    clearSlots();
  };

  // ── Selection derivations ─────────────────────────────────────────────────
  const selectedDuration = DURATION_OPTIONS.find((o) => o.minutes === durationMinutes) ?? DURATION_OPTIONS[0];
  const endTime = selectedSlot ? addMinutesToTime(selectedSlot.start_time, durationMinutes) : null;
  const totalPrice = selectedField?.price_per_hour != null
    ? Math.round((selectedField.price_per_hour / 60) * durationMinutes)
    : null;

  // Sinkronkan harga ke store
  useEffect(() => {
    setTotalPrice(totalPrice);
  }, [totalPrice, setTotalPrice]);

  // Perbarui jam selesai slot saat durasi berubah
  useEffect(() => {
    if (selectedSlot) {
      setSlot({ start_time: selectedSlot.start_time, end_time: addMinutesToTime(selectedSlot.start_time, durationMinutes) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMinutes]);

  const canContinue = !!selectedDate && !!selectedSlot && !!endTime;

  const handleContinue = async () => {
    if (!canContinue) {
      showToast({ type: 'info', title: 'Pilih tanggal dan jam terlebih dahulu' });
      return;
    }
    setSubmitting(true);
    try {
      const booking = await create({
        field_id: fieldIdNumber,
        booking_date: selectedDate!,
        slots: [{ start_time: selectedSlot!.start_time, end_time: endTime! }],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBookingId(booking.id);
      router.replace({ pathname: '/booking/payment/[id]', params: { id: String(booking.id) } });
    } catch (e: any) {
      const msg = getErrorMessage(e?.data ?? e, 'Gagal membuat booking');
      showToast({ type: 'error', title: 'Gagal', description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Renderers ─────────────────────────────────────────────────────────────

  const renderFieldCard = () => {
    const field = selectedField;
    if (!field) return null;
    return (
      <View style={st.fieldCard}>
        <SafeImage source={{ uri: field.image_url ?? '' }} style={st.fieldImage} fallbackSize={32} />
        <View style={st.fieldInfo}>
          <Text style={st.fieldName} numberOfLines={1}>{field.name}</Text>
          {field.sport_type ? (
            <View style={st.fieldMeta}>
              <MaterialIcons name="sports-soccer" size={13} color={colors.primary} />
              <Text style={st.fieldMetaText}>{SPORT_LABELS[field.sport_type] ?? field.sport_type}</Text>
            </View>
          ) : null}
          {field.location ? (
            <View style={st.fieldMeta}>
              <MaterialIcons name="location-on" size={13} color={MUTED_TEXT} />
              <Text style={st.fieldMetaText} numberOfLines={1}>{field.location}</Text>
            </View>
          ) : null}
          <Text style={st.fieldPrice}>{pricePerHourLabel(field.price_per_hour)}</Text>
        </View>
      </View>
    );
  };

  const renderDateSection = () => (
    <View style={st.section}>
      <Text style={st.sectionTitle}>Pilih Tanggal</Text>
      <View style={st.card}>
        <HorizontalDatePicker value={selectedDate} onChange={handleDateChange} />
      </View>
    </View>
  );

  const renderDurationSection = () => (
    <View style={st.section}>
      <Text style={st.sectionTitle}>Durasi Sewa</Text>
      <View style={st.durationRow}>
        {DURATION_OPTIONS.map((opt) => {
          const isSelected = opt.minutes === durationMinutes;
          return (
            <TouchableOpacity
              key={opt.minutes}
              style={[st.durationChip, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => { setDuration(opt.minutes); Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              <Text style={[st.durationText, isSelected && { color: WHITE }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderSlotSection = () => (
    <View style={st.section}>
      <View style={st.sectionHeader}>
        <Text style={st.sectionTitle}>Pilih Jam</Text>
        {slotsData?.field_status && (
          <View style={[st.liveStatusBadge, { backgroundColor: slotsData.field_status === 'AVAILABLE' ? colors.primaryContainer : colors.errorContainer }]}>
            <View style={[st.liveStatusDot, { backgroundColor: slotsData.field_status === 'AVAILABLE' ? colors.primary : colors.error }]} />
            <Text style={[st.liveStatusText, { color: slotsData.field_status === 'AVAILABLE' ? colors.primary : colors.error }]}>
              {slotsData.field_status === 'AVAILABLE' ? 'Tersedia' : slotsData.field_status === 'PLAYING' ? 'Sedang Dimainkan' : 'Sedang Dipakai'}
            </Text>
          </View>
        )}
      </View>

      <View style={st.card}>
        {slotsLoading ? (
          <View style={st.slotsLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={st.slotsLoadingText}>Memuat jadwal...</Text>
          </View>
        ) : slotsError ? (
          <ErrorState title="Jadwal gagal dimuat" description={slotsError} onRetry={refetchSlots} />
        ) : !slotsData?.slots?.length ? (
          <EmptyState icon="event-busy" title="Tidak ada slot tersedia" description="Coba pilih tanggal lain." />
        ) : (
          <View style={st.slotsGrid}>
            {slotsData.slots.map((slot, i) => {
              const isAvailable = slot.status === 'AVAILABLE';
              const isSelected = selectedSlot?.start_time === slot.start_time;
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={isAvailable ? 0.75 : 1}
                  disabled={!isAvailable}
                  onPress={() => {
                    setSlot({ start_time: slot.start_time, end_time: addMinutesToTime(slot.start_time, durationMinutes) });
                    Haptics.selectionAsync();
                  }}
                  style={[
                    st.slotBtn,
                    isSelected && st.slotBtnSelected,
                    !isSelected && isAvailable && st.slotBtnAvailable,
                    !isAvailable && st.slotBtnBooked,
                  ]}
                >
                  <Text
                    style={[
                      st.slotTime,
                      isSelected ? { color: WHITE } : isAvailable ? { color: colors.primary } : { color: colors.textTertiary },
                    ]}
                  >
                    {slot.start_time}
                  </Text>
                  {isSelected ? (
                    <Text style={[st.slotHint, { color: 'rgba(255,255,255,0.9)' }]}>Dipilih</Text>
                  ) : !isAvailable ? (
                    <Text style={[st.slotHint, { color: colors.textTertiary }]}>
                      {slot.status === 'BOOKED' ? 'Penuh' : 'Tutup'}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );

  const renderSummary = () => {
    if (!selectedSlot || !endTime) return null;
    return (
      <View style={st.section}>
        <Text style={st.sectionTitle}>Ringkasan</Text>
        <View style={st.card}>
          <View style={st.summaryRow}>
            <Text style={st.summaryLabel}>Lapangan</Text>
            <Text style={st.summaryValue} numberOfLines={1}>{selectedField?.name ?? 'Lapangan'}</Text>
          </View>
          <View style={st.summaryRow}>
            <Text style={st.summaryLabel}>Tanggal</Text>
            <Text style={st.summaryValue}>{selectedDate ? formatDateDisplay(selectedDate) : '-'}</Text>
          </View>
          <View style={st.summaryRow}>
            <Text style={st.summaryLabel}>Jam</Text>
            <Text style={st.summaryValue}>{selectedSlot.start_time} – {endTime}</Text>
          </View>
          <View style={st.summaryRow}>
            <Text style={st.summaryLabel}>Durasi</Text>
            <Text style={st.summaryValue}>{selectedDuration.label}</Text>
          </View>
          <View style={st.summaryDivider} />
          <View style={st.summaryTotalRow}>
            <Text style={st.summaryTotalLabel}>Total</Text>
            <Text style={st.summaryTotalValue}>{totalPrice != null ? formatRupiah(totalPrice) : 'Hubungi'}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (!selectedField && !fieldError) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header title="Booking Lapangan" />
        <View style={st.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={st.centeredText}>Memuat lapangan...</Text>
        </View>
      </View>
    );
  }

  if (fieldError && !selectedField) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header title="Booking Lapangan" />
        <View style={st.centered}>
          <ErrorState
            title="Lapangan tidak bisa dimuat"
            description={fieldError}
            onRetry={() => {
              setFieldError(null);
              getFieldDetail(fieldIdNumber)
                .then(setField)
                .catch((e: any) => setFieldError(e?.message || 'Gagal memuat detail lapangan'));
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={st.container}>
      <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <Header title="Booking Lapangan" />

      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <FadeInView slideUp={12} duration={320}>
          {renderFieldCard()}
        </FadeInView>

        <FadeInView delay={60} duration={320}>
          {renderDateSection()}
        </FadeInView>

        <FadeInView delay={120} duration={320}>
          {renderDurationSection()}
        </FadeInView>

        <FadeInView delay={180} duration={320}>
          {renderSlotSection()}
        </FadeInView>

        <FadeInView delay={240} duration={320}>
          {renderSummary()}
        </FadeInView>

        <View style={{ height: 130 }} />
      </ScrollView>

      {/* Sticky bottom action */}
      <View style={st.bottomBar}>
        <View style={st.bottomTotalRow}>
          <Text style={st.bottomLabel}>{canContinue ? 'Total' : 'Pilih jadwal'}</Text>
          <Text style={[st.bottomAmount, !canContinue && { color: colors.textTertiary }]}>
            {canContinue && totalPrice != null ? formatRupiah(totalPrice) : '—'}
          </Text>
        </View>
        <TouchableOpacity
          style={[st.cta, !canContinue && st.ctaDisabled]}
          onPress={handleContinue}
          disabled={!canContinue || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <>
              <Text style={st.ctaText}>Lanjut Pembayaran</Text>
              <MaterialIcons name="arrow-forward" size={18} color={WHITE} />
            </>
          )}
        </TouchableOpacity>
      </View>
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
      <Text style={st.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 12,
    padding: 32,
  },
  centeredText: {
    ...FONTS.bodyMd,
    color: colors.textSecondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  headerTitle: { ...FONTS.headlineSm, color: colors.text },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ── Venue summary ─────────────────────────────────────────────────────────
  fieldCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 14,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  fieldImage: {
    width: 90,
    height: 90,
    borderRadius: SIZES.borderRadiusLg,
    backgroundColor: colors.surfaceContainer,
  },
  fieldInfo: { flex: 1, justifyContent: 'center', gap: 3 },
  fieldName: { ...FONTS.headlineSm, color: colors.text },
  fieldMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fieldMetaText: { ...FONTS.bodySm, color: colors.textSecondary, flex: 1 },
  fieldPrice: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 4 },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { ...FONTS.headlineSm, color: colors.text, marginBottom: 12 },
  card: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 16,
    ...SHADOWS.sm,
  },

  liveStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveStatusDot: { width: 6, height: 6, borderRadius: 3 },
  liveStatusText: { ...FONTS.labelSm, fontWeight: '700' },

  // ── Durasi ────────────────────────────────────────────────────────────────
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  durationChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.borderRadiusFull,
    borderWidth: 1.5,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceWhite,
  },
  durationText: { ...FONTS.titleSm, color: colors.text },

  // ── Slot grid ─────────────────────────────────────────────────────────────
  slotsLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 24, justifyContent: 'center' },
  slotsLoadingText: { ...FONTS.bodyMd, color: colors.textSecondary },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotBtn: {
    width: '22%',
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
  slotBtnBooked: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.divider,
  },
  slotTime: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700' },
  slotHint: { fontFamily: FONT_FAMILY, fontSize: 10, marginTop: 2 },

  // ── Summary ───────────────────────────────────────────────────────────────
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  summaryLabel: { ...FONTS.bodyMd, color: colors.textSecondary },
  summaryValue: { ...FONTS.labelLg, color: colors.text, flex: 1, textAlign: 'right' },
  summaryDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 12 },
  summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTotalLabel: { ...FONTS.titleLg, color: colors.text },
  summaryTotalValue: { fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: '700', color: colors.primary },

  // ── Bottom bar ────────────────────────────────────────────────────────────
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
  bottomTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  bottomLabel: { ...FONTS.bodySm, color: colors.textSecondary },
  bottomAmount: { fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: '700', color: colors.primary },
  cta: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
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
