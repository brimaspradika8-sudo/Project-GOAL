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
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../components/goalTheme';
import { SafeImage } from '../components/SafeImage';
import { FadeInView } from '../components/FadeInView';
import { useTheme } from '../lib/theme';
import { useSlots } from '../hooks/useBooking';
import { type TimeSlot } from '../services/bookingService';
import { SPORT_LABELS } from '../lib/fieldValidation';
import { apiFetch } from '../lib/apiClient';
import type { Field } from '../store/fieldStore';
import { CalendarPicker, TimeSlotCard } from '../components/booking';

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

export default function BookingFlowScreen() {
  const { id, date, startTime } = useLocalSearchParams<{ id: string; date?: string; startTime?: string }>();
  const fieldId = Number(id);
  const { colors } = useTheme();
  const st = makeStyles(colors);

  // Field info
  const [field, setField] = useState<Field | null>(null);
  const [fieldLoading, setFieldLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/fields/${fieldId}`, { skipToken: true })
      .then(r => r.json())
      .then(data => setField(data))
      .catch(() => {})
      .finally(() => setFieldLoading(false));
  }, [fieldId]);

  // Date state
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(date ?? today);
  const [displayDate, setDisplayDate] = useState(new Date());

  // Slots
  const { slotsData, loading: slotsLoading, error: slotsError, refetch: refetchSlots } = useSlots(fieldId, selectedDate);

  // Selection state
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1]); // default 1.5h

  // Reset slot when date changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  useEffect(() => {
    if (!startTime || !slotsData?.slots?.length) return;
    const slot = slotsData.slots.find((item) => item.start_time === startTime && item.status === 'AVAILABLE');
    if (slot) setSelectedSlot(slot);
  }, [slotsData, startTime]);

  useEffect(() => {
    setDisplayDate(new Date(`${selectedDate}T00:00:00`));
  }, [selectedDate]);

  // Computed end_time
  const endTime = selectedSlot ? addMinutesToTime(selectedSlot.start_time, selectedDuration.minutes) : null;
  const totalPrice = field?.price_per_hour != null
    ? Math.round((field.price_per_hour / 60) * selectedDuration.minutes)
    : null;

  const handleContinueToConfirmation = () => {
    if (!selectedSlot || !endTime) return;
    Haptics.selectionAsync();
    router.push({
      pathname: '/booking-confirmation',
      params: {
        id: String(fieldId),
        date: selectedDate,
        startTime: selectedSlot.start_time,
        endTime,
      },
    });
  };

  if (fieldLoading) {
    return (
      <View style={st.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Pesan Lapangan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scrollContent}>

        {/* Field Card */}
        {field && (
          <FadeInView style={st.fieldCard}>
            <SafeImage
              source={{ uri: field.image_url ?? '' }}
              style={st.fieldImage}
              fallbackSize={32}
            />
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
          </FadeInView>
        )}

        {/* Date Selection */}
        <FadeInView delay={80} style={st.section}>
          <Text style={st.sectionTitle}>Pilih Tanggal</Text>
          <CalendarPicker value={selectedDate} onChange={setSelectedDate} />
        </FadeInView>

        {/* Slot Selection */}
        <FadeInView delay={120} style={st.section}>
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
            <View style={st.slotsLoading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={st.slotsLoadingText}>Memuat slot...</Text>
            </View>
          ) : slotsError ? (
            <View style={st.slotsError}>
              <MaterialIcons name="error-outline" size={24} color={colors.error} />
              <Text style={st.slotsErrorText}>{slotsError}</Text>
              <TouchableOpacity onPress={refetchSlots} style={st.retryBtn}>
                <Text style={st.retryBtnText}>Coba lagi</Text>
              </TouchableOpacity>
            </View>
          ) : !slotsData?.slots?.length ? (
            <View style={st.slotsError}>
              <MaterialIcons name="event-busy" size={32} color={colors.textTertiary} />
              <Text style={st.slotsErrorText}>Tidak ada slot tersedia</Text>
            </View>
          ) : (
            <View style={st.slotsGrid}>
              {slotsData.slots.map((slot, i) => {
                const isAvailable = slot.status === 'AVAILABLE';
                const isSelected = selectedSlot?.start_time === slot.start_time;
                return (
                  <View
                    key={i}
                    style={[
                      st.slotWrap,
                      isSelected && { borderColor: colors.primary },
                    ]}
                  >
                    <TimeSlotCard
                      time={slot.start_time}
                      status={slot.status}
                      onPress={() => { if (isAvailable) { setSelectedSlot(slot); Haptics.selectionAsync(); } }}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </FadeInView>

        {/* Duration Selection */}
        {selectedSlot && (
          <FadeInView delay={0} style={st.section}>
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
                    <Text style={[st.durationText, isSelected && { color: '#fff' }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FadeInView>
        )}

        {/* Booking Summary */}
        {selectedSlot && endTime && (
          <FadeInView delay={0} style={st.summaryCard}>
            <Text style={st.summaryTitle}>Ringkasan Pesanan</Text>

            <View style={st.summaryRow}>
              <Text style={st.summaryLabel}>Lapangan</Text>
              <Text style={st.summaryValue} numberOfLines={1}>{field?.name ?? '-'}</Text>
            </View>
            <View style={st.summaryDivider} />
            <View style={st.summaryRow}>
              <Text style={st.summaryLabel}>Tanggal</Text>
              <Text style={st.summaryValue}>{formatDateDisplay(displayDate)}</Text>
            </View>
            <View style={st.summaryDivider} />
            <View style={st.summaryRow}>
              <Text style={st.summaryLabel}>Jam</Text>
              <Text style={st.summaryValue}>{selectedSlot.start_time} – {endTime}</Text>
            </View>
            <View style={st.summaryDivider} />
            <View style={st.summaryRow}>
              <Text style={st.summaryLabel}>Durasi</Text>
              <Text style={st.summaryValue}>{selectedDuration.label}</Text>
            </View>
            <View style={st.summaryDivider} />
            <View style={st.summaryRow}>
              <Text style={st.summaryLabel}>Total Harga</Text>
              <Text style={[st.summaryValue, { color: colors.primary, fontWeight: '700' }]}>
                {totalPrice != null ? formatPrice(totalPrice) : 'Hubungi'}
              </Text>
            </View>
          </FadeInView>
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
            style={st.confirmBtn}
            onPress={handleContinueToConfirmation}
            activeOpacity={0.85}
          >
            <Text style={st.confirmBtnText}>Lanjut Konfirmasi</Text>
          </TouchableOpacity>
        </View>
      )}
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

  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  dateArrow: {
    width: 44, height: 52, alignItems: 'center', justifyContent: 'center',
  },
  dateArrowDisabled: { opacity: 0.3 },
  dateDisplay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  dateText: { ...FONTS.titleMd, color: colors.text },

  slotsLoading: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  slotsLoadingText: { ...FONTS.bodySm, color: colors.textSecondary },
  slotsError: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  slotsErrorText: { ...FONTS.bodySm, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary },
  retryBtnText: { ...FONTS.labelMd, color: colors.onPrimary },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotWrap: {
    width: '30%',
    borderRadius: SIZES.borderRadius,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  slotChip: {
    width: '30%', paddingVertical: 10, paddingHorizontal: 6,
    borderRadius: SIZES.borderRadius, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  slotTime: { ...FONTS.titleSm, textAlign: 'center' },
  slotStatus: { ...FONTS.labelSm, textAlign: 'center', marginTop: 2 },

  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  durationChip: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: SIZES.borderRadiusFull,
    borderWidth: 1.5, borderColor: colors.divider,
    backgroundColor: colors.surfaceWhite,
  },
  durationText: { ...FONTS.titleSm, color: colors.text },

  summaryCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    ...SHADOWS.sm,
  },
  summaryTitle: { ...FONTS.headlineSm, color: colors.text, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  summaryLabel: { ...FONTS.bodyMd, color: colors.textSecondary, flex: 1 },
  summaryValue: { ...FONTS.bodyMd, color: colors.text, fontWeight: '600', flex: 2, textAlign: 'right' },
  summaryDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 10 },

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
