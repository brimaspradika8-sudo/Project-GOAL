import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONTS, SIZES, SHADOWS } from '../components/goalTheme';

export default function ETicketScreen() {
  const ticketCode = 'GOAL-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} activeOpacity={0.7} style={styles.headerBtn}>
          <MaterialIcons name="close" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>E-Tiket</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.successSection}>
          <View style={styles.successCircle}>
            <MaterialIcons name="check" size={48} color="#ffffff" />
          </View>
          <Text style={styles.successTitle}>Booking Berhasil!</Text>
          <Text style={styles.successDesc}>Tiket Anda telah berhasil dibuat. Tunjukkan tiket ini saat tiba di lapangan.</Text>
        </View>

        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <View style={styles.ticketLogoRow}>
              <View style={styles.ticketLogoIcon}>
                <MaterialIcons name="sports-soccer" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.ticketLogo}>GOAL</Text>
            </View>
            <View style={styles.ticketBadge}>
              <Text style={styles.ticketBadgeText}>AKTIF</Text>
            </View>
          </View>

          <View style={styles.ticketDivider}>
            <View style={styles.ticketDividerHole} />
            <View style={styles.ticketDividerLine} />
            <View style={styles.ticketDividerHole} />
          </View>

          <View style={styles.ticketBody}>
            <View style={styles.ticketRow}>
              <View style={styles.ticketField}>
                <Text style={styles.ticketLabel}>KODE TIKET</Text>
                <Text style={styles.ticketValue}>{ticketCode}</Text>
              </View>
            </View>

            <View style={styles.ticketRow}>
              <View style={styles.ticketField}>
                <Text style={styles.ticketLabel}>VENUE</Text>
                <Text style={styles.ticketValue}>Kinetic Stadium</Text>
              </View>
            </View>

            <View style={styles.ticketRow}>
              <View style={styles.ticketField}>
                <Text style={styles.ticketLabel}>LAPANGAN</Text>
                <Text style={styles.ticketValue}>Lapangan A - Futsal</Text>
              </View>
            </View>

            <View style={styles.ticketRow2}>
              <View style={styles.ticketField}>
                <Text style={styles.ticketLabel}>TANGGAL</Text>
                <Text style={styles.ticketValue}>Sabtu, 19 Juli 2025</Text>
              </View>
              <View style={styles.ticketField}>
                <Text style={styles.ticketLabel}>JAM</Text>
                <Text style={styles.ticketValue}>10:00</Text>
              </View>
            </View>

            <View style={styles.ticketRow2}>
              <View style={styles.ticketField}>
                <Text style={styles.ticketLabel}>DURASI</Text>
                <Text style={styles.ticketValue}>1 Jam</Text>
              </View>
              <View style={styles.ticketField}>
                <Text style={styles.ticketLabel}>TOTAL</Text>
                <Text style={[styles.ticketValue, { color: COLORS.primary }]}>Rp150.000</Text>
              </View>
            </View>
          </View>

          <View style={styles.ticketDivider}>
            <View style={styles.ticketDividerHole} />
            <View style={styles.ticketDividerLine} />
            <View style={styles.ticketDividerHole} />
          </View>

          <View style={styles.ticketFooter}>
            <View style={styles.qrPlaceholder}>
              <MaterialIcons name="qr-code-2" size={64} color={COLORS.textTertiary} />
              <Text style={styles.qrText}>Tunjukkan QR ini</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Datang 15 menit sebelum jadwal. Bawa tiket ini dalam format digital atau cetak.
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85}>
            <MaterialIcons name="download" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryBtnText}>Unduh Tiket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.primaryBtnText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  successSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.primary,
  },
  successTitle: {
    fontFamily: 'Montserrat',
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  successDesc: {
    ...FONTS.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  ticketCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusXl,
    borderWidth: 1,
    borderColor: COLORS.divider,
    overflow: 'hidden',
    marginBottom: 16,
    ...SHADOWS.lg,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  ticketLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketLogoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketLogo: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  ticketBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ticketBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Montserrat',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  ticketDivider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketDividerHole: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },
  ticketDividerLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  ticketBody: {
    padding: 18,
    gap: 14,
  },
  ticketRow: {
    marginBottom: 4,
  },
  ticketRow2: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 4,
  },
  ticketField: {
    flex: 1,
  },
  ticketLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Montserrat',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ticketValue: {
    ...FONTS.titleMd,
    color: COLORS.text,
  },
  ticketFooter: {
    padding: 18,
    alignItems: 'center',
  },
  qrPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  qrText: {
    ...FONTS.bodySm,
    color: COLORS.textTertiary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.primaryContainer + '20',
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionButtons: {
    gap: 12,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceWhite,
    gap: 8,
  },
  secondaryBtnText: {
    ...FONTS.buttonMd,
    color: COLORS.primary,
  },
  primaryBtn: {
    height: 48,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primary,
  },
  primaryBtnText: {
    color: '#ffffff',
    ...FONTS.buttonMd,
  },
});
