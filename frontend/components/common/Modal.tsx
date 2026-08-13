import React from 'react';
import { Modal as NativeModal, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Button from './Button';
import { radius, shadows, spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

interface AppModalProps {
  visible: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
  style?: ViewStyle;
}

export default function AppModal({
  visible,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Batal',
  loading = false,
  destructive = false,
  onConfirm,
  onClose,
  style,
}: AppModalProps) {
  const { colors } = useTheme();

  return (
    <NativeModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[styles.panel, { backgroundColor: colors.surfaceWhite, borderColor: colors.divider }, style]}>
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              {description ? <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text> : null}
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {children ? <View style={styles.body}>{children}</View> : null}

          {(confirmLabel || onConfirm) ? (
            <View style={styles.actions}>
              <Button title={cancelLabel} variant="ghost" onPress={onClose} style={styles.actionButton} />
              <Button
                title={confirmLabel ?? 'Simpan'}
                variant={destructive ? 'danger' : 'primary'}
                loading={loading}
                onPress={onConfirm}
                style={styles.actionButton}
              />
            </View>
          ) : null}
        </View>
      </View>
    </NativeModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.56)',
    padding: spacing.lg,
  },
  panel: {
    width: '100%',
    maxWidth: 460,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...typography.headlineSm,
  },
  description: {
    ...typography.bodyMd,
    marginTop: spacing.xs,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    marginTop: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? spacing.xs : 0,
  },
  actionButton: {
    flex: 1,
  },
});
