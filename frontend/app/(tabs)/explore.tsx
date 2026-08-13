import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FadeInView } from '../../components/FadeInView';
import { SkeletonFilterBar, SkeletonVenueList } from '../../components/Skeleton';
import { Button, EmptyState, ErrorState, Input, Loading } from '../../components/common';
import { FieldCard } from '../../components/field';
import { radius, shadows, spacing, typography } from '../../components/theme';
import { useDebounce } from '../../hooks/useDebounce';
import { SPORT_LABELS } from '../../lib/fieldValidation';
import { useTheme } from '../../lib/theme';
import { type Field, type FieldFilters, useFieldStore } from '../../store/fieldStore';

const SPORTS = [
  { key: undefined, label: 'Semua', icon: 'apps' as const },
  { key: 'futsal', label: 'Futsal', icon: 'sports-soccer' as const },
  { key: 'mini_soccer', label: 'Soccer', icon: 'sports-soccer' as const },
  { key: 'basketball', label: 'Basketball', icon: 'sports-basketball' as const },
  { key: 'badminton', label: 'Badminton', icon: 'sports-tennis' as const },
  { key: 'volleyball', label: 'Volleyball', icon: 'sports-volleyball' as const },
];

const PRICE_FILTERS: { label: string; filters: FieldFilters }[] = [
  { label: 'Semua harga', filters: {} },
  { label: '< Rp100k', filters: { maxPrice: '100000' } },
  { label: 'Rp100k - 250k', filters: { minPrice: '100000', maxPrice: '250000' } },
  { label: '> Rp250k', filters: { minPrice: '250000' } },
];

const SORTS: { label: string; sort: FieldFilters['sort'] }[] = [
  { label: 'Terbaru', sort: 'latest' },
  { label: 'Harga naik', sort: 'price_asc' },
  { label: 'Harga turun', sort: 'price_desc' },
];

