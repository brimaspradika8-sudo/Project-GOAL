import React, { useState } from 'react';
import { Image, ImageProps, View, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAssetUrl } from '../lib/api';
import { useTheme } from '../lib/theme';

export function SafeImage(props: ImageProps & { fallbackSize?: number }) {
  const { colors } = useTheme();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const fallbackSize = props.fallbackSize ?? 32;
  const st = makeStyles(colors);

  if (error) {
    return (
      <View style={[st.fallback, props.style, { borderRadius: (props.style as any)?.borderRadius ?? 12 }]}>
        <MaterialIcons name="image-not-supported" size={fallbackSize} color={colors.textTertiary} />
      </View>
    );
  }

  return (
    <View style={props.style as any}>
      {loading && (
        <View style={[st.loader, { borderRadius: (props.style as any)?.borderRadius ?? 12 }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <Image
        {...props}
        source={
          props.source && typeof props.source === 'object' && 'uri' in props.source
            ? { ...props.source, uri: getAssetUrl((props.source as any).uri) || undefined }
            : props.source
        }
        style={[props.style, { opacity: loading ? 0 : 1 }]}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setError(true); setLoading(false); }}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  fallback: {
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
