import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { useNotificationStore, type AppNotification } from '../../store/notificationStore';
import { useProfileStore } from '../../store/profileStore';
import ConfirmDialog from './ConfirmDialog';

function formatNotificationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = Date.now();
  const diffMinutes = Math.max(0, Math.floor((now - date.getTime()) / 60000));

  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TYPE_ICONS: Record<string, string> = {
  field_approved: 'check-circle',
  field_rejected: 'cancel',
  owner_request_approved: 'verified',
  owner_request_rejected: 'feedback',
  field_submitted: 'add-circle',
  owner_request_submitted: 'person-add',
  field_updated: 'edit',
  field_deleted: 'delete',
  role_changed: 'manage-accounts',
};

const TYPE_LABELS: Record<string, string> = {
  field_approved: 'Lapangan disetujui',
  field_rejected: 'Lapangan ditolak',
  owner_request_approved: 'Pengajuan owner disetujui',
  owner_request_rejected: 'Pengajuan owner ditolak',
  field_submitted: 'Pengajuan lapangan baru',
  owner_request_submitted: 'Pengajuan owner baru',
  field_updated: 'Lapangan diperbarui',
  field_deleted: 'Lapangan dihapus',
  role_changed: 'Peran akun',
};

interface NavTarget {
  label: string;
  href: string;
}

