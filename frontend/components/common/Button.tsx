import React from 'react';
import { ActivityIndicator, GestureResponderEvent, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { radius, shadows, spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const palette = {
    primary: { bg: colors.primary, border: colors.primary, text: colors.onPrimary },
    secondary: { bg: colors.primaryContainer, border: colors.primary + '33', text: colors.primary },
    ghost: { bg: 'transparent', border: colors.divider, text: colors.text },
    danger: { bg: colors.errorContainer, border: colors.error + '33', text: colors.error },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: isDisabled ? 0.58 : pressed ? 0.82 : 1 },
        variant === 'primary' && shadows.primary,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <>
          {icon ? <MaterialIcons name={icon} size={18} color={palette.text} /> : null}
          <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  text: {
    ...typography.buttonMd,
  },
});
