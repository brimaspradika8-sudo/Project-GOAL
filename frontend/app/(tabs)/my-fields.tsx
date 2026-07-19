import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../components/goalTheme';
import { API_BASE_URL } from '../../lib/api';
import { TOKEN_KEY } from '../_layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeImage } from '../../components/SafeImage';
import type { Field } from '../../store/fieldStore';

const DEFAULT_IMAGES: Record<string, string> = {
  futsal: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: 'Disetujui', color: COLORS.primary, bg: COLORS.successLight },
  pending:  { label: 'Menunggu', color: '#d97706', bg: '#fef3c7' },
  rejected: { label: 'Ditolak', color: COLORS.error, bg: COLORS.errorLight },
};

function formatPrice(price: number | null): string {
  if (!price) return 'Hubungi';
  return `Rp${price.toLocaleString('id-ID')}`;
}

export default function MyFieldsScreen() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchFields = useCallback(async (pageNum: number = 1, append = false) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(`${API_BASE_URL}/fields/my/list?page=${pageNum}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('Gagal memuat data');
      const body = await res.json();

      if (append) {
        setFields((prev) => [...prev, ...body.data]);
      } else {
        setFields(body.data);
      }
      setPage(body.meta.current_page);
      setLastPage(body.meta.last_page);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFields(1, false);
  }, [fetchFields]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFields(1, false);
    setRefreshing(false);
  }, [fetchFields]);

  const onEndReached = useCallback(() => {
    if (page < lastPage && !loadingMore) {
      setLoadingMore(true);
      fetchFields(page + 1, true).finally(() => setLoadingMore(false));
    }
  }, [page, lastPage, loadingMore, fetchFields]);

  const handleDelete = (field: Field) => {
    Alert.alert(
      'Hapus Lapangan',
      `Yakin ingin menghapus "${field.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem(TOKEN_KEY);
              const res = await fetch(`${API_BASE_URL}/fields/${field.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                setFields((prev) => prev.filter((f) => f.id !== field.id));
              }
            } catch {
              Alert.alert('Gagal', 'Terjadi kesalahan saat menghapus.');
            }
          },
        },
      ]
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="stadium" size={48} color={COLORS.textTertiary} />
        <Text style={styles.emptyTitle}>Belum ada lapangan</Text>
        <Text style={styles.emptyDesc}>Ketuk tombol + untuk menambah lapangan baru.</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Field }) => {
    const imgUrl = item.image_url || DEFAULT_IMAGES[item.sport_type] || DEFAULT_IMAGES.default;
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

    return (
      <View style={styles.card}>
        <View style={styles.cardImageWrap}>
          <SafeImage source={{ uri: imgUrl }} style={styles.cardImage} fallbackSize={24} />
          <View style={styles.cardImageOverlay} />
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardPrice}>{formatPrice(item.price_per_hour)}/jam</Text>
          </View>
          <View style={styles.cardLocationRow}>
            <MaterialIcons name="location-on" size={14} color={COLORS.textTertiary} />
            <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
          </View>
          <View style={styles.cardTags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.sport_type}</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/venue-detail', params: { id: String(item.id) } })}
            >
              <MaterialIcons name="visibility" size={16} color={COLORS.primary} />
              <Text style={styles.actionText}>Lihat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteAction]}
              activeOpacity={0.7}
              onPress={() => handleDelete(item)}
            >
              <MaterialIcons name="delete-outline" size={16} color={COLORS.error} />
              <Text style={[styles.actionText, { color: COLORS.error }]}>Hapus</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lapangan Saya</Text>
      </View>

      <FlatList
        data={fields}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          <Text style={styles.subtitle}>
            {fields.length > 0 ? `${fields.length} lapangan terdaftar` : ''}
          </Text>
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={onEndReached}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  headerTitle: {
    ...FONTS.headlineSm,
    fontSize: 18,
    color: COLORS.text,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  subtitle: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  cardImageWrap: {
    height: 120,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  cardBody: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardName: {
    ...FONTS.headlineSm,
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  cardPrice: {
    ...FONTS.headlineSm,
    fontSize: 14,
    color: COLORS.primary,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  cardLocation: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  cardTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  tagText: {
    ...FONTS.labelMd,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
  },
  deleteAction: {
    backgroundColor: COLORS.errorLight,
  },
  actionText: {
    ...FONTS.labelMd,
    fontSize: 12,
    color: COLORS.primary,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    ...FONTS.headlineSm,
    color: COLORS.text,
  },
  emptyDesc: {
    ...FONTS.bodySm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});
