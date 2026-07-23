import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme_preference';

export type ThemeMode = 'light' | 'dark' | 'auto';

export type ResolvedMode = 'light' | 'dark';

export interface ThemeColors {
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
  accentPurple: string;
  accentPurpleLight: string;
  accentOrange: string;
  accentOrangeLight: string;
  ownerAccent: string;
  ownerAccentLight: string;
  adminAccent: string;
  adminAccentLight: string;
}

const LIGHT_COLORS: ThemeColors = {
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
  accentPurple: '#8B5CF6',
  accentPurpleLight: '#F1EAFB',
  accentOrange: '#E97A1F',
  accentOrangeLight: '#FFF3E6',
  ownerAccent: '#7C3AED',
  ownerAccentLight: '#EDE9FE',
  adminAccent: '#D97706',
  adminAccentLight: '#FEF3C7',
};

const DARK_COLORS: ThemeColors = {
  background: '#111827',
  surface: '#1F2937',
  surfaceWhite: '#1F2937',
  surfaceContainer: '#1A2332',
  surfaceContainerLow: '#16202E',
  surfaceContainerLowest: '#0F1722',
  surfaceContainerHigh: '#263040',
  surfaceContainerHighest: '#2D3A4C',
  surfaceAlt: '#1A2535',
  surfaceStrong: '#374357',
  primary: '#34D07B',
  primaryLight: '#1A3A2A',
  primaryContainer: '#1A3A2A',
  primaryFixed: '#34D07B',
  onPrimary: '#0A1F12',
  onPrimaryContainer: '#A8F5C8',
  success: '#34D07B',
  successLight: '#1A3A2A',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  onSurface: '#F9FAFB',
  onSurfaceVariant: '#9CA3AF',
  outline: '#374151',
  outlineVariant: '#2D3748',
  error: '#F87171',
  errorContainer: '#3B1A1A',
  errorLight: '#4A1F1F',
  onErrorContainer: '#FECACA',
  floodlight: '#FBBF24',
  inverseSurface: '#F3F4F6',
  inverseOnSurface: '#1F2937',
  divider: '#374151',
  shadow: 'rgba(0,0,0,0.3)',
  shadowDark: 'rgba(0,0,0,0.5)',
  warmWhite: '#1F2937',
  cardBg: '#1F2937',
  accentPurple: '#A78BFA',
  accentPurpleLight: '#2D1F5E',
  accentOrange: '#FB923C',
  accentOrangeLight: '#4A2C10',
  ownerAccent: '#A78BFA',
  ownerAccentLight: '#2D1F5E',
  adminAccent: '#FBBF24',
  adminAccentLight: '#4A3810',
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
