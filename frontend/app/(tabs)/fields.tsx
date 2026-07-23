import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  Platform,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../components/goalTheme';
import { useFieldStore, Field } from '../../store/fieldStore';
import { SafeImage } from '../../components/SafeImage';
import { SkeletonVenueList } from '../../components/Skeleton';
import { useDebounce } from '../../hooks/useDebounce';
import { useTheme } from '../../lib/theme';

const FILTERS = ['Semua', 'Futsal', 'Basket', 'Badminton', 'Mini Soccer', 'Tenis', 'Voli', 'Lainnya'];
const DEFAULT_IMAGES: Record<string, string> = {
  Futsal: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
  Basket: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
  Badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
};

function formatPrice(price: number | null): string {
  if (price == null) return 'Hubungi';
  return `Rp${price.toLocaleString('id-ID')}`;
}

function VenueCard({ item }: { item: Field }) {
  const imgUrl = item.image_url || DEFAULT_IMAGES[item.sport_type] || DEFAULT_IMAGES.default;
  const isApproved = item.status === 'approved';
  return (
    <TouchableOpacity
      style={styles.venueCard}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/venue-detail', params: { id: String(item.id) } })}
    >
      <View style={[styles.venueImage, { backgroundColor: COLORS.primaryContainer }]}>
        <SafeImage source={{ uri: imgUrl }} style={styles.venueImageBg} fallbackSize={32} />
        <View style={styles.venueImageOverlay} />
        <MaterialIcons name="sports" size={28} color="#ffffff80" />
      </View>
      <View style={styles.venueBody}>
        <View style={styles.venueHeader}>
          <Text style={styles.venueName}>{item.name}</Text>
          <View style={[styles.statusBadge, isApproved ? styles.badgeAvailable : styles.badgeFull]}>
            <View style={[styles.statusDot, isApproved ? styles.dotAvailable : styles.dotFull]} />
            <Text style={[styles.statusText, isApproved ? styles.textAvailable : styles.textFull]}>
              {isApproved ? 'Tersedia' : 'Menunggu'}
            </Text>
          </View>
        </View>
        <View style={styles.venueLocationRow}>
          <MaterialIcons name="location-on" size={14} color={COLORS.textTertiary} />
          <Text style={styles.venueLocation}>{item.location}</Text>
        </View>
        <Text style={styles.venuePrice}>{formatPrice(item.price_per_hour)}/jam</Text>
        <View style={styles.tagRow}>
          <View style={styles.featureTag}>
            <Text style={styles.featureTagText}>{item.sport_type}</Text>
          </View>
          {item.owner && (
            <View style={styles.featureTag}>
              <Text style={styles.featureTagText}>{item.owner.name}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FieldsScreen() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');
  const debouncedSearch = useDebounce(search, 400);
  const { fields, loading, loadingMore, meta, fetchFields, fetchMore, refreshFields } = useFieldStore();
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    const sport = activeFilter === 'Semua' ? undefined : activeFilter;
    fetchFields(sport, debouncedSearch || undefined);
  }, [activeFilter, debouncedSearch, fetchFields]);

  useFocusEffect(
    useCallback(() => {
      const sport = activeFilter === 'Semua' ? undefined : activeFilter;
      fetchFields(sport, debouncedSearch || undefined);
    }, [activeFilter, debouncedSearch, fetchFields])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFields();
    setRefreshing(false);
  }, [refreshFields]);

  const hasMore = meta ? meta.current_page < meta.last_page : false;

  const renderHeader = () => (
    <>
      <Text style={styles.title}>Lapangan</Text>
      <Text style={styles.subtitle}>Temukan lapangan terdekat dan tersedia.</Text>

      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={COLORS.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama lapangan..."
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

      <FlatList
        horizontal
        data={FILTERS}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
        style={styles.chipScrollWrapper}
        keyExtractor={(item) => item}
        renderItem={({ item: filter }) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              style={[styles.chip, isActive && styles.chipActive]}
              activeOpacity={0.75}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{filter}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerText}>Memuat lebih banyak...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading && !refreshing) return <SkeletonVenueList />;
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="search-off" size={48} color={COLORS.textTertiary} />
        <Text style={styles.emptyTitle}>Tidak ada lapangan ditemukan</Text>
        <Text style={styles.emptyDesc}>Coba kata kunci atau filter yang berbeda.</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#F8FAFC' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
      <FlatList
        data={fields}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <VenueCard item={item} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={() => {
          if (hasMore) fetchMore();
        }}
        onEndReachedThreshold={0.4}
      />
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
    paddingBottom: 20,
  },
  title: {
    ...FONTS.headlineLg,
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    ...FONTS.bodyMd,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 10,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    ...FONTS.bodyMd,
    color: COLORS.text,
  },
  chipScrollWrapper: {
    marginBottom: 20,
  },
  chipScroll: {
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: SIZES.borderRadiusFull,
    backgroundColor: COLORS.surfaceWhite,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.primary,
  },
  chipText: {
    ...FONTS.labelMd,
    fontSize: 13,
    color: COLORS.text,
  },
  chipTextActive: {
    color: COLORS.onPrimary,
  },
  venueCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  venueImage: {
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  venueImageBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  venueImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  venueBody: {
    padding: 16,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  venueName: {
    ...FONTS.headlineSm,
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeAvailable: {
    backgroundColor: COLORS.successLight,
  },
  badgeFull: {
    backgroundColor: COLORS.errorLight,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotAvailable: {
    backgroundColor: COLORS.primary,
  },
  dotFull: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  textAvailable: {
    color: COLORS.primary,
  },
  textFull: {
    color: COLORS.error,
  },
  venueLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  venueLocation: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
  },
  venuePrice: {
    ...FONTS.headlineSm,
    fontSize: 15,
    color: COLORS.primary,
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  featureTagText: {
    ...FONTS.labelMd,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    ...FONTS.headlineSm,
    color: COLORS.text,
  },
  emptyDesc: {
    ...FONTS.bodySm,
    color: COLORS.textTertiary,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitleRow: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  emptyCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 32,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  favTitle: {
    ...FONTS.headlineSm,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  favDesc: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
