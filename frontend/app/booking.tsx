import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../components/goalTheme';

export default function BookingScreen() {
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

      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="construction" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Fitur Belum Tersedia</Text>
        <View style={styles.badgeWrap}>
          <Text style={styles.badge}>SEGERA HADIR</Text>
        </View>
        <Text style={styles.desc}>
          Sistem pemesanan lapangan secara online sedang{'\n'}
          kami kembangkan. Nantikan pembaruan berikutnya!
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <MaterialIcons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.backBtnText}>Kembali</Text>
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
  backBtnText: { ...FONTS.buttonMd, color: '#ffffff' },
});
