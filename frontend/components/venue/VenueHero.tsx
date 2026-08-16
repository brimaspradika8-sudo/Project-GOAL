import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HeroCarousel } from '../booking';
import { useTheme } from '../../lib/theme';
import { FONT_FAMILY } from '../goalTheme';

const WHITE = '#FFFFFF';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface VenueHeroProps {
  images: string[];
  sportIcon: MaterialIconName;
  isMobile: boolean;
  liked: boolean;
  isApproved: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
}

export default function VenueHero({
  images,
  sportIcon,
  isMobile,
  liked,
  isApproved,
  onBack,
  onToggleFavorite,
}: VenueHeroProps) {
  const { colors } = useTheme();
  const st = makeStyles(colors, isMobile);

  return (
    <View style={st.heroShell}>
      <HeroCarousel images={images} height={isMobile ? 260 : 420} radius={28} sportIcon={sportIcon} />
      {isMobile && (
        <TouchableOpacity style={st.glassBtnLeft} onPress={onBack} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={st.glassBtnRight} onPress={onToggleFavorite} activeOpacity={0.8}>
        <MaterialIcons
          name={liked ? 'favorite' : 'favorite-border'}
          size={isMobile ? 22 : 24}
          color={liked ? colors.favorite : WHITE}
        />
      </TouchableOpacity>
      {!isApproved && (
        <View style={st.statusBadge}>
          <Text style={st.statusBadgeText}>Menunggu Persetujuan</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], isMobile: boolean) =>
  StyleSheet.create({
    heroShell: {
      position: 'relative',
      width: '100%',
    },
    glassBtnLeft: {
      position: 'absolute',
      top: 14,
      left: 14,
      width: isMobile ? 40 : 44,
      height: isMobile ? 40 : 44,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      ...(Platform.OS === 'web'
        ? ({ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any)
        : {}),
    },
    glassBtnRight: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: isMobile ? 40 : 44,
      height: isMobile ? 40 : 44,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      ...(Platform.OS === 'web'
        ? ({ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any)
        : {}),
    },
    statusBadge: {
      position: 'absolute',
      bottom: 14,
      left: 14,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 5,
      backgroundColor: '#F59E0B',
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      color: WHITE,
    },
  });
