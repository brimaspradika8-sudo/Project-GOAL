import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { radius, shadows, spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

interface BottomSheetProps {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  style?: ViewStyle;
}

export default function BottomSheet({ visible, title, children, onClose, style }: BottomSheetProps) {
  const { colors } = useTheme();

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surfaceWhite, borderColor: colors.divider }, style]}>
          <View style={[styles.handle, { backgroundColor: colors.divider }]} />
          {title ? (
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10} style={styles.closeButton}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.52)',
  },
  sheet: {
    width: '100%',
    maxHeight: '88%',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 38 : spacing.xl,
    ...shadows.lg,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headlineSm,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
