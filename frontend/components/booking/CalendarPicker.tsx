import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { radius, spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

interface CalendarPickerProps {
  value: string;
  onChange: (date: string) => void;
  days?: number;
  startDate?: Date;
  style?: ViewStyle;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CalendarPicker({ value, onChange, days = 14, startDate = new Date(), style }: CalendarPickerProps) {
  const { colors } = useTheme();
  const dates = useMemo(() => {
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return date;
    });
  }, [days, startDate]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, style]}>
      {dates.map((date) => {
        const iso = formatDate(date);
        const active = iso === value;
        return (
          <TouchableOpacity
            key={iso}
            activeOpacity={0.78}
            onPress={() => onChange(iso)}
            style={[
              styles.day,
              {
                backgroundColor: active ? colors.primary : colors.surfaceWhite,
                borderColor: active ? colors.primary : colors.divider,
              },
            ]}
          >
            <Text style={[styles.weekday, { color: active ? colors.onPrimary : colors.textTertiary }]}>
              {date.toLocaleDateString('id-ID', { weekday: 'short' })}
            </Text>
            <Text style={[styles.date, { color: active ? colors.onPrimary : colors.text }]}>
              {date.getDate()}
            </Text>
            <Text style={[styles.month, { color: active ? colors.onPrimary : colors.textSecondary }]}>
              {date.toLocaleDateString('id-ID', { month: 'short' })}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  day: {
    width: 74,
    minHeight: 86,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  weekday: {
    ...typography.labelSm,
    textTransform: 'uppercase',
  },
  date: {
    ...typography.headlineMd,
    marginTop: 2,
  },
  month: {
    ...typography.bodySm,
  },
});