function resolveTarget(item: AppNotification, role?: string): NavTarget | null {
  const roleMap: Record<string, Record<string, NavTarget>> = {
    super_admin: {
      field_submitted: { label: 'Kelola Lapangan (Pending)', href: '/(super-admin)/manage-fields?tab=pending' },
      field_updated: { label: 'Kelola Lapangan', href: '/(super-admin)/manage-fields' },
      field_deleted: { label: 'Sampah Lapangan', href: '/(super-admin)/manage-fields?tab=trashed' },
      owner_request_submitted: { label: 'Pengajuan Owner', href: '/(super-admin)/owner-requests' },
      role_changed: { label: 'Profil Saya', href: '/(super-admin)/profile' },
    },
    owner: {
      field_approved: { label: 'Lapangan Saya', href: '/(owner)/fields' },
      field_rejected: { label: 'Lapangan Saya', href: '/(owner)/fields' },
      field_updated: { label: 'Lapangan Saya', href: '/(owner)/fields' },
      field_deleted: { label: 'Lapangan Saya', href: '/(owner)/fields' },
      owner_request_approved: { label: 'Profil Saya', href: '/(owner)/profile' },
      owner_request_rejected: { label: 'Profil Saya', href: '/(owner)/profile' },
      role_changed: { label: 'Profil Saya', href: '/(owner)/profile' },
    },
    player: {
      role_changed: { label: 'Profil Saya', href: '/(tabs)/profile' },
    },
  };

  return roleMap[role ?? '']?.[item.type ?? ''] ?? null;
}

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ visible, onClose }: NotificationCenterProps) {
  const { colors } = useTheme();
  const { items, loading, refresh, markAsRead, markAllRead, clearAll, unreadCount } = useNotificationStore();
  const profile = useProfileStore((s) => s.profile);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<AppNotification | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      refresh().catch(() => {});
    }
  }, [visible, refresh]);

  const onPullRefresh = async () => {
    setRefreshing(true);
    await refresh().catch(() => {});
    setRefreshing(false);
  };

  const unread = unreadCount();

  const openDetail = (item: AppNotification) => {
    if (!item.read) markAsRead(item.id).catch(() => {});
    setDetail(item);
  };

  const handleOpenTarget = (target: NavTarget) => {
    setDetail(null);
    onClose();
    router.push(target.href as any);
  };

  const handleClearAll = async () => {
    setClearing(true);
    setClearError(null);
    const deleted = await clearAll();
    setClearing(false);
    setConfirmClear(false);
    if (deleted === 0 && items.length > 0) {
      setClearError('Gagal menghapus notifikasi. Coba lagi.');
      setConfirmClear(true);
    }
  };

  const detailIcon = detail ? TYPE_ICONS[detail.type ?? ''] ?? 'notifications' : 'notifications';
  const detailTarget = detail ? resolveTarget(detail, profile?.role) : null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modalBox, { backgroundColor: colors.surfaceWhite }]}>
          <View style={styles.modalHead}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Notifikasi</Text>
            <View style={styles.modalHeadRight}>
              {unread > 0 ? (
                <TouchableOpacity
                  style={[styles.headAction, { backgroundColor: colors.primaryLight }]}
                  activeOpacity={0.8}
                  onPress={() => markAllRead().catch(() => {})}
                >
                  <MaterialIcons name="done-all" size={16} color={colors.primary} />
                  <Text style={[styles.headActionText, { color: colors.primary }]}>Dibaca</Text>
                </TouchableOpacity>
              ) : null}
              {items.length > 0 ? (
                <TouchableOpacity
                  style={[styles.headAction, { backgroundColor: colors.errorContainer }]}
                  activeOpacity={0.8}
                  onPress={() => { setClearError(null); setConfirmClear(true); }}
                >
                  <MaterialIcons name="delete-sweep" size={16} color={colors.error} />
                  <Text style={[styles.headActionText, { color: colors.error }]}>Hapus semua</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {loading && items.length === 0 ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.centerText, { color: colors.textSecondary }]}>Memuat notifikasi...</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyNotif}>
              <MaterialIcons name="notifications-none" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyNotifText, { color: colors.textSecondary }]}>
                Belum ada notifikasi.
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onPullRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
            >
              <View style={styles.list}>
                {items.map((item) => {
                  const icon = TYPE_ICONS[item.type ?? ''] ?? 'notifications';
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => openDetail(item)}
                      style={({ pressed }) => [
                        styles.card,
                        {
                          borderColor: item.read ? colors.divider : colors.primary + '55',
                          backgroundColor: item.read ? colors.surface : colors.surfaceContainerLow,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      {!item.read ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
                      <View style={[styles.iconWrap, { backgroundColor: item.read ? colors.surfaceContainerHigh : colors.primaryContainer }]}>
                        <MaterialIcons name={icon as any} size={18} color={item.read ? colors.textSecondary : colors.primary} />
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                        {item.description ? (
                          <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
                        ) : null}
                        <Text style={[styles.cardTime, { color: colors.textTertiary }]}>
                          {formatNotificationTime(item.created_at)}
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={18} color={colors.textTertiary} style={styles.cardChevron} />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* ── Detail notifikasi ── */}
      <Modal visible={!!detail} animationType="fade" transparent onRequestClose={() => setDetail(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setDetail(null)} />
          <View style={[styles.detailBox, { backgroundColor: colors.surfaceWhite }]}>
            {detail ? (
              <>
                <View style={styles.detailHead}>
                  <View style={[styles.detailIconWrap, { backgroundColor: colors.primaryContainer }]}>
                    <MaterialIcons name={detailIcon as any} size={26} color={colors.primary} />
                  </View>
                  <Text style={[styles.detailTitle, { color: colors.text }]}>{detail.title}</Text>
                  <TouchableOpacity onPress={() => setDetail(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="close" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.detailBody, { color: colors.text }]}>
                  {detail.description || 'Tidak ada deskripsi.'}
                </Text>

                <View style={styles.detailMeta}>
                  {detail.type && TYPE_LABELS[detail.type] ? (
                    <View style={[styles.metaPill, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline }]}>
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>{TYPE_LABELS[detail.type]}</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.detailTime, { color: colors.textTertiary }]}>
                    {formatNotificationTime(detail.created_at)}
                  </Text>
                </View>

                {detailTarget ? (
                  <TouchableOpacity
                    style={[styles.openBtn, { backgroundColor: colors.primary }]}
                    activeOpacity={0.85}
                    onPress={() => handleOpenTarget(detailTarget)}
                  >
                    <MaterialIcons name="open-in-new" size={16} color={colors.onPrimary} />
                    <Text style={[styles.openBtnText, { color: colors.onPrimary }]}>Buka {detailTarget.label}</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirmClear}
        title="Hapus semua notifikasi?"
        description="Semua notifikasi akan dihapus permanen dan tidak bisa dikembalikan."
        destructive
        loading={clearing}
        error={clearError}
        confirmLabel="Ya, Hapus Semua"
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    padding: 20,
    maxHeight: '75%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 10 }),
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeadRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  centerText: {
    fontSize: 14,
  },
  emptyNotif: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyNotifText: {
    fontSize: 14,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    position: 'relative',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 4,
    paddingRight: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardTime: {
    fontSize: 12,
  },
  cardChevron: {
    alignSelf: 'center',
  },

  detailBox: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 10 }),
  },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  detailIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  detailBody: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  metaPill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailTime: {
    fontSize: 12,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
  },
  openBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
