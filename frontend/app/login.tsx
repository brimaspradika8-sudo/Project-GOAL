import React, { useState, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView,
  Platform, ScrollView, Keyboard
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FloatingInput from '../components/FloatingInput';
import { AUTH_DARK_COLORS } from '../lib/theme';
import { useAuthAnimations } from '../hooks/useAuthAnimations';
import { API_BASE_URL, getErrorMessage, DEFAULT_HEADERS } from '../lib/api';
import * as SecureStore from '../lib/secureStorage';
import { TOKEN_KEY } from '../lib/auth';
import { useProfileStore } from '../store/profileStore';
import { fieldError } from '../lib/formValidation';

const RATE_LIMIT_MS = 5000;
const lastAttemptRef = { current: 0 };
async function parseApiResponse(res: Response) {
  const text = await res.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getApiErrorMessage(data: any, status: number) {
  if (status === 401) {
    return 'Email atau password salah.';
  }

  if (status >= 500) {
    return 'Server sedang tidak tersedia. Silakan coba lagi sebentar.';
  }

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

  function onEmailChange(v: string) {
    setEmail(v);
    setEmailError(fieldError(v, validateEmail(v), emailTouched));
  }

  function onPasswordChange(v: string) {
    setPassword(v);
    setPasswordError(fieldError(v, validatePassword(v), passwordTouched));
  }

  function onEmailBlur() {
    setEmailTouched(true);
    setEmailError(validateEmail(email));
  }

  function onPasswordBlur() {
    setPasswordTouched(true);
    setPasswordError(validatePassword(password));
  }

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
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await parseApiResponse(res);

      if (!res.ok) {
        showMessage(getApiErrorMessage(data, res.status), 'error');
        setLoading(false);
        return;
      }

        if (data?.token) {
          await SecureStore.setItemAsync(TOKEN_KEY, data.token);

          const profileRes = await fetch(`${API_BASE_URL}/me`, {
            headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${data.token}` },
          });
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
      <StatusBar style="light" />

      <View style={StyleSheet.absoluteFill}>
        <Animated.Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNgBJlBY97_QaewYW2r-DjSlc7y1DcxBuTyd2FT01aWpOMDdC6E5Ojftib57g020fqnyp0_maN4R5MEHbvA5mKvbvL62-rTz8r9ur1HeYAdQRNcHj2N8UkRNLsr6n30pKT8wvR2ALUnlrVoH30n83mprQd7LqD0c88IYJTTyGNiDVyADu8naOoqsrI2DdszdWsC6qGeg9DMNEPKErslJTkraaMEw-PLU4zYb0RM7Qzcqh4FeFxhc1IHMBcbbO-zGz4b_LtpTKBW06d' }}
          style={[styles.bgImage, { transform: [{ scale: bgScaleAnim }] }]}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveWrapper}>

          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={[{ transform: [{ scale: pulseAnim }], marginBottom: 12 }, Platform.OS === 'web' ? { boxShadow: '0 0 20px rgba(75,226,119,0.6)' } : { shadowColor: '#4be277', shadowOpacity: 0.6, shadowRadius: 20, elevation: 15 }]}>
              <MaterialIcons name="sports-soccer" size={72} color="#4be277" />
            </Animated.View>
            <Text style={styles.title}>GOAL</Text>
            <Text style={styles.subtitle}>Game Arena & Arena League</Text>
          </Animated.View>

          <Animated.View style={[styles.glassCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {message && (
              <Animated.View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess, { opacity: messageAnim, transform: [{ translateY: messageAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
                <Text style={styles.messageText}>{message.text}</Text>
              </Animated.View>
            )}

            <FloatingInput
              label="Email"
              value={email}
              onChangeText={onEmailChange}
              onBlur={onEmailBlur}
              keyboardType="email-address"
              error={emailError}
              colors={AUTH_DARK_COLORS}
            />

            <FloatingInput
              label="Password"
              value={password}
              onChangeText={onPasswordChange}
              onBlur={onPasswordBlur}
              secureTextEntry={true}
              error={passwordError}
              colors={AUTH_DARK_COLORS}
            />

            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }} />
              <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                <Text style={styles.forgotText}>Lupa Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={signInWithEmail}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0e2a14" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>SIGN IN</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#005321" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.footerLink}>Daftar Gratis</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  bgImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  title: {
    fontSize: 56,
    fontWeight: '900',
    color: '#4be277',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 2,
    ...(Platform.OS === 'web'
      ? { textShadow: '0px 2px 10px rgba(75,226,119,0.4)' }
      : { textShadowColor: 'rgba(75, 226, 119, 0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }
    ),
  },
  subtitle: {
    fontSize: 18,
    color: '#bccbb9',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(30,30,30,0.7)',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
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
    color: '#4be277',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  button: {
    backgroundColor: '#4be277',
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 6px 12px rgba(75,226,119,0.4)' }
      : { shadowColor: '#4be277', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }
    ),
  },
  buttonDisabled: {
    backgroundColor: '#2a8b46',
    ...(Platform.OS === 'web'
      ? { boxShadow: 'none' }
      : { shadowOpacity: 0, elevation: 0 }
    ),
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#002109',
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
    color: '#bccbb9',
    fontSize: 16,
  },
  footerLink: {
    color: '#4be277',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageBox: {
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  messageError: {
    backgroundColor: '#3a0d10',
    borderLeftWidth: 4,
    borderLeftColor: '#ffb4ab',
  },
  messageSuccess: {
    backgroundColor: '#0a2614',
    borderLeftWidth: 4,
    borderLeftColor: '#4be277',
  },
  messageText: {
    color: '#e5e2e1',
    fontSize: 15,
  },
});
