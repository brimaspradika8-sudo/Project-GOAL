import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import LoadingScreen from '../components/LoadingScreen';
import * as Linking from 'expo-linking';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/api';

export const unstable_settings = {
  anchor: '(tabs)',
};

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
  } catch {
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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Menyiapkan arena');
  const [session, setSession] = useState<any>(null);
  const segments = useSegments();
  const routingRef = useRef(false);

  const routeByProfile = async (accessToken: string) => {
    if (routingRef.current) return;
    routingRef.current = true;
    setIsRouting(true);
    setLoadingMessage('Mengecek profil pemain');

    const profile = await fetchProfile(accessToken);
    if (!profile?.onboarding_completed) {
      router.replace('/onboarding' as any);
    } else {
      router.replace('/(tabs)');
    }

    setTimeout(() => {
      routingRef.current = false;
      setIsRouting(false);
      setLoadingMessage('Menyiapkan arena');
    }, 250);
  };

  const routeToLogin = () => {
    if (routingRef.current) return;
    routingRef.current = true;
    setIsRouting(true);
    setLoadingMessage('Membuka halaman login');
    router.replace('/login');

    setTimeout(() => {
      routingRef.current = false;
      setIsRouting(false);
      setLoadingMessage('Menyiapkan arena');
    }, 250);
  };

  const handleDeepLink = async (url: string | null) => {
    if (!url) return;

    try {
      console.log('--- Checking deep link URL:', url, '---');

      if (url.includes('access_token=')) {
        console.log('=> Menemukan access_token di URL');
        const accessToken = getUrlParam(url, 'access_token');
        const refreshToken = getUrlParam(url, 'refresh_token');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          console.log('=> Sukses memuat sesi dari access_token');
        }
      } else if (url.includes('code=')) {
        console.log('=> Menemukan auth code (PKCE) di URL');
        const code = getUrlParam(url, 'code');

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          console.log('=> Sukses menukar kode PKCE dengan sesiaktif');
        }
      }
    } catch (e) {
      console.error("Error extracting session from url:", e);
    }
  };

  useEffect(() => {
    const sub = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    const initializeSession = async () => {
      setLoadingMessage('Membuka sesi');

      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleDeepLink(initialUrl);
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        await handleDeepLink(window.location.href);
      }

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsReady(true);
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      setSession(session);

      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password');
      } else if (event === 'SIGNED_IN' && session) {
        const isRecovery = Platform.OS === 'web' && typeof window !== 'undefined' &&
          (window.location?.href?.includes('type=recovery') || window.location?.href?.includes('recovery'));

        if (isRecovery) {
          router.replace('/reset-password');
        } else {
          routeByProfile(session.access_token);
        }
      }
    });

    return () => {
      sub.remove();
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup =
      segments[0] === 'login' ||
      segments[0] === 'register' ||
      segments[0] === 'forgot-password' ||
      segments[0] === 'reset-password';

    const inOnboarding = (segments[0] as string) === 'onboarding';

    if (session?.user && inAuthGroup) {
      const isRecovery = Platform.OS === 'web' && typeof window !== 'undefined' &&
          (window.location?.href?.includes('type=recovery') || window.location?.href?.includes('recovery') || window.location?.pathname?.includes('reset-password'));

      if (!isRecovery && segments[0] !== 'reset-password') {
        routeByProfile(session.access_token);
      }
    } else if (!session?.user && !inAuthGroup && !inOnboarding) {
      if (segments[0] !== undefined) {
         routeToLogin();
      }
    } else if (!session?.user && inOnboarding) {
      routeToLogin();
    }
  }, [session, segments, isReady]);

  if (!isReady || isRouting) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
