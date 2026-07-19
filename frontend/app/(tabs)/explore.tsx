import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../components/goalTheme';
import { FadeInView } from '../../components/FadeInView';

const CATEGORIES = [
  { key: 'futsal', label: 'Futsal', icon: 'sports-soccer' as const, color: COLORS.primary },
  { key: 'basket', label: 'Basket', icon: 'sports-basketball' as const, color: '#f59e0b' },
  { key: 'badminton', label: 'Badminton', icon: 'sports-tennis' as const, color: '#3b82f6' },
  { key: 'volley', label: 'Voli', icon: 'sports-volleyball' as const, color: '#8b5cf6' },
  { key: 'tennis', label: 'Tenis', icon: 'sports-tennis' as const, color: '#06b6d4' },
  { key: 'minisoccer', label: 'Mini Soccer', icon: 'sports-soccer' as const, color: '#10b981' },
];

export default function ExploreScreen() {
  const [search, setSearch] = useState('');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Text style={styles.title}>Jelajahi</Text>
          <Text style={styles.subtitle}>Temukan lapangan, pertandingan, dan teman olahraga.</Text>
        </FadeInView>

        <FadeInView delay={80}>
          <View style={styles.searchCard}>
            <MaterialIcons name="search" size={20} color={COLORS.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari lapangan atau olahraga"
              placeholderTextColor={COLORS.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </FadeInView>

        <FadeInView delay={160}>
          <Text style={styles.sectionTitle}>KATEGORI</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => {
              const filtered = search && !category.label.toLowerCase().includes(search.toLowerCase());
              if (filtered) return null;
              return (
                <TouchableOpacity
                  key={category.key}
                  style={styles.categoryCard}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/fields')}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '18' }]}>
                    <MaterialIcons name={category.icon} size={24} color={category.color} />
                  </View>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={COLORS.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </FadeInView>

        <FadeInView delay={240}>
          <Text style={styles.sectionTitle}>REKOMENDASI</Text>
          <TouchableOpacity style={styles.infoCard} activeOpacity={0.85} onPress={() => router.push('/(tabs)/fields')}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="place" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoTitle}>Lapangan Terdekat</Text>
              <Text style={styles.infoDesc}>Temukan lapangan favorit di sekitarmu.</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </FadeInView>

        <FadeInView delay={320}>
          <Text style={styles.sectionTitle}>POPULER MINGGU INI</Text>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="trending-up" size={32} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Belum ada data populer</Text>
            <Text style={styles.emptyDesc}>Data pertandingan populer akan muncul di sini.</Text>
          </View>
        </FadeInView>
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
    paddingBottom: 40,
  },
  title: {
    ...FONTS.headlineLg,
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    ...FONTS.bodyMd,
    color: COLORS.textSecondary,
    marginBottom: 22,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 10,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    ...FONTS.bodyMd,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  categoryGrid: {
    gap: 10,
    marginBottom: 24,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.divider,
    gap: 14,
    ...SHADOWS.sm,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    flex: 1,
    ...FONTS.titleMd,
    color: COLORS.text,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.divider,
    gap: 14,
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextBlock: {
    flex: 1,
  },
  infoTitle: {
    ...FONTS.titleLg,
    color: COLORS.text,
    marginBottom: 2,
  },
  infoDesc: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 28,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    ...FONTS.headlineSm,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyDesc: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
