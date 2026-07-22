import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS, SHADOWS } from '../goalTheme';
import ThemeToggle from '../ThemeToggle';
import { useTheme } from '../../lib/theme';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export default function DashboardHeader({ title, subtitle, right }: DashboardHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[st.wrap, { backgroundColor: colors.primary }]}>
      <View style={st.blobTopLeft} />
      <View style={st.blobBottomRight} />

      <View style={st.content}>
        <View style={st.textGroup}>
          <Text style={[st.title, { color: colors.onPrimary }]} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={[st.subtitle, { color: 'rgba(255,255,255,0.78)' }]} numberOfLines={2}>{subtitle}</Text>
          ) : null}
        </View>
        <View style={st.rightSlot}>
          {right}
          <ThemeToggle />
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  blobTopLeft: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -30,
    right: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    ...FONTS.headlineMd,
  },
  subtitle: {
    ...FONTS.bodyMd,
    marginTop: 4,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 12,
  },
});
