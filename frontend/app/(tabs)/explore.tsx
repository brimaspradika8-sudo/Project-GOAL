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
import { SIZES, SHADOWS, FONTS } from '../../components/goalTheme';
import { useTheme } from '../../lib/theme';
import { FadeInView } from '../../components/FadeInView';

const CATEGORIES = [
  { key: 'futsal', label: 'Futsal', icon: 'sports-soccer' as const, color: '#1E8A4C' },
  { key: 'basketball', label: 'Basket', icon: 'sports-basketball' as const, color: '#f59e0b' },
  { key: 'badminton', label: 'Badminton', icon: 'sports-tennis' as const, color: '#3b82f6' },
  { key: 'volleyball', label: 'Voli', icon: 'sports-volleyball' as const, color: '#8b5cf6' },
  { key: 'tennis', label: 'Tenis', icon: 'sports-tennis' as const, color: '#06b6d4' },
  { key: 'mini_soccer', label: 'Mini Soccer', icon: 'sports-soccer' as const, color: '#10b981' },
  { key: 'padel', label: 'Padel', icon: 'sports-tennis' as const, color: '#8b5cf6' },
];

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const { colors } = useTheme();
  const st = makeStyles(colors);

  return (
    <View style={st.container}>
      <StatusBar barStyle={colors.background === '#0C1219' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Text style={st.title}>Jelajahi</Text>
          <Text style={st.subtitle}>Temukan lapangan, pertandingan, dan teman olahraga.</Text>
        </FadeInView>

        <FadeInView delay={80}>
          <View style={st.searchCard}>
            <MaterialIcons name="search" size={20} color={colors.textTertiary} />
            <TextInput
              style={st.searchInput}
              placeholder="Cari lapangan atau olahraga"
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </FadeInView>

        <FadeInView delay={160}>
          <Text style={st.sectionTitle}>KATEGORI</Text>
          <View style={st.categoryGrid}>
            {CATEGORIES.map((category) => {
              const filtered = search && !category.label.toLowerCase().includes(search.toLowerCase());
              if (filtered) return null;
              return (
                <TouchableOpacity
                  key={category.key}
                  style={st.categoryCard}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/fields')}
                >
                  <View style={[st.categoryIcon, { backgroundColor: category.color + '18' }]}>
                    <MaterialIcons name={category.icon} size={24} color={category.color} />
                  </View>
                  <Text style={st.categoryLabel}>{category.label}</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </FadeInView>

        <FadeInView delay={240}>
          <Text style={st.sectionTitle}>REKOMENDASI</Text>
          <TouchableOpacity style={st.infoCard} activeOpacity={0.85} onPress={() => router.push('/(tabs)/fields')}>
            <View style={st.infoIcon}>
              <MaterialIcons name="place" size={22} color={colors.primary} />
            </View>
            <View style={st.infoTextBlock}>
              <Text style={st.infoTitle}>Lapangan Terdekat</Text>
              <Text style={st.infoDesc}>Temukan lapangan favorit di sekitarmu.</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </FadeInView>

        <FadeInView delay={320}>
          <Text style={st.sectionTitle}>POPULER MINGGU INI</Text>
          <View style={st.emptyCard}>
            <View style={st.emptyIconWrap}>
              <MaterialIcons name="trending-up" size={32} color={colors.textTertiary} />
            </View>
            <Text style={st.emptyTitle}>Belum ada data populer</Text>
            <Text style={st.emptyDesc}>Data pertandingan populer akan muncul di sini.</Text>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    ...FONTS.headlineLg,
    fontSize: 28,
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    ...FONTS.bodyMd,
    color: colors.textSecondary,
    marginBottom: 22,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 10,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    ...FONTS.bodyMd,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textTertiary,
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
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
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
    color: colors.text,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 14,
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextBlock: {
    flex: 1,
  },
  infoTitle: {
    ...FONTS.titleLg,
    color: colors.text,
    marginBottom: 2,
  },
  infoDesc: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 28,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    ...FONTS.headlineSm,
    fontSize: 15,
    color: colors.text,
    marginBottom: 6,
  },
  emptyDesc: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
