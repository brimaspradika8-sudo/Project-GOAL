import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import { useTheme } from '../../lib/theme';
import AlertBox from './AlertBox';

export interface ConfirmOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  icon?: string;
  color?: string;
  iconBg?: string;
}

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  error?: string | null;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  options?: ConfirmOption[];
  onConfirm?: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  visible, title, description, confirmLabel = 'Ya', cancelLabel = 'Batal',
  destructive = false, loading = false, error = null,
  icon, iconColor, iconBg,
  options, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  const hasOptions = options && options.length > 0;
  const showIcon = icon || destructive;
  const resolvedIcon = icon || (destructive ? 'logout' : 'help-outline');
  const resolvedIconColor = iconColor || (destructive ? colors.error : colors.primary);
  const resolvedIconBg = iconBg || (destructive ? colors.errorLight : colors.primaryLight);
  const st = makeStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={st.backdrop}>
        <View style={st.card}>
          <TouchableOpacity
            style={st.closeBtn}
            onPress={onCancel}
            disabled={loading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Tutup"
          >
            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {showIcon && (
            <View style={[st.iconWrap, { backgroundColor: resolvedIconBg }]}>
              <MaterialIcons name={resolvedIcon as any} size={24} color={resolvedIconColor} />
            </View>
          )}

          <Text style={st.title}>{title}</Text>
          {description ? <Text style={st.desc}>{description}</Text> : null}

          {error ? (
            <AlertBox type="error" title={error} style={st.alertBox} />
          ) : null}

          {hasOptions ? (
            <View style={st.options}>
              {options!.map((opt, idx) => {
                const btnColor = opt.destructive ? colors.error : (opt.color ?? colors.primary);
                const bg = opt.destructive ? colors.errorContainer : colors.primaryContainer;
                const iconBgColor = opt.iconBg || (opt.destructive ? (colors.error + '20') : (btnColor + '20'));
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[st.optionBtn, { backgroundColor: bg, borderColor: btnColor + '30' }, loading && { opacity: 0.6 }]}
                    onPress={opt.onPress}
                    activeOpacity={0.75}
                    disabled={loading}
                  >
                    {opt.icon && (
                      <View style={[st.optionIcon, { backgroundColor: iconBgColor }]}>
                        <MaterialIcons name={opt.icon as any} size={18} color={btnColor} />
                      </View>
                    )}
                    <Text style={[st.optionLabel, { color: btnColor }]}>{opt.label}</Text>
                    {loading && <ActivityIndicator color={btnColor} size="small" style={{ marginLeft: 8 }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={st.actions}>
              <TouchableOpacity style={[st.btn, st.btnCancel]} onPress={onCancel} disabled={loading}>
                <Text style={st.btnCancelText}>{cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.btn, destructive ? st.btnDanger : st.btnPrimary, loading && { opacity: 0.6 }]}
                onPress={onConfirm!}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={colors.onPrimary} size="small" />
                  : <Text style={st.btnConfirmText}>{confirmLabel}</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(22,32,26,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 340, backgroundColor: colors.surface,
    borderRadius: SIZES.borderRadiusLg, padding: 22, alignItems: 'center',
    borderWidth: 1, borderColor: colors.outline,
    position: 'relative',
    ...SHADOWS.md,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
    zIndex: 10,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  title: { ...FONTS.headlineSm, color: colors.text, textAlign: 'center', marginBottom: 6 },
  desc: { ...FONTS.bodySm, color: colors.textSecondary, textAlign: 'center', marginBottom: 18 },
  alertBox: { marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 10, width: '100%' },
  btn: { flex: 1, paddingVertical: 12, borderRadius: SIZES.borderRadius, alignItems: 'center', ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}) },
  btnCancel: { backgroundColor: colors.surfaceContainerHigh, borderWidth: 1, borderColor: colors.outline },
  btnCancelText: { ...FONTS.buttonMd, color: colors.textSecondary },
  btnPrimary: { backgroundColor: colors.primary },
  btnDanger: { backgroundColor: colors.error },
  btnConfirmText: { ...FONTS.buttonMd, color: colors.onPrimary },
  options: { gap: 10, width: '100%', marginBottom: 12 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 1.5, minHeight: 52,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  optionIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  optionLabel: { ...FONTS.titleMd, flex: 1 },
});
