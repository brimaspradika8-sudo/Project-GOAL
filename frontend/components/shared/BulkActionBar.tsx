import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import { useTheme, type ThemeColors } from '../../lib/theme';
import SelectCheckbox from './SelectCheckbox';

export interface BulkAction {
  label: string;
  icon: string;
  color?: string;
  onPress: () => void;
}

export default function BulkActionBar({
  count,
  allSelected,
  onSelectAll,
  onClear,
  actions,
  loading = false,
}: {
  count: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  actions: BulkAction[];
  loading?: boolean;
}) {
  const { colors } = useTheme();
  const st = makeStyles(colors);

  if (count === 0) return null;

  return (
    <View style={st.wrap}>
      <View style={[st.bar, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <TouchableOpacity style={st.left} onPress={onSelectAll} activeOpacity={0.8} disabled={loading}>
          <SelectCheckbox selected={allSelected} colors={colors} size={20} />
          <Text style={[st.countText, { color: colors.text }]}>{count} dipilih</Text>
        </TouchableOpacity>

        <View style={st.actions}>
          {actions.map((a, i) => {
            const color = a.color ?? colors.primary;
            return (
              <TouchableOpacity
                key={i}
                style={[st.actionBtn, { backgroundColor: color + '1A', borderColor: color + '50' }]}
                onPress={a.onPress}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={color} size="small" />
                ) : (
                  <MaterialIcons name={a.icon as any} size={15} color={color} />
                )}
                <Text style={[st.actionText, { color }]}>{a.label}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[st.closeBtn, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outline }]}
            onPress={onClear}
            disabled={loading}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialIcons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: SIZES.gutter,
      paddingBottom: SIZES.gutter,
      paddingTop: 6,
      width: '100%',
      maxWidth: 1240,
      alignSelf: 'center',
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      borderRadius: 16,
      borderWidth: 1,
      paddingVertical: 10,
      paddingHorizontal: 14,
      ...SHADOWS.md,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    countText: { ...FONTS.titleSm },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
    },
    actionText: { ...FONTS.titleSm, fontSize: 12 },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
