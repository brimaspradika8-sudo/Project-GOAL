import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';
import { FadeInView } from '../FadeInView';

const CARD_W = 64;
const GAP = 10;
const STRIDE = CARD_W + GAP;

interface DayItem {
  iso: string;
  day: number;
  weekday: string;
  monthLabel: string;
  isToday: boolean;
  isPast: boolean;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

interface HorizontalDatePickerProps {
  value: string | null;
  onChange: (iso: string) => void;
  startDate?: Date;
  days?: number;
  style?: ViewStyle;
}

export default function HorizontalDatePicker({
  value,
  onChange,
  startDate = new Date(),
  days = 60,
  style,
}: HorizontalDatePickerProps) {
  const { colors } = useTheme();
  const today = useMemo(() => startOfDay(startDate), [startDate]);
  const todayIso = toIso(today);
  const scrollRef = useRef<ScrollView>(null);

  const { items, months } = useMemo(() => {
    const list: DayItem[] = [];
    const monthList: { key: string; label: string; start: number; end: number }[] = [];
    let currentKey = '';
    let currentLabel = '';
    let currentStart = 0;

    for (let i = 0; i < days; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const iso = toIso(d);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      if (key !== currentKey) {
        if (currentKey !== '') {
          monthList.push({ key: currentKey, label: currentLabel, start: currentStart, end: i - 1 });
        }
        currentKey = key;
        currentLabel = label;
        currentStart = i;
      }

      list.push({
        iso,
        day: d.getDate(),
        weekday: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        monthLabel: label,
        isToday: iso === todayIso,
        isPast: iso < todayIso,
      });
    }
    monthList.push({ key: currentKey, label: currentLabel, start: currentStart, end: days - 1 });

    return { items: list, months: monthList };
  }, [today, todayIso, days]);

  const [activeMonth, setActiveMonth] = useState(() => (months[0]?.label ?? ''));

  const activeMonthIndex = Math.max(0, months.findIndex((m) => m.label === activeMonth));

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.max(
      0,
      Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.x / STRIDE)),
    );
    setActiveMonth(items[idx].monthLabel);
  };

  const scrollToMonth = (monthIndex: number) => {
    const target = months[monthIndex];
    if (!target) return;
    const sc = scrollRef.current;
    if (sc) sc.scrollTo({ x: target.start * STRIDE, animated: true });
  };

  useEffect(() => {
    const selectedIndex = value ? items.findIndex((item) => item.iso === value) : -1;
    const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
    const sc = scrollRef.current;
    if (sc) sc.scrollTo({ x: targetIndex * STRIDE, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => scrollToMonth(activeMonthIndex - 1)}
          disabled={activeMonthIndex <= 0}
          accessibilityRole="button"
          style={[styles.navBtn, activeMonthIndex <= 0 && styles.navBtnDisabled]}
        >
          <MaterialIcons name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>

        <FadeInView key={activeMonth} duration={200} slideUp={6} style={styles.monthWrap}>
          <Text style={[styles.monthLabel, { color: colors.text }]}>{activeMonth}</Text>
        </FadeInView>

        <TouchableOpacity
          onPress={() => scrollToMonth(activeMonthIndex + 1)}
          disabled={activeMonthIndex >= months.length - 1}
          accessibilityRole="button"
          style={[styles.navBtn, activeMonthIndex >= months.length - 1 && styles.navBtnDisabled]}
        >
          <MaterialIcons name="chevron-right" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {items.map((item) => {
          const selected = item.iso === value;
          const disabled = item.isPast;
          return (
            <TouchableOpacity
              key={item.iso}
              activeOpacity={disabled ? 1 : 0.75}
              disabled={disabled}
              onPress={() => { if (!disabled) onChange(item.iso); }}
              style={[
                styles.dayCard,
                {
                  backgroundColor: selected ? colors.primary : colors.surfaceWhite,
                  borderColor: selected || item.isToday ? colors.primary : colors.divider,
                },
                disabled && styles.dayCardDisabled,
              ]}
            >
              <Text
                style={[
                  styles.weekday,
                  { color: selected ? 'rgba(255,255,255,0.85)' : colors.textTertiary },
                ]}
              >
                {item.weekday}
              </Text>
              <Text
                style={[
                  styles.dayNum,
                  { color: selected ? '#FFFFFF' : item.isToday ? colors.primary : colors.text },
                ]}
              >
                {item.day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  monthWrap: {
    flex: 1,
    alignItems: 'center',
  },
  monthLabel: {
    ...typography.titleLg,
    textTransform: 'capitalize',
  },
  content: {
    gap: GAP,
    paddingVertical: spacing.xs,
  },
  dayCard: {
    width: CARD_W,
    height: 82,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayCardDisabled: {
    opacity: 0.35,
  },
  weekday: {
    ...typography.labelMd,
    textTransform: 'capitalize',
  },
  dayNum: {
    fontFamily: typography.headlineMd.fontFamily,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
});
