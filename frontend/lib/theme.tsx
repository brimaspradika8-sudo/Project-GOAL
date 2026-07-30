import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme_preference';

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
  primaryHover: '#176D3C',
  primaryMuted: '#DCF2DD',
  destructive: '#E0533D',
  destructiveMuted: '#FEEBE9',
  warning: '#D97706',
  warningMuted: '#FEF3C7',
  focusRing: 'rgba(30,138,76,0.35)',
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
  primary: '#1E8A4C',
  primaryLight: '#E6F4E8',
  primaryContainer: '#DCF2DD',
  primaryFixed: '#1E8A4C',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#0F3D22',
  success: '#1E8A4C',
  successLight: '#E6F4E8',
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
  bgBase: '#0C1219',
  bgSurface: '#161E28',
  bgElevated: '#1E2A36',
  borderSubtle: '#263040',
  textPrimary: '#F0F4F2',
  textMuted: '#5C6B62',
  primaryHover: '#5BE091',
  primaryMuted: '#1A3828',
  destructive: '#F87171',
  destructiveMuted: '#3B1A1A',
  warning: '#FBBF24',
  warningMuted: '#3A2A12',
  focusRing: 'rgba(52,208,123,0.36)',
  background: '#0C1219',
  surface: '#161E28',
  surfaceWhite: '#1E2A36',
  surfaceContainer: '#131B24',
  surfaceContainerLow: '#101820',
  surfaceContainerLowest: '#0A1018',
  surfaceContainerHigh: '#1E2A36',
  surfaceContainerHighest: '#263444',
  surfaceAlt: '#141E28',
  surfaceStrong: '#304050',
  primary: '#34D07B',
  primaryLight: '#162E24',
  primaryContainer: '#1A3828',
  primaryFixed: '#34D07B',
  onPrimary: '#003D1E',
  onPrimaryContainer: '#A8F5C8',
  success: '#34D07B',
  successLight: '#162E24',
  text: '#F0F4F2',
  textSecondary: '#8B9A91',
  textTertiary: '#5C6B62',
  onSurface: '#F0F4F2',
  onSurfaceVariant: '#8B9A91',
  outline: '#263040',
  outlineVariant: '#1E2A36',
  error: '#F87171',
  errorContainer: '#3B1A1A',
  errorLight: '#4A1F1F',
  onErrorContainer: '#FECACA',
  floodlight: '#FBBF24',
  inverseSurface: '#E2E8F0',
  inverseOnSurface: '#1A2332',
  divider: '#263040',
  shadow: 'rgba(0,0,0,0.35)',
  shadowDark: 'rgba(0,0,0,0.55)',
  warmWhite: '#1E2A36',
  cardBg: '#1E2A36',
};

function getAutoMode(systemScheme: string | null | undefined): ResolvedMode {
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
  setMode: (m: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'auto',
  resolved: 'light',
  colors: LIGHT_COLORS,
  setMode: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [loaded, setLoaded] = useState(false);
  const initialRef = useRef(true);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(stored => {
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        setModeState(stored);
      }
      setLoaded(true);
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
    () => ({ mode, resolved, colors, setMode, toggleTheme }),
    [mode, resolved, colors, setMode, toggleTheme],
  );

  if (!loaded) {
    return (
      <ThemeContext.Provider value={{ mode: 'auto', resolved: 'light', colors: LIGHT_COLORS, setMode: () => {}, toggleTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export { LIGHT_COLORS, DARK_COLORS };
