import React from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../goalTheme';

export interface ConfirmOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  icon?: string;
  color?: string;
}

interface ConfirmActionModalProps {
  visible: boolean;
  title: string;
  description?: string;
  options: ConfirmOption[];
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
}

export default function ConfirmActionModal({
  visible,
  title,
  description,
  options,
  onCancel,
  loading = false,
  error = null,
  icon = 'help-outline',
  iconColor = COLORS.textSecondary,
  iconBg = COLORS.surfaceContainerHigh,
}: ConfirmActionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={st.overlay}>
        <View style={st.card}>
          <View style={st.iconWrap}>
            <View style={[st.iconCircle, { backgroundColor: iconBg }]}>
              <MaterialIcons name={icon as any} size={24} color={iconColor} />
            </View>
          </View>

          <Text style={st.title}>{title}</Text>
          {description ? <Text style={st.description}>{description}</Text> : null}

          {error ? (
            <View style={st.errorBox}>
              <MaterialIcons name="error-outline" size={14} color={COLORS.error} />
              <Text style={st.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={st.options}>
            {options.map((opt, idx) => {
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

          <TouchableOpacity style={st.cancelBtn} onPress={onCancel} activeOpacity={0.7} disabled={loading}>
            <Text style={st.cancelText}>Batal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.outline,
    ...SHADOWS.lg,
  },
  iconWrap: { alignItems: 'center', marginBottom: 16 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    ...FONTS.headlineSm,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    ...FONTS.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.errorContainer,
    borderRadius: 10, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.error + '30',
  },
  errorText: { ...FONTS.bodySm, color: COLORS.error, flex: 1 },
  options: { gap: 10, marginBottom: 12 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    minHeight: 52,
  },
  optionIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  optionLabel: { ...FONTS.titleMd, flex: 1 },
  cancelBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  cancelText: { ...FONTS.titleSm, color: COLORS.textSecondary },
});
