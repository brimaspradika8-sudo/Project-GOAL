import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme_preference';

function isThemeMode(v: unknown): v is ThemeMode {
  return v === 'light' || v === 'dark' || v === 'auto';
}

function readStoredThemeSync(): ThemeMode | null {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const v = localStorage.getItem(THEME_KEY);
      if (isThemeMode(v)) return v;
    }
  } catch {}
  return null;
}

export type ThemeMode = 'light' | 'dark' | 'auto';

export type ResolvedMode = 'light' | 'dark';

export interface ThemeColors {
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  borderSubtle: string;
  textPrimary: string;
  textMuted: string;
  primaryHover: string;
  primaryMuted: string;
  destructive: string;
  destructiveMuted: string;
  warning: string;
  warningMuted: string;
  focusRing: string;
  background: string;
  surface: string;
  surfaceWhite: string;
  surfaceContainer: string;
  surfaceContainerLow: string;
  surfaceContainerLowest: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceAlt: string;
  surfaceStrong: string;
  primary: string;
  primaryLight: string;
  primaryContainer: string;
  primaryFixed: string;
  onPrimary: string;
  onPrimaryContainer: string;
  success: string;
  successLight: string;
  info: string;
  infoLight: string;
  onInfo: string;
  onWarning: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  errorContainer: string;
  errorLight: string;
  onErrorContainer: string;
  floodlight: string;
  inverseSurface: string;
  inverseOnSurface: string;
  divider: string;
  shadow: string;
  shadowDark: string;
  warmWhite: string;
  cardBg: string;
}

const LIGHT_COLORS: ThemeColors = {
  bgBase: '#F3F7F4',
  bgSurface: '#FFFFFF',
  bgElevated: '#EFF6EE',
  borderSubtle: '#DDE5E0',
  textPrimary: '#16201A',
  textMuted: '#889189',
  primaryHover: '#059669',
  primaryMuted: 'rgba(16,185,129,0.12)',
  destructive: '#E0533D',
  destructiveMuted: '#FEEBE9',
  warning: '#D97706',
  warningMuted: '#FEF3C7',
  focusRing: 'rgba(16,185,129,0.28)',
  background: '#F3F7F4',
  surface: '#FFFFFF',
  surfaceWhite: '#FFFFFF',
  surfaceContainer: '#EFF6EE',
  surfaceContainerLow: '#F3F7F4',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerHigh: '#E2E9E4',
  surfaceContainerHighest: '#DCE9E2',
  surfaceAlt: '#F8FAF6',
  surfaceStrong: '#DDE7DE',
  primary: '#10B981',
  primaryLight: '#E6F4E8',
  primaryContainer: 'rgba(16,185,129,0.12)',
  primaryFixed: '#10B981',
  onPrimary: '#07130D',
  onPrimaryContainer: '#047857',
  success: '#10B981',
  successLight: '#E6F4E8',
  info: '#2563EB',
  infoLight: '#DBEAFE',
  onInfo: '#1E3A8A',
  onWarning: '#92400E',
  text: '#16201A',
  textSecondary: '#5B6960',
  textTertiary: '#889189',
  onSurface: '#16201A',
  onSurfaceVariant: '#5B6960',
  outline: '#E2E9E4',
  outlineVariant: '#DDE5E0',
  error: '#E0533D',
  errorContainer: '#FEEBE9',
  errorLight: '#FFE6E1',
  onErrorContainer: '#410002',
  floodlight: '#FFC93C',
  inverseSurface: '#2C322F',
  inverseOnSurface: '#F3F7F4',
  divider: '#E2E9E4',
  shadow: 'rgba(0,0,0,0.06)',
  shadowDark: 'rgba(0,0,0,0.10)',
  warmWhite: '#FFFFFF',
  cardBg: '#FFFFFF',
};

const DARK_COLORS: ThemeColors = {
  bgBase: '#0B1118',
  bgSurface: '#151F2B',
  bgElevated: '#191D1C',
  borderSubtle: '#2C3948',
  textPrimary: '#F4F7F5',
  textMuted: '#69736F',
  primaryHover: '#27B96B',
  primaryMuted: 'rgba(52,217,129,0.12)',
  destructive: '#F87171',
  destructiveMuted: '#3B1A1A',
  warning: '#FBBF24',
  warningMuted: '#3A2A12',
  focusRing: 'rgba(52,217,129,0.28)',
  background: '#0B1118',
  surface: '#151F2B',
  surfaceWhite: '#1C2635',
  surfaceContainer: '#101820',
  surfaceContainerLow: '#0E1520',
  surfaceContainerLowest: '#080E14',
  surfaceContainerHigh: '#2C3948',
  surfaceContainerHighest: '#344252',
  surfaceAlt: '#131C28',
  surfaceStrong: '#344252',
  primary: '#34D981',
  primaryLight: '#0F2A1A',
  primaryContainer: 'rgba(52,217,129,0.12)',
  primaryFixed: '#34D981',
  onPrimary: '#07130D',
  onPrimaryContainer: '#A7F3C7',
  success: '#34D981',
  successLight: '#0F2A1A',
  info: '#60A5FA',
  infoLight: '#1E3A8A',
  onInfo: '#DBEAFE',
  onWarning: '#FDE68A',
  text: '#F4F7F5',
  textSecondary: '#AAB4B0',
  textTertiary: '#69736F',
  onSurface: '#F4F7F5',
  onSurfaceVariant: '#AAB4B0',
  outline: '#2C3948',
  outlineVariant: '#1E2D3A',
  error: '#F87171',
  errorContainer: '#3B1A1A',
  errorLight: '#4A1F1F',
  onErrorContainer: '#FECACA',
  floodlight: '#FBBF24',
  inverseSurface: '#E2E8F0',
  inverseOnSurface: '#1A2332',
  divider: '#2C3948',
  shadow: 'rgba(0,0,0,0.40)',
  shadowDark: 'rgba(0,0,0,0.60)',
  warmWhite: '#1C2635',
  cardBg: '#151F2B',
};

function getAutoMode(systemScheme: string | null | undefined): ResolvedMode {
  if (systemScheme === 'dark' || systemScheme === 'light') {
    return systemScheme;
  }
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 18) return 'light';
  return 'dark';
}

function resolveMode(preference: ThemeMode, systemScheme: string | null | undefined): ResolvedMode {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return getAutoMode(systemScheme);
}

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedMode;
  colors: ThemeColors;
  ready: boolean;
  setMode: (m: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'auto',
  resolved: 'light',
  colors: LIGHT_COLORS,
  ready: true,
  setMode: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredThemeSync() ?? 'auto');
  const [ready, setReady] = useState(() => readStoredThemeSync() !== null);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(stored => {
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        setModeState(stored);
      }
      setReady(true);
    });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(THEME_KEY, m);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  const resolved = useMemo(
    () => resolveMode(mode, systemScheme),
    [mode, systemScheme],
  );

  const colors = useMemo(
    () => (resolved === 'dark' ? DARK_COLORS : LIGHT_COLORS),
    [resolved],
  );

  const value = useMemo(
    () => ({ mode, resolved, colors, ready, setMode, toggleTheme }),
    [mode, resolved, colors, ready, setMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {ready ? children : null}
    </ThemeContext.Provider>
  );
}

export const AUTH_DARK_COLORS: ThemeColors = {
  ...DARK_COLORS,
  borderSubtle: DARK_COLORS.surfaceStrong,
  textTertiary: DARK_COLORS.textSecondary,
};

export { LIGHT_COLORS, DARK_COLORS };
