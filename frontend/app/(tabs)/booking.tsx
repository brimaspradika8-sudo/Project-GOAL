import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../components/goalTheme';
import { FadeInView } from '../../components/FadeInView';

const UPCOMING_BOOKINGS = [
  {
    id: 'BK-1024',
    venue: 'Kinetic Stadium',
    court: 'Lapangan A - Futsal',
    date: 'Sabtu, 19 Juli',
    time: '10:00 - 11:00',
    status: 'Aktif',
  },
];

const HISTORY_BOOKINGS = [
  { id: 'BK-1018', venue: 'Arena Selatan', date: '12 Juli', status: 'Selesai' },
  { id: 'BK-1007', venue: 'Victory Court', date: '7 Juli', status: 'Selesai' },
];

export default function BookingTabScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageShell}>
        <FadeInView>
          <Text style={styles.title}>Booking</Text>
          <Text style={styles.subtitle}>Pantau jadwal booking lapangan dan tiket aktif.</Text>
        </FadeInView>

        <FadeInView delay={100}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Booking Aktif</Text>
          </View>
          <View style={[styles.bookingGrid, isDesktop && styles.bookingGridDesktop]}>
          {UPCOMING_BOOKINGS.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={[styles.bookingCard, isDesktop && styles.bookingCardDesktop]}
              activeOpacity={0.85}
              onPress={() => router.push('/e-ticket')}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <MaterialIcons name="confirmation-number" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.bookingCode}>{booking.id}</Text>
                  <Text style={styles.bookingStatus}>{booking.status}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={COLORS.textTertiary} />
              </View>

              <View style={styles.divider} />

              <Text style={styles.venueName}>{booking.venue}</Text>
              <Text style={styles.courtName}>{booking.court}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MaterialIcons name="event" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{booking.date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialIcons name="schedule" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{booking.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          </View>
        </FadeInView>

        <FadeInView delay={200}>
          <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.findFieldButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/fields')}
          >
            <MaterialIcons name="stadium" size={20} color="#ffffff" />
            <Text style={styles.findFieldText}>Cari Lapangan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => router.push('/e-ticket')}
          >
            <MaterialIcons name="qr-code-2" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Lihat Tiket</Text>
          </TouchableOpacity>
          </View>
        </FadeInView>

        <FadeInView delay={300}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Riwayat</Text>
          </View>
          <View style={styles.historyCard}>
            {HISTORY_BOOKINGS.map((booking, index) => (
              <View key={booking.id}>
                <View style={styles.historyRow}>
                  <View style={styles.historyIcon}>
                    <MaterialIcons name="history" size={18} color={COLORS.textSecondary} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyVenue}>{booking.venue}</Text>
                    <Text style={styles.historyMeta}>{booking.id} · {booking.date}</Text>
                  </View>
                  <Text style={styles.historyStatus}>{booking.status}</Text>
                </View>
                {index < HISTORY_BOOKINGS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </FadeInView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  pageShell: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  title: {
    ...FONTS.headlineLg,
    color: COLORS.text,
  },
  subtitle: {
    ...FONTS.bodyMd,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 20,
  },
  bookingCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 16,
    ...SHADOWS.md,
  },
  bookingCardDesktop: {
    width: 'calc(50% - 7px)' as any,
  },
  bookingGrid: {
    gap: 14,
  },
  bookingGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    ...FONTS.labelMd,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  bookingCode: {
    ...FONTS.labelLg,
    color: COLORS.text,
  },
  bookingStatus: {
    ...FONTS.bodySm,
    color: COLORS.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 14,
  },
  venueName: {
    ...FONTS.headlineSm,
    color: COLORS.text,
  },
  courtName: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaText: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
  },
  findFieldButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    paddingVertical: 14,
    marginTop: 18,
    ...SHADOWS.primary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingVertical: 14,
    marginTop: 18,
  },
  secondaryButtonText: {
    ...FONTS.buttonMd,
    color: COLORS.primary,
  },
  historyCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingVertical: 4,
    ...SHADOWS.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyVenue: {
    ...FONTS.labelLg,
    color: COLORS.text,
  },
  historyMeta: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyStatus: {
    ...FONTS.labelMd,
    color: COLORS.primary,
  },
  findFieldText: {
    ...FONTS.buttonMd,
    color: '#ffffff',
  },
});
