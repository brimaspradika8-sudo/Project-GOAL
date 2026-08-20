import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { FONTS, FONT_FAMILY, SHADOWS } from '../goalTheme';
import { useTheme } from '../../lib/theme';
import { SPORT_LABELS } from '../../lib/fieldValidation';
import type { Field } from '../../store/fieldStore';
import { useToastStore } from '../../store/toastStore';

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

const DEFAULT_FACILITIES = [
  { icon: 'wifi', label: 'Wi-Fi Gratis' },
  { icon: 'local-parking', label: 'Parkir Luas' },
  { icon: 'wc', label: 'Toilet & Ganti' },
  { icon: 'ac-unit', label: 'AC' },
  { icon: 'storefront', label: 'Kantin' },
  { icon: 'lightbulb', label: 'Lampu Malam' },
];

export default function VenueInfo({ field: f, sportIcon, isMobile }: VenueInfoProps) {
  const { colors } = useTheme();
  const st = makeStyles(colors, isMobile);

  const handleCopyLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(f.location || f.name);
      useToastStore.getState().show({
        type: 'success',
        title: 'Alamat Disalin',
        description: 'Alamat lapangan disalin ke clipboard.',
      });
    }
  };

  return (
    <View style={st.infoCard}>
      <Text style={st.venueName} numberOfLines={2} ellipsizeMode="tail">{f.name}</Text>

      <View style={st.metaRow}>
        <View style={[st.sportTag, { backgroundColor: colors.primaryContainer }]}>
          <MaterialIcons name={sportIcon} size={14} color={colors.primary} />
          <Text style={[st.sportTagText, { color: colors.primary }]}>{SPORT_LABELS[f.sport_type] ?? f.sport_type}</Text>
        </View>

        {f.open_time && f.close_time && (
          <View style={[st.hoursTag, { backgroundColor: colors.bgElevated }]}>
            <MaterialIcons name="schedule" size={13} color={colors.textSecondary} />
            <Text style={[st.hoursTagText, { color: colors.textSecondary }]}>{f.open_time.slice(0, 5)} - {f.close_time.slice(0, 5)}</Text>
          </View>
        )}
      </View>

      {/* ── LOCATION MAP PREVIEW CARD ── */}
      <View style={[st.locationBox, { backgroundColor: colors.bgElevated, borderColor: colors.outline }]}>
        <View style={[st.locationIconWrap, { backgroundColor: colors.primaryContainer }]}>
          <MaterialIcons name="location-on" size={18} color={colors.primary} />
        </View>

        <View style={st.locationTextWrap}>
          <Text style={[st.locationTitle, { color: colors.text }]}>Lokasi Lapangan</Text>
          <Text style={[st.locationText, { color: colors.textSecondary }]} numberOfLines={2}>{f.location}</Text>
        </View>

        <View style={st.locationActions}>
          <TouchableOpacity
            style={[st.mapBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={() => {
              const q = encodeURIComponent(`${f.name} ${f.location}`);
              Linking.openURL(`https://www.google.com/maps/search/${q}`);
            }}
          >
            <MaterialIcons name="map" size={13} color="#FFFFFF" />
            <Text style={st.mapBtnText}>Peta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[st.copyBtn, { backgroundColor: colors.surfaceContainerHigh }]}
            activeOpacity={0.8}
            onPress={handleCopyLocation}
          >
            <MaterialIcons name="content-copy" size={13} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── FACILITY PILLS ── */}
      <Text style={[st.facilityHeader, { color: colors.textSecondary }]}>FASILITAS LAPANGAN</Text>
      <View style={st.facilityRow}>
        {DEFAULT_FACILITIES.map((fac, idx) => (
          <View key={idx} style={[st.facilityPill, { backgroundColor: colors.bgElevated, borderColor: colors.outline }]}>
            <MaterialIcons name={fac.icon as any} size={13} color={colors.primary} />
            <Text style={[st.facilityPillText, { color: colors.text }]}>{fac.label}</Text>
          </View>
        ))}
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
      marginBottom: 12,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    sportTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    sportTagText: {
      ...FONTS.labelMd,
      fontWeight: '700',
    },
    hoursTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    hoursTagText: {
      ...FONTS.bodySm,
      fontWeight: '600',
    },
    locationBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 16,
      borderWidth: 1,
      padding: 12,
      marginBottom: 18,
    },
    locationIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    locationTextWrap: {
      flex: 1,
    },
    locationTitle: {
      ...FONTS.labelLg,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 2,
    },
    locationText: {
      ...FONTS.bodySm,
      fontSize: 12,
      lineHeight: 16,
    },
    locationActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    mapBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    mapBtnText: {
      ...FONTS.labelMd,
      fontSize: 12,
      color: '#FFFFFF',
    },
    copyBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    facilityHeader: {
      ...FONTS.labelMd,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    facilityRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    facilityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
    },
    facilityPillText: {
      ...FONTS.bodySm,
      fontSize: 12,
      fontWeight: '500',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingTop: isMobile ? 14 : 16,
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
