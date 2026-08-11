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
import { fieldError } from '../lib/formValidation';
import { useBreakpoint } from '../lib/responsive';
import AuthPromoPanel from '../components/AuthPromoPanel';
import { FONT_FAMILY } from '../components/goalTheme';

function regValidateName(v: string): string {
  if (!v.trim()) return 'Name is required.';
  if (v.trim().length > 255) return 'Name must be 255 characters or fewer.';
  return '';
}
function regValidateEmail(v: string): string {
  if (!v.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Invalid email format.';
  return '';
}
function regValidatePassword(v: string): string {
  if (!v) return 'Password is required.';
  if (v.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-z]/.test(v)) return 'Password must contain a lowercase letter.';
  if (!/[A-Z]/.test(v)) return 'Password must contain an uppercase letter.';
  if (!/[0-9]/.test(v)) return 'Password must contain a number.';
  return '';
}
function regValidateConfirm(v: string, password: string): string {
  if (!v) return 'Please confirm your password.';
  if (v !== password) return 'Passwords do not match!';
  return '';
}

export default function RegisterScreen() {
  const { colors, resolved } = useTheme();
  const isDark = resolved === 'dark';
  const { width, height } = useWindowDimensions();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === 'desktop';
  const desktopScale = isDesktop ? Math.max(0.78, Math.min(1.08, Math.min(width / 1440, height / 900))) : 1;
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  
  const [nameErr, setNameErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [confirmErr, setConfirmErr] = useState('');
  
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

  function onRegNameChange(v: string) { setName(v); setNameErr(fieldError(v, regValidateName(v), nameTouched)); }
  function onRegEmailChange(v: string) { setEmail(v); setEmailErr(fieldError(v, regValidateEmail(v), emailTouched)); }
  function onRegPasswordChange(v: string) {
    setPassword(v);
    setPasswordErr(fieldError(v, regValidatePassword(v), passwordTouched));
    if (confirmPassword) setConfirmErr(regValidateConfirm(confirmPassword, v));
  }
  function onRegConfirmChange(v: string) { setConfirmPassword(v); setConfirmErr(fieldError(v, regValidateConfirm(v, password), confirmTouched)); }

  function onRegNameBlur() { setNameTouched(true); setNameErr(regValidateName(name)); }
  function onRegEmailBlur() { setEmailTouched(true); setEmailErr(regValidateEmail(email)); }
  function onRegPasswordBlur() { setPasswordTouched(true); setPasswordErr(regValidatePassword(password)); }
  function onRegConfirmBlur() { setConfirmTouched(true); setConfirmErr(regValidateConfirm(confirmPassword, password)); }

  async function signUpWithEmail() {
    setNameTouched(true); setEmailTouched(true); setPasswordTouched(true); setConfirmTouched(true);
    const nErr = regValidateName(name);
    const eErr = regValidateEmail(email);
    const pErr = regValidatePassword(password);
    const cErr = regValidateConfirm(confirmPassword, password);
    setNameErr(nErr); setEmailErr(eErr); setPasswordErr(pErr); setConfirmErr(cErr);
    if (nErr || eErr || pErr || cErr) {
      showMessage('Please check your entries.', 'error');
      return;
    }

    setMessage(null);
    Keyboard.dismiss();
    setLoading(true);
    
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        skipToken: true,
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          password_confirmation: confirmPassword,
        },
      });
      const data = await res.json();

      if (res.ok) {
        showMessage('Registration successful! Please sign in.', 'success');
        setTimeout(() => router.replace('/login'), 1500);
      } else {
        showMessage(getErrorMessage(data, 'Registration failed.'), 'error');
      }
    } catch (err: any) {
      showMessage(err?.message || 'Something went wrong.', 'error');
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
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
        <View style={[styles.glowTopLeft, { backgroundColor: colors.primary, opacity: isDark ? 0.12 : 0.06 }]} />
        <View style={[styles.glowBottomRight, { backgroundColor: colors.primary, opacity: isDark ? 0.10 : 0.05 }]} />
        <View style={[styles.glowTopRight, { backgroundColor: colors.primary, opacity: isDark ? 0.08 : 0.04 }]} />
      </View>

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
            <Text style={[styles.subtitle, { color: isDark ? colors.textSecondary : '#4B5563' }]}>Join G.O.A.L and start playing.</Text>
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
            <Text style={[styles.cardTitle, isDesktop && { fontSize: 28 * desktopScale, marginBottom: 4 * desktopScale }, { color: isDark ? colors.text : '#111827' }]}>Create Account</Text>
            <Text style={[styles.cardSubtitle, isDesktop && { fontSize: 15 * desktopScale, marginBottom: 12 * desktopScale, lineHeight: 22 * desktopScale }, { color: isDark ? colors.textSecondary : '#6B7280' }]}>Sign up to book venues and play with friends.</Text>

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
              label="Full Name"
              value={name}
              onChangeText={onRegNameChange}
              onBlur={onRegNameBlur}
              autoCapitalize="words"
              error={nameErr}
              colors={colors}
              compact={isDesktop}
              icon={<MaterialIcons name="person-outline" size={20} color="#6B7280" />}
            />

            <FloatingInput
              label="Email"
              value={email}
              onChangeText={onRegEmailChange}
              onBlur={onRegEmailBlur}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              inputMode="email"
              error={emailErr}
              colors={colors}
              compact={isDesktop}
              icon={<MaterialIcons name="mail-outline" size={20} color="#6B7280" />}
            />

            <FloatingInput
              label="Password"
              value={password}
              onChangeText={onRegPasswordChange}
              onBlur={onRegPasswordBlur}
              secureTextEntry={true}
              autoComplete="new-password"
              textContentType="newPassword"
              error={passwordErr}
              colors={colors}
              compact={isDesktop}
              icon={<MaterialIcons name="lock-outline" size={20} color="#6B7280" />}
            />

            <FloatingInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={onRegConfirmChange}
              onBlur={onRegConfirmBlur}
              secureTextEntry={true}
              autoComplete="new-password"
              textContentType="newPassword"
              error={confirmErr}
              colors={colors}
              compact={isDesktop}
              icon={<MaterialIcons name="lock-outline" size={20} color="#6B7280" />}
            />

            <Pressable
              onPressIn={() => Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start()}
              onHoverIn={() => Animated.spring(arrowTranslate, { toValue: 5, useNativeDriver: true }).start()}
              onHoverOut={() => Animated.spring(arrowTranslate, { toValue: 0, useNativeDriver: true }).start()}
              onPress={signUpWithEmail}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              <Animated.View style={[styles.buttonWrapper, isDesktop && { borderRadius: 14 * desktopScale }, { opacity: buttonFade, transform: [{ scale: buttonScale }, { translateY: buttonSlide }] }]}>
                {isDark ? (
                   <View style={[styles.buttonInner, isDesktop && { height: 52 * desktopScale }, { backgroundColor: loading ? colors.primaryMuted : colors.primary }]}>
                     {renderButtonContent()}
                   </View>
                ) : (
                   <LinearGradient
                     colors={loading ? ['#A7F3D0', '#6EE7B7'] : ['#1FCB8B', '#00D9A0']}
                     start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                       style={[styles.buttonInner, isDesktop && { height: 52 * desktopScale }]}
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
              <Text style={[styles.footerText, { color: isDark ? colors.textSecondary : '#4B5563' }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={[styles.footerLink, { color: isDark ? colors.primary : '#10B981' }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          </View>
        </View>
      </ScrollView>

    </KeyboardAvoidingView>
  );

  function renderButtonContent() {
    return loading ? (
      <ActivityIndicator color={isDark ? colors.onPrimary : '#FFFFFF'} />
    ) : (
      <View style={styles.buttonContent}>
        <Text style={[styles.buttonText, { color: isDark ? colors.onPrimary : '#FFFFFF' }]}>SIGN UP</Text>
        <Animated.View style={{ transform: [{ translateX: arrowTranslate }] }}>
          <MaterialIcons name="arrow-forward" size={20} color={isDark ? colors.onPrimary : '#FFFFFF'} style={{ marginLeft: 8 }} />
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
    width: 90,
    height: 90,
    borderRadius: 45,
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

