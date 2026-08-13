import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { radius, shadows, typography } from '../theme';
import { useTheme } from '../../lib/theme';
import { SafeImage } from '../SafeImage';

interface HeroCarouselProps {
  images: string[];
  height?: number;
  radius?: number;
  sportIcon?: string;
  style?: ViewStyle;
}

const AUTOPLAY_MS = 4000;

export default function HeroCarousel({
  images,
  height = 260,
  radius: borderRadius = 28,
  sportIcon = 'sports-soccer',
  style,
}: HeroCarouselProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const list = images.length > 0 ? images : [];
  const count = list.length;

  const stopAutoplay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (count <= 1 || width <= 0) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % count;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, AUTOPLAY_MS);
  };

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, width]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(count - 1, i)));
  };

  return (
    <View
      style={[
        styles.shadowShell,
        { borderRadius, ...shadows.md },
        style,
      ]}
    >
      <View
        style={[
          styles.clip,
          { height, borderRadius, backgroundColor: colors.surfaceContainer },
        ]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - width) > 1) {
            setWidth(w);
            setIndex(0);
            scrollRef.current?.scrollTo({ x: 0, animated: false });
          }
        }}
      >
        {count > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onScrollBeginDrag={stopAutoplay}
            onScrollEndDrag={startAutoplay}
            onMomentumScrollEnd={startAutoplay}
            bounces={false}
          >
            {list.map((uri, i) => (
              <View key={`${uri}-${i}`} style={[styles.page, { width }]}>
                <SafeImage source={{ uri }} style={styles.image} fallbackSize={48} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.placeholder}>
            <View style={[styles.placeholderIconWrap, { backgroundColor: colors.primaryContainer }]}>
              <MaterialIcons
                name={sportIcon as React.ComponentProps<typeof MaterialIcons>['name']}
                size={40}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>Belum ada foto</Text>
          </View>
        )}

        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
          style={styles.gradient}
        />

        {count > 1 && (
          <View style={styles.dots}>
            {list.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowShell: {
    width: '100%',
    ...(Platform.OS === 'web' ? { boxShadow: '0px 12px 40px rgba(15,23,42,0.16)' } : {}),
  },
  clip: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  page: {
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    ...typography.bodyMd,
  },
  dots: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },
});
