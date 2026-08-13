import React, { useState, useEffect } from 'react';
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
import { useSlots } from '../../../hooks/useBooking';
import { createBooking, getFieldDetail, type TimeSlot } from '../../../services/bookingService';
import { useToastStore } from '../../../store/toastStore';
import { getErrorMessage } from '../../../lib/api';
import { SPORT_LABELS } from '../../../lib/fieldValidation';
import type { Field } from '../../../store/fieldStore';
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
  { label: '1.5 jam', minutes: 90 },
  { label: '2 jam', minutes: 120 },
  { label: '3 jam', minutes: 180 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingCreateScreen() {
  const { fieldId } = useLocalSearchParams<{ fieldId: string }>();
  const fieldIdNumber = Number(fieldId);
  const { colors } = useTheme();
  const showToast = useToastStore((s) => s.show);
  const st = makeStyles(colors);

  // Field info
  const [field, setField] = useState<Field | null>(null);
  const [fieldLoading, setFieldLoading] = useState(true);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFieldLoading(true);
      setFieldError(null);
      try {
        const data = await getFieldDetail(fieldIdNumber);
        if (!cancelled) setField(data);
      } catch (e: any) {
        if (!cancelled) setFieldError(e?.message || 'Gagal memuat detail lapangan');
      } finally {
        if (!cancelled) setFieldLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fieldIdNumber]);

  // Date state (CalendarPicker starts from today, past dates are not offered)
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [displayDate, setDisplayDate] = useState(new Date());

  // Slots
  const { slotsData, loading: slotsLoading, error: slotsError, refetch: refetchSlots } = useSlots(fieldIdNumber, selectedDate);

  // Selection state
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1]);

  // Submission
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  useEffect(() => {
    setDisplayDate(new Date(`${selectedDate}T00:00:00`));
  }, [selectedDate]);

  const endTime = selectedSlot ? addMinutesToTime(selectedSlot.start_time, selectedDuration.minutes) : null;
  const totalPrice = field?.price_per_hour != null
    ? Math.round((field.price_per_hour / 60) * selectedDuration.minutes)
    : null;

  const handleContinue = async () => {
    if (!selectedSlot || !endTime) {
      showToast({ type: 'error', title: 'Pilih slot waktu terlebih dahulu' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await createBooking({
        field_id: fieldIdNumber,
        booking_date: selectedDate,
        slots: [{ start_time: selectedSlot.start_time, end_time: endTime }],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const booking = res.data ?? (res as any);
      router.replace({ pathname: '/booking/payment/[id]', params: { id: String(booking.id) } });
    } catch (e: any) {
      const msg = getErrorMessage(e?.data ?? e, 'Gagal membuat booking');
      showToast({ type: 'error', title: 'Gagal', description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (fieldLoading) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header title="Pesan Lapangan" />
        <Loading message="Memuat lapangan..." />
      </View>
    );
  }

  if (fieldError || !field) {
    return (
      <View style={st.container}>
        <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header title="Pesan Lapangan" />
        <ErrorState
          title="Lapangan tidak bisa dimuat"
          description={fieldError ?? 'Lapangan tidak ditemukan.'}
          onRetry={() => {
            setFieldLoading(true);
            setFieldError(null);
            getFieldDetail(fieldIdNumber)
              .then(setField)
              .catch((e: any) => setFieldError(e?.message || 'Gagal memuat detail lapangan'))
              .finally(() => setFieldLoading(false));
          }}
        />
      </View>
    );
  }

  return (
    <View style={st.container}>
      <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <Header title="Pesan Lapangan" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scrollContent}>

        {/* Field Card */}
        <View style={st.fieldCard}>
          <SafeImage source={{ uri: field.image_url ?? '' }} style={st.fieldImage} fallbackSize={32} />
          <View style={st.fieldInfo}>
            <Text style={st.fieldName} numberOfLines={1}>{field.name}</Text>
            <View style={st.fieldMeta}>
              <MaterialIcons name="sports" size={13} color={colors.primary} />
              <Text style={st.fieldMetaText}>{SPORT_LABELS[field.sport_type] ?? field.sport_type}</Text>
            </View>
            <View style={st.fieldMeta}>
              <MaterialIcons name="location-on" size={13} color={colors.textTertiary} />
              <Text style={st.fieldMetaText} numberOfLines={1}>{field.location}</Text>
            </View>
            <Text style={st.fieldPrice}>{formatPrice(field.price_per_hour)}<Text style={st.fieldPriceUnit}>/jam</Text></Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Pilih Tanggal</Text>
          <CalendarPicker value={selectedDate} onChange={setSelectedDate} />
        </View>

        {/* Slot Selection */}
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
            <ErrorState
              title="Slot gagal dimuat"
              description={slotsError}
              onRetry={refetchSlots}
            />
          ) : !slotsData?.slots?.length ? (
            <EmptyState
              icon="event-busy"
              title="Tidak ada slot tersedia"
              description="Coba pilih tanggal lain."
            />
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
                          setSelectedSlot(slot);
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

        {/* Duration Selection */}
        {selectedSlot && (
          <View style={st.section}>
            <Text style={st.sectionTitle}>Pilih Durasi</Text>
            <View style={st.durationRow}>
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = opt.minutes === selectedDuration.minutes;
                return (
                  <TouchableOpacity
                    key={opt.minutes}
                    style={[st.durationChip, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => { setSelectedDuration(opt); Haptics.selectionAsync(); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[st.durationText, isSelected && { color: colors.onPrimary }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Booking Summary */}
        {selectedSlot && endTime && (
          <BookingSummary
            field={field.name}
            date={formatDateDisplay(displayDate)}
            time={`${selectedSlot.start_time} – ${endTime}`}
            duration={selectedDuration.label}
            price={totalPrice != null ? formatPrice(totalPrice) : 'Hubungi'}
          />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      {selectedSlot && (
        <View style={st.bottomBar}>
          <View>
            <Text style={st.bottomPriceLabel}>Total Bayar</Text>
            <Text style={st.bottomPriceValue}>{totalPrice != null ? formatPrice(totalPrice) : '-'}</Text>
          </View>
          <TouchableOpacity
            style={[st.confirmBtn, submitting && st.confirmBtnDisabled]}
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
        </View>
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

  fieldCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 14,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  fieldImage: { width: 72, height: 72, borderRadius: SIZES.borderRadius, backgroundColor: colors.surfaceContainer },
  fieldInfo: { flex: 1 },
  fieldName: { ...FONTS.headlineSm, color: colors.text, marginBottom: 4 },
  fieldMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  fieldMetaText: { ...FONTS.bodySm, color: colors.textSecondary, flex: 1 },
  fieldPrice: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 4 },
  fieldPriceUnit: { fontSize: 12, fontWeight: '400', color: colors.textSecondary },

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
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { ...FONTS.buttonLg, color: colors.onPrimary },
});
