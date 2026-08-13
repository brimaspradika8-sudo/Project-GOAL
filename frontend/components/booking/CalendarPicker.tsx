import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

interface CalendarPickerProps {
  value: string;
  onChange: (date: string) => void;
  days?: number;
  startDate?: Date;
  style?: ViewStyle;
}

export default function CalendarPicker({ value, onChange, startDate = new Date(), style }: CalendarPickerProps) {
  const { colors } = useTheme();
  const today = useMemo(() => startOfDay(new Date()), []);
  const todayIso = formatDate(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday-first

  const cells = useMemo(() => {
    return [
      ...Array<null>(firstWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [firstWeekday, daysInMonth]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => {
    if (isCurrentMonth) return;
    setViewMonth(viewMonth === 0 ? 11 : viewMonth - 1);
    if (viewMonth === 0) setViewYear(viewYear - 1);
  };

  const nextMonth = () => {
    setViewMonth(viewMonth === 11 ? 0 : viewMonth + 1);
    if (viewMonth === 11) setViewYear(viewYear + 1);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceWhite, borderColor: colors.divider }, style]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={prevMonth}
          disabled={isCurrentMonth}
          accessibilityRole="button"
          style={[styles.navBtn, isCurrentMonth && { opacity: 0.35 }]}
        >
          <MaterialIcons name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.text }]}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} accessibilityRole="button" style={styles.navBtn}>
          <MaterialIcons name="chevron-right" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={[styles.weekday, { color: colors.textTertiary }]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day == null) {
            return <View key={`blank-${index}`} style={styles.cell} />;
          }

          const date = new Date(viewYear, viewMonth, day);
          const iso = formatDate(date);
          const isPast = date < today;
          const isToday = iso === todayIso;
          const isSelected = iso === value;
          const disabled = isPast;

          return (
            <View key={iso} style={styles.cell}>
              <TouchableOpacity
                activeOpacity={disabled ? 1 : 0.8}
                disabled={disabled}
                onPress={() => { if (!disabled) onChange(iso); }}
                style={[
                  styles.day,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceWhite,
                    borderColor: isSelected || isToday ? colors.primary : 'transparent',
                  },
                  disabled && { opacity: 0.3 },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: isSelected ? colors.onPrimary : isToday ? colors.primary : colors.text },
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    ...typography.titleMd,
    textTransform: 'capitalize',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...typography.labelSm,
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.2857%',
    aspectRatio: 1,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    ...typography.titleMd,
  },
});
