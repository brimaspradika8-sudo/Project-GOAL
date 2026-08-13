import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../common/Card';
import { spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

interface BookingSummaryProps {
  field: string;
  date: string;
  time: string;
  duration: string;
  price: string;
}

export default function BookingSummary({ field, date, time, duration, price }: BookingSummaryProps) {
  const { colors } = useTheme();
  const rows = [
    ['Lapangan', field],
    ['Tanggal', date],
    ['Jam', time],
    ['Durasi', duration],
  ];

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>Ringkasan Booking</Text>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        </View>
      ))}
      <View style={[styles.totalRow, { borderTopColor: colors.divider }]}>
        <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
        <Text style={[styles.totalValue, { color: colors.primary }]}>{price}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  title: {
    ...typography.headlineSm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    ...typography.bodyMd,
  },
  value: {
    ...typography.labelLg,
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    ...typography.titleLg,
  },
  totalValue: {
    ...typography.headlineSm,
  },
});
