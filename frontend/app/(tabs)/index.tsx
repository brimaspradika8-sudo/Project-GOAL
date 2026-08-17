import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '../../store/profileStore';
import { Field, useFieldStore } from '../../store/fieldStore';
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../../components/goalTheme';
import { CATEGORIES } from '../../data/venues';
import { SafeImage } from '../../components/SafeImage';
import { SkeletonVenueList, SkeletonHorizontalCards, SkeletonProfile, SkeletonHero } from '../../components/Skeleton';
import { useDebounce } from '../../hooks/useDebounce';
import { apiFetch } from '../../lib/apiClient';
import { useTheme } from '../../lib/theme';
import VenueCard from '../../components/VenueCard';
import NotificationCenter from '../../components/shared/NotificationCenter';
import { useNotificationStore } from '../../store/notificationStore';
import { SPORT_MAP } from '../../lib/fieldValidation';
import ThemeToggle from '../../components/ThemeToggle';

const isWeb = Platform.OS === 'web';


const DEFAULT_IMAGES: Record<string, string> = {
  futsal: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
};

function getSportFilter(category: string): string | undefined {
  if (category === 'Semua') return undefined;
  const categoryItem = CATEGORIES.find(c => c.label === category || c.key === category);
  if (categoryItem) return categoryItem.key;
  return SPORT_MAP[category] || category.toLowerCase();
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { profile, loading: profileLoading, fetchProfile } = useProfileStore();
  const { fields, loading: fieldsLoading, fetchFields } = useFieldStore();
  const [popularFields, setPopularFields] = useState<Field[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifVisible, setNotifVisible] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 150);
  const { colors } = useTheme();
  const { refresh: refreshNotifications, unreadCount } = useNotificationStore();

  useEffect(() => {
    if (!profile) fetchProfile();
  }, [profile, fetchProfile]);

  const fetchPopularFields = useCallback(async () => {
    try {
      const res = await apiFetch('/fields', { params: { page: '1' }, skipToken: true });
      if (!res.ok) throw new Error('Gagal memuat venue populer');
      const body = await res.json();
      setPopularFields(body.data ?? []);
    } catch {
      // silent
    } finally {
      setPopularLoading(false);
    }
  }, []);

  const lastSearchRef = useRef(debouncedSearch);

  useEffect(() => {
    lastSearchRef.current = debouncedSearch;
    const sport = getSportFilter(activeCategory);
    fetchFields(sport, debouncedSearch || undefined);
  }, [activeCategory, debouncedSearch, fetchFields]);

  useEffect(() => {
    fetchPopularFields().catch(() => {});
  }, [fetchPopularFields]);

  useEffect(() => {
    refreshNotifications().catch(() => {});
  }, [refreshNotifications]);

  useFocusEffect(
    useCallback(() => {
      lastSearchRef.current = debouncedSearch;
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

  const isFiltering = activeCategory !== 'Semua' || debouncedSearch.length > 0;
  const filteredVenues = useMemo(() => isFiltering ? fields : popularFields.slice(0, 5), [fields, popularFields, isFiltering]);
  // rekomendasi uses popularFields (approved-only) to avoid showing non-approved fields from cache
  const rekomendasi = useMemo(() => popularFields.slice(0, 4), [popularFields]);
  const resultCount = isFiltering ? fields.length : popularFields.length;

  const styles = makeStyles(colors);
  const isDesktop = width >= 900;
  const sports = profile?.sports ?? [];
  const userName = profile?.full_name || profile?.username || 'Pengguna';
  const isOwnerOrSuperAdmin = profile?.role === 'owner' || profile?.role === 'super_admin';

  if (profileLoading && !refreshing) {
    return (
      <View style={styles.skeletonContainer}>
        <StatusBar barStyle={colors.background === '#F8FAFC' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.pageShell}>
            <SkeletonProfile />
            <View style={{ height: 16 }} />
            <SkeletonHero />
            <View style={{ height: 4 }} />
            <SkeletonHorizontalCards />
            <View style={{ height: 16 }} />
            <SkeletonVenueList />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.background === '#F8FAFC' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />

      {!isWeb && (
      <View style={styles.topBar}>
        <View style={[styles.pageShell, styles.topBarShell]}>
          <View style={styles.logoRow}>
            <View style={styles.logoIconWrap}>
              <MaterialIcons name="sports-soccer" size={20} color={colors.primary} />
            </View>
            <Text style={styles.logoText}>GOAL</Text>
          </View>
          <View style={styles.topBarActions}>
            <ThemeToggle />
            <TouchableOpacity style={styles.topBarBtn} activeOpacity={0.7} onPress={() => setNotifVisible(true)}>
              <MaterialIcons name="notifications-none" size={22} color={colors.onSurface} />
              {unreadCount() > 0 ? <View style={styles.topBarBadge} /> : null}
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.7} onPress={() => router.push('/(tabs)/profile')}>
              <MaterialIcons name="person" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageShell}>
        {refreshing ? (
          <View style={styles.refreshBanner}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.refreshBannerText}>Menyegarkan data...</Text>
          </View>
        ) : null}
        <View style={[styles.heroPanel, isDesktop && styles.heroPanelDesktop]}>
          <View style={styles.heroCopy}>
            <Text style={styles.greeting}>Halo, {userName}</Text>
            <Text style={styles.heroTitle}>Temukan lapangan yang pas hari ini</Text>
            <Text style={styles.heroText}>Cari lapangan, cek ketersediaan, lalu lanjut booking dari satu tempat.</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={22} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama lapangan..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
          {fieldsLoading && fields.length > 0 && (
            <ActivityIndicator size="small" color={colors.primary} />
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
                    <MaterialIcons name={item.icon} size={26} color={isActive ? colors.onPrimary : colors.onSurfaceVariant} />
                  </View>
                  <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {(activeCategory !== 'Semua' || searchQuery.length > 0) && (
          <View style={styles.filterSummaryRow}>
            <View style={styles.filterSummaryPill}>
              <MaterialIcons name="filter-list" size={16} color={colors.primary} />
              <Text style={styles.filterSummaryText}>
                {resultCount} hasil ditemukan
              </Text>
            </View>
            <TouchableOpacity
              style={styles.filterResetButton}
              activeOpacity={0.8}
              onPress={() => {
                setActiveCategory('Semua');
                setSearchQuery('');
              }}
            >
              <Text style={styles.filterResetText}>Reset filter</Text>
            </TouchableOpacity>
          </View>
        )}



        <TouchableOpacity
          style={styles.sparringCard}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/matches')}
        >
          <View style={styles.sparringContent}>
            <View style={styles.sparringBadge}>
              <Text style={styles.sparringBadgeText}>FITUR BARU ⚽</Text>
            </View>
            <Text style={styles.sparringTitle}>Cari lawan sparring & main bareng</Text>
            <Text style={styles.sparringDesc}>Kekurangan pemain? Gabung tim lain atau buat match baru.</Text>
          </View>
          <TouchableOpacity
            style={styles.sparringBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/matches')}
          >
            <Text style={styles.sparringBtnText}>Lihat Match</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{isFiltering ? 'Hasil pencarian' : 'Lapangan populer'}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/fields')}>
              <Text style={styles.sectionLink}>Lihat semua</Text>
            </TouchableOpacity>
          </View>

          {(isFiltering ? fieldsLoading : popularLoading) ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.emptyText}>Memuat lapangan...</Text>
            </View>
          ) : filteredVenues.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyText}>{isFiltering ? 'Belum ada lapangan yang cocok' : 'Belum ada lapangan tersedia'}</Text>
              {isFiltering ? (
                <TouchableOpacity
                  style={styles.emptyAction}
                  activeOpacity={0.8}
                  onPress={() => {
                    setActiveCategory('Semua');
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.emptyActionText}>Reset filter</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={[styles.venueGrid, isDesktop && styles.venueGridDesktop]}>
              {filteredVenues.map((item) => (
                <View key={item.id} style={isDesktop ? styles.venueCardDesktop : {}}>
                  <VenueCard field={item} />
                </View>
              ))}
            </View>
          )}
        </View>

        {!isFiltering && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rekomendasi terdekat</Text>
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
                     <Text style={styles.rekomName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                    <View style={styles.rekomDistRow}>
                      <MaterialIcons name="near-me" size={12} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.rekomDist} numberOfLines={1} ellipsizeMode="tail">{item.location}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        )}

        {sports.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Olahraga favorit</Text>
            </View>
            <View style={styles.sportChips}>
              {sports.map((sport) => (
                <View key={sport} style={styles.sportChip}>
                  <Text style={styles.sportChipText} numberOfLines={1}>{sport}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {!isDesktop && (
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (isOwnerOrSuperAdmin) {
            router.push('/(owner)/fields');
          } else {
            router.push('/(tabs)/fields');
          }
        }}
      >
        <MaterialIcons name={isOwnerOrSuperAdmin ? 'add-business' : 'search'} size={26} color={colors.onPrimary} />
      </TouchableOpacity>
      )}
      <NotificationCenter visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 38,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  pageShell: {
    width: '100%',
    maxWidth: 1200,
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
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    color: colors.primary,
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
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
    ...SHADOWS.sm,
  },
  topBarBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.error,
    borderWidth: 1,
    borderColor: colors.surfaceWhite,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroPanel: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.divider,
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
  refreshBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceWhite,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  refreshBannerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  greeting: {
    ...FONTS.labelMd,
    color: colors.primary,
    marginBottom: 6,
  },
  heroTitle: {
    ...FONTS.headlineLg,
    color: colors.text,
  },
  heroText: {
    ...FONTS.bodyMd,
    color: colors.textSecondary,
    marginTop: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: 16,
    marginBottom: 8,
    gap: 10,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }
    ),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    color: colors.text,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
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
    color: colors.text,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: colors.primary,
  },
  categoryScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  filterSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 2,
    marginBottom: 2,
  },
  filterSummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryContainer,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterSummaryText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  filterResetButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterResetText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 8,
  },
  categoryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
    ...SHADOWS.sm,
  },
  categoryIconWrapActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...SHADOWS.primary,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: colors.onSurfaceVariant,
  },
  categoryLabelActive: {
    color: colors.primary,
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
    fontFamily: FONT_FAMILY,
    color: '#ffffff',
    letterSpacing: 1,
  },
  promoTitle: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    color: '#ffffff',
    marginBottom: 6,
  },
  promoDesc: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 14,
  },
  promoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  promoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: colors.onPrimary,
  },
  promoDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.surfaceWhite,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceContainerHigh,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  venueCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 14,
    ...SHADOWS.md,
  },
  venueCardDesktop: {
    width: 'calc((100% - 28px) / 3)' as any,
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
    fontFamily: FONT_FAMILY,
    color: colors.onPrimary,
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
    fontFamily: FONT_FAMILY,
    color: colors.text,
    flex: 1,
  },
  venuePrice: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: colors.primary,
  },
  venueLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  venueLocation: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    color: colors.textSecondary,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 8,
  },
  featureChip: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: colors.onSurfaceVariant,
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
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
    color: 'rgba(255,255,255,0.85)',
  },
  sportChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sportChip: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sportChipText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    ...FONTS.bodyMd,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: 4,
    backgroundColor: colors.primaryContainer,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  emptyActionText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  sparringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryContainer,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    padding: 16,
    marginTop: 20,
    marginBottom: 4,
  },
  sparringContent: {
    flex: 1,
    marginRight: 12,
  },
  sparringBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  sparringBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  sparringTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
    marginBottom: 4,
  },
  sparringDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: colors.onPrimaryContainer + 'CC',
  },
  sparringBtn: {
    backgroundColor: colors.primary,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sparringBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 14px rgba(30,138,76,0.15)' }
      : { shadowColor: colors.primary }
    ),
  },
});
