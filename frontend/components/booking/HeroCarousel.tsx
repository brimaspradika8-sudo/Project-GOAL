import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  const [containerWidth, setContainerWidth] = useState(0);
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
    if (count <= 1 || containerWidth <= 0) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % count;
        scrollRef.current?.scrollTo({ x: next * containerWidth, animated: true });
        return next;
      });
    }, AUTOPLAY_MS);
  };

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, containerWidth]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (containerWidth <= 0) return;
    const currentX = e.nativeEvent.contentOffset.x;
    const i = Math.round(currentX / containerWidth);
    if (i !== index && i >= 0 && i < count) {
      setIndex(i);
    }
  };

  const scrollToSlide = (targetIndex: number) => {
    if (containerWidth <= 0 || targetIndex < 0 || targetIndex >= count) return;
    stopAutoplay();
    setIndex(targetIndex);
    scrollRef.current?.scrollTo({ x: targetIndex * containerWidth, animated: true });
    startAutoplay();
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
          if (w > 0 && Math.abs(w - containerWidth) > 1) {
            setContainerWidth(w);
            setIndex(0);
            scrollRef.current?.scrollTo({ x: 0, animated: false });
          }
        }}
      >
        {count > 0 && containerWidth > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            snapToInterval={containerWidth}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onScrollBeginDrag={stopAutoplay}
            onScrollEndDrag={startAutoplay}
            onMomentumScrollEnd={startAutoplay}
            bounces={false}
            style={{ width: containerWidth }}
          >
            {list.map((uri, i) => (
              <View key={`${uri}-${i}`} style={[styles.page, { width: containerWidth }]}>
                <SafeImage source={{ uri }} style={styles.image} fallbackSize={48} />
              </View>
            ))}
          </ScrollView>
        ) : count > 0 ? (
          <View style={styles.placeholder}>
            <SafeImage source={{ uri: list[0] }} style={styles.image} fallbackSize={48} />
          </View>
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
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']}
          style={styles.gradient}
        />

        {count > 1 && (
          <>
            {/* Arrow Nav (Web / Large screens) */}
            {Platform.OS === 'web' && index > 0 && (
              <TouchableOpacity
                style={[styles.arrowBtn, styles.arrowLeft]}
                onPress={() => scrollToSlide(index - 1)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="chevron-left" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {Platform.OS === 'web' && index < count - 1 && (
              <TouchableOpacity
                style={[styles.arrowBtn, styles.arrowRight]}
                onPress={() => scrollToSlide(index + 1)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="chevron-right" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Pagination Indicators / Dots */}
            <View style={styles.dots}>
              {list.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => scrollToSlide(i)}
                  activeOpacity={0.8}
                  style={[styles.dotTouch]}
                >
                  <View style={[styles.dot, i === index && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Counter badge (e.g. 1/3) */}
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{index + 1} / {count}</Text>
            </View>
          </>
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
  arrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  dots: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    zIndex: 5,
  },
  dotTouch: {
    padding: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#FFFFFF',
  },
  counterBadge: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 5,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
