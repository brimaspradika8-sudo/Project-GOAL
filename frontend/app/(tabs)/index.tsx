import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '../../store/profileStore';
import { Field, useFieldStore } from '../../store/fieldStore';
import { COLORS, FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../../components/goalTheme';
import { CATEGORIES } from '../../data/venues';
import { SafeImage } from '../../components/SafeImage';
import { SkeletonVenueList, SkeletonHorizontalCards, SkeletonProfile } from '../../components/Skeleton';
import { useDebounce } from '../../hooks/useDebounce';
import { API_BASE_URL } from '../../lib/api';
import { useTheme } from '../../lib/theme';


const SPORT_MAP: Record<string, string> = {
  'Semua': '',
  'Futsal': 'futsal',
  'Basket': 'basketball',
  'Badminton': 'badminton',
  'Mini Soccer': 'mini_soccer',
  'Tenis': 'tennis',
};
const DEFAULT_IMAGES: Record<string, string> = {
  futsal: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
};

function formatPrice(price: number | null): string {
  if (price == null) return 'Hubungi';
  return `Rp${price.toLocaleString('id-ID')}`;
}

function getSportFilter(category: string): string | undefined {
  if (category === 'Semua') return undefined;
  return SPORT_MAP[category] || category.toLowerCase();
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { profile, loading, fetchProfile } = useProfileStore();
  const { fields, fetchFields } = useFieldStore();
  const [popularFields, setPopularFields] = useState<Field[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { colors } = useTheme();

  useEffect(() => {
    if (!profile) fetchProfile();
  }, [profile, fetchProfile]);

  const fetchPopularFields = useCallback(async () => {
    const params = new URLSearchParams({ page: '1' });
    const res = await fetch(`${API_BASE_URL}/fields?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Gagal memuat venue populer');
    const body = await res.json();
    setPopularFields(body.data ?? []);
  }, []);

  useEffect(() => {
    const sport = getSportFilter(activeCategory);
    fetchFields(sport, debouncedSearch || undefined);
  }, [activeCategory, debouncedSearch, fetchFields]);

  useEffect(() => {
    fetchPopularFields().catch(() => {});
  }, [fetchPopularFields]);

  useFocusEffect(
    useCallback(() => {
      const sport = getSportFilter(activeCategory);
      fetchFields(sport, debouncedSearch || undefined);
      fetchPopularFields().catch(() => {});
    }, [activeCategory, debouncedSearch, fetchFields, fetchPopularFields])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    const sport = getSportFilter(activeCategory);
    await Promise.all([fetchProfile(), fetchFields(sport, debouncedSearch || undefined), fetchPopularFields()]);
    setRefreshing(false);
  };

  const filteredVenues = useMemo(() => popularFields.slice(0, 5), [popularFields]);
  const rekomendasi = useMemo(() => fields.slice(0, 4), [fields]);

  const isDesktop = width >= 900;
  const sports = profile?.sports ?? [];
  const userName = profile?.full_name || profile?.username || 'Pengguna';

  if (loading && !refreshing) {
    return (
      <View style={styles.skeletonContainer}>
        <StatusBar barStyle={colors.background === '#F8FAFC' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <SkeletonProfile />
          <View style={{ height: 16 }} />
          <SkeletonHorizontalCards />
          <View style={{ height: 16 }} />
          <SkeletonVenueList />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.background === '#F8FAFC' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />

      <View style={styles.topBar}>
        <View style={[styles.pageShell, styles.topBarShell]}>
          <View style={styles.logoRow}>
            <View style={styles.logoIconWrap}>
              <MaterialIcons name="sports-soccer" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.logoText}>GOAL</Text>
          </View>
          <View style={styles.topBarActions}>
            <TouchableOpacity style={styles.topBarBtn} activeOpacity={0.7}>
              <MaterialIcons name="notifications-none" size={22} color={COLORS.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.7} onPress={() => router.push('/(tabs)/profile')}>
              <MaterialIcons name="person" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageShell}>
        <View style={[styles.heroPanel, isDesktop && styles.heroPanelDesktop]}>
          <View style={styles.heroCopy}>
            <Text style={styles.greeting}>Halo, {userName}</Text>
            <Text style={styles.heroTitle}>Temukan lapangan terbaik hari ini</Text>
            <Text style={styles.heroText}>Cari venue, cek status, lalu lanjut booking dari satu tempat.</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={22} color={COLORS.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari lapangan atau venue..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {[{ label: 'Semua', icon: 'apps' as const }, ...CATEGORIES].map((item) => {
              const isActive = activeCategory === item.label;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={styles.categoryItem}
                  activeOpacity={0.7}
                  onPress={() => setActiveCategory(item.label)}
                >
                  <View style={[styles.categoryIconWrap, isActive && styles.categoryIconWrapActive]}>
                    <MaterialIcons name={item.icon} size={26} color={isActive ? '#ffffff' : COLORS.onSurfaceVariant} />
                  </View>
                  <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.promoCard}>
          <SafeImage
            source={{ uri: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=800&auto=format&fit=crop' }}
            style={styles.promoImage}
            resizeMode="cover"
            fallbackSize={32}
          />
          <View style={styles.promoGradient} />
          <View style={styles.promoContent}>
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>PROMO SPESIAL</Text>
            </View>
            <Text style={styles.promoTitle}>Diskon 20%</Text>
            <Text style={styles.promoDesc}>Booking lebih hemat di akhir pekan ini.</Text>
            <TouchableOpacity style={styles.promoBtn} activeOpacity={0.8}>
              <Text style={styles.promoBtnText}>Gunakan Sekarang</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promoDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Venue Populer</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/fields')}>
              <Text style={styles.sectionLink}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {filteredVenues.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={40} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>Tidak ada venue ditemukan</Text>
            </View>
          ) : (
            <View style={[styles.venueGrid, isDesktop && styles.venueGridDesktop]}>
            {filteredVenues.map((item) => {
              const imgUrl = item.image_url || DEFAULT_IMAGES[item.sport_type] || DEFAULT_IMAGES.default;
              const isApproved = item.status === 'approved';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.venueCard, isDesktop && styles.venueCardDesktop]}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/venue-detail', params: { id: String(item.id) } })}
                >
                  <View style={styles.venueImageWrap}>
                    <SafeImage source={{ uri: imgUrl }} style={styles.venueImage} resizeMode="cover" fallbackSize={32} />
                    <View style={styles.venueImageOverlay} />
                    <View style={[styles.statusBadge, { backgroundColor: isApproved ? COLORS.primary : COLORS.error }]}>
                      <Text style={styles.statusText}>{isApproved ? 'Tersedia' : 'Menunggu'}</Text>
                    </View>
                  </View>
                  <View style={styles.venueInfo}>
                    <View style={styles.venueTopRow}>
                      <Text style={styles.venueName}>{item.name}</Text>
                      <Text style={styles.venuePrice}>{formatPrice(item.price_per_hour)}/jam</Text>
                    </View>
                    <View style={styles.venueLocationRow}>
                      <MaterialIcons name="location-on" size={14} color={COLORS.textTertiary} />
                      <Text style={styles.venueLocation}>{item.location}</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <View style={styles.featureChip}>
                        <Text style={styles.featureText}>{item.sport_type}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rekomendasi Terdekat</Text>
          </View>
          <View style={[styles.rekomGrid, isDesktop && styles.rekomGridDesktop]}>
            {rekomendasi.map((item) => {
              const imgUrl = item.image_url || DEFAULT_IMAGES[item.sport_type] || DEFAULT_IMAGES.default;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.rekomCard, isDesktop && styles.rekomCardDesktop]}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/venue-detail', params: { id: String(item.id) } })}
                >
                  <SafeImage source={{ uri: imgUrl }} style={styles.rekomImage} fallbackSize={24} />
                  <View style={styles.rekomOverlay} />
                  <View style={styles.rekomInfo}>
                    <Text style={styles.rekomName}>{item.name}</Text>
                    <View style={styles.rekomDistRow}>
                      <MaterialIcons name="near-me" size={12} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.rekomDist}>{item.location}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {sports.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Olahraga Favorit</Text>
            </View>
            <View style={styles.sportChips}>
              {sports.map((sport) => (
                <View key={sport} style={styles.sportChip}>
                  <Text style={styles.sportChipText}>{sport}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(tabs)/fields'); }}>
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 38,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  pageShell: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
  },
  topBarShell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.sm,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroPanel: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 18,
    marginTop: 12,
    ...SHADOWS.sm,
  },
  heroPanelDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
  },
  heroCopy: {
    flex: 1,
  },
  greeting: {
    ...FONTS.labelMd,
    color: COLORS.primary,
    marginBottom: 6,
  },
  heroTitle: {
    ...FONTS.headlineLg,
    color: COLORS.text,
  },
  heroText: {
    ...FONTS.bodyMd,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(30, 138, 76, 0.15)',
    marginTop: 16,
    marginBottom: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    color: COLORS.text,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: COLORS.text,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: COLORS.primary,
  },
  categoryScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 8,
  },
  categoryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.sm,
  },
  categoryIconWrapActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.primary,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: COLORS.onSurfaceVariant,
  },
  categoryLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  promoCard: {
    marginTop: 20,
    borderRadius: SIZES.borderRadiusLg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  promoImage: {
    width: '100%',
    height: 200,
  },
  promoGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 30, 15, 0.55)',
  },
  promoContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 40,
    padding: 20,
    justifyContent: 'flex-end',
  },
  promoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  promoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Montserrat',
    color: '#ffffff',
    letterSpacing: 1,
  },
  promoTitle: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Montserrat',
    color: '#ffffff',
    marginBottom: 6,
  },
  promoDesc: {
    fontSize: 13,
    fontFamily: 'Montserrat',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 14,
  },
  promoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  promoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Montserrat',
    color: '#ffffff',
  },
  promoDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceWhite,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  venueCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: 14,
    ...SHADOWS.md,
  },
  venueCardDesktop: {
    width: 'calc(50% - 7px)' as any,
  },
  venueGrid: {
    gap: 14,
  },
  venueGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  venueImageWrap: {
    height: 180,
    position: 'relative',
  },
  venueImage: {
    width: '100%',
    height: '100%',
  },
  venueImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Montserrat',
    color: '#ffffff',
  },
  venueInfo: {
    padding: 16,
  },
  venueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Montserrat',
    color: COLORS.text,
    flex: 1,
  },
  venuePrice: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Montserrat',
    color: COLORS.primary,
  },
  venueLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  venueLocation: {
    fontSize: 13,
    fontFamily: 'Montserrat',
    color: COLORS.textSecondary,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 8,
  },
  featureChip: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Montserrat',
    color: COLORS.onSurfaceVariant,
  },
  rekomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rekomGridDesktop: {
    gap: 16,
  },
  rekomCard: {
    width: '48%' as any,
    aspectRatio: 1,
    borderRadius: SIZES.borderRadiusLg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  rekomCardDesktop: {
    width: '23.5%' as any,
  },
  rekomImage: {
    width: '100%',
    height: '100%',
  },
  rekomOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 20, 10, 0.45)',
  },
  rekomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    justifyContent: 'flex-end',
  },
  rekomName: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Montserrat',
    color: '#ffffff',
    marginBottom: 4,
  },
  rekomDistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rekomDist: {
    fontSize: 12,
    fontFamily: 'Montserrat',
    color: 'rgba(255,255,255,0.85)',
  },
  sportChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sportChip: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sportChipText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    ...FONTS.bodyMd,
    color: COLORS.textTertiary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
    shadowColor: COLORS.primary,
  },
});
