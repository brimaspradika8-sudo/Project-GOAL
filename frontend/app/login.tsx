import React, { useState, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Pressable,
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView,
  Platform, ScrollView, Keyboard, useWindowDimensions
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingInput from '../components/FloatingInput';
import { useTheme } from '../lib/theme';
import { useAuthAnimations } from '../hooks/useAuthAnimations';
import { getErrorMessage } from '../lib/api';
import { apiFetch } from '../lib/apiClient';
import * as SecureStore from '../lib/secureStorage';
import { TOKEN_KEY } from '../lib/auth';
import { useProfileStore } from '../store/profileStore';
import { fieldError } from '../lib/formValidation';

const RATE_LIMIT_MS = 5000;
const lastAttemptRef = { current: 0 };
async function parseApiResponse(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

function getApiErrorMessage(data: any, status: number) {
  if (status === 401) return 'Email atau password salah.';
  if (status >= 500) return 'Server sedang tidak tersedia. Silakan coba lagi sebentar.';
  return getErrorMessage(data, 'Terjadi kesalahan sistem. Silakan coba lagi.');
}

function validateEmail(v: string): string {
  if (!v.trim()) return 'Email wajib diisi.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Format email tidak valid.';
  return '';
}

function validatePassword(v: string): string {
  if (!v) return 'Password wajib diisi.';
  return '';
}

export default function LoginScreen() {
  const { colors, resolved } = useTheme();
  const isDark = resolved === 'dark';
  const { width } = useWindowDimensions();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  
  const { fadeAnim, slideAnim, pulseAnim, bgScaleAnim } = useAuthAnimations();
  const messageAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const arrowTranslate = useRef(new Animated.Value(0)).current;

  const showMessage = (text: string, type: 'error' | 'success') => {
    setMessage({ text, type });
    messageAnim.setValue(0);
    Animated.timing(messageAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  function onEmailChange(v: string) { setEmail(v); setEmailError(fieldError(v, validateEmail(v), emailTouched)); }
  function onPasswordChange(v: string) { setPassword(v); setPasswordError(fieldError(v, validatePassword(v), passwordTouched)); }
  function onEmailBlur() { setEmailTouched(true); setEmailError(validateEmail(email)); }
  function onPasswordBlur() { setPasswordTouched(true); setPasswordError(validatePassword(password)); }

  async function signInWithEmail() {
    setEmailTouched(true);
    setPasswordTouched(true);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setMessage(null);
    Keyboard.dismiss();

    const now = Date.now();
    if (now - lastAttemptRef.current < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - (now - lastAttemptRef.current)) / 1000);
      showMessage(`Tunggu ${waitSec} detik sebelum mencoba lagi.`, 'error');
      return;
    }

    setLoading(true);
    lastAttemptRef.current = Date.now();

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        skipToken: true,
        body: { email: email.trim(), password },
      });
      const data = await parseApiResponse(res);

      if (!res.ok) {
        showMessage(getApiErrorMessage(data, res.status), 'error');
        setLoading(false);
        return;
      }

      if (data?.token) {
        await SecureStore.setItemAsync(TOKEN_KEY, data.token);

          const profileRes = await apiFetch('/me', { token: data.token });
          const profileData = await parseApiResponse(profileRes);

        if (profileRes.ok && profileData) {
          useProfileStore.setState({ profile: profileData, loading: false });

            if (profileData.onboarding_completed === false) {
              router.replace('/onboarding');
            } else if (profileData.role === 'super_admin') {
              router.replace('/(admin)/dashboard');
            } else {
              router.replace('/(tabs)');
            }
          } else {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            showMessage('Gagal memuat profil. Silakan coba login lagi.', 'error');
          }
        } else {
        showMessage('Gagal login. Silakan coba lagi.', 'error');
      }
    } catch {
      showMessage('Terjadi kesalahan sistem. Silakan coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={StyleSheet.absoluteFill}>
        {isDark ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#131313' }]} />
        ) : (
          <LinearGradient colors={['#F8FAFB', '#EDF1F3']} style={StyleSheet.absoluteFill} />
        )}
        
        <Animated.Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNgBJlBY97_QaewYW2r-DjSlc7y1DcxBuTyd2FT01aWpOMDdC6E5Ojftib57g020fqnyp0_maN4R5MEHbvA5mKvbvL62-rTz8r9ur1HeYAdQRNcHj2N8UkRNLsr6n30pKT8wvR2ALUnlrVoH30n83mprQd7LqD0c88IYJTTyGNiDVyADu8naOoqsrI2DdszdWsC6qGeg9DMNEPKErslJTkraaMEw-PLU4zYb0RM7Qzcqh4FeFxhc1IHMBcbbO-zGz4b_LtpTKBW06d' }}
          style={[styles.bgImage, { transform: [{ scale: bgScaleAnim }], opacity: isDark ? 0.3 : 0.05 }]}
          resizeMode="cover"
        />
        <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveWrapper}>

          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={[{ transform: [{ scale: pulseAnim }], marginBottom: 16 }]}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(31, 203, 139, 0.15)' : 'rgba(31, 203, 139, 0.1)' }]}>
                <MaterialIcons name="sports-soccer" size={64} color={isDark ? colors.primary : '#1FCB8B'} />
              </View>
            </Animated.View>
            <Text style={[styles.title, { color: isDark ? colors.primary : '#1FCB8B' }]}>GOAL</Text>
            <Text style={[styles.subtitle, { color: isDark ? colors.textSecondary : '#4B5563' }]}>Game Arena & Arena League</Text>
          </Animated.View>

          <Animated.View style={[
            styles.glassCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            isDark ? styles.glassCardDark : styles.glassCardLight
          ]}>
            {message && (
              <Animated.View style={[
                styles.messageBox,
                message.type === 'error' 
                  ? [styles.messageError, { backgroundColor: isDark ? colors.errorContainer : '#FEE2E2', borderLeftColor: isDark ? colors.error : '#DC2626' }] 
                  : [styles.messageSuccess, { backgroundColor: isDark ? colors.successLight : '#D1FAE5', borderLeftColor: isDark ? colors.success : '#10B981' }],
                { opacity: messageAnim, transform: [{ translateY: messageAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }
              ]}>
                <Text style={[styles.messageText, { color: message.type === 'error' && !isDark ? '#DC2626' : (message.type === 'success' && !isDark ? '#065F46' : colors.text) }]}>
                  {message.text}
                </Text>
              </Animated.View>
            )}

            <FloatingInput
              label="Email"
              value={email}
              onChangeText={onEmailChange}
              onBlur={onEmailBlur}
              keyboardType="email-address"
              error={emailError}
              colors={colors}
            />

            <FloatingInput
              label="Password"
              value={password}
              onChangeText={onPasswordChange}
              onBlur={onPasswordBlur}
              secureTextEntry={true}
              error={passwordError}
              colors={colors}
            />

            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }} />
              <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                <Text style={[styles.forgotText, { color: isDark ? colors.primary : '#1FCB8B' }]}>Lupa Password?</Text>
              </TouchableOpacity>
            </View>

            <Pressable
              onPressIn={() => Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start()}
              onHoverIn={() => Animated.spring(arrowTranslate, { toValue: 5, useNativeDriver: true }).start()}
              onHoverOut={() => Animated.spring(arrowTranslate, { toValue: 0, useNativeDriver: true }).start()}
              onPress={signInWithEmail}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScale }] }]}>
                {isDark ? (
                   <View style={[styles.buttonInner, { backgroundColor: loading ? colors.primaryMuted : colors.primary }]}>
                     {renderButtonContent()}
                   </View>
                ) : (
                   <LinearGradient
                     colors={loading ? ['#A7F3D0', '#6EE7B7'] : ['#1FCB8B', '#00D9A0']}
                     start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                     style={styles.buttonInner}
                   >
                     {renderButtonContent()}
                   </LinearGradient>
                )}
              </Animated.View>
            </Pressable>

          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={[styles.footerText, { color: isDark ? colors.textSecondary : '#4B5563' }]}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={[styles.footerLink, { color: isDark ? colors.primary : '#1FCB8B' }]}>Daftar Gratis</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  function renderButtonContent() {
    return loading ? (
      <ActivityIndicator color={isDark ? colors.onPrimary : '#FFFFFF'} />
    ) : (
      <View style={styles.buttonContent}>
        <Text style={[styles.buttonText, { color: isDark ? colors.onPrimary : '#FFFFFF' }]}>SIGN IN</Text>
        <Animated.View style={{ transform: [{ translateX: arrowTranslate }] }}>
          <MaterialIcons name="arrow-forward" size={22} color={isDark ? colors.onPrimary : '#FFFFFF'} style={{ marginLeft: 8 }} />
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 32px rgba(31, 203, 139, 0.2)' }
      : { shadowColor: '#1FCB8B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 32, elevation: 10 }
    ),
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  glassCard: {
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
  },
  glassCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255,255,255,0.8)',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.02)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.06, shadowRadius: 40, elevation: 10 }
    ),
  },
  glassCardDark: {
    backgroundColor: 'rgba(30,30,30,0.7)',
    borderColor: 'rgba(255,255,255,0.15)',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 15px 25px rgba(0,0,0,0.5)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.5, shadowRadius: 25, elevation: 10 }
    ),
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  buttonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 20px rgba(31, 203, 139, 0.25)' }
      : { shadowColor: '#1FCB8B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 6 }
    ),
  },
  buttonInner: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '800',
  },
  messageBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
  },
  messageError: {},
  messageSuccess: {},
  messageText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
