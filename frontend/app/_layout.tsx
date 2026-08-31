import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NativeSplash from 'expo-splash-screen';
import * as Font from 'expo-font';
import 'react-native-reanimated';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from '../components/SplashScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { MaterialIcons } from '@expo/vector-icons';
import { apiFetch } from '../lib/apiClient';
import { useProfileStore } from '../store/profileStore';
import { ThemeProvider, useTheme } from '../lib/theme';
import AppToast from '../components/shared/AppToast';
import { useToastStore } from '../store/toastStore';

import * as SecureStore from '../lib/secureStorage';
import { TOKEN_KEY } from '../lib/auth';
import { isUserRole, profileFromApi, routeForRole } from '../types/roles';
import type { Profile } from '../store/profileStore';

NativeSplash.preventAutoHideAsync();

// Local fonts are loaded offline via Font.useFonts below.

type BootProfile = Profile;

async function fetchProfile(token: string, maxRetries = 2): Promise<{ profile: BootProfile | null; unauthorized: boolean; networkError: boolean }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await apiFetch('/me', { token, skipToken: true, timeout: 8000 });
      if (res.status === 401 || res.status === 403 || (res.status >= 400 && res.status < 500)) {
        return { profile: null, unauthorized: true, networkError: false };
      }
      if (res.ok) {
        const profile = profileFromApi<BootProfile>(await res.json());
        if (!isUserRole(profile?.role)) {
          return { profile: null, unauthorized: true, networkError: false };
        }
        return { profile, unauthorized: false, networkError: false };
      }
    } catch {
      // retry on network exception
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  return { profile: null, unauthorized: false, networkError: true };
}

function AppToastWrapper() {
  const { visible, type, title, description, durationMs, hide } = useToastStore();
  return <AppToast visible={visible} type={type} title={title} description={description} durationMs={durationMs} onDismiss={hide} />;
}

export default function RootLayout() {
  const [isClient, setIsClient] = useState(Platform.OS !== 'web');

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <RootLayoutInner />
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

function RootLayoutInner() {
  const { resolved, colors, ready: themeReady } = useTheme();
  const pathname = usePathname();
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname);
  const shouldBlockForFonts = Platform.OS !== 'web';
  const [fontsLoaded, fontError] = Font.useFonts({
    'Plus Jakarta Sans': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'Plus Jakarta Sans_500': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'Plus Jakarta Sans_700': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'Inter': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter_500': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter_700': require('../assets/fonts/Inter-Bold.ttf'),
    ...MaterialIcons.font,
  });
  const [fontsFallback, setFontsFallback] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) return;
    const timer = setTimeout(() => setFontsFallback(true), 5000);
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);
  const [showSplash, setShowSplash] = useState(Platform.OS !== 'web');
  const bootRef = useRef(false);

  const onSplashFinish = useCallback(() => {
    NativeSplash.hideAsync().catch(() => {});
    setShowSplash(false);
  }, []);

  const initialize = useCallback(async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);

      if (!storedToken) {
        useProfileStore.getState().clearProfile();
        if (!isAuthRoute) {
          router.replace('/login');
        }
        return;
      }

      let { profile } = await fetchProfile(storedToken);

      if (profile) {
        useProfileStore.setState({ profile, loading: false });

        if (!isAuthRoute) {
          if (profile.role === 'player' && profile.onboarding_completed === false) {
            router.replace('/onboarding');
          } else {
            router.replace(routeForRole(profile.role));
          }
        }
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        useProfileStore.getState().clearProfile();
        if (!isAuthRoute) {
          router.replace('/login');
        }
      }
    } catch {
      useProfileStore.getState().clearProfile();
      if (!isAuthRoute) {
        router.replace('/login');
      }
    }
  }, [isAuthRoute]);

  useEffect(() => {
    if (showSplash || !themeReady || bootRef.current) return;
    bootRef.current = true;
    initialize();
  }, [showSplash, themeReady, initialize]);

  if (shouldBlockForFonts && !fontsLoaded && !fontsFallback && !fontError) {
    return null;
  }

  return (
    <NavThemeProvider value={resolved === 'dark' ? DarkTheme : DefaultTheme}>
      <AppToastWrapper />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 250,
          contentStyle: { backgroundColor: colors.background },
        }}
        initialRouteName="login"
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="reset-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="change-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(owner)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(super-admin)" options={{ animation: 'fade' }} />
        <Stack.Screen name="venue-detail" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="booking/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="booking/payment/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="booking-success" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      </Stack>
      {showSplash && (
        <View style={styles.loadingOverlay}>
          <SplashScreen onFinish={onSplashFinish} />
        </View>
      )}
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});

