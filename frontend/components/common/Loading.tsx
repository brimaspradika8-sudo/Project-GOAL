import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

export default function Loading({ message = 'Memuat data...' }: { message?: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
    gap: spacing.sm,
  },
  text: {
    ...typography.bodyMd,
  },
});
