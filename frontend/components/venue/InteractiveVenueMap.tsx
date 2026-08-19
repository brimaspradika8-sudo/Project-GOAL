import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SIZES, SHADOWS, FONT_FAMILY } from '../goalTheme';
import { useTheme } from '../../lib/theme';
import { formatCurrency } from '../../lib/format';
import type { Field } from '../../store/fieldStore';

interface InteractiveVenueMapProps {
  fields: Field[];
  selectedFieldId: number | null;
  onSelectField: (field: Field) => void;
  userLocation?: { lat: number; lng: number };
  radiusKm?: number;
}

const SPORT_ICONS: Record<string, string> = {
  futsal: 'sports-soccer',
  basketball: 'sports-basketball',
  badminton: 'sports-tennis',
  volleyball: 'sports-volleyball',
  mini_soccer: 'sports-soccer',
  tennis: 'sports-tennis',
  other: 'sports',
};

export default function InteractiveVenueMap({
  fields,
  selectedFieldId,
  onSelectField,
  userLocation = { lat: -6.2186, lng: 106.8024 },
  radiusKm = 5,
}: InteractiveVenueMapProps) {
  const { colors } = useTheme();
  const st = makeStyles(colors);
  const [zoomLevel, setZoomLevel] = useState(14);
  const [mapCenter, setMapCenter] = useState(userLocation);

  // Sync center when selected field changes
  useEffect(() => {
    if (selectedFieldId) {
      const found = fields.find((f) => f.id === selectedFieldId);
      if (found && found.latitude && found.longitude) {
        setMapCenter({ lat: found.latitude, lng: found.longitude });
      }
    }
  }, [selectedFieldId, fields]);

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  // Map coordinates projection to relative 2D percentage positions
  const getMapPosition = (lat: number, lng: number) => {
    const latDiff = lat - mapCenter.lat;
    const lngDiff = lng - mapCenter.lng;
    const scale = (zoomLevel / 14) * 3500;

    const x = 50 + lngDiff * scale;
    const y = 50 - latDiff * scale;

    return {
      left: `${Math.min(Math.max(x, 5), 90)}%` as any,
      top: `${Math.min(Math.max(y, 10), 85)}%` as any,
    };
  };

  const handleRecenter = () => {
    setMapCenter(userLocation);
  };

  return (
    <View style={st.container}>
      {/* ── Simulated Map Grid Viewport ── */}
      <View style={st.mapGrid}>
        {/* Map Grid Lines Decorator */}
        <View style={st.gridLineHorizontal1} />
        <View style={st.gridLineHorizontal2} />
        <View style={st.gridLineVertical1} />
        <View style={st.gridLineVertical2} />

        {/* ── User GPS Radar Pulse ── */}
        <View style={[st.userPin, getMapPosition(userLocation.lat, userLocation.lng)]}>
          <View style={st.userPulse} />
          <View style={st.userDot} />
        </View>

        {/* ── Venue Custom Price Pins ── */}
        {fields.map((field) => {
          const isSelected = field.id === selectedFieldId;
          const lat = field.latitude ?? userLocation.lat;
          const lng = field.longitude ?? userLocation.lng;
          const pos = getMapPosition(lat, lng);
          const iconName = (SPORT_ICONS[field.sport_type] || 'sports') as React.ComponentProps<typeof MaterialIcons>['name'];

          return (
            <TouchableOpacity
              key={field.id}
              style={[st.markerWrap, pos, isSelected && st.markerWrapSelected]}
              activeOpacity={0.8}
              onPress={() => onSelectField(field)}
            >
              <View style={[st.markerBadge, isSelected && st.markerBadgeSelected]}>
                <MaterialIcons
                  name={iconName}
                  size={12}
                  color={isSelected ? colors.onPrimary : colors.primary}
                />
                <Text style={[st.markerPriceText, isSelected && st.markerPriceTextSelected]}>
                  {field.price_per_hour ? `Rp ${Math.round(field.price_per_hour / 1000)}k` : 'Gratis'}
                </Text>
              </View>

              {/* Pin Arrow Indicator */}
              <View style={[st.markerArrow, isSelected && st.markerArrowSelected]} />
            </TouchableOpacity>
          );
        })}

        {/* ── Floating Controls (Zoom & Recenter) ── */}
        <View style={st.controlsContainer}>
          <TouchableOpacity
            style={st.controlBtn}
            onPress={() => setZoomLevel((z) => Math.min(z + 1, 18))}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={st.controlDivider} />
          <TouchableOpacity
            style={st.controlBtn}
            onPress={() => setZoomLevel((z) => Math.max(z - 1, 10))}
            activeOpacity={0.8}
          >
            <MaterialIcons name="remove" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={st.recenterBtn} onPress={handleRecenter} activeOpacity={0.8}>
          <MaterialIcons name="my-location" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* ── Active Selected Venue Banner Overlay (Top) ── */}
        {selectedField && (
          <View style={st.selectedOverlay}>
            <View style={st.selectedDot} />
            <Text style={st.selectedText} numberOfLines={1}>
              {selectedField.name} — Terpilih pada peta
            </Text>
          </View>
        )}

        {/* ── Search Radius Indicator Badge ── */}
        <View style={st.radiusBadge}>
          <MaterialIcons name="radar" size={14} color={colors.primary} />
          <Text style={st.radiusText}>Radius {radiusKm} km</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      borderRadius: SIZES.borderRadiusLg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.surfaceContainerLow,
    },
    mapGrid: {
      flex: 1,
      position: 'relative',
      backgroundColor: colors.background === '#F8FAFC' ? '#E2E8F0' : '#1E293B',
    },
    gridLineHorizontal1: {
      position: 'absolute',
      top: '33%',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.background === '#F8FAFC' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
    },
    gridLineHorizontal2: {
      position: 'absolute',
      top: '66%',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.background === '#F8FAFC' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
    },
    gridLineVertical1: {
      position: 'absolute',
      left: '33%',
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: colors.background === '#F8FAFC' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
    },
    gridLineVertical2: {
      position: 'absolute',
      left: '66%',
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: colors.background === '#F8FAFC' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
    },
    userPin: {
      position: 'absolute',
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: -12,
      marginTop: -12,
      zIndex: 2,
    },
    userPulse: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(59, 130, 246, 0.3)',
    },
    userDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#2563EB',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    markerWrap: {
      position: 'absolute',
      alignItems: 'center',
      zIndex: 5,
      marginLeft: -40,
      marginTop: -28,
    },
    markerWrapSelected: {
      zIndex: 10,
      transform: [{ scale: 1.12 }],
    },
    markerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceWhite,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.primary,
      ...SHADOWS.md,
    },
    markerBadgeSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.onPrimary,
      ...SHADOWS.primary,
    },
    markerPriceText: {
      fontFamily: FONT_FAMILY,
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    markerPriceTextSelected: {
      color: colors.onPrimary,
    },
    markerArrow: {
      width: 0,
      height: 0,
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderTopWidth: 6,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: colors.primary,
      marginTop: -1,
    },
    markerArrowSelected: {
      borderTopColor: colors.primary,
    },
    controlsContainer: {
      position: 'absolute',
      top: 14,
      right: 14,
      backgroundColor: colors.surfaceWhite,
      borderRadius: SIZES.borderRadius,
      borderWidth: 1,
      borderColor: colors.divider,
      overflow: 'hidden',
      ...SHADOWS.sm,
      zIndex: 10,
    },
    controlBtn: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlDivider: {
      height: 1,
      backgroundColor: colors.divider,
    },
    recenterBtn: {
      position: 'absolute',
      top: 96,
      right: 14,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceWhite,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.divider,
      ...SHADOWS.sm,
      zIndex: 10,
    },
    selectedOverlay: {
      position: 'absolute',
      top: 14,
      left: 14,
      right: 70,
      backgroundColor: 'rgba(0,0,0,0.75)',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      zIndex: 10,
    },
    selectedDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#34D07B',
    },
    selectedText: {
      color: '#FFFFFF',
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      fontWeight: '600',
      flex: 1,
    },
    radiusBadge: {
      position: 'absolute',
      bottom: 14,
      left: 14,
      backgroundColor: colors.surfaceWhite,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderWidth: 1,
      borderColor: colors.divider,
      ...SHADOWS.sm,
      zIndex: 10,
    },
    radiusText: {
      fontFamily: FONT_FAMILY,
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
    },
  });
