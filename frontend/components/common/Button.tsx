import React from 'react';
import { ActivityIndicator, GestureResponderEvent, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { radius, shadows, spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
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

  const sizeStyle = {
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
  }[size];

  const textStyle = {
    sm: styles.textSm,
    md: styles.textMd,
    lg: styles.textLg,
  }[size];

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: isDisabled ? 0.58 : pressed ? 0.82 : 1 },
        variant === 'primary' && shadows.primary,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <>
          {icon ? <MaterialIcons name={icon} size={iconSize} color={palette.text} /> : null}
          <Text style={[textStyle, { color: palette.text }]} numberOfLines={1}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sizeSm: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  sizeMd: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  sizeLg: {
    minHeight: 54,
    paddingHorizontal: spacing.xl,
  },
  textSm: {
    ...typography.buttonMd,
    fontSize: 12,
  },
  textMd: {
    ...typography.buttonMd,
    fontSize: 14,
  },
  textLg: {
    ...typography.buttonLg,
    fontSize: 16,
  },
});
