import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../components/goalTheme';
import { useTheme } from '../lib/theme';

export default function BookingScreen() {
  const { colors, resolved } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.outline }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.headerBtn}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Pesan Lapangan</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
          <MaterialIcons name="construction" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Fitur Belum Tersedia</Text>
        <View style={styles.badgeWrap}>
          <Text style={[styles.badge, { color: colors.primary, backgroundColor: colors.primaryContainer }]}>SEGERA HADIR</Text>
        </View>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          Sistem pemesanan lapangan secara online sedang{'\n'}
          kami kembangkan. Nantikan pembaruan berikutnya!
        </Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()} activeOpacity={0.85}>
          <MaterialIcons name="arrow-back" size={18} color={colors.onPrimary} />
          <Text style={[styles.backBtnText, { color: colors.onPrimary }]}>Kembali</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...FONTS.headlineSm, color: COLORS.text },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 36,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    gap: 0,
  },
  iconWrap: {
    width: 84, height: 84, borderRadius: 24,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  title: { ...FONTS.headlineLg, color: COLORS.text, marginBottom: 12, textAlign: 'center' },
  badgeWrap: { marginBottom: 16 },
  badge: {
    fontSize: 11, fontWeight: '800', color: COLORS.primary,
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, overflow: 'hidden', letterSpacing: 1.5,
  },
  desc: {
    ...FONTS.bodyMd, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 13, paddingHorizontal: 24,
    borderRadius: SIZES.borderRadius,
  },
  backBtnText: { ...FONTS.buttonMd, color: COLORS.onPrimary },
});
