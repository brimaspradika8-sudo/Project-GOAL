import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDebounce } from '../../hooks/useDebounce';
import { apiFetch } from '../../lib/apiClient';
import { FONTS, SIZES } from '../goalTheme';
import { useTheme } from '../../lib/theme';
import DashboardHeader from '../shared/DashboardHeader';

type AuditLog = {
  id: number;
  action: string;
  target_type: string | null;
  target_id: number | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  actor: { id: number; name: string; email: string } | null;
};

const ACTIONS = [
  { key: '', label: 'Semua' },
  { key: 'user.created', label: 'Dibuat' },
  { key: 'user.updated', label: 'Diedit' },
  { key: 'user.role_updated', label: 'Role' },
  { key: 'user.deleted', label: 'Dihapus' },
];

export default function AuditLogPage() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await apiFetch('/admin/audit-logs', {
        params: { ...(debouncedSearch ? { search: debouncedSearch } : {}), ...(action ? { action } : {}) },
      });
      const body = await response.json();
      if (response.ok) setLogs(body?.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [action, debouncedSearch]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatAction = (value: string) => value.replace('user.', '').replace('_', ' ');
  const formatDate = (value: string) => new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DashboardHeader title="Audit Log" subtitle="Riwayat perubahan yang dilakukan admin." showBack={false} />
      <FlatList
        data={logs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLogs(); }} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={(
          <>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color={colors.textTertiary} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Cari admin atau aksi..." placeholderTextColor={colors.textTertiary} style={styles.searchInput} />
            </View>
            <FlatList
              horizontal
              data={ACTIONS}
              keyExtractor={(item) => item.key || 'all'}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              renderItem={({ item }) => (
                <Text onPress={() => setAction(item.key)} style={[styles.chip, action === item.key && styles.chipActive, action === item.key ? styles.chipTextActive : styles.chipText]}>{item.label}</Text>
              )}
            />
          </>
        )}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : <Text style={styles.empty}>Belum ada aktivitas admin.</Text>}
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <View style={styles.logIcon}><MaterialIcons name="history" size={20} color={colors.primary} /></View>
            <View style={styles.logBody}>
              <Text style={styles.action}>{formatAction(item.action)}</Text>
              <Text style={styles.actor}>{item.actor?.name ?? 'Admin tidak diketahui'}{item.target_id ? ` • User #${item.target_id}` : ''}</Text>
              <Text style={styles.date}>{formatDate(item.created_at)}{item.ip_address ? ` • ${item.ip_address}` : ''}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, maxWidth: 1000, width: '100%', alignSelf: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline, borderRadius: SIZES.borderRadius, paddingHorizontal: 14, height: 48, marginBottom: 12 },
  searchInput: { flex: 1, ...FONTS.bodyMd, color: colors.text, ...(typeof window !== 'undefined' ? { outlineStyle: 'none' as any } : {}) },
  chips: { gap: 8, paddingBottom: 16 },
  chip: { ...FONTS.labelMd, paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.borderRadiusFull, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline, color: colors.textSecondary },
  chipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
  chipText: { color: colors.textSecondary },
  chipTextActive: { color: colors.primary },
  logCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginBottom: 10, borderRadius: SIZES.borderRadius, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline },
  logIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryContainer },
  logBody: { flex: 1 },
  action: { ...FONTS.titleMd, color: colors.text, textTransform: 'capitalize' },
  actor: { ...FONTS.bodyMd, color: colors.textSecondary, marginTop: 3 },
  date: { ...FONTS.bodySm, color: colors.textTertiary, marginTop: 4 },
  loader: { marginTop: 40 },
  empty: { ...FONTS.bodyMd, color: colors.textTertiary, textAlign: 'center', paddingVertical: 48 },
});
