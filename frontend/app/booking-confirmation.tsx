import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FadeInView } from '../components/FadeInView';
import { SafeImage } from '../components/SafeImage';
import { FONTS, FONT_FAMILY, SHADOWS, SIZES } from '../components/goalTheme';
import { getErrorMessage } from '../lib/api';
import { apiFetch } from '../lib/apiClient';
import { SPORT_LABELS } from '../lib/fieldValidation';
import { useTheme } from '../lib/theme';
import { createBooking, type Booking } from '../services/bookingService';
import type { Field } from '../store/fieldStore';
import { useToastStore } from '../store/toastStore';

function formatPrice(price: number | null): string {
  if (price == null) return 'Hubungi';
  return `Rp${price.toLocaleString('id-ID')}`;
}

function formatDateDisplay(date: string): string {
  if (!date) return '-';
  return new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function minutesBetween(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  return Math.max(0, (endHour * 60 + endMinute) - (startHour * 60 + startMinute));
}

export default function BookingConfirmationScreen() {
  const { id, date, startTime, endTime } = useLocalSearchParams<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  }>();
  const fieldId = Number(id);
  const { colors } = useTheme();
  const showToast = useToastStore((state) => state.show);
  const st = makeStyles(colors);

  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [responseState, setResponseState] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const durationMinutes = useMemo(() => minutesBetween(startTime, endTime), [startTime, endTime]);
  const totalPrice = field?.price_per_hour != null
    ? Math.round((field.price_per_hour / 60) * durationMinutes)
    : null;

  useEffect(() => {
    apiFetch(`/fields/${fieldId}`, { skipToken: true })
      .then((res) => {
        if (!res.ok) throw new Error('Lapangan tidak ditemukan');
        return res.json();
      })
      .then((data) => setField(data))
      .catch(() => {
        setResponseState({ type: 'error', message: 'Lapangan tidak ditemukan.' });
      })
      .finally(() => setLoading(false));
  }, [fieldId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setResponseState(null);
    try {
      const res = await createBooking({
        field_id: fieldId,
        booking_date: date,
        slots: [{ start_time: startTime, end_time: endTime }],
      });
      const booking = res.data ?? (res as any);
      setCreatedBooking(booking);
      setResponseState({ type: 'success', message: res.message ?? 'Booking request berhasil dibuat.' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ type: 'success', title: 'Booking terkirim', description: 'Menunggu konfirmasi owner.' });
    } catch (error: any) {
      const message = getErrorMessage(error?.data, error?.message ?? 'Gagal membuat booking');
      setResponseState({ type: 'error', message });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast({ type: 'error', title: 'Booking gagal', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={st.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={st.container}>
      <StatusBar barStyle={colors.background === '#0B1118' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={st.header}>
        <TouchableOpacity style={st.headerButton} onPress={() => router.back()} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Konfirmasi Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        {field && (
          <FadeInView style={st.fieldCard}>
            <SafeImage source={{ uri: field.image_url ?? '' }} style={st.fieldImage} fallbackSize={32} />
            <View style={st.fieldInfo}>
              <Text style={st.fieldName} numberOfLines={1}>{field.name}</Text>
              <Text style={st.fieldMeta} numberOfLines={1}>
                {SPORT_LABELS[field.sport_type] ?? field.sport_type} - {field.location}
              </Text>
              <Text style={st.fieldPrice}>{formatPrice(field.price_per_hour)}<Text style={st.fieldPriceUnit}>/jam</Text></Text>
            </View>
          </FadeInView>
        )}

        <FadeInView delay={80} style={st.summaryCard}>
          <Text style={st.summaryTitle}>Detail Pesanan</Text>
          <SummaryRow label="Tanggal" value={formatDateDisplay(date)} colors={colors} />
          <SummaryRow label="Jam" value={`${startTime} - ${endTime}`} colors={colors} />
          <SummaryRow label="Durasi" value={`${durationMinutes} menit`} colors={colors} />
          <View style={st.divider} />
          <SummaryRow label="Total Harga" value={totalPrice != null ? formatPrice(totalPrice) : 'Hubungi'} colors={colors} highlight />
        </FadeInView>

        {responseState && (
          <FadeInView delay={0}>
            <View style={[
              st.responseCard,
              responseState.type === 'success' ? st.responseSuccess : st.responseError,
            ]}>
            <MaterialIcons
              name={responseState.type === 'success' ? 'check-circle' : 'error-outline'}
              size={22}
              color={responseState.type === 'success' ? '#047857' : colors.error}
            />
            <View style={{ flex: 1 }}>
              <Text style={[
                st.responseTitle,
                { color: responseState.type === 'success' ? '#047857' : colors.error },
              ]}>
                {responseState.type === 'success' ? 'Response Berhasil' : 'Response Gagal'}
              </Text>
              <Text style={st.responseText}>{responseState.message}</Text>
              {createdBooking && <Text style={st.responseText}>ID Booking: #{createdBooking.id}</Text>}
            </View>
            </View>
          </FadeInView>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={st.bottomBar}>
        {createdBooking ? (
          <TouchableOpacity
            style={st.primaryButton}
            onPress={() => router.replace({ pathname: '/booking-waiting', params: { id: String(createdBooking.id) } })}
            activeOpacity={0.85}
          >
            <Text style={st.primaryButtonText}>Lihat Status Booking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[st.primaryButton, submitting && st.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !field}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Text style={st.primaryButtonText}>Kirim Booking</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  colors,
  highlight = false,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
  highlight?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
      <Text style={{ ...FONTS.bodyMd, color: colors.textSecondary, flex: 1 }}>{label}</Text>
      <Text style={{ ...FONTS.bodyMd, color: highlight ? colors.primary : colors.text, fontWeight: '700', flex: 2, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  headerTitle: { ...FONTS.headlineSm, color: colors.text },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, maxWidth: 520, width: '100%', alignSelf: 'center' },
  fieldCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.divider,
    ...SHADOWS.sm,
  },
  fieldImage: { width: 72, height: 72, borderRadius: SIZES.borderRadius, backgroundColor: colors.surfaceContainer },
  fieldInfo: { flex: 1, justifyContent: 'center' },
  fieldName: { ...FONTS.headlineSm, color: colors.text, marginBottom: 4 },
  fieldMeta: { ...FONTS.bodySm, color: colors.textSecondary },
  fieldPrice: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 6 },
  fieldPriceUnit: { fontSize: 12, fontWeight: '400', color: colors.textSecondary },
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
  divider: { height: 1, backgroundColor: colors.divider, marginBottom: 12 },
  responseCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  responseSuccess: { backgroundColor: '#E6F9ED', borderColor: '#10B981' },
  responseError: { backgroundColor: colors.errorContainer, borderColor: colors.error },
  responseTitle: { ...FONTS.titleSm, marginBottom: 4 },
  responseText: { ...FONTS.bodySm, color: colors.textSecondary, lineHeight: 18 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceWhite,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    ...SHADOWS.xl,
  },
  primaryButton: {
    height: 52,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    ...SHADOWS.primary,
  },
  primaryButtonDisabled: { opacity: 0.65 },
  primaryButtonText: { ...FONTS.buttonLg, color: colors.onPrimary },
});
