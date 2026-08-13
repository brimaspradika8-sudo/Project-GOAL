import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NativeSplash from 'expo-splash-screen';
import * as Font from 'expo-font';
import 'react-native-reanimated';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoadingScreen from '../components/LoadingScreen';
import SplashScreen from '../components/SplashScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';

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

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const fontLinkId = 'google-fonts-plus-jakarta';
  if (!document.getElementById(fontLinkId)) {
    const link = document.createElement('link');
    link.id = fontLinkId;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }
}

type BootProfile = Profile;

async function fetchProfile(token: string): Promise<{ profile: BootProfile | null; unauthorized: boolean }> {
  try {
    const res = await apiFetch('/me', { token, skipToken: true, timeout: 20000 });
    if (res.status === 401 || res.status === 403) {
      return { profile: null, unauthorized: true };
    }
    if (!res.ok) {
      return { profile: null, unauthorized: false };
    }
    const profile = profileFromApi<BootProfile>(await res.json());
    if (!isUserRole(profile?.role)) {
      return { profile: null, unauthorized: true };
    }
    return { profile, unauthorized: false };
  } catch {
    return { profile: null, unauthorized: false };
  }
}

function AppToastWrapper() {
  const { visible, type, title, description, durationMs, hide } = useToastStore();
  return <AppToast visible={visible} type={type} title={title} description={description} durationMs={durationMs} onDismiss={hide} />;
}

export default function RootLayout() {
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
    'material': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
  });
  const [fontsFallback, setFontsFallback] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) return;
    const timer = setTimeout(() => setFontsFallback(true), 5000);
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);
  const [showSplash, setShowSplash] = useState(Platform.OS !== 'web');
  const [booting, setBooting] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Memuat...');
  const bootRef = useRef(false);

  const onSplashFinish = useCallback(() => {
    NativeSplash.hideAsync().catch(() => {});
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (showSplash || !themeReady || bootRef.current) return;
    bootRef.current = true;

    const initialize = async () => {
      setLoadingMessage('Memeriksa sesi');

      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);

      if (storedToken) {
        setLoadingMessage('Memeriksa data profil');

        let { profile, unauthorized } = await fetchProfile(storedToken);

        if (!profile && !unauthorized) {
          setLoadingMessage('Koneksi terputus. Mencoba ulang...');
          await new Promise((r) => setTimeout(r, 1500));
          ({ profile, unauthorized } = await fetchProfile(storedToken));
        }

        if (profile) {
          useProfileStore.setState({ profile, loading: false });

          if (isAuthRoute) {
          } else if (profile.onboarding_completed === false) {
            router.replace('/onboarding');
          } else {
            router.replace(routeForRole(profile.role));
          }
        } else {
          if (unauthorized) {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            useProfileStore.getState().clearProfile();
          }
          if (!isAuthRoute) {
            router.replace('/login');
          }
        }
      } else {
        if (!isAuthRoute) {
          router.replace('/login');
        }
        useProfileStore.getState().clearProfile();
      }

      setLoadingMessage('Memuat...');
      setTimeout(() => setBooting(false), 150);
    };

    initialize();
  }, [showSplash, themeReady, isAuthRoute]);

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
        <Stack.Screen name="booking/payment/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="booking-confirmation" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="e-ticket" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="booking-flow" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="booking-waiting" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
        <Stack.Screen name="booking-payment" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="booking-success" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      </Stack>
      {(showSplash || booting) && (
        <View style={styles.loadingOverlay}>
          {showSplash ? (
            <SplashScreen onFinish={onSplashFinish} />
          ) : (
            <LoadingScreen message={loadingMessage} />
          )}
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
