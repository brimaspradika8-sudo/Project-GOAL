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

function fpValidateEmail(v: string): string {
  if (!v.trim()) return 'Email wajib diisi.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Format email tidak valid.';
  return '';
}

export default function ForgotPasswordScreen() {
  const { colors, resolved } = useTheme();
  const isDark = resolved === 'dark';
  const { width } = useWindowDimensions();
  
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [emailSent, setEmailSent] = useState(false);

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

  function onFpEmailChange(v: string) { setEmail(v); setEmailError(fieldError(v, fpValidateEmail(v), emailTouched)); }
  function onFpEmailBlur() { setEmailTouched(true); setEmailError(fpValidateEmail(email)); }

  async function handleSend() {
    setEmailTouched(true);
    const eErr = fpValidateEmail(email);
    setEmailError(eErr);
    if (eErr) {
      showMessage('Periksa kembali email Anda.', 'error');
      return;
    }

    setMessage(null);
    Keyboard.dismiss();
    setLoading(true);
    
    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        skipToken: true,
        body: { email: email.trim() },
      });
      const data = await res.json();

      if (!res.ok) {
        showMessage(getErrorMessage(data, 'Gagal mengirim tautan reset.'), 'error');
        setLoading(false);
        return;
      }

      setEmailSent(true);
    } catch {
      showMessage('Terjadi kesalahan sistem. Silakan coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const renderBackground = () => (
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
  );

  const renderMessage = () => {
    if (!message) return null;
    return (
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
    );
  };

  if (emailSent) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {renderBackground()}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.responsiveWrapper}>
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Animated.View style={[{ transform: [{ scale: pulseAnim }], marginBottom: 16 }]}>
                <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(31, 203, 139, 0.15)' : 'rgba(31, 203, 139, 0.1)' }]}>
                  <MaterialIcons name="mark-email-read" size={56} color={isDark ? colors.primary : '#1FCB8B'} />
                </View>
              </Animated.View>
              <Text style={[styles.title, { fontSize: Math.min(48, width * 0.13), color: isDark ? colors.primary : '#1FCB8B' }]}>TERKIRIM!</Text>
              <Text style={[styles.subtitle, { color: isDark ? colors.textSecondary : '#4B5563' }]}>Tautan reset password telah dikirim ke</Text>
              <Text style={[styles.emailHighlight, { color: isDark ? colors.primary : '#1FCB8B' }]} numberOfLines={1} ellipsizeMode="tail">{email}</Text>
            </Animated.View>

            <Animated.View style={[
              styles.glassCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              isDark ? styles.glassCardDark : styles.glassCardLight
            ]}>
              {renderMessage()}

              <View style={[styles.sentIconWrap, { backgroundColor: isDark ? colors.primaryContainer : '#ECFDF5', borderColor: isDark ? colors.primaryMuted : '#A7F3D0' }]}>
                <MaterialIcons name="email" size={40} color={isDark ? colors.primary : '#10B981'} />
              </View>

              <Text style={[styles.sentDesc, { color: isDark ? colors.textTertiary : '#6B7280' }]}>
                Buka aplikasi email Anda dan cari tautan untuk mengatur ulang password. Jika tidak ada di inbox, cek folder spam atau junk.
              </Text>

              <Pressable
                onPressIn={() => Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start()}
                onHoverIn={() => Animated.spring(arrowTranslate, { toValue: 5, useNativeDriver: true }).start()}
                onHoverOut={() => Animated.spring(arrowTranslate, { toValue: 0, useNativeDriver: true }).start()}
                onPress={handleSend}
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScale }] }]}>
                  {isDark ? (
                     <View style={[styles.buttonInner, { backgroundColor: loading ? colors.primaryMuted : colors.primary }]}>
                       {loading ? <ActivityIndicator color={colors.onPrimary} /> : (
                         <View style={styles.buttonContent}>
                           <MaterialIcons name="refresh" size={20} color={colors.onPrimary} style={{ marginRight: 8 }} />
                           <Text style={[styles.buttonText, { color: colors.onPrimary }]}>KIRIM ULANG</Text>
                         </View>
                       )}
                     </View>
                  ) : (
                     <LinearGradient
                       colors={loading ? ['#A7F3D0', '#6EE7B7'] : ['#1FCB8B', '#00D9A0']}
                       start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                       style={styles.buttonInner}
                     >
                       {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                         <View style={styles.buttonContent}>
                           <MaterialIcons name="refresh" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                           <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>KIRIM ULANG</Text>
                         </View>
                       )}
                     </LinearGradient>
                  )}
                </Animated.View>
              </Pressable>
            </Animated.View>

            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
              <TouchableOpacity onPress={() => router.push('/login')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="arrow-back" size={16} color={isDark ? colors.primary : '#1FCB8B'} style={{ marginRight: 4 }} />
                <Text style={[styles.footerLink, { color: isDark ? colors.primary : '#1FCB8B' }]}>Kembali ke Login</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {renderBackground()}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveWrapper}>
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={[{ transform: [{ scale: pulseAnim }], marginBottom: 16 }]}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(31, 203, 139, 0.15)' : 'rgba(31, 203, 139, 0.1)' }]}>
                <MaterialIcons name="lock-reset" size={56} color={isDark ? colors.primary : '#1FCB8B'} />
              </View>
            </Animated.View>
            <Text style={[styles.title, { fontSize: Math.min(48, width * 0.13), color: isDark ? colors.primary : '#1FCB8B' }]}>RESET</Text>
            <Text style={[styles.subtitle, { color: isDark ? colors.textSecondary : '#4B5563' }]}>Masukkan email Anda dan kami akan mengirimkan tautan untuk reset password.</Text>
          </Animated.View>

          <Animated.View style={[
            styles.glassCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            isDark ? styles.glassCardDark : styles.glassCardLight
          ]}>
            {renderMessage()}

            <FloatingInput
              label="Email"
              value={email}
              onChangeText={onFpEmailChange}
              onBlur={onFpEmailBlur}
              keyboardType="email-address"
              error={emailError}
              colors={colors}
            />

            <Pressable
              onPressIn={() => Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start()}
              onHoverIn={() => Animated.spring(arrowTranslate, { toValue: 5, useNativeDriver: true }).start()}
              onHoverOut={() => Animated.spring(arrowTranslate, { toValue: 0, useNativeDriver: true }).start()}
              onPress={handleSend}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScale }] }]}>
                {isDark ? (
                   <View style={[styles.buttonInner, { backgroundColor: loading ? colors.primaryMuted : colors.primary }]}>
                     {loading ? <ActivityIndicator color={colors.onPrimary} /> : (
                       <View style={styles.buttonContent}>
                         <MaterialIcons name="send" size={20} color={colors.onPrimary} style={{ marginRight: 8 }} />
                         <Text style={[styles.buttonText, { color: colors.onPrimary }]}>KIRIM LINK</Text>
                       </View>
                     )}
                   </View>
                ) : (
                   <LinearGradient
                     colors={loading ? ['#A7F3D0', '#6EE7B7'] : ['#1FCB8B', '#00D9A0']}
                     start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                     style={styles.buttonInner}
                   >
                     {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                       <View style={styles.buttonContent}>
                         <MaterialIcons name="send" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                         <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>KIRIM LINK</Text>
                       </View>
                     )}
                   </LinearGradient>
                )}
              </Animated.View>
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <TouchableOpacity onPress={() => router.push('/login')} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="arrow-back" size={16} color={isDark ? colors.primary : '#1FCB8B'} style={{ marginRight: 4 }} />
              <Text style={[styles.footerLink, { color: isDark ? colors.primary : '#1FCB8B' }]}>Kembali ke Login</Text>
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
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  emailHighlight: {
    fontSize: 17,
    marginTop: 8,
    fontWeight: '800',
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
  sentIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  sentDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
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
