import React from 'react';
import { Platform, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  error?: string | null;
}

export default function Input({ label, icon, error, style, ...props }: InputProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View style={[
        styles.inputWrap,
        {
          backgroundColor: colors.surfaceWhite,
          borderColor: error ? colors.error : colors.divider,
        },
      ]}>
        {icon ? <MaterialIcons name={icon} size={20} color={error ? colors.error : colors.textTertiary} /> : null}
        <TextInput
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { color: colors.text }, style]}
          {...props}
        />
      </View>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.labelMd,
  },
  inputWrap: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.bodyMd,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  error: {
    ...typography.bodySm,
  },
});
