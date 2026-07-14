import React, { useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, Animated, Easing, Platform, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const GREEN = '#4be277';
const DARK = '#131313';
const CARD = '#1a2e1f';
const CARD_BORDER = '#263d2c';
const MUTED = '#627369';

export default function FieldsScreen() {
  const [search, setSearch] = React.useState('');
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
          <Text style={styles.title}>Lapangan</Text>
          <Text style={styles.subtitle}>Temukan lapangan terdekat</Text>

          {/* Search */}
          <View style={styles.searchWrapper}>
            <MaterialIcons name="search" size={20} color={MUTED} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari lapangan..."
              placeholderTextColor={MUTED}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Quick Filter */}
          <View style={styles.filterRow}>
            {['Semua', 'Futsal', 'Basket', 'Badminton'].map((f) => (
              <TouchableOpacity key={f} style={styles.filterChip} activeOpacity={0.7}>
                <Text style={styles.filterText}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nearby */}
          <Text style={styles.sectionTitle}>SEKITAR ANDA</Text>
          <View style={styles.emptyCard}>
            <MaterialIcons name="location-off" size={40} color={CARD_BORDER} />
            <Text style={styles.emptyTitle}>Izinkan akses lokasi</Text>
            <Text style={styles.emptyDesc}>Aktifkan lokasi untuk menemukan lapangan terdekat</Text>
            <TouchableOpacity style={styles.enableBtn} activeOpacity={0.7}>
              <MaterialIcons name="my-location" size={18} color={GREEN} />
              <Text style={styles.enableBtnText}>Aktifkan Lokasi</Text>
            </TouchableOpacity>
          </View>

          {/* Favorites */}
          <Text style={styles.sectionTitle}>FAVORIT</Text>
          <View style={styles.emptyCard}>
            <MaterialIcons name="favorite-border" size={40} color={CARD_BORDER} />
            <Text style={styles.emptyTitle}>Belum ada favorit</Text>
            <Text style={styles.emptyDesc}>Simpan lapangan favorit Anda di sini</Text>
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
  subtitle: { fontSize: 14, color: MUTED, marginTop: 4, marginBottom: 20 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1,
    borderColor: CARD_BORDER, paddingHorizontal: 14, marginBottom: 16,
  },
  searchInput: { flex: 1, height: 48, color: '#fff', fontSize: 15 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  filterChip: {
    backgroundColor: CARD, borderRadius: 20, borderWidth: 1,
    borderColor: CARD_BORDER, paddingHorizontal: 14, paddingVertical: 8,
  },
  filterText: { fontSize: 12, fontWeight: '600', color: '#fff' },
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
  enableBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, backgroundColor: 'rgba(75,226,119,0.12)',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(75,226,119,0.2)',
  },
  enableBtnText: { fontSize: 13, fontWeight: '700', color: GREEN },
});
