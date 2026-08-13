import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { radius, spacing, typography } from '../theme';

type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'CLOSED';

const palette = {
  AVAILABLE: { bg: '#DCFCE7', border: '#22C55E', text: '#166534' },
  BOOKED: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
  CLOSED: { bg: '#E2E8F0', border: '#CBD5E1', text: '#475569' },
};

export default function TimeSlotCard({
  time,
  status,
  onPress,
}: {
  time: string;
  status: SlotStatus;
  onPress?: () => void;
}) {
  const p = palette[status];
  const disabled = status !== 'AVAILABLE';

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.78}
      disabled={disabled}
      onPress={onPress}
      style={[styles.card, { backgroundColor: p.bg, borderColor: p.border }]}
    >
      <Text style={[styles.time, { color: p.text }]}>{time}</Text>
      <Text style={[styles.status, { color: p.text }]}>{status === 'AVAILABLE' ? 'Tersedia' : status === 'BOOKED' ? 'Penuh' : 'Tutup'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  time: {
    ...typography.labelLg,
  },
  status: {
    ...typography.bodySm,
  },
});
