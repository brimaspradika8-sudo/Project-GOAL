import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS, SHADOWS } from './goalTheme';

const DESKTOP_BREAKPOINT = 768;
const AUTH_CARD_MAX_WIDTH = 430;

export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return width >= DESKTOP_BREAKPOINT;
}

interface AuthCardProps {
  children: React.ReactNode;
}

export default function AuthCard({ children }: AuthCardProps) {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <View style={styles.desktopBackground}>
      <View style={styles.card}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopBackground: {
    flex: 1,
    backgroundColor: '#E2E8E4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: AUTH_CARD_MAX_WIDTH,
    maxWidth: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    ...SHADOWS.xl,
  },
});
