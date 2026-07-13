import React, { useState, useRef } from 'react';
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

const CATEGORIES = [
  { id: 'futsal', label: 'Futsal', icon: 'sports-soccer' as const, color: GREEN },
  { id: 'basketball', label: 'Basket', icon: 'sports-basketball' as const, color: '#3b82f6' },
  { id: 'badminton', label: 'Badminton', icon: 'sports-tennis' as const, color: '#fbbf24' },
  { id: 'volleyball', label: 'Voli', icon: 'sports-volleyball' as const, color: '#a855f7' },
  { id: 'minisoccer', label: 'Mini Soccer', icon: 'sports-soccer' as const, color: '#f43f5e' },
  { id: 'tennis', label: 'Tenis', icon: 'sports-tennis' as const, color: '#06b6d4' },
];

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <Text style={styles.title}>Jelajahi</Text>
          <Text style={styles.subtitle}>Cari lapangan, pertandingan, atau pemain</Text>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <MaterialIcons name="search" size={20} color={MUTED} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari..."
              placeholderTextColor={MUTED}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Categories */}
          <Text style={styles.sectionTitle}>KATEGORI OLAHRAGA</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.categoryCard} activeOpacity={0.7}>
                <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}18` }]}>
                  <MaterialIcons name={cat.icon} size={24} color={cat.color} />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Near You */}
          <Text style={styles.sectionTitle}>SEKITAR ANDA</Text>
          <View style={styles.emptyCard}>
            <MaterialIcons name="location-searching" size={40} color={CARD_BORDER} />
            <Text style={styles.emptyTitle}>Data lokasi belum tersedia</Text>
            <Text style={styles.emptyDesc}>Izinkan akses lokasi untuk menemukan lapangan terdekat.</Text>
          </View>

          {/* Popular Matches */}
          <Text style={styles.sectionTitle}>PERTANDINGAN POPULER</Text>
          <View style={styles.emptyCard}>
            <MaterialIcons name="sports" size={40} color={CARD_BORDER} />
            <Text style={styles.emptyTitle}>Belum ada pertandingan</Text>
            <Text style={styles.emptyDesc}>Pertandingan populer akan ditampilkan di sini.</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: MUTED,
    marginTop: 4,
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    marginBottom: 28,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  categoryCard: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  emptyCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  emptyDesc: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
  },
});
