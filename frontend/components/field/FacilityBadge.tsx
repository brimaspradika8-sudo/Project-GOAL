import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

interface FacilityBadgeProps {
  label: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
}

export default function FacilityBadge({ label, icon = 'check-circle' }: FacilityBadgeProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '22' }]}>
      <MaterialIcons name={icon} size={14} color={colors.primary} />
      <Text style={[styles.text, { color: colors.primary }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 30,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    ...typography.labelMd,
  },
});
