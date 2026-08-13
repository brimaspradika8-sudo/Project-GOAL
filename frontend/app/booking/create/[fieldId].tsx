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
import { useTheme } from '../../../lib/theme';
import { useBreakpoint } from '../../../lib/responsive';
import { useSlots } from '../../../hooks/useBooking';
import { getFieldDetail } from '../../../services/bookingService';
import { useBookingStore } from '../../../store/bookingStore';
import { useToastStore } from '../../../store/toastStore';
import { getErrorMessage } from '../../../lib/api';
import { SPORT_LABELS } from '../../../lib/fieldValidation';
import { BookingSummary, CalendarPicker, TimeSlotCard } from '../../../components/booking';
import { EmptyState, ErrorState, Loading } from '../../../components/common';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function formatPrice(price: number | null): string {
  if (price == null) return 'Hubungi';
  return `Rp${price.toLocaleString('id-ID')}`;
}

const DURATION_OPTIONS = [
  { label: '1 jam', minutes: 60 },
  { label: '2 jam', minutes: 120 },
  { label: '3 jam', minutes: 180 },
];

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
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === 'desktop';
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

  // Default tanggal hari ini untuk flow baru
  useEffect(() => {
    if (!selectedDate) setDate(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Slots ─────────────────────────────────────────────────────────────────
  const { slotsData, loading: slotsLoading, error: slotsError, refetch: refetchSlots } = useSlots(fieldIdNumber, selectedDate ?? today);

  const handleDateChange = (iso: string) => {
    if (iso === selectedDate) return;
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

  const displayDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();

  const handleContinue = async () => {
    if (!selectedSlot || !endTime) {
      showToast({ type: 'error', title: 'Pilih slot waktu terlebih dahulu' });
      return;
    }
    setSubmitting(true);
    try {
      const booking = await create({
        field_id: fieldIdNumber,
        booking_date: selectedDate ?? today,
        slots: [{ start_time: selectedSlot.start_time, end_time: endTime }],
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

  const renderFieldCard = (compact = false) => {
    const field = selectedField;
    if (!field) return null;
    return (
      <View style={[st.fieldCard, compact && st.fieldCardCompact]}>
        <SafeImage source={{ uri: field.image_url ?? '' }} style={[st.fieldImage, compact && st.fieldImageCompact]} fallbackSize={32} />
        <View style={st.fieldInfo}>
          <Text style={st.fieldName} numberOfLines={1}>{field.name}</Text>
          {field.sport_type ? (
            <View style={st.fieldMeta}>
              <MaterialIcons name="sports" size={13} color={colors.primary} />
              <Text style={st.fieldMetaText}>{SPORT_LABELS[field.sport_type] ?? field.sport_type}</Text>
            </View>
          ) : null}
          {field.location ? (
            <View style={st.fieldMeta}>
              <MaterialIcons name="location-on" size={13} color={colors.textTertiary} />
              <Text style={st.fieldMetaText} numberOfLines={1}>{field.location}</Text>
            </View>
          ) : null}
          <Text style={st.fieldPrice}>{formatPrice(field.price_per_hour)}<Text style={st.fieldPriceUnit}>/jam</Text></Text>
        </View>
      </View>
    );
  };

  const renderDateSection = () => (
    <View style={st.section}>
      <Text style={st.sectionTitle}>Pilih Tanggal</Text>
      <CalendarPicker value={selectedDate ?? today} onChange={handleDateChange} />
    </View>
  );

  const renderSlotSection = () => (
    <View style={st.section}>
      <View style={st.sectionHeader}>
        <Text style={st.sectionTitle}>Pilih Slot Waktu</Text>
        {slotsData?.field_status && (
          <View style={[st.liveStatusBadge, { backgroundColor: slotsData.field_status === 'AVAILABLE' ? colors.primaryContainer : colors.errorContainer }]}>
            <View style={[st.liveStatusDot, { backgroundColor: slotsData.field_status === 'AVAILABLE' ? colors.primary : colors.error }]} />
            <Text style={[st.liveStatusText, { color: slotsData.field_status === 'AVAILABLE' ? colors.primary : colors.error }]}>
              {slotsData.field_status === 'AVAILABLE' ? 'Tersedia' : slotsData.field_status === 'PLAYING' ? 'Sedang Dimainkan' : 'Sedang Dipakai'}
            </Text>
          </View>
        )}
      </View>

      {slotsLoading ? (
        <Loading message="Memuat slot..." />
      ) : slotsError ? (
        <ErrorState title="Slot gagal dimuat" description={slotsError} onRetry={refetchSlots} />
      ) : !slotsData?.slots?.length ? (
        <EmptyState icon="event-busy" title="Tidak ada slot tersedia" description="Coba pilih tanggal lain." />
      ) : (
        <View style={st.slotsGrid}>
          {slotsData.slots.map((slot, i) => {
            const isAvailable = slot.status === 'AVAILABLE';
            const isSelected = selectedSlot?.start_time === slot.start_time;
            return (
              <View key={i} style={[st.slotWrap, isSelected && { borderColor: colors.primary }]}>
                <TimeSlotCard
                  time={slot.start_time}
                  status={slot.status}
                  onPress={() => {
                    if (isAvailable) {
                      setSlot({ start_time: slot.start_time, end_time: addMinutesToTime(slot.start_time, durationMinutes) });
                      Haptics.selectionAsync();
                    }
                  }}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderDurationSection = () => (
    <View style={st.section}>
      <Text style={st.sectionTitle}>Pilih Durasi</Text>
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
              <Text style={[st.durationText, isSelected && { color: colors.onPrimary }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderSummary = () => {
    if (!selectedSlot || !endTime) return null;
    return (
      <BookingSummary
        field={selectedField?.name ?? 'Lapangan'}
        date={formatDateDisplay(displayDate)}
        time={`${selectedSlot.start_time} – ${endTime}`}
        duration={selectedDuration.label}
        price={totalPrice != null ? formatPrice(totalPrice) : 'Hubungi'}
      />
    );
  };

  const renderSubmitButton = (inline = false) => (
    <TouchableOpacity
      style={[st.confirmBtn, inline && st.confirmBtnInline, submitting && st.confirmBtnDisabled]}
      onPress={handleContinue}
      disabled={submitting}
      activeOpacity={0.85}
    >
      {submitting ? (
        <ActivityIndicator color={colors.onPrimary} size="small" />
      ) : (
        <Text style={st.confirmBtnText}>Lanjut Pembayaran</Text>
      )}
    </TouchableOpacity>
  );

  if (!selectedField && !fieldError) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header title="Booking Lapangan" />
        <Loading message="Memuat lapangan..." />
      </View>
    );
  }

  if (fieldError && !selectedField) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header title="Booking Lapangan" />
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
    );
  }

  return (
    <View style={st.container}>
      <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <Header title="Booking Lapangan" />

      {isDesktop ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.desktopScroll}>
          <View style={st.desktopRow}>
            <View style={st.desktopLeft}>
              {renderFieldCard()}
              <View style={st.infoCard}>
                <Text style={st.infoCardTitle}>Informasi Lapangan</Text>
                <View style={st.infoRow}>
                  <MaterialIcons name="sports" size={16} color={colors.primary} />
                  <Text style={st.infoRowText}>{selectedField?.sport_type ? (SPORT_LABELS[selectedField.sport_type] ?? selectedField.sport_type) : 'Tidak diketahui'}</Text>
                </View>
                <View style={st.infoRow}>
                  <MaterialIcons name="location-on" size={16} color={colors.textTertiary} />
                  <Text style={st.infoRowText}>{selectedField?.location || 'Lokasi tidak tersedia'}</Text>
                </View>
                <View style={st.infoRow}>
                  <MaterialIcons name="payments" size={16} color={colors.primary} />
                  <Text style={st.infoRowText}>{formatPrice(selectedField?.price_per_hour ?? null)}/jam</Text>
                </View>
                {selectedField?.description ? (
                  <Text style={st.infoDesc}>{selectedField.description}</Text>
                ) : null}
              </View>
            </View>

            <View style={st.desktopRight}>
              {renderDateSection()}
              {renderSlotSection()}
              {renderDurationSection()}
              {renderSummary()}
              {selectedSlot && renderSubmitButton(true)}
            </View>
          </View>
        </ScrollView>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scrollContent}>
            {renderFieldCard()}
            {renderDateSection()}
            {renderSlotSection()}
            {renderDurationSection()}
            {renderSummary()}
            <View style={{ height: 120 }} />
          </ScrollView>

          {selectedSlot && (
            <View style={st.bottomBar}>
              <View>
                <Text style={st.bottomPriceLabel}>Total Bayar</Text>
                <Text style={st.bottomPriceValue}>{totalPrice != null ? formatPrice(totalPrice) : '-'}</Text>
              </View>
              {renderSubmitButton()}
            </View>
          )}
        </>
      )}
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
      <Text style={st.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

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
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  headerTitle: { ...FONTS.headlineSm, color: colors.text },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  desktopScroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48, alignItems: 'center' },
  desktopRow: { flexDirection: 'row', gap: 24, width: '100%', maxWidth: 1080 },
  desktopLeft: { width: 320, gap: 16, alignSelf: 'flex-start' },
  desktopRight: { flex: 1, gap: 20 },

  fieldCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 14,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  fieldCardCompact: { marginBottom: 0 },
  fieldImage: { width: 72, height: 72, borderRadius: SIZES.borderRadius, backgroundColor: colors.surfaceContainer },
  fieldImageCompact: { width: 64, height: 64 },
  fieldInfo: { flex: 1 },
  fieldName: { ...FONTS.headlineSm, color: colors.text, marginBottom: 4 },
  fieldMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  fieldMetaText: { ...FONTS.bodySm, color: colors.textSecondary, flex: 1 },
  fieldPrice: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 4 },
  fieldPriceUnit: { fontSize: 12, fontWeight: '400', color: colors.textSecondary },

  infoCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 16,
    gap: 10,
    ...SHADOWS.sm,
  },
  infoCardTitle: { ...FONTS.headlineSm, color: colors.text },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoRowText: { ...FONTS.bodyMd, color: colors.text, flex: 1 },
  infoDesc: { ...FONTS.bodySm, color: colors.textSecondary, lineHeight: 20 },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { ...FONTS.headlineSm, color: colors.text, marginBottom: 12 },

  liveStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveStatusDot: { width: 6, height: 6, borderRadius: 3 },
  liveStatusText: { ...FONTS.labelSm },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotWrap: { borderWidth: 1, borderColor: 'transparent', borderRadius: 10, padding: 2 },

  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  durationChip: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: SIZES.borderRadiusFull,
    borderWidth: 1.5, borderColor: colors.divider,
    backgroundColor: colors.surfaceWhite,
  },
  durationText: { ...FONTS.titleSm, color: colors.text },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceWhite,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1, borderTopColor: colors.divider,
    ...SHADOWS.xl,
  },
  bottomPriceLabel: { ...FONTS.bodySm, color: colors.textSecondary },
  bottomPriceValue: { fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: '700', color: colors.primary },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 24, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    minWidth: 180,
    ...SHADOWS.primary,
  },
  confirmBtnInline: { width: '100%', marginTop: 4 },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { ...FONTS.buttonLg, color: colors.onPrimary },
});
