import React, { useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Animated, Easing, Platform, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const GREEN = '#4be277';
const DARK = '#131313';
const CARD = '#1a2e1f';
const CARD_BORDER = '#263d2c';
const MUTED = '#627369';

export default function MatchesScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DARK} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>Pertandingan</Text>
          <Text style={styles.subtitle}>Kelola jadwal pertandingan Anda</Text>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <MaterialIcons name="add-circle" size={22} color={GREEN} />
              <Text style={styles.actionBtnText}>Buat Pertandingan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} activeOpacity={0.7}>
              <MaterialIcons name="search" size={22} color={GREEN} />
              <Text style={styles.actionBtnText}>Cari Pertandingan</Text>
            </TouchableOpacity>
          </View>

          {/* Active Matches */}
          <Text style={styles.sectionTitle}>PERTANDINGAN AKTIF</Text>
          <View style={styles.emptyCard}>
            <MaterialIcons name="event-busy" size={40} color={CARD_BORDER} />
            <Text style={styles.emptyTitle}>Belum ada pertandingan aktif</Text>
            <Text style={styles.emptyDesc}>Buat atau cari pertandingan untuk memulai.</Text>
          </View>

          {/* History */}
          <Text style={styles.sectionTitle}>RIWAYAT</Text>
          <View style={styles.emptyCard}>
            <MaterialIcons name="history" size={40} color={CARD_BORDER} />
            <Text style={styles.emptyTitle}>Belum ada riwayat</Text>
            <Text style={styles.emptyDesc}>Riwayat pertandingan akan ditampilkan di sini.</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  subtitle: { fontSize: 14, color: MUTED, marginTop: 4, marginBottom: 24 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(75,226,119,0.12)',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(75,226,119,0.2)',
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderColor: CARD_BORDER,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: MUTED,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1,
    borderColor: CARD_BORDER, padding: 32, alignItems: 'center',
    gap: 8, marginBottom: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  emptyDesc: { fontSize: 13, color: MUTED, textAlign: 'center' },
});
