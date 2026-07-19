import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SIZES, SHADOWS } from '../components/goalTheme';
import { ALL_VENUES, generateBooking } from '../data/venues';

const DATES = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return {
    id: i.toString(),
    day: d.toLocaleDateString('id-ID', { weekday: 'short' }),
    date: d.getDate().toString(),
    month: d.toLocaleDateString('id-ID', { month: 'short' }),
    full: d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  };
});

const TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

const PAYMENT_METHODS = [
  { id: 'ewallet', name: 'GoPay / OVO', icon: 'account-balance-wallet' },
  { id: 'transfer', name: 'Transfer Bank', icon: 'account-balance' },
  { id: 'card', name: 'Kartu Kredit', icon: 'credit-card' },
];

export default function BookingScreen() {
  const { venueId, courtId } = useLocalSearchParams<{ venueId: string; courtId: string }>();
  const venue = ALL_VENUES.find((v) => v.id === venueId);
  const court = venue?.courts?.find((c) => c.id === courtId);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  if (!venue || !court) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color={COLORS.textTertiary} />
        <Text style={styles.errorText}>Data tidak ditemukan</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const priceNum = parseInt(court.price.replace(/[^0-9]/g, ''), 10);
  const total = priceNum * duration;
  const dateObj = DATES.find((d) => d.id === selectedDate);

  const canBook = selectedDate && selectedTime && selectedPayment;

  function handleBook() {
    if (!canBook || !dateObj) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const booking = generateBooking(venue!, court!, dateObj.full, selectedTime);
    booking.duration = duration;
    booking.totalPrice = `Rp${(total).toLocaleString('id-ID')}/jam`;
    router.replace({ pathname: '/e-ticket', params: { bookingId: booking.id } });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.headerBtn}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pesan Lapangan</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.venueInfo}>
          <View style={styles.venueImageSmall}>
            <MaterialIcons name="sports" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.venueTextInfo}>
            <Text style={styles.venueName}>{venue.title}</Text>
            <Text style={styles.courtName}>{court.name} - {court.type}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tanggal</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
            {DATES.map((d) => {
              const isActive = selectedDate === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.dateCard, isActive && styles.dateCardActive]}
                  activeOpacity={0.8}
                  onPress={() => { Haptics.selectionAsync(); setSelectedDate(d.id); }}
                >
                  <Text style={[styles.dateDay, isActive && styles.dateDayActive]}>{d.day}</Text>
                  <Text style={[styles.dateNum, isActive && styles.dateNumActive]}>{d.date}</Text>
                  <Text style={[styles.dateMonth, isActive && styles.dateMonthActive]}>{d.month}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jam</Text>
          <View style={styles.timeGrid}>
            {TIMES.map((t) => {
              const isActive = selectedTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, isActive && styles.timeChipActive]}
                  activeOpacity={0.8}
                  onPress={() => { Haptics.selectionAsync(); setSelectedTime(t); }}
                >
                  <Text style={[styles.timeText, isActive && styles.timeTextActive]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Durasi</Text>
          <View style={styles.durationRow}>
            <TouchableOpacity
              style={styles.durBtn}
              onPress={() => { Haptics.selectionAsync(); setDuration(Math.max(1, duration - 1)); }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="remove" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.durValue}>{duration} jam</Text>
            <TouchableOpacity
              style={styles.durBtn}
              onPress={() => { Haptics.selectionAsync(); setDuration(Math.min(4, duration + 1)); }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pembayaran</Text>
          {PAYMENT_METHODS.map((p) => {
            const isActive = selectedPayment === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.paymentCard, isActive && styles.paymentCardActive]}
                activeOpacity={0.85}
                onPress={() => { Haptics.selectionAsync(); setSelectedPayment(p.id); }}
              >
                <MaterialIcons name={p.icon as any} size={22} color={isActive ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.paymentName, isActive && { color: COLORS.primary }]}>{p.name}</Text>
                <View style={[styles.radio, isActive && styles.radioActive]}>
                  {isActive && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Ringkasan</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Lapangan</Text>
              <Text style={styles.summaryValue}>{court.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tanggal</Text>
              <Text style={styles.summaryValue}>{dateObj?.full || '-'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Jam</Text>
              <Text style={styles.summaryValue}>{selectedTime || '-'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Durasi</Text>
              <Text style={styles.summaryValue}>{duration} jam</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>Rp{total.toLocaleString('id-ID')}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bookBtn, !canBook && styles.bookBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleBook}
          disabled={!canBook}
        >
          <Text style={styles.bookBtnText}>Konfirmasi & Bayar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  errorText: {
    ...FONTS.headlineSm,
    color: COLORS.textSecondary,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.primary,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.headlineSm,
    color: COLORS.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadius,
    padding: 14,
    gap: 12,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  venueImageSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueTextInfo: {
    flex: 1,
  },
  venueName: {
    ...FONTS.titleMd,
    color: COLORS.text,
    marginBottom: 2,
  },
  courtName: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONTS.headlineSm,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
  },
  dateScroll: {
    gap: 10,
  },
  dateCard: {
    width: 68,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.surfaceWhite,
    borderWidth: 1.5,
    borderColor: COLORS.divider,
    ...SHADOWS.sm,
  },
  dateCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryContainer + '15',
  },
  dateDay: {
    ...FONTS.labelMd,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dateDayActive: {
    color: COLORS.primary,
  },
  dateNum: {
    fontFamily: 'Montserrat',
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  dateNumActive: {
    color: COLORS.primary,
  },
  dateMonth: {
    ...FONTS.labelMd,
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  dateMonthActive: {
    color: COLORS.primary,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.surfaceWhite,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  timeChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  timeText: {
    ...FONTS.titleMd,
    fontSize: 13,
    color: COLORS.text,
  },
  timeTextActive: {
    color: '#ffffff',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadius,
    padding: 14,
    alignSelf: 'flex-start',
    ...SHADOWS.sm,
  },
  durBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durValue: {
    fontFamily: 'Montserrat',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 50,
    textAlign: 'center',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1.5,
    borderColor: COLORS.divider,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  paymentCardActive: {
    borderColor: COLORS.primary,
  },
  paymentName: {
    flex: 1,
    ...FONTS.titleMd,
    color: COLORS.text,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  summaryCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 18,
    ...SHADOWS.md,
  },
  summaryTitle: {
    ...FONTS.headlineSm,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...FONTS.bodySm,
    color: COLORS.text,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 10,
  },
  summaryTotalLabel: {
    ...FONTS.headlineSm,
    color: COLORS.text,
  },
  summaryTotalValue: {
    fontFamily: 'Montserrat',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceWhite,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    ...SHADOWS.xl,
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primary,
  },
  bookBtnDisabled: {
    backgroundColor: COLORS.surfaceContainerHigh,
    shadowOpacity: 0,
    elevation: 0,
  },
  bookBtnText: {
    color: '#ffffff',
    ...FONTS.buttonLg,
  },
});
