import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  Platform,
  StatusBar,
  TouchableOpacity,
  Animated,
  Modal,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { SIZES, FONTS, SHADOWS, FONT_FAMILY } from '../../components/goalTheme';
import { useFieldStore, type FieldFilters } from '../../store/fieldStore';
import { SkeletonVenueList } from '../../components/Skeleton';
import { useDebounce } from '../../hooks/useDebounce';
import { useTheme } from '../../lib/theme';
import VenueCard from '../../components/VenueCard';
import { SPORT_OPTIONS, SPORT_MAP } from '../../lib/fieldValidation';

const FILTERS = ['Semua', ...SPORT_OPTIONS];
const SORT_OPTIONS: { key: NonNullable<FieldFilters['sort']>; label: string }[] = [
  { key: 'latest', label: 'Terbaru' },
  { key: 'price_asc', label: 'Termurah' },
  { key: 'price_desc', label: 'Termahal' },
];

export default function FieldsScreen() {
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<NonNullable<FieldFilters['sort']>>('latest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 150);
  const debouncedMinPrice = useDebounce(minPrice, 400);
  const debouncedMaxPrice = useDebounce(maxPrice, 400);
  const { fields, loading, loadingMore, meta, fetchFields, fetchMore, refreshFields } = useFieldStore();
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const filterAnimation = useRef(new Animated.Value(0)).current;

  const isDesktop = width >= 900;
  const numColumns = isDesktop ? (width >= 1200 ? 3 : 2) : 1;
  const hasActiveFilters = activeFilter !== 'Semua' || search.trim().length > 0 || minPrice.trim().length > 0 || maxPrice.trim().length > 0 || sort !== 'latest';
  const hasAdvancedFilters = minPrice.trim().length > 0 || maxPrice.trim().length > 0 || sort !== 'latest';

  useEffect(() => {
    Animated.timing(filterAnimation, {
      toValue: isFilterOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [filterAnimation, isFilterOpen]);

  const lastFetchRef = useRef(debouncedSearch);

  useEffect(() => {
    lastFetchRef.current = debouncedSearch;
    const sport = activeFilter === 'Semua' ? undefined : SPORT_MAP[activeFilter] || activeFilter.toLowerCase();
    fetchFields(sport, debouncedSearch || undefined, { minPrice: debouncedMinPrice, maxPrice: debouncedMaxPrice, sort });
  }, [activeFilter, debouncedSearch, debouncedMinPrice, debouncedMaxPrice, fetchFields, sort]);

  useFocusEffect(
    useCallback(() => {
      lastFetchRef.current = debouncedSearch;
      const sport = activeFilter === 'Semua' ? undefined : SPORT_MAP[activeFilter] || activeFilter.toLowerCase();
      fetchFields(sport, debouncedSearch || undefined, { minPrice: debouncedMinPrice, maxPrice: debouncedMaxPrice, sort });
    }, [activeFilter, debouncedSearch, debouncedMinPrice, debouncedMaxPrice, fetchFields, sort])
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
      <Text style={styles.subtitle}>Cari lapangan yang cocok, lalu saring hasilnya dengan cepat.</Text>

      <View style={styles.resultRow}>
        <Text style={styles.resultText}>
          {loading && fields.length === 0 ? 'Memuat data...' : `${fields.length} lapangan ditemukan`}
        </Text>
        {hasActiveFilters ? (
          <TouchableOpacity
            onPress={() => {
              setSearch('');
              setActiveFilter('Semua');
              setMinPrice('');
              setMaxPrice('');
              setSort('latest');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.resetText}>Reset filter</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.searchActionsRow}>
        <View style={[styles.searchBar, styles.searchBarInRow]}>
          <MaterialIcons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama lapangan"
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
          {loading && fields.length > 0 && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, isFilterOpen && styles.filterButtonActive]}
          onPress={() => setIsFilterOpen((current) => !current)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Buka filter harga dan urutan"
        >
          <MaterialIcons name="tune" size={19} color={isFilterOpen ? colors.primary : colors.textSecondary} />
          <Text style={[styles.filterButtonText, isFilterOpen && styles.filterButtonTextActive]}>Filter</Text>
          {hasAdvancedFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.advancedFilterPanel,
          {
            maxHeight: filterAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 150] }),
            opacity: filterAnimation,
            marginBottom: filterAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }),
          },
        ]}
      >
        <View style={styles.priceRow}>
          <Text style={styles.filterLabel}>Harga per jam</Text>
          <TextInput style={styles.priceInput} placeholder="Min" placeholderTextColor={colors.textTertiary} keyboardType="numeric" value={minPrice} onChangeText={setMinPrice} />
          <Text style={styles.priceSeparator}>-</Text>
          <TextInput style={styles.priceInput} placeholder="Maks" placeholderTextColor={colors.textTertiary} keyboardType="numeric" value={maxPrice} onChangeText={setMaxPrice} />
        </View>
        <TouchableOpacity style={styles.sortSelector} onPress={() => setIsSortModalOpen(true)} activeOpacity={0.8}>
          <Text style={styles.filterLabel}>Urutkan</Text>
          <View style={styles.sortSelectorValue}>
            <Text style={styles.sortSelectorText}>{SORT_OPTIONS.find((option) => option.key === sort)?.label}</Text>
            <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </Animated.View>

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
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerText}>Memuat lebih banyak...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading && !refreshing && fields.length === 0) return <SkeletonVenueList />;
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="search-off" size={48} color={colors.textTertiary} />
        <Text style={styles.emptyTitle}>Belum ada lapangan yang cocok</Text>
        <Text style={styles.emptyDesc}>Coba ubah kata kunci atau longgarkan filter harga.</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#F8FAFC' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
      <FlatList
        key={String(numColumns)}
        data={fields}
        numColumns={numColumns}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          numColumns > 1
            ? <View style={styles.gridCell}><VenueCard field={item} /></View>
            : <VenueCard field={item} />
        )}
        columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
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
      <Modal visible={isSortModalOpen} transparent animationType="slide" onRequestClose={() => setIsSortModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setIsSortModalOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Urutkan lapangan</Text>
            {SORT_OPTIONS.map((option) => {
              const isActive = sort === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.modalItem, isActive && styles.modalItemActive]}
                  onPress={() => {
                    setSort(option.key);
                    setIsSortModalOpen(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.modalItemText, isActive && styles.modalItemTextActive]}>{option.label}</Text>
                  {isActive && <MaterialIcons name="check" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxWidth: 1120,
    alignSelf: 'center',
    width: '100%',
  },
  scrollContentDesktop: {
    maxWidth: 1120,
    paddingHorizontal: 24,
  },
  gridRow: {
    gap: 16,
  },
  gridCell: {
    flex: 1,
  },
  title: {
    ...FONTS.headlineLg,
    fontSize: 28,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    ...FONTS.bodyMd,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultText: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  resetText: {
    ...FONTS.bodySm,
    color: colors.primary,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 10,
    ...SHADOWS.sm,
  },
  searchActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchBarInRow: {
    flex: 1,
    marginBottom: 0,
  },
  filterButton: {
    height: 52,
    minWidth: 86,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: SIZES.borderRadiusLg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  filterButtonText: {
    ...FONTS.labelMd,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  advancedFilterPanel: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    ...FONTS.bodyMd,
    color: colors.text,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...SHADOWS.primary,
  },
  chipText: {
    ...FONTS.labelMd,
    fontSize: 13,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterLabel: {
    ...FONTS.labelMd,
    color: colors.textSecondary,
    marginRight: 2,
  },
  priceInput: {
    flex: 1,
    minWidth: 80,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
    color: colors.text,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  priceSeparator: {
    color: colors.textTertiary,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  sortSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  sortSelectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: SIZES.borderRadius,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  sortSelectorText: {
    ...FONTS.labelMd,
    color: colors.text,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: SIZES.borderRadiusFull,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  sortChipActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  sortChipText: {
    ...FONTS.labelMd,
    color: colors.textSecondary,
  },
  sortChipTextActive: {
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.shadowDark,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: SIZES.borderRadiusLg,
    borderTopRightRadius: SIZES.borderRadiusLg,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outline,
    marginBottom: 18,
  },
  modalTitle: {
    ...FONTS.headlineSm,
    color: colors.text,
    marginBottom: 10,
  },
  modalItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: SIZES.borderRadius,
  },
  modalItemActive: {
    backgroundColor: colors.primaryContainer,
  },
  modalItemText: {
    ...FONTS.bodyMd,
    color: colors.textSecondary,
  },
  modalItemTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  venueCard: {
    backgroundColor: colors.surface,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.outline,
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
    color: colors.text,
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
    backgroundColor: colors.primaryContainer,
  },
  badgeFull: {
    backgroundColor: colors.errorContainer,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotAvailable: {
    backgroundColor: colors.primary,
  },
  dotFull: {
    backgroundColor: colors.error,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  textAvailable: {
    color: colors.primary,
  },
  textFull: {
    color: colors.error,
  },
  venueLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  venueLocation: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
  },
  venuePrice: {
    ...FONTS.headlineSm,
    fontSize: 15,
    color: colors.primary,
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
    backgroundColor: colors.surfaceContainer,
  },
  featureTagText: {
    ...FONTS.labelMd,
    fontSize: 11,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    ...FONTS.headlineSm,
    color: colors.text,
    textAlign: 'center',
  },
  emptyDesc: {
    ...FONTS.bodySm,
    color: colors.textTertiary,
    textAlign: 'center',
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
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 32,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  favTitle: {
    ...FONTS.headlineSm,
    fontSize: 15,
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  favDesc: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
