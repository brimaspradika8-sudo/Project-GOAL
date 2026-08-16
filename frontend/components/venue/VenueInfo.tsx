import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { FONTS, FONT_FAMILY, SHADOWS } from '../goalTheme';
import { useTheme } from '../../lib/theme';
import { SPORT_LABELS } from '../../lib/fieldValidation';
import type { Field } from '../../store/fieldStore';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

function pricePerHourLabel(price: number | null): string {
  if (price == null) return 'Hubungi';
  return `Rp${price.toLocaleString('id-ID')}/jam`;
}

interface VenueInfoProps {
  field: Field;
  sportIcon: MaterialIconName;
  isMobile: boolean;
}

export default function VenueInfo({ field: f, sportIcon, isMobile }: VenueInfoProps) {
  const { colors } = useTheme();
  const st = makeStyles(colors, isMobile);

  return (
    <View style={st.infoCard}>
      <Text style={st.venueName} numberOfLines={2} ellipsizeMode="tail">{f.name}</Text>
      <View style={st.metaRow}>
        <MaterialIcons name={sportIcon} size={isMobile ? 15 : 17} color={colors.primary} />
        <Text style={st.metaText}>{SPORT_LABELS[f.sport_type] ?? f.sport_type}</Text>
      </View>
      <View style={st.metaRow}>
        <MaterialIcons name="location-on" size={isMobile ? 15 : 17} color={colors.textTertiary} />
        <Text style={[st.metaText, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{f.location}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            const q = encodeURIComponent(`${f.name} ${f.location}`);
            Linking.openURL(`https://www.google.com/maps/search/${q}`);
          }}
        >
          <Text style={st.mapLink}>Buka Maps</Text>
        </TouchableOpacity>
      </View>
      <View style={st.priceRow}>
        <View>
          <Text style={st.priceLabel}>Harga Sewa</Text>
          <Text style={st.price}>{pricePerHourLabel(f.price_per_hour)}</Text>
        </View>
        {f.owner?.name ? (
          <View style={st.ownerBlock}>
            <Text style={st.ownerLabel}>Dikelola oleh</Text>
            <Text style={st.ownerText} numberOfLines={1}>{f.owner.name}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], isMobile: boolean) =>
  StyleSheet.create({
    infoCard: {
      backgroundColor: colors.surfaceWhite,
      borderRadius: 24,
      padding: isMobile ? 24 : 28,
      marginBottom: isMobile ? 20 : 28,
      ...SHADOWS.sm,
    },
    venueName: {
      fontFamily: FONT_FAMILY,
      fontSize: isMobile ? 22 : 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 14,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    metaText: {
      ...FONTS.bodyMd,
      color: colors.textSecondary,
      fontSize: isMobile ? undefined : 16,
    },
    mapLink: {
      ...FONTS.labelMd,
      color: colors.primary,
      fontSize: isMobile ? undefined : 15,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingTop: isMobile ? 14 : 16,
      marginTop: isMobile ? 10 : 12,
    },
    priceLabel: {
      ...FONTS.bodySm,
      color: colors.textTertiary,
      marginBottom: 2,
    },
    price: {
      fontFamily: FONT_FAMILY,
      fontSize: isMobile ? 20 : 24,
      fontWeight: '700',
      color: colors.primary,
    },
    ownerBlock: {
      alignItems: 'flex-end',
      flex: 1,
    },
    ownerLabel: {
      ...FONTS.bodySm,
      color: colors.textTertiary,
      marginBottom: 2,
    },
    ownerText: {
      ...FONTS.bodySm,
      color: colors.textSecondary,
      fontSize: isMobile ? undefined : 15,
    },
  });
