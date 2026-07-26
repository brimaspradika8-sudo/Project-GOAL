import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NativeSplash from 'expo-splash-screen';
import * as Font from 'expo-font';
import 'react-native-reanimated';
import { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoadingScreen from '../components/LoadingScreen';
import SplashScreen from '../components/SplashScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { API_BASE_URL, DEFAULT_HEADERS } from '../lib/api';
import { useProfileStore } from '../store/profileStore';
import { ToastProvider } from '../components/Toast';
import { ThemeProvider, useTheme } from '../lib/theme';
import AppToast from '../components/shared/AppToast';
import { useToastStore } from '../store/toastStore';

import { Platform } from 'react-native';
import { TOKEN_KEY } from '../lib/auth';

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

async function fetchProfile(token: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${API_BASE_URL}/me`, {
      headers: {
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
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
  const colorScheme = useColorScheme();
  const { resolved, colors } = useTheme();
  const [fontsLoaded] = Font.useFonts({
    'Plus Jakarta Sans': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakarta Sans_500': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakarta Sans_700': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'Inter': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter_500': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter_700': require('../assets/fonts/Inter-Bold.ttf'),
    MaterialIcons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
  });
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Memuat...');
  const routingRef = useRef(false);

  const routeToLogin = useCallback(() => {
    routingRef.current = true;
    setLoadingMessage('Mengarahkan ke halaman masuk');
    router.replace('/login');
    setTimeout(() => {
      routingRef.current = false;
      setLoadingMessage('Memuat...');
    }, 250);
  }, []);

  const routeByProfile = useCallback(async (token: string) => {
    if (routingRef.current) return;
    routingRef.current = true;
    setLoadingMessage('Memeriksa data profil');

    const profile = await fetchProfile(token);

    if (!profile) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      useProfileStore.getState().clearProfile();
      routeToLogin();
      return;
    }

    useProfileStore.setState({ profile, loading: false });

    if (profile.onboarding_completed === false) {
      router.replace('/onboarding');
    } else if (profile.role === 'super_admin') {
      router.replace('/(admin)/dashboard');
    } else {
      router.replace('/(tabs)');
    }
    setTimeout(() => {
      routingRef.current = false;
      setLoadingMessage('Memuat...');
    }, 250);
  }, [routeToLogin]);

  const onSplashFinish = useCallback(() => {
    NativeSplash.hideAsync().catch(() => {});
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (showSplash) return;

    const initialize = async () => {
      setLoadingMessage('Memeriksa sesi');

      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        const profile = await fetchProfile(storedToken);
        if (profile) {
          useProfileStore.setState({ profile, loading: false });
          if (profile.onboarding_completed === false) {
            router.replace('/onboarding');
          } else if (profile.role === 'super_admin') {
            router.replace('/(admin)/dashboard');
          } else {
            router.replace('/(tabs)');
          }
        } else {
          await AsyncStorage.removeItem(TOKEN_KEY);
          routeToLogin();
        }
      } else {
        routeToLogin();
      }

      setIsReady(true);
    };

    initialize();
  }, [showSplash, routeByProfile, routeToLogin]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavThemeProvider value={resolved === 'dark' ? DarkTheme : DefaultTheme}>
      <ToastProvider />
      <AppToastWrapper />
      {showSplash ? (
        <SplashScreen onFinish={onSplashFinish} />
      ) : (
        <>
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
            <Stack.Screen name="venue-detail" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="booking" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="e-ticket" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
          </Stack>
          {!isReady && (
            <View style={styles.loadingOverlay}>
              <LoadingScreen message={loadingMessage} />
            </View>
          )}
        </>
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
