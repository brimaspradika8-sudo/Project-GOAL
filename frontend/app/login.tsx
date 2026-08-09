import React, { useState, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Pressable,
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView,
  Platform, ScrollView, Keyboard, useWindowDimensions,
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
import { useBreakpoint } from '../lib/responsive';
import AuthPromoPanel from '../components/AuthPromoPanel';
import ThemeToggle from '../components/ThemeToggle';
import { FONT_FAMILY } from '../components/goalTheme';

const RATE_LIMIT_MS = 5000;
const lastAttemptRef = { current: 0 };

async function parseApiResponse(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

function getApiErrorMessage(data: any, status: number) {
  if (status === 401) return 'Invalid email or password.';
  if (status >= 500) return 'Server is temporarily unavailable. Please try again in a moment.';
  return getErrorMessage(data, 'Something went wrong. Please try again.');
}

function validateEmail(v: string): string {
  if (!v.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Invalid email format.';
  return '';
}

function validatePassword(v: string): string {
  if (!v) return 'Password is required.';
  return '';
}

export default function LoginScreen() {
  const { colors, resolved } = useTheme();
  const isDark = resolved === 'dark';
  const { width, height } = useWindowDimensions();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === 'desktop';
  const desktopScale = isDesktop ? Math.max(0.78, Math.min(1.08, Math.min(width / 1440, height / 900))) : 1;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const { headerFade, headerSlide, cardFade, cardSlide, buttonFade, buttonSlide, pulseAnim } = useAuthAnimations();
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
      showMessage(`Please wait ${waitSec} seconds before trying again.`, 'error');
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
          } else if (profileData.role === 'owner') {
            router.replace('/(owner)');
          } else {
            router.replace('/(tabs)');
          }
        } else {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          showMessage('Failed to load your profile. Please log in again.', 'error');
        }
      } else {
        showMessage('Login failed. Please try again.', 'error');
      }
    } catch {
      showMessage('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const renderBackground = () => (
    <View style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
      <View style={[styles.glowTopLeft, { backgroundColor: colors.primary, opacity: isDark ? 0.12 : 0.06 }]} />
      <View style={[styles.glowBottomRight, { backgroundColor: colors.primary, opacity: isDark ? 0.10 : 0.05 }]} />
      <View style={[styles.glowTopRight, { backgroundColor: colors.primary, opacity: isDark ? 0.08 : 0.04 }]} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {renderBackground()}

      <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]} showsVerticalScrollIndicator={false}>
          <View style={[styles.pageLayout, isDesktop && styles.desktopPageLayout]}>
            {isDesktop && <AuthPromoPanel />}
            <View style={isDesktop ? styles.desktopFormColumn : styles.responsiveWrapper}>
          <Animated.View style={[styles.header, isDesktop && { marginBottom: 20 * desktopScale }, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
            <Animated.View style={[{ transform: [{ scale: pulseAnim }], marginBottom: 12 * desktopScale }]}> 
              <View style={[styles.iconWrapper, { width: 88 * desktopScale, height: 88 * desktopScale, borderRadius: 44 * desktopScale, backgroundColor: isDark ? 'rgba(31, 203, 139, 0.15)' : 'rgba(31, 203, 139, 0.1)' }]}> 
                <MaterialIcons name="sports-soccer" size={56 * desktopScale} color={isDark ? colors.primary : '#1FCB8B'} />
              </View>
            </Animated.View>
            <Text style={[styles.title, { fontSize: Math.min(48, width * 0.13) * desktopScale, color: isDark ? colors.primary : '#1FCB8B' }]}>G.O.A.L</Text>
            <Text style={[styles.subtitle, { color: isDark ? colors.textSecondary : '#4B5563' }]}>Find, compare, and book your favorite sports venues.</Text>
          </Animated.View>

          <Animated.View style={[
            styles.authCard,
            isDesktop && { padding: 28 * desktopScale, borderRadius: 32 * desktopScale, width: '100%', maxWidth: 440, alignSelf: 'center' },
            isDark && {
              backgroundColor: colors.surfaceWhite,
              borderColor: colors.borderSubtle,
              ...(Platform.OS === 'web'
                ? { boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)' }
                : { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 12 }
              ),
            },
            { opacity: cardFade, transform: [{ translateY: cardSlide }] },
          ]}>
            <Text style={[styles.cardTitle, isDesktop && { fontSize: 28 * desktopScale, marginBottom: 4 * desktopScale }, { color: isDark ? colors.text : '#111827' }]}>Sign In</Text>
            <Text style={[styles.cardSubtitle, isDesktop && { fontSize: 15 * desktopScale, marginBottom: 12 * desktopScale, lineHeight: 22 * desktopScale }, { color: isDark ? colors.textSecondary : '#6B7280' }]}>Continue booking your favorite venues, anytime, anywhere.</Text>

            {message && (
              <Animated.View style={[
                styles.messageBox,
                message.type === 'error'
                  ? [styles.messageError, { backgroundColor: isDark ? colors.errorContainer : '#FEE2E2', borderLeftColor: isDark ? colors.error : '#DC2626' }]
                  : [styles.messageSuccess, { backgroundColor: isDark ? colors.successLight : '#D1FAE5', borderLeftColor: isDark ? colors.success : '#10B981' }],
                { opacity: messageAnim, transform: [{ translateY: messageAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
              ]}>
                <Text style={[styles.messageText, { color: isDark ? (message.type === 'error' ? colors.error : colors.success) : (message.type === 'error' ? '#991B1B' : '#065F46') }]}>
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
              autoComplete="email"
              textContentType="emailAddress"
              inputMode="email"
              error={emailError}
              colors={colors}
              compact={isDesktop}
              icon={<MaterialIcons name="mail-outline" size={20} color="#6B7280" />}
            />

            <FloatingInput
              label="Password"
              value={password}
              onChangeText={onPasswordChange}
              onBlur={onPasswordBlur}
              secureTextEntry={true}
              autoComplete="current-password"
              textContentType="password"
              error={passwordError}
              colors={colors}
              compact={isDesktop}
              icon={<MaterialIcons name="lock-outline" size={20} color="#6B7280" />}
            />

            <View style={[styles.rowBetween, isDesktop && { marginBottom: 14 * desktopScale }]}>
              <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                <Text style={[styles.forgotText, { color: isDark ? colors.text : colors.textSecondary }]}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <Pressable
              onPressIn={() => Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start()}
              onHoverIn={() => Animated.spring(arrowTranslate, { toValue: 5, useNativeDriver: true }).start()}
              onHoverOut={() => Animated.spring(arrowTranslate, { toValue: 0, useNativeDriver: true }).start()}
              onPress={signInWithEmail}
              disabled={loading}
              style={{ marginTop: 6 }}
            >
              <Animated.View style={[styles.buttonWrapper, { opacity: buttonFade, transform: [{ scale: buttonScale }, { translateY: buttonSlide }] }]}>
                {isDark ? (
                  <View style={[styles.buttonInner, isDesktop && { height: 52 * desktopScale, borderRadius: 14 * desktopScale }, { backgroundColor: loading ? colors.primaryMuted : colors.primary }]}>
                    {renderButtonContent()}
                  </View>
                ) : (
                  <LinearGradient
                    colors={loading ? ['#A7F3D0', '#6EE7B7'] : ['#1FCB8B', '#00D9A0']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.buttonInner, isDesktop && { height: 52 * desktopScale, borderRadius: 14 * desktopScale }]}
                  >
                    {renderButtonContent()}
                  </LinearGradient>
                )}
              </Animated.View>
            </Pressable>

            <View style={[styles.dividerRow, isDesktop && { marginTop: 18 * desktopScale, marginBottom: 14 * desktopScale }]}>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? colors.divider : '#E5E7EB' }]} />
              <Text style={[styles.dividerText, { color: isDark ? colors.textTertiary : '#9CA3AF' }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? colors.divider : '#E5E7EB' }]} />
            </View>

            <View style={styles.createAccountRow}>
              <Text style={[styles.footerText, { color: isDark ? colors.textSecondary : '#4B5563' }]}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={[styles.footerLink, { color: isDark ? colors.primary : '#10B981' }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.themeToggleWrap}>
        <ThemeToggle variant="button" />
      </View>
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
    ...(Platform.OS === 'web' ? ({ minHeight: '100vh', width: '100%', overflow: 'hidden' } as any) : {}),
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  glowTopLeft: {
    position: 'absolute',
    top: -160,
    left: -140,
    width: 420,
    height: 420,
    borderRadius: 210,
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: -180,
    right: -140,
    width: 460,
    height: 460,
    borderRadius: 230,
  },
  glowTopRight: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  themeToggleWrap: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 50,
  },
  desktopScrollContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ minHeight: '100vh' } as any) : {}),
  },
  pageLayout: {
    width: '100%',
    alignItems: 'center',
  },
  desktopPageLayout: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
  },
  desktopFormColumn: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: FONT_FAMILY,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 8,
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.08, shadowRadius: 30, elevation: 8 }
    ),
  },
  cardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
    color: '#6B7280',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  forgotText: {
    fontFamily: FONT_FAMILY,
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
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  createAccountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 2,
  },
  footerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '500',
  },
  footerLink: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
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
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '500',
  },
});

