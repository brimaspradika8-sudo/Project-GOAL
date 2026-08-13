import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FONTS, SIZES, SHADOWS, FONT_FAMILY } from '../components/goalTheme';
import { SafeImage } from '../components/SafeImage';
import { apiFetch } from '../lib/apiClient';
import { useFavoriteStore } from '../store/favoriteStore';

import { useTheme } from '../lib/theme';
import { useBreakpoint } from '../lib/responsive';
import type { Field } from '../store/fieldStore';
import { useToastStore } from '../store/toastStore';
import { SPORT_LABELS } from '../lib/fieldValidation';
import * as Linking from 'expo-linking';

const SPORT_ICONS: Record<string, string> = {
  futsal: 'sports-soccer',
  basketball: 'sports-basketball',
  badminton: 'sports-tennis',
  volleyball: 'sports-volleyball',
  mini_soccer: 'sports-soccer',
  tennis: 'sports-tennis',
  other: 'sports',
};

function formatPrice(price: number | null): string {
  if (price == null) return 'Hubungi';
  return `Rp${price.toLocaleString('id-ID')}`;
}

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === 'desktop';
  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { hydrate, isFavorite, toggleFavorite } = useFavoriteStore();

  useEffect(() => {
    hydrate().catch(() => {});
  }, [hydrate]);

  const fetchField = useCallback(async () => {
    try {
      const res = await apiFetch(`/fields/${id}`, { skipToken: true });
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setField(data);
      setError(null);
    } catch {
      setError('Lapangan tidak ditemukan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchField();
  }, [fetchField]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchField();
    setRefreshing(false);
  }, [fetchField]);

  const st = makeStyles(colors, isDesktop, screenWidth);

  if (loading) {
    return (
      <View style={st.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={st.errorText}>Memuat data...</Text>
      </View>
    );
  }

  if (error || !field) {
    return (
      <View style={st.centered}>
        <MaterialIcons name="error-outline" size={48} color={colors.textTertiary} />
        <Text style={st.errorText}>{error || 'Lapangan tidak ditemukan'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtnSmall}>
          <Text style={st.backBtnSmallText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const f = field!;
  const hasImage = !!f.image_url;
  const isApproved = f.status === 'approved';
  const liked = isFavorite(f.id);
  const sportIcon = (SPORT_ICONS[f.sport_type] || 'sports') as React.ComponentProps<typeof MaterialIcons>['name'];
  const initial = (f.owner?.name || '?').charAt(0).toUpperCase();

  function renderHero() {
    return (
      <View style={[st.heroSection, { height: isDesktop ? '100%' : Math.min(280, screenHeight * 0.4) }]}>
        {hasImage ? (
          <SafeImage source={{ uri: f.image_url! }} style={st.heroImage} fallbackSize={48} />
        ) : (
          <View style={st.heroPlaceholder}>
            <MaterialIcons name={sportIcon} size={64} color={colors.primary} />
            <Text style={st.heroPlaceholderText}>Belum ada foto</Text>
          </View>
        )}
        <View style={st.heroOverlay} />
        <TouchableOpacity style={st.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={st.favButton}
          activeOpacity={0.8}
          onPress={async () => {
            const next = await toggleFavorite(f.id);
            const title = next ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit';
            const description = next
              ? `${f.name} masuk ke daftar lapangan favorit Anda.`
              : `${f.name} sudah dihapus dari daftar favorit Anda.`;

            useToastStore.getState().show({
              type: next ? 'success' : 'info',
              title,
              description,
              durationMs: 2500,
            });
          }}
        >
          <MaterialIcons name={liked ? 'favorite' : 'favorite-border'} size={22} color={liked ? '#F87171' : '#ffffff'} />
        </TouchableOpacity>
        <View style={st.heroContent}>
          <View style={st.heroBadges}>
            <View style={[st.heroStatusBadge, { backgroundColor: isApproved ? colors.primary : colors.error }]}>
              <Text style={st.heroStatusText}>{isApproved ? 'Tersedia' : 'Menunggu'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  function renderInfoBar() {
    return (
      <View style={st.infoRow}>
        <View style={st.infoItem}>
          <MaterialIcons name="sports" size={18} color={colors.primary} />
          <Text style={st.infoText}>{SPORT_LABELS[f.sport_type] ?? f.sport_type}</Text>
        </View>
        <View style={st.infoDivider} />
        <View style={st.infoItem}>
          <MaterialIcons name="payments" size={18} color={colors.primary} />
          <Text style={st.infoText}>{formatPrice(f.price_per_hour)}/jam</Text>
        </View>
      </View>
    );
  }

  function renderDescription() {
    if (!f.description) return null;
    return (
      <View style={st.section}>
        <Text style={st.sectionTitle}>Tentang</Text>
        <Text style={st.descText}>{f.description}</Text>
      </View>
    );
  }

  function renderOwner() {
    if (!f.owner) return null;
    return (
      <View style={st.section}>
        <Text style={st.sectionTitle}>Pemilik</Text>
        <View style={st.ownerRow}>
          <View style={[st.ownerAvatar, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[st.ownerAvatarText, { color: colors.primary }]}>{initial}</Text>
          </View>
          <View>
            <Text style={st.ownerName}>{f.owner.name}</Text>
            <Text style={st.ownerLabel}>Pemilik Lapangan</Text>
          </View>
        </View>
      </View>
    );
  }

  function renderLocation() {
    return (
      <View style={st.section}>
        <Text style={st.sectionTitle}>Lokasi</Text>
        <View style={st.mapCard}>
          <View style={[st.mapCanvas, { backgroundColor: colors.primaryContainer }]}>
            <View style={st.mapDots}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <View key={i} style={[st.mapDot, { backgroundColor: colors.primary + '20' }]} />
              ))}
            </View>
            <View style={st.mapDecoPinTop}>
              <MaterialIcons name="location-on" size={14} color={colors.error || '#EF4444'} />
            </View>
            <View style={st.mapDecoPinRight}>
              <MaterialIcons name="location-on" size={10} color={colors.primary} />
            </View>
            <View style={st.mapCenterPin}>
              <MaterialIcons name="location-on" size={40} color={colors.error || '#EF4444'} />
            </View>
          </View>
          <Text style={st.mapAddress}>{f.location}</Text>
          <TouchableOpacity
            style={[st.mapButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={() => {
              const q = encodeURIComponent(`${f.name} ${f.location}`);
              Linking.openURL(`https://www.google.com/maps/search/${q}`);
            }}
          >
            <MaterialIcons name="directions" size={18} color={colors.onPrimary} />
            <Text style={st.mapButtonText}>Buka di Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderMainContent() {
    return (
      <>
        <Text style={st.venueTitle} numberOfLines={2} ellipsizeMode="tail">{f.name}</Text>
        <View style={st.locationRow}>
          <MaterialIcons name="location-on" size={16} color={colors.primary} />
          <Text style={st.locationText} numberOfLines={1} ellipsizeMode="tail">{f.location}</Text>
        </View>
        {renderInfoBar()}
        {renderDescription()}
        {renderOwner()}
        {renderLocation()}
      </>
    );
  }

  return (
    <View style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {isDesktop ? (
        <View style={st.desktopOuter}>
          <View style={st.desktopLeftCol}>{renderHero()}</View>
          <ScrollView
            style={st.desktopRightCol}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
            }
          >
            <View style={st.content}>{renderMainContent()}</View>
            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      ) : (
        <View style={st.containerInner}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
            }
          >
            {renderHero()}
            <View style={st.content}>{renderMainContent()}</View>
          </ScrollView>
        </View>
      )}

      <View style={st.bottomBar}>
        <View style={st.bottomPrice}>
          <Text style={st.bottomPriceLabel}>Harga</Text>
          <Text style={st.bottomPriceValue}>{formatPrice(f.price_per_hour)}/jam</Text>
        </View>
        <TouchableOpacity
          style={[st.bookButton, !isApproved && st.bookButtonDisabled]}
          activeOpacity={0.85}
          onPress={() => {
            if (!isApproved) return;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push({ pathname: '/booking-flow', params: { id: String(f.id) } });
          }}
          disabled={!isApproved}
        >
          <Text style={st.bookButtonText}>{isApproved ? 'Pesan Sekarang' : 'Tersedia Nanti'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], isDesktop: boolean, screenWidth: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerInner: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  errorText: {
    ...FONTS.headlineSm,
    color: colors.textSecondary,
  },
  backBtnSmall: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.borderRadius,
    backgroundColor: colors.primary,
  },
  backBtnSmallText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  desktopGrid: {
    flexDirection: 'row',
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
    width: '100%',
    flex: 1,
  },
  desktopLeft: {
    flex: 3,
  },
  desktopRight: {
    flex: 4,
  },
  desktopOuter: {
    flexDirection: 'row',
    flex: 1,
  },
  desktopLeftCol: {
    width: '45%',
  },
  desktopRightCol: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  heroSection: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  heroPlaceholderText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: colors.textTertiary,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  heroStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  heroStatusText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: colors.onPrimary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxWidth: isDesktop ? undefined : 440,
    alignSelf: isDesktop ? 'stretch' : 'center',
    width: '100%',
  },
  venueTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: isDesktop ? 28 : 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    ...FONTS.bodyMd,
    color: colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadius,
    padding: 14,
    gap: 12,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    ...FONTS.bodySm,
    color: colors.text,
    fontWeight: '600',
  },
  infoDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.divider,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONTS.headlineSm,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  descText: {
    ...FONTS.bodyMd,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadius,
    padding: 14,
    ...SHADOWS.sm,
  },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarText: {
    ...FONTS.headlineSm,
    fontSize: 18,
  },
  ownerName: {
    ...FONTS.titleMd,
    color: colors.text,
  },
  ownerLabel: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
  },
  mapCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  mapCanvas: {
    height: 160,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapDots: {
    position: 'absolute',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
  },
  mapDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    margin: 6,
  },
  mapDecoPinTop: {
    position: 'absolute',
    top: 16,
    left: '30%',
    opacity: 0.6,
  },
  mapDecoPinRight: {
    position: 'absolute',
    top: '45%',
    right: '20%',
    opacity: 0.4,
  },
  mapCenterPin: {
    zIndex: 2,
  },
  mapAddress: {
    ...FONTS.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  mapButtonText: {
    ...FONTS.titleMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceWhite,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    ...SHADOWS.xl,
  },
  bottomPrice: {
    flex: 1,
  },
  bottomPriceLabel: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
  },
  bottomPriceValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  bookButton: {
    backgroundColor: colors.primary,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 28,
    paddingVertical: 14,
    ...SHADOWS.primary,
  },
  bookButtonDisabled: {
    backgroundColor: colors.surfaceContainerHigh,
    ...(Platform.OS === 'web'
      ? { boxShadow: 'none' }
      : { shadowOpacity: 0, elevation: 0 }
    ),
  },
  bookButtonText: {
    color: colors.onPrimary,
    ...FONTS.buttonLg,
  },
});
