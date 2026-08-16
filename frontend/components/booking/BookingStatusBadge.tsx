import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_FAMILY } from '../goalTheme';
import { useTheme, type ThemeColors } from '../../lib/theme';
import type { BookingStatus } from '../../services/bookingService';

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: keyof ThemeColors; text: keyof ThemeColors }> = {
  WAITING_CONFIRMATION: { label: 'Menunggu Konfirmasi', bg: 'warningMuted', text: 'warning' },
  CONFIRMED: { label: 'Dikonfirmasi', bg: 'primaryMuted', text: 'primary' },
  COMPLETED: { label: 'Selesai', bg: 'surfaceContainerHigh', text: 'textSecondary' },
  REJECTED: { label: 'Ditolak', bg: 'destructiveMuted', text: 'error' },
  CANCELLED: { label: 'Dibatalkan', bg: 'destructiveMuted', text: 'error' },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { colors } = useTheme();
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.CANCELLED;

  return (
    <View style={[styles.pill, { backgroundColor: colors[cfg.bg] }]}>
      <View style={[styles.dot, { backgroundColor: colors[cfg.text] }]} />
      <Text style={[styles.label, { color: colors[cfg.text] }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
