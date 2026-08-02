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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SIZES, FONTS, SHADOWS, FONT_FAMILY } from '../../components/goalTheme';
import { API_BASE_URL, DEFAULT_HEADERS } from '../../lib/api';
import * as SecureStore from '../../lib/secureStorage';
import { TOKEN_KEY } from '../../lib/auth';
import { SafeImage } from '../../components/SafeImage';
import type { Field } from '../../store/fieldStore';
import { useTheme } from '../../lib/theme';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useToastStore } from '../../store/toastStore';

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

export default function MyFieldsScreen() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const { colors, resolved } = useTheme();
  const st = makeStyles(colors);
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    approved: { label: 'Disetujui', color: colors.primary, bg: colors.successLight },
    pending:  { label: 'Menunggu', color: colors.warning, bg: colors.warningMuted },
    rejected: { label: 'Ditolak', color: colors.error, bg: colors.errorLight },
  };
  const [deleteTarget, setDeleteTarget] = useState<Field | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFields = useCallback(async (pageNum: number = 1, append = false) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) return;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(`${API_BASE_URL}/fields/my/list?page=${pageNum}`, {
        headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
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

  useFocusEffect(
    useCallback(() => {
      fetchFields(1, false);
    }, [fetchFields])
  );

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
    setDeleteTarget(field);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFields((prev) => prev.filter((f) => f.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: 'Terjadi kesalahan saat menghapus.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={st.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={st.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    return (
      <View style={st.emptyState}>
        <MaterialIcons name="stadium" size={48} color={colors.textTertiary} />
        <Text style={st.emptyTitle}>Belum ada lapangan</Text>
        <Text style={st.emptyDesc}>Ketuk tombol + untuk menambah lapangan baru.</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Field }) => {
    const imgUrl = item.image_url || DEFAULT_IMAGES[item.sport_type] || DEFAULT_IMAGES.default;
    const status = statusConfig[item.status] || statusConfig.pending;

    return (
      <View style={st.card}>
        <View style={st.cardImageWrap}>
          <SafeImage source={{ uri: imgUrl }} style={st.cardImage} fallbackSize={24} />
          <View style={st.cardImageOverlay} />
          <View style={[st.statusBadge, { backgroundColor: status.bg }]}>
            <View style={[st.statusDot, { backgroundColor: status.color }]} />
            <Text style={[st.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={st.cardBody}>
          <View style={st.cardHeader}>
            <Text style={st.cardName} numberOfLines={1}>{item.name}</Text>
            <Text style={st.cardPrice}>{formatPrice(item.price_per_hour)}/jam</Text>
          </View>
          <View style={st.cardLocationRow}>
            <MaterialIcons name="location-on" size={14} color={colors.textTertiary} />
            <Text style={st.cardLocation} numberOfLines={1}>{item.location}</Text>
          </View>
          {item.owner && (
            <View style={st.cardLocationRow}>
              <MaterialIcons name="person" size={14} color={colors.textTertiary} />
              <Text style={st.cardLocation} numberOfLines={1}>{item.owner.name}</Text>
            </View>
          )}
          <View style={st.cardTags}>
            <View style={st.tag}>
              <Text style={st.tagText}>{item.sport_type}</Text>
            </View>
          </View>
          <View style={st.cardActions}>
            <TouchableOpacity
              style={st.actionBtn}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/venue-detail', params: { id: String(item.id) } })}
            >
              <MaterialIcons name="visibility" size={16} color={colors.primary} />
              <Text style={st.actionText}>Lihat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.actionBtn, st.deleteAction]}
              activeOpacity={0.7}
              onPress={() => handleDelete(item)}
            >
              <MaterialIcons name="delete-outline" size={16} color={colors.error} />
              <Text style={[st.actionText, { color: colors.error }]}>Hapus</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} activeOpacity={0.8} onPress={() => router.push('/(tabs)')}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Lapangan Saya</Text>
      </View>

      <FlatList
        data={fields}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          <Text style={st.subtitle}>
            {fields.length > 0 ? `${fields.length} lapangan terdaftar` : ''}
          </Text>
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={st.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title={`Hapus "${deleteTarget?.name ?? ''}"?`}
        description="Yakin ingin menghapus lapangan ini? Tindakan ini tidak bisa dibatalkan."
        destructive
        loading={deleteLoading}
        confirmLabel="Ya, Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  headerTitle: {
    ...FONTS.headlineSm,
    fontSize: 18,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  subtitle: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.divider,
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
    fontFamily: FONT_FAMILY,
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
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  cardPrice: {
    ...FONTS.headlineSm,
    fontSize: 14,
    color: colors.primary,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  cardLocation: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
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
    backgroundColor: colors.surfaceContainerLow,
  },
  tagText: {
    ...FONTS.labelMd,
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.successLight,
  },
  deleteAction: {
    backgroundColor: colors.errorLight,
  },
  actionText: {
    ...FONTS.labelMd,
    fontSize: 12,
    color: colors.primary,
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
    color: colors.text,
  },
  emptyDesc: {
    ...FONTS.bodySm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
