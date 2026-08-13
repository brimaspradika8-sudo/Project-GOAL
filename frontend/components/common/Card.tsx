import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { radius, shadows, spacing } from '../theme';
import { useTheme } from '../../lib/theme';

interface CardProps extends ViewProps {
  padded?: boolean;
}

export default function Card({ padded = true, style, children, ...props }: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceWhite, borderColor: colors.divider },
        padded && styles.padded,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.sm,
  },
  padded: {
    padding: spacing.lg,
  },
});
