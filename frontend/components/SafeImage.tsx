import React, { useState } from 'react';
import { Image, ImageProps, View, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './goalTheme';

export function SafeImage(props: ImageProps & { fallbackSize?: number }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const fallbackSize = props.fallbackSize ?? 32;

  if (error) {
    return (
      <View style={[styles.fallback, props.style, { borderRadius: (props.style as any)?.borderRadius ?? 12 }]}>
        <MaterialIcons name="image-not-supported" size={fallbackSize} color={COLORS.textTertiary} />
      </View>
    );
  }

  return (
    <View style={props.style as any}>
      {loading && (
        <View style={[styles.loader, { borderRadius: (props.style as any)?.borderRadius ?? 12 }]}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
      <Image
        {...props}
        style={[props.style, { opacity: loading ? 0 : 1 }]}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setError(true); setLoading(false); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
