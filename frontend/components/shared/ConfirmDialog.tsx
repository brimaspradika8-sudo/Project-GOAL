import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../goalTheme';

export interface ConfirmOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  icon?: string;
  color?: string;
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
  const hasOptions = options && options.length > 0;
  const showIcon = icon || destructive;
  const resolvedIcon = icon || (destructive ? 'logout' : 'help-outline');
  const resolvedIconColor = iconColor || (destructive ? COLORS.error : COLORS.primary);
  const resolvedIconBg = iconBg || (destructive ? COLORS.errorLight : COLORS.primaryLight);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={st.backdrop}>
        <View style={st.card}>
          {showIcon && (
            <View style={[st.iconWrap, { backgroundColor: resolvedIconBg }]}>
              <MaterialIcons name={resolvedIcon as any} size={24} color={resolvedIconColor} />
            </View>
          )}

          <Text style={st.title}>{title}</Text>
          {description ? <Text style={st.desc}>{description}</Text> : null}

          {error ? (
            <View style={st.errorBox}>
              <MaterialIcons name="error-outline" size={14} color={COLORS.error} />
              <Text style={st.errorText}>{error}</Text>
            </View>
          ) : null}

          {hasOptions ? (
            <View style={st.options}>
              {options!.map((opt, idx) => {
                const btnColor = opt.destructive ? COLORS.error : (opt.color ?? COLORS.primary);
                const bg = opt.destructive ? COLORS.errorContainer : COLORS.primaryContainer;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[st.optionBtn, { backgroundColor: bg, borderColor: btnColor + '30' }, loading && { opacity: 0.6 }]}
                    onPress={opt.onPress}
                    activeOpacity={0.75}
                    disabled={loading}
                  >
                    {opt.icon && (
                      <View style={[st.optionIcon, { backgroundColor: btnColor + '15' }]}>
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
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
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

const st = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(22,32,26,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 340, backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadiusLg, padding: 22, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.outline,
    ...SHADOWS.md,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  title: { ...FONTS.headlineSm, color: COLORS.text, textAlign: 'center', marginBottom: 6 },
  desc: { ...FONTS.bodySm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 18 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.errorContainer, borderRadius: 10,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.error + '30',
  },
  errorText: { ...FONTS.bodySm, color: COLORS.error, flex: 1 },
  actions: { flexDirection: 'row', gap: 10, width: '100%' },
  btn: { flex: 1, paddingVertical: 12, borderRadius: SIZES.borderRadius, alignItems: 'center' },
  btnCancel: { backgroundColor: COLORS.surfaceContainer, borderWidth: 1, borderColor: COLORS.outline },
  btnCancelText: { ...FONTS.buttonMd, color: COLORS.textSecondary },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnDanger: { backgroundColor: COLORS.error },
  btnConfirmText: { ...FONTS.buttonMd, color: '#FFFFFF' },
  options: { gap: 10, width: '100%', marginBottom: 12 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 1.5, minHeight: 52,
  },
  optionIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  optionLabel: { ...FONTS.titleMd, flex: 1 },
});
