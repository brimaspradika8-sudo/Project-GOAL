import React, { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { useNotificationStore } from '../../store/notificationStore';

function formatNotificationTime(value: string): string {
  const date = new Date(value);
  const now = Date.now();
  const diffMinutes = Math.max(0, Math.floor((now - date.getTime()) / 60000));

  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ visible, onClose }: NotificationCenterProps) {
  const { colors } = useTheme();
  const { items, hydrate, markAllRead } = useNotificationStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    hydrate().finally(() => setInitialized(true));
  }, [hydrate]);

  useEffect(() => {
    if (visible) {
      markAllRead().catch(() => {});
    }
  }, [visible, markAllRead]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[styles.modalBox, { backgroundColor: colors.surfaceWhite }]}>
          <View style={styles.modalHead}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Notifikasi</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {!initialized || items.length === 0 ? (
              <View style={styles.emptyNotif}>
                <MaterialIcons name="notifications-none" size={40} color={colors.textTertiary} />
                <Text style={[styles.emptyNotifText, { color: colors.textSecondary }]}>
                  Belum ada notifikasi terbaru.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {items.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.card, { borderColor: colors.divider, backgroundColor: colors.surface }]}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
                      <MaterialIcons name="notifications" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                      <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                      <Text style={[styles.cardTime, { color: colors.textTertiary }]}>
                        {formatNotificationTime(item.created_at)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
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
    maxHeight: '70%',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
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
});
