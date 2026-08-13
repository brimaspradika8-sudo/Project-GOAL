import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

export type PaymentMethod = 'cash' | 'transfer' | 'gateway';

interface PaymentCardProps {
  method: PaymentMethod;
  title: string;
  description: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

const icons: Record<PaymentMethod, React.ComponentProps<typeof MaterialIcons>['name']> = {
  cash: 'payments',
  transfer: 'account-balance',
  gateway: 'credit-card',
};

export default function PaymentCard({ method, title, description, selected = false, disabled = false, onPress }: PaymentCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={disabled ? 1 : 0.78}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: selected ? colors.primaryContainer : colors.surfaceWhite,
          borderColor: selected ? colors.primary : colors.divider,
          opacity: disabled ? 0.56 : 1,
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
        <MaterialIcons name={icons[method]} size={22} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <MaterialIcons name={selected ? 'radio-button-checked' : 'radio-button-unchecked'} size={22} color={selected ? colors.primary : colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 78,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.titleMd,
  },
  description: {
    ...typography.bodySm,
    marginTop: 2,
  },
});
