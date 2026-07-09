import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import LoadingScreen from '../components/LoadingScreen';
import * as Linking from 'expo-linking';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '../lib/supabase';

export const unstable_settings = {
  anchor: '(tabs)',
};

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

async function fetchProfile(accessToken: string) {
  try {
    const res = await fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  const segments = useSegments();

  // URL Handler for Supabase Session (handling deep links & PKCE codes)
  const handleDeepLink = async (url: string | null) => {
    if (!url) return;
    
    try {
      console.log('--- Checking deep link URL:', url, '---');
      
      // Jika flow lama (Implicit Flow) menghasilkan access_token di URL
      if (url.includes('access_token=')) {
        console.log('=> Menemukan access_token di URL');
        const matchAccessToken = url.match(/access_token=([^&]*)/);
        const matchRefreshToken = url.match(/refresh_token=([^&]*)/);
        
        if (matchAccessToken && matchRefreshToken) {
          await supabase.auth.setSession({
            access_token: matchAccessToken[1],
            refresh_token: matchRefreshToken[1],
          });
          console.log('=> Sukses memuat sesi dari access_token');
        }
      } 
      // Jika flow baru (PKCE Flow) menghasilkan code di URL
      else if (url.includes('code=')) {
        console.log('=> Menemukan auth code (PKCE) di URL');
        const matchCode = url.match(/code=([^&]*)/);
        
        if (matchCode) {
          let code = matchCode[1];
          // Hapus karakter tambahan seperti hash jika menempel
          code = code.split('#')[0];
          
          await supabase.auth.exchangeCodeForSession(code);
          console.log('=> Sukses menukar kode PKCE dengan sesiaktif');
        }
      }
    } catch (e) {
      console.error("Error extracting session from url:", e);
    }
  };

  useEffect(() => {
    // 1. Ekstrak params jika aplikasi dibuka lewat link email
    const sub = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Cek juga window.location di platform web apabila url event terlewat
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
       handleDeepLink(window.location.href);
    }

    // 2. Cek sesi saat aplikasi dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsReady(true);
    });

    // 3. Dengarkan perubahan status auth (login, logout, token refresh)
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
          // Check onboarding status on every sign-in (async IIFE)
          ;(async () => {
            const profile = await fetchProfile(session.access_token);
            if (!profile?.onboarding_completed) {
              router.replace('/onboarding' as any);
            } else {
              router.replace('/(tabs)');
            }
          })();
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
        // Check onboarding before routing away from auth pages
        supabase.auth.getSession().then(async ({ data: { session: s } }) => {
          if (!s) return;
          const profile = await fetchProfile(s.access_token);
          if (!profile?.onboarding_completed) {
            router.replace('/onboarding' as any);
          } else {
            router.replace('/(tabs)');
          }
        });
      }
    } else if (!session?.user && !inAuthGroup && !inOnboarding) {
      if (segments[0] !== undefined) {
         router.replace('/login');
      }
    } else if (!session?.user && inOnboarding) {
      // Not logged in on onboarding? Send to login.
      router.replace('/login');
    }
  }, [session, segments, isReady]);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        {/* gestureEnabled: false prevents swipe-back to bypass onboarding */}
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

