import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SIZES, SHADOWS, FONT_FAMILY } from '../goalTheme';
import { SafeImage } from '../SafeImage';
import { SPORT_LABELS } from '../../lib/fieldValidation';
import { useTheme } from '../../lib/theme';
import { formatCurrency } from '../../lib/format';
import type { Field } from '../../store/fieldStore';

const SPORT_ICONS: Record<string, string> = {
  futsal: 'sports-soccer',
  basketball: 'sports-basketball',
  badminton: 'sports-tennis',
  volleyball: 'sports-volleyball',
  mini_soccer: 'sports-soccer',
  tennis: 'sports-tennis',
  other: 'sports',
};

interface VenueCarouselCardProps {
  field: Field;
  isSelected?: boolean;
  onPress?: () => void;
  width?: number;
}

export default function VenueCarouselCard({
  field,
  isSelected = false,
  onPress,
  width: customWidth,
}: VenueCarouselCardProps) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const st = useMemo(() => makeStyles(colors), [colors]);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const images = useMemo(() => {
    if (field.images && field.images.length > 0) {
      return field.images.map((img) => img.image_path).filter(Boolean);
    }
    return field.image_url ? [field.image_url] : [];
  }, [field]);

  const sportLabel = SPORT_LABELS[field.sport_type] || field.sport_type;
  const sportIcon = (SPORT_ICONS[field.sport_type] || 'sports') as React.ComponentProps<typeof MaterialIcons>['name'];
  const cardWidth = customWidth || (windowWidth >= 768 ? 320 : windowWidth * 0.82);

  const onScrollImage = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = e.nativeEvent.contentOffset.x;
    const layoutWidth = e.nativeEvent.layoutMeasurement.width;
    if (layoutWidth > 0) {
      const index = Math.round(contentOffset / layoutWidth);
      if (index !== activeImgIndex && index >= 0 && index < images.length) {
        setActiveImgIndex(index);
      }
    }
  };

  const openRoute = () => {
    const lat = field.latitude ?? -6.2186;
    const lng = field.longitude ?? 106.8024;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  return (
    <TouchableOpacity
      style={[st.card, { width: cardWidth }, isSelected && st.cardSelected]}
      activeOpacity={0.92}
      onPress={onPress}
    >
      {/* ── Multi-Image Slider ── */}
      <View style={st.imageWrap}>
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScrollImage}
            scrollEventThrottle={16}
            style={st.imageScroll}
          >
            {images.map((url, idx) => (
              <View key={`${url}-${idx}`} style={{ width: cardWidth, height: 150 }}>
                <SafeImage source={{ uri: url }} style={st.image} resizeMode="cover" fallbackSize={32} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={st.imagePlaceholder}>
            <MaterialIcons name={sportIcon} size={36} color={colors.primary} />
            <Text style={st.imagePlaceholderText}>Belum ada foto</Text>
          </View>
        )}

        {/* ── Sport Tag ── */}
        <View style={st.sportPill}>
          <MaterialIcons name={sportIcon} size={13} color={colors.onPrimary} />
          <Text style={st.sportPillText}>{sportLabel}</Text>
        </View>

        {/* ── Badge Image Counter (📷 1/4) ── */}
        {images.length > 1 && (
          <View style={st.imageBadge}>
            <MaterialIcons name="photo-camera" size={12} color="#FFF" />
            <Text style={st.imageBadgeText}>
              {activeImgIndex + 1}/{images.length}
            </Text>
          </View>
        )}

        {/* ── Pagination Dots Indicator ── */}
        {images.length > 1 && (
          <View style={st.dotsContainer}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[st.dot, i === activeImgIndex ? st.dotActive : st.dotInactive]}
              />
            ))}
          </View>
        )}
      </View>

      {/* ── Venue Info Section ── */}
      <View style={st.info}>
        <View style={st.headerRow}>
          <Text style={st.name} numberOfLines={1} ellipsizeMode="tail">
            {field.name}
          </Text>
          <View style={st.ratingBadge}>
            <MaterialIcons name="star" size={14} color="#F59E0B" />
            <Text style={st.ratingText}>{field.rating || 4.8}</Text>
          </View>
        </View>

        <View style={st.locationRow}>
          <MaterialIcons name="location-on" size={14} color={colors.textTertiary} />
          <Text style={st.locationText} numberOfLines={1} ellipsizeMode="tail">
            {field.location}
          </Text>
        </View>

        <View style={st.divider} />

        <View style={st.footerRow}>
          <View style={st.priceCol}>
            <Text style={st.priceLabel}>Mulai</Text>
            <Text style={st.priceValue}>{formatCurrency(field.price_per_hour)}/jam</Text>
          </View>

          <View style={st.actionButtons}>
            <TouchableOpacity style={st.routeBtn} activeOpacity={0.7} onPress={openRoute}>
              <MaterialIcons name="directions" size={16} color={colors.primary} />
              <Text style={st.routeBtnText}>Rute</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={st.bookBtn}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/venue-detail', params: { id: String(field.id) } })}
            >
              <Text style={st.bookBtnText}>Detail</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceWhite,
      borderRadius: SIZES.borderRadiusLg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.divider,
      ...SHADOWS.md,
    },
    cardSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
      ...SHADOWS.primary,
    },
    imageWrap: {
      height: 150,
      position: 'relative',
      backgroundColor: colors.surfaceContainer,
    },
    imageScroll: {
      flex: 1,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    imagePlaceholderText: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      color: colors.textTertiary,
    },
    sportPill: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: 'rgba(30, 138, 76, 0.9)',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 3,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    sportPillText: {
      color: '#FFFFFF',
      fontFamily: FONT_FAMILY,
      fontSize: 11,
      fontWeight: '700',
    },
    imageBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    imageBadgeText: {
      color: '#FFFFFF',
      fontFamily: FONT_FAMILY,
      fontSize: 11,
      fontWeight: '600',
    },
    dotsContainer: {
      position: 'absolute',
      bottom: 8,
      alignSelf: 'center',
      flexDirection: 'row',
      gap: 5,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    dot: {
      height: 6,
      borderRadius: 3,
    },
    dotActive: {
      width: 14,
      backgroundColor: colors.primary,
    },
    dotInactive: {
      width: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    info: {
      padding: 12,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    name: {
      fontFamily: FONT_FAMILY,
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      marginRight: 6,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: colors.surfaceContainer,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    ratingText: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 8,
    },
    locationText: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      color: colors.textTertiary,
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 6,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priceCol: {
      flex: 1,
    },
    priceLabel: {
      fontFamily: FONT_FAMILY,
      fontSize: 10,
      color: colors.textTertiary,
    },
    priceValue: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    routeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: SIZES.borderRadius,
      backgroundColor: colors.surfaceContainer,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    routeBtnText: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    bookBtn: {
      backgroundColor: colors.primary,
      borderRadius: SIZES.borderRadius,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    bookBtnText: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      fontWeight: '700',
      color: colors.onPrimary,
    },
  });
