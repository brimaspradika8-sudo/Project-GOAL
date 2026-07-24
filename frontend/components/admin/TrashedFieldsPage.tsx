import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../../app/_layout';
import { API_BASE_URL } from '../../lib/api';
import { COLORS, FONTS, SIZES, SHADOWS } from '../goalTheme';
import { SkeletonCards } from '../Skeleton';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useToastStore } from '../../store/toastStore';

export default function TrashedFieldsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<{ id: number; name: string } | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFields = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/trashed/list`, {
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      setFields(data?.data ?? []);
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Gagal memuat data.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFields(); }, [fetchFields]);
  const onRefresh = () => { setRefreshing(true); fetchFields(); };

  const handleRestore = (id: number, name: string) => {
    setRestoreTarget({ id, name });
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    setRestoreLoading(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/${restoreTarget.id}/restore`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setRestoreTarget(null);
        useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Lapangan dipulihkan.' });
        fetchFields();
      } else {
        useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Gagal memulihkan.' });
      }
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Tidak dapat terhubung ke server.' });
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleForceDelete = (id: number, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmForceDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/${deleteTarget.id}/force`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setDeleteTarget(null);
        useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Lapangan dihapus permanen.' });
        fetchFields();
      } else {
        useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Gagal menghapus.' });
      }
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Tidak dapat terhubung ke server.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={st.screen}>
        <SkeletonCards count={3} />
      </View>
    );
  }

  if (fields.length === 0) {
    return (
      <View style={st.emptyWrap}>
        <View style={st.emptyIconWrap}>
          <MaterialIcons name="delete-sweep" size={40} color={COLORS.textTertiary} />
        </View>
        <Text style={st.emptyTitle}>Tempat Sampah Kosong</Text>
        <Text style={st.emptyDesc}>Tidak ada lapangan yang dihapus.</Text>
      </View>
    );
  }

  return (
    <View style={st.screen}>
      <ScrollView
        contentContainerStyle={st.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={st.headerRow}>
          <View style={st.countPill}>
            <MaterialIcons name="auto-delete" size={12} color={COLORS.error} />
            <Text style={st.countText}>{fields.length} lapangan terhapus</Text>
          </View>
          <Text style={st.warningText}>Hati-hati — hapus permanen tidak bisa dikembalikan</Text>
        </View>

        {fields.map((f: any) => (
          <View key={f.id} style={st.card}>
            <View style={st.cardMain}>
              <View style={st.fieldIconWrap}>
                <MaterialIcons name="delete" size={20} color={COLORS.error} />
              </View>
              <View style={st.cardInfo}>
                <Text style={st.fieldName} numberOfLines={1}>{f.name}</Text>
                <View style={st.tagRow}>
                  {f.sport_type && (
                    <View style={st.sportTag}>
                      <Text style={st.sportText}>{f.sport_type.toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={st.deletedTag}>
                    <Text style={st.deletedText}>Dihapus</Text>
                  </View>
                </View>
              </View>
            </View>

            {f.deleted_at && (
              <View style={st.deletedRow}>
                <MaterialIcons name="schedule" size={12} color={COLORS.textSecondary} />
                <Text style={st.deletedAt}>Dihapus: {new Date(f.deleted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </View>
            )}

            <View style={st.actions}>
              <TouchableOpacity style={st.restoreBtn} onPress={() => handleRestore(f.id, f.name)} activeOpacity={0.8}>
                <MaterialIcons name="restore" size={16} color={COLORS.primary} />
                <Text style={st.restoreBtnText}>Pulihkan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.deleteBtn} onPress={() => handleForceDelete(f.id, f.name)} activeOpacity={0.8}>
                <MaterialIcons name="delete-forever" size={16} color={COLORS.error} />
                <Text style={st.deleteBtnText}>Hapus Permanen</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Restore Confirm Modal */}
      <ConfirmDialog
        visible={!!restoreTarget}
        title={`Pulihkan "${restoreTarget?.name ?? ''}"?`}
        description="Lapangan akan dikembalikan dan terlihat oleh semua pengguna."
        icon="restore"
        iconColor={COLORS.primary}
        iconBg={COLORS.primaryContainer}
        loading={restoreLoading}
        onCancel={() => setRestoreTarget(null)}
        confirmLabel="Pulihkan"
        onConfirm={confirmRestore}
      />

      {/* Force Delete Confirm Modal */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title={`Hapus permanen "${deleteTarget?.name ?? ''}"?`}
        description="Tindakan ini tidak bisa dibatalkan. Lapangan akan dihapus selamanya."
        icon="delete-forever"
        iconColor={COLORS.error}
        iconBg={COLORS.errorContainer}
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Ya, Hapus Permanen"
        destructive
        onConfirm={confirmForceDelete}
      />
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SIZES.gutter, paddingBottom: 48 },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 100 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.outline, marginBottom: 4,
  },
  emptyTitle: { ...FONTS.titleLg, color: COLORS.text },
  emptyDesc: { ...FONTS.bodyMd, color: COLORS.textSecondary },

  headerRow: { marginBottom: 14 },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.errorContainer, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.error + '30', alignSelf: 'flex-start', marginBottom: 6,
  },
  countText: { ...FONTS.labelSm, color: COLORS.error },
  warningText: { ...FONTS.bodySm, color: COLORS.textSecondary },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.outline, ...SHADOWS.sm,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  fieldIconWrap: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: COLORS.errorContainer,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.error + '30',
  },
  cardInfo: { flex: 1 },
  fieldName: { ...FONTS.titleLg, color: COLORS.text, marginBottom: 6 },
  tagRow: { flexDirection: 'row', gap: 6 },
  sportTag: {
    backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 5, paddingVertical: 2, paddingHorizontal: 7,
  },
  sportText: { ...FONTS.labelSm, color: COLORS.textSecondary },
  deletedTag: {
    backgroundColor: COLORS.errorContainer, borderRadius: 5, paddingVertical: 2, paddingHorizontal: 7,
    borderWidth: 1, borderColor: COLORS.error + '30',
  },
  deletedText: { ...FONTS.labelSm, color: COLORS.error },

  deletedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  deletedAt: { ...FONTS.bodySm, color: COLORS.textSecondary },

  actions: { flexDirection: 'row', gap: 10 },
  restoreBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: COLORS.primaryContainer, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.primary + '30', minHeight: 44,
  },
  restoreBtnText: { ...FONTS.titleSm, color: COLORS.primary },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: COLORS.errorContainer, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.error + '30', minHeight: 44,
  },
  deleteBtnText: { ...FONTS.titleSm, color: COLORS.error },
});