export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const { colors, resolved } = useTheme();
  const {
    fields,
    loading,
    loadingMore,
    error,
    fetchFields,
    fetchMore,
    refreshFields,
  } = useFieldStore();
  const [search, setSearch] = useState('');
  const [sport, setSport] = useState<string | undefined>();
  const [priceIndex, setPriceIndex] = useState(0);
  const [sort, setSort] = useState<FieldFilters['sort']>('latest');
  const [refreshing, setRefreshing] = useState(false);
  const debouncedSearch = useDebounce(search, 220);
  const isDesktop = width >= 900;
  const st = makeStyles(colors, isDesktop);

  const filters = useMemo<FieldFilters>(() => ({
    ...PRICE_FILTERS[priceIndex].filters,
    sort,
  }), [priceIndex, sort]);

  const loadFields = useCallback(() => {
    return fetchFields(sport, debouncedSearch || undefined, filters);
  }, [debouncedSearch, fetchFields, filters, sport]);

  useEffect(() => {
    loadFields().catch(() => {});
  }, [loadFields]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshFields();
    } finally {
      setRefreshing(false);
    }
  }, [refreshFields]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setSport(undefined);
    setPriceIndex(0);
    setSort('latest');
  }, []);

  const listData = fields;
  const showInitialSkeleton = loading && fields.length === 0;
  const activeFilterCount = (sport ? 1 : 0) + (priceIndex > 0 ? 1 : 0) + (sort !== 'latest' ? 1 : 0) + (search ? 1 : 0);

  const renderField = useCallback(({ item }: { item: Field }) => (
    <View style={isDesktop ? st.gridItem : undefined}>
      <FieldCard field={item} />
    </View>
  ), [isDesktop, st.gridItem]);

  return (
    <View style={st.container}>
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <FlatList
        data={listData}
        key={isDesktop ? 'desktop' : 'mobile'}
        keyExtractor={(item) => String(item.id)}
        numColumns={isDesktop ? 2 : 1}
        renderItem={renderField}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.content}
        columnWrapperStyle={isDesktop ? st.columnWrap : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        onEndReached={() => fetchMore().catch(() => {})}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={st.shell}>
            <FadeInView>
              <View style={st.header}>
                <View style={st.headerCopy}>
                  <Text style={st.kicker}>G.O.A.L Explore</Text>
                  <Text style={st.title}>Cari lapangan atau pertandingan</Text>
                  <Text style={st.subtitle}>Filter venue olahraga, cek harga, dan lanjut booking tanpa pindah konteks.</Text>
                </View>
                <Button title="Match" icon="groups" variant="secondary" onPress={() => router.push('/(tabs)/matches')} style={st.matchBtn} />
              </View>
            </FadeInView>

            <FadeInView delay={80}>
              <View style={st.searchPanel}>
                <Input
                  icon="search"
                  placeholder="Cari nama lapangan atau lokasi"
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                />
                <View style={st.quickStats}>
                  <View style={st.statPill}>
                    <MaterialIcons name="stadium" size={16} color={colors.primary} />
                    <Text style={st.statText}>{fields.length} venue</Text>
                  </View>
                  {activeFilterCount > 0 ? (
                    <TouchableOpacity style={st.resetBtn} activeOpacity={0.8} onPress={resetFilters}>
                      <Text style={st.resetText}>Reset filter</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </FadeInView>

            <FadeInView delay={120}>
              <Text style={st.sectionLabel}>Olahraga</Text>
              <FlatList
                horizontal
                data={SPORTS}
                keyExtractor={(item) => item.label}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={st.chipRow}
                renderItem={({ item }) => {
                  const active = sport === item.key;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.78}
                      style={[st.sportChip, active && st.sportChipActive]}
                      onPress={() => setSport(item.key)}
                    >
                      <MaterialIcons name={item.icon} size={18} color={active ? colors.onPrimary : colors.textSecondary} />
                      <Text style={[st.sportChipText, active && st.sportChipTextActive]}>
                        {item.key ? SPORT_LABELS[item.key] ?? item.label : item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </FadeInView>

            <FadeInView delay={160}>
              <View style={st.filterGrid}>
                <View style={st.filterBlock}>
                  <Text style={st.sectionLabel}>Harga</Text>
                  <View style={st.segmentRow}>
                    {PRICE_FILTERS.map((item, index) => {
                      const active = priceIndex === index;
                      return (
                        <TouchableOpacity
                          key={item.label}
                          activeOpacity={0.78}
                          style={[st.segment, active && st.segmentActive]}
                          onPress={() => setPriceIndex(index)}
                        >
                          <Text style={[st.segmentText, active && st.segmentTextActive]}>{item.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                <View style={st.filterBlock}>
                  <Text style={st.sectionLabel}>Urutkan</Text>
                  <View style={st.segmentRow}>
                    {SORTS.map((item) => {
                      const active = sort === item.sort;
                      return (
                        <TouchableOpacity
                          key={item.label}
                          activeOpacity={0.78}
                          style={[st.segment, active && st.segmentActive]}
                          onPress={() => setSort(item.sort)}
                        >
                          <Text style={[st.segmentText, active && st.segmentTextActive]}>{item.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </FadeInView>

            {showInitialSkeleton ? (
              <View style={st.skeletonWrap}>
                <SkeletonFilterBar />
                <SkeletonVenueList />
              </View>
            ) : null}

            {!showInitialSkeleton ? (
              <View style={st.resultHeader}>
                <Text style={st.resultTitle}>Lapangan tersedia</Text>
                <Text style={st.resultMeta}>{fields.length} hasil</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          showInitialSkeleton ? null : error ? (
            <ErrorState description={error} onRetry={loadFields} />
          ) : (
            <EmptyState
              title="Belum ada lapangan yang cocok"
              description="Coba ubah kata kunci, olahraga, atau rentang harga."
              actionLabel="Reset Filter"
              onAction={resetFilters}
            />
          )
        }
        ListFooterComponent={loadingMore ? <Loading message="Memuat lapangan lainnya..." /> : <View style={{ height: 92 }} />}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], isDesktop: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: Platform.OS === 'ios' ? 58 : 36,
    paddingHorizontal: spacing.gutter,
  },
  shell: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
  },
  header: {
    flexDirection: isDesktop ? 'row' : 'column',
    alignItems: isDesktop ? 'center' : 'stretch',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    ...typography.labelMd,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.headlineLg,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    maxWidth: 620,
  },
  matchBtn: {
    alignSelf: isDesktop ? 'auto' : 'flex-start',
  },
  searchPanel: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.section,
    ...shadows.md,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statText: {
    ...typography.labelMd,
    color: colors.primary,
  },
  resetBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  resetText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  sectionLabel: {
    ...typography.labelSm,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: spacing.sm,
  },
  chipRow: {
    gap: spacing.sm,
    paddingBottom: spacing.section,
  },
  sportChip: {
    height: 42,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceWhite,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sportChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.primary,
  },
  sportChipText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  sportChipTextActive: {
    color: colors.onPrimary,
  },
  filterGrid: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: spacing.md,
    marginBottom: spacing.section,
  },
  filterBlock: {
    flex: 1,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  segment: {
    minHeight: 38,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceWhite,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  segmentActive: {
    borderColor: colors.primary + '55',
    backgroundColor: colors.primaryContainer,
  },
  segmentText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  skeletonWrap: {
    marginBottom: spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  resultTitle: {
    ...typography.headlineSm,
    color: colors.text,
  },
  resultMeta: {
    ...typography.labelMd,
    color: colors.textTertiary,
  },
  columnWrap: {
    gap: spacing.lg,
    maxWidth: 1120,
    alignSelf: 'center',
    width: '100%',
  },
  gridItem: {
    flex: 1,
    minWidth: 0,
  },
});
