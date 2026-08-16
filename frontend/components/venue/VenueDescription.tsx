import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FONTS, SHADOWS } from '../goalTheme';
import { useTheme } from '../../lib/theme';

interface VenueDescriptionProps {
  description: string | null;
  isMobile: boolean;
}

export default function VenueDescription({ description, isMobile }: VenueDescriptionProps) {
  const { colors } = useTheme();
  const [descExpanded, setDescExpanded] = useState(false);
  const st = makeStyles(colors, isMobile);
  const desc = description?.trim();
  const canExpand = !!desc && desc.length > 110;

  return (
    <View style={st.descCard}>
      <Text style={st.descTitle}>Tentang Lapangan</Text>
      <Text style={st.descText} numberOfLines={descExpanded ? undefined : 3}>
        {desc || 'Belum ada deskripsi'}
      </Text>
      {canExpand && (
        <TouchableOpacity activeOpacity={0.7} onPress={() => setDescExpanded((v) => !v)} style={st.readMoreBtn}>
          <Text style={st.readMoreText}>{descExpanded ? 'Tutup' : 'Lihat Selengkapnya'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], isMobile: boolean) =>
  StyleSheet.create({
    descCard: {
      backgroundColor: colors.surfaceWhite,
      borderRadius: 24,
      padding: isMobile ? 24 : 28,
      ...SHADOWS.sm,
    },
    descTitle: {
      ...FONTS.headlineSm,
      color: colors.text,
      marginBottom: 12,
      fontSize: isMobile ? undefined : 22,
    },
    descText: {
      ...FONTS.bodyMd,
      color: colors.textSecondary,
      lineHeight: 22,
      fontSize: isMobile ? undefined : 16,
    },
    readMoreBtn: {
      marginTop: 8,
    },
    readMoreText: {
      ...FONTS.labelMd,
      color: colors.primary,
    },
  });
