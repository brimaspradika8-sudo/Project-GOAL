import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ThemeColors } from '../../lib/theme';

export default function SelectCheckbox({
  selected,
  colors,
  size = 22,
}: {
  selected: boolean;
  colors: ThemeColors;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size / 3),
          borderColor: selected ? colors.primary : colors.outline,
          backgroundColor: selected ? colors.primary : 'transparent',
        },
      ]}
    >
      {selected ? <MaterialIcons name="check" size={size - 6} color={colors.onPrimary} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
