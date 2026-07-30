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
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../components/goalTheme';
import { useTheme } from '../lib/theme';

export default function ETicketScreen() {
  const { colors } = useTheme();
  const ticketCode = 'GOAL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const st = makeStyles(colors);

  return (
    <View style={st.container}>
      <StatusBar barStyle={colors.background === '#0C1219' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={st.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} activeOpacity={0.7} style={st.headerBtn}>
          <MaterialIcons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>E-Tiket</Text>
        <View style={st.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={st.successSection}>
          <View style={st.successCircle}>
            <MaterialIcons name="check" size={48} color="#ffffff" />
          </View>
          <Text style={st.successTitle}>Booking Berhasil!</Text>
          <Text style={st.successDesc}>Tiket Anda telah berhasil dibuat. Tunjukkan tiket ini saat tiba di lapangan.</Text>
        </View>

        <View style={st.ticketCard}>
          <View style={st.ticketHeader}>
            <View style={st.ticketLogoRow}>
              <View style={st.ticketLogoIcon}>
                <MaterialIcons name="sports-soccer" size={14} color={colors.primary} />
              </View>
              <Text style={st.ticketLogo}>GOAL</Text>
            </View>
            <View style={st.ticketBadge}>
              <Text style={st.ticketBadgeText}>AKTIF</Text>
            </View>
          </View>

          <View style={st.ticketDivider}>
            <View style={st.ticketDividerHole} />
            <View style={st.ticketDividerLine} />
            <View style={st.ticketDividerHole} />
          </View>

          <View style={st.ticketBody}>
            <View style={st.ticketRow}>
              <View style={st.ticketField}>
                <Text style={st.ticketLabel}>KODE TIKET</Text>
                <Text style={st.ticketValue} numberOfLines={1} ellipsizeMode="tail">{ticketCode}</Text>
              </View>
            </View>

            <View style={st.ticketRow}>
              <View style={st.ticketField}>
                <Text style={st.ticketLabel}>VENUE</Text>
                <Text style={st.ticketValue} numberOfLines={1} ellipsizeMode="tail">Kinetic Stadium</Text>
              </View>
            </View>

            <View style={st.ticketRow}>
              <View style={st.ticketField}>
                <Text style={st.ticketLabel}>LAPANGAN</Text>
                <Text style={st.ticketValue} numberOfLines={1} ellipsizeMode="tail">Lapangan A - Futsal</Text>
              </View>
            </View>

            <View style={st.ticketRow2}>
              <View style={st.ticketField}>
                <Text style={st.ticketLabel}>TANGGAL</Text>
                <Text style={st.ticketValue} numberOfLines={1} ellipsizeMode="tail">Sabtu, 19 Juli 2025</Text>
              </View>
              <View style={st.ticketField}>
                <Text style={st.ticketLabel}>JAM</Text>
                <Text style={st.ticketValue}>10:00</Text>
              </View>
            </View>

            <View style={st.ticketRow2}>
              <View style={st.ticketField}>
                <Text style={st.ticketLabel}>DURASI</Text>
                <Text style={st.ticketValue}>1 Jam</Text>
              </View>
              <View style={st.ticketField}>
                <Text style={[st.ticketValue, { color: colors.primary }]} numberOfLines={1} ellipsizeMode="tail">Rp150.000</Text>
              </View>
            </View>
          </View>

          <View style={st.ticketDivider}>
            <View style={st.ticketDividerHole} />
            <View style={st.ticketDividerLine} />
            <View style={st.ticketDividerHole} />
          </View>

          <View style={st.ticketFooter}>
            <View style={st.qrPlaceholder}>
              <MaterialIcons name="qr-code-2" size={64} color={colors.textTertiary} />
              <Text style={st.qrText}>Tunjukkan QR ini</Text>
            </View>
          </View>
        </View>

        <View style={st.infoCard}>
          <MaterialIcons name="info-outline" size={18} color={colors.primary} />
          <Text style={st.infoText}>
            Datang 15 menit sebelum jadwal. Bawa tiket ini dalam format digital atau cetak.
          </Text>
        </View>

        <View style={st.actionButtons}>
          <TouchableOpacity style={st.secondaryBtn} activeOpacity={0.85}>
            <MaterialIcons name="download" size={20} color={colors.primary} />
            <Text style={st.secondaryBtnText}>Unduh Tiket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.primaryBtn} activeOpacity={0.85} onPress={() => router.replace('/(tabs)')}>
            <Text style={st.primaryBtnText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  successSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.primary,
  },
  successTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  successDesc: {
    ...FONTS.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  ticketCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusXl,
    borderWidth: 1,
    borderColor: colors.divider,
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
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketLogo: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  ticketBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ticketBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    color: colors.primary,
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
    backgroundColor: colors.background,
  },
  ticketDividerLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
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
    fontFamily: FONT_FAMILY,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ticketValue: {
    ...FONTS.titleMd,
    color: colors.text,
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
    color: colors.textTertiary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.primaryContainer + '20',
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    ...FONTS.bodySm,
    color: colors.textSecondary,
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
    borderColor: colors.primary,
    backgroundColor: colors.surfaceWhite,
    gap: 8,
  },
  secondaryBtnText: {
    ...FONTS.buttonMd,
    color: colors.primary,
  },
  primaryBtn: {
    height: 48,
    borderRadius: SIZES.borderRadius,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primary,
  },
  primaryBtnText: {
    color: colors.onPrimary,
    ...FONTS.buttonMd,
  },
});