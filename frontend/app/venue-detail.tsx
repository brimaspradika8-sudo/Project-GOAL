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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SIZES, SHADOWS } from '../components/goalTheme';
import { SafeImage } from '../components/SafeImage';
import { API_BASE_URL } from '../lib/api';
import type { Field } from '../store/fieldStore';

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

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchField = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(`${API_BASE_URL}/fields/${id}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.errorText}>Memuat data...</Text>
      </View>
    );
  }

  if (error || !field) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color={COLORS.textTertiary} />
        <Text style={styles.errorText}>{error || 'Lapangan tidak ditemukan'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnSmall}>
          <Text style={styles.backBtnSmallText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imgUrl = field.image_url || DEFAULT_IMAGES[field.sport_type] || DEFAULT_IMAGES.default;
  const isApproved = field.status === 'approved';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.heroSection}>
          <SafeImage source={{ uri: imgUrl }} style={styles.heroImage} fallbackSize={48} />
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
            <MaterialIcons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.favButton} activeOpacity={0.8}>
            <MaterialIcons name="favorite-border" size={22} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <View style={styles.heroBadges}>
              <View style={[styles.heroStatusBadge, { backgroundColor: isApproved ? COLORS.primary : COLORS.error }]}>
                <Text style={styles.heroStatusText}>{isApproved ? 'Tersedia' : 'Menunggu'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.venueTitle}>{field.name}</Text>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={16} color={COLORS.primary} />
            <Text style={styles.locationText}>{field.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialIcons name="sports" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>{field.sport_type}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <MaterialIcons name="payments" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>{formatPrice(field.price_per_hour)}/jam</Text>
            </View>
          </View>

          {field.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tentang</Text>
              <Text style={styles.descText}>{field.description}</Text>
            </View>
          )}

          {field.owner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pemilik</Text>
              <View style={styles.ownerRow}>
                <View style={styles.ownerAvatar}>
                  <MaterialIcons name="person" size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.ownerName}>{field.owner.name}</Text>
                  <Text style={styles.ownerLabel}>Pemilik Lapangan</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lokasi</Text>
            <View style={styles.mapPlaceholder}>
              <MaterialIcons name="map" size={32} color={COLORS.textTertiary} />
              <Text style={styles.mapText}>{field.location}</Text>
              <TouchableOpacity style={styles.mapButton} activeOpacity={0.8}>
                <MaterialIcons name="directions" size={18} color={COLORS.primary} />
                <Text style={styles.mapButtonText}>Buka di Maps</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceLabel}>Harga</Text>
          <Text style={styles.bottomPriceValue}>{formatPrice(field.price_per_hour)}/jam</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, !isApproved && styles.bookButtonDisabled]}
          activeOpacity={0.85}
          onPress={() => {
            if (!isApproved) return;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push({ pathname: '/booking', params: { venueId: String(field.id) } });
          }}
          disabled={!isApproved}
        >
          <Text style={styles.bookButtonText}>{isApproved ? 'Pesan Sekarang' : 'Tersedia Nanti'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  errorText: {
    ...FONTS.headlineSm,
    color: COLORS.textSecondary,
  },
  backBtnSmall: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.primary,
  },
  backBtnSmallText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  heroSection: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
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
    fontFamily: 'Montserrat',
    color: '#ffffff',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  venueTitle: {
    fontFamily: 'Montserrat',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
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
    color: COLORS.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWhite,
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
    color: COLORS.text,
    fontWeight: '600',
  },
  infoDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.divider,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONTS.headlineSm,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  descText: {
    ...FONTS.bodyMd,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadius,
    padding: 14,
    ...SHADOWS.sm,
  },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerName: {
    ...FONTS.titleMd,
    color: COLORS.text,
  },
  ownerLabel: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
  },
  mapPlaceholder: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    ...SHADOWS.sm,
  },
  mapText: {
    ...FONTS.bodyMd,
    color: COLORS.textSecondary,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  mapButtonText: {
    ...FONTS.titleMd,
    color: COLORS.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceWhite,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    ...SHADOWS.xl,
  },
  bottomPrice: {
    flex: 1,
  },
  bottomPriceLabel: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
  },
  bottomPriceValue: {
    fontFamily: 'Montserrat',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 28,
    paddingVertical: 14,
    ...SHADOWS.primary,
  },
  bookButtonDisabled: {
    backgroundColor: COLORS.surfaceContainerHigh,
    shadowOpacity: 0,
    elevation: 0,
  },
  bookButtonText: {
    color: '#ffffff',
    ...FONTS.buttonLg,
  },
});
