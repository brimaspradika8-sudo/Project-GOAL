import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle, type StyleProp } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS, SIZES } from '../goalTheme';
import { useTheme } from '../../lib/theme';
import { getAlertPalette, type AlertType } from './alertPalette';

interface AlertBoxProps {
  type?: AlertType;
  title: string;
  description?: string;
  onClose?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function AlertBox({ type = 'error', title, description, onClose, style }: AlertBoxProps) {
  const { colors, resolved } = useTheme();
  const palette = getAlertPalette(type, colors, resolved);

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: palette.background, borderColor: palette.border },
        style,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: palette.accent }]} />
      <View style={styles.iconWrap}>
        <MaterialIcons name={palette.icon} size={20} color={palette.accent} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        {description ? <Text style={[styles.desc, { color: palette.text }]}>{description}</Text> : null}
      </View>
      {onClose ? (
        <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn}>
          <MaterialIcons name="close" size={18} color={palette.accent} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconWrap: {
    width: 24,
    height: 24,
    marginTop: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...FONTS.bodyMd,
    fontWeight: '700',
  },
  desc: {
    ...FONTS.bodySm,
    opacity: 0.85,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
});
