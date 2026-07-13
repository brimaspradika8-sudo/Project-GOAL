import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import LoadingScreen from '../components/LoadingScreen';
import SplashScreen from '../components/SplashScreen';
import * as Linking from 'expo-linking';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/api';
import { useProfileStore } from '../store/profileStore';

async function fetchProfile(accessToken: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getUrlParam(url: string, name: string) {
  const normalizedUrl = url.replace('#', '&');
  const match = normalizedUrl.match(new RegExp(`[?&]${name}=([^&]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function isRecoveryUrl(url: string): boolean {
  return url.includes('type=recovery') || url.includes('type=reset');
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Menyiapkan arena');
  const routingRef = useRef(false);
  const isRecoveryRef = useRef(false);

  const routeByProfile = async (accessToken: string) => {
    if (routingRef.current) return;
    routingRef.current = true;
    setLoadingMessage('Mengecek profil pemain');

    const profile = await fetchProfile(accessToken);
    useProfileStore.setState({ profile: profile ?? undefined, loading: false });
    router.replace('/(tabs)');
    setTimeout(() => {
      routingRef.current = false;
      setLoadingMessage('Menyiapkan arena');
    }, 250);
  };

  const routeToLogin = () => {
    isRecoveryRef.current = false;
    routingRef.current = true;
    setLoadingMessage('Membuka halaman login');
    router.replace('/login');

    setTimeout(() => {
      routingRef.current = false;
      setLoadingMessage('Menyiapkan arena');
    }, 250);
  };

  const handleDeepLink = async (url: string | null) => {
    if (!url) return;

    if (isRecoveryUrl(url)) {
      isRecoveryRef.current = true;
    }

    try {
      if (url.includes('access_token=')) {
        const accessToken = getUrlParam(url, 'access_token');
        const refreshToken = getUrlParam(url, 'refresh_token');
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      } else if (url.includes('code=')) {
        const code = getUrlParam(url, 'code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      }
    } catch (e) {
      console.error("Error extracting session from url:", e);
    }
  };

  const onSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (showSplash) return;

    let cancelled = false;

    const sub = Linking.addEventListener('url', (event) => {
      if (cancelled) return;
      const url = event.url;
      if (isRecoveryUrl(url)) {
        isRecoveryRef.current = true;
        router.replace('/reset-password');
        return;
      }
      handleDeepLink(url);
    });

    const initialize = async () => {
      setLoadingMessage('Membuka sesi');

      isRecoveryRef.current = false;

      // Check URL FIRST for recovery — before any session handling
      let currentUrl: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        currentUrl = window.location.href;
      }
      if (!currentUrl) {
        currentUrl = await Linking.getInitialURL();
      }
      if (cancelled) return;

      if (currentUrl && isRecoveryUrl(currentUrl)) {
        isRecoveryRef.current = true;
        try {
          const accessToken = getUrlParam(currentUrl, 'access_token');
          const refreshToken = getUrlParam(currentUrl, 'refresh_token');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          }
        } catch (e) {
          console.error('Error setting recovery session:', e);
        }
        if (cancelled) return;
        setIsReady(true);
        router.replace('/reset-password');
        return;
      }

      // Not a recovery — process deep link tokens if any
      if (currentUrl) {
        await handleDeepLink(currentUrl);
      }

      if (cancelled) return;

      const { data: { session } } = await supabase.auth.getSession();

      if (cancelled) return;
      if (session?.user) {
        await routeByProfile(session.access_token);
      } else {
        routeToLogin();
      }

      setIsReady(true);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      console.log('Auth event:', event);

      if (event === 'PASSWORD_RECOVERY') {
        isRecoveryRef.current = true;
        router.replace('/reset-password');
      } else if (event === 'SIGNED_OUT') {
        isRecoveryRef.current = false;
        useProfileStore.getState().clearProfile();
        routeToLogin();
      } else if (event === 'SIGNED_IN' && session) {
        if (isRecoveryRef.current) {
          router.replace('/reset-password');
          return;
        }

        const isRecovery = Platform.OS === 'web' && typeof window !== 'undefined' &&
          (window.location?.href?.includes('type=recovery') || window.location?.href?.includes('recovery'));

        if (isRecovery) {
          isRecoveryRef.current = true;
          router.replace('/reset-password');
        } else {
          routeByProfile(session.access_token);
        }
      }
    });

    return () => {
      cancelled = true;
      sub.remove();
      subscription.unsubscribe();
    };
  }, [showSplash]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {showSplash ? (
        <SplashScreen onFinish={onSplashFinish} />
      ) : (
        <>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="reset-password" />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(tabs)" />
          </Stack>
          {!isReady && (
            <View style={styles.loadingOverlay}>
              <LoadingScreen message={loadingMessage} />
            </View>
          )}
        </>
      )}
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});
