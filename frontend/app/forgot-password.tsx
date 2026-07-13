import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView,
  Platform, ScrollView, Keyboard
} from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FloatingInput from '../components/FloatingInput';
import { useAuthAnimations } from '../hooks/useAuthAnimations';

const COOLDOWN_SECONDS = 60;
const RESET_PASSWORD_PATH = 'reset-password';

function getResetPasswordRedirectUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/${RESET_PASSWORD_PATH}`;
  }

  return `frontend://${RESET_PASSWORD_PATH}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local.length > 2
    ? local[0] + '***' + local[local.length - 1]
    : local[0] + '***';
  return `${masked}@${domain}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const inputRef = useRef<any>(null);
  const { fadeAnim, slideAnim, pulseAnim, bgScaleAnim } = useAuthAnimations();
  const messageAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

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

  const showSuccess = () => {
    setEmailSent(true);
    setCooldown(COOLDOWN_SECONDS);
    Animated.parallel([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(successScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  async function sendResetEmail() {
    setMessage(null);
    Keyboard.dismiss();

    if (!email.trim()) {
      showMessage('Masukkan alamat email Anda terlebih dahulu.', 'error');
      return;
    }

    if (!isValidEmail(email.trim())) {
      showMessage('Format email tidak valid. Periksa kembali.', 'error');
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = getResetPasswordRedirectUrl();

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        showMessage(error.message, 'error');
      } else {
        showSuccess();
      }
    } catch (err: any) {
      showMessage(err?.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function resendEmail() {
    if (cooldown > 0) return;
    setMessage(null);
    setLoading(true);
    try {
      const redirectUrl = getResetPasswordRedirectUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        showMessage(error.message, 'error');
      } else {
        setCooldown(COOLDOWN_SECONDS);
        showMessage('Link baru telah dikirim!', 'success');
      }
    } catch (err: any) {
      showMessage(err?.message || 'Gagal mengirim ulang.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function goBackToLogin() {
    router.replace('/login');
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.responsiveWrapper}>
          {!emailSent ? (
            <>
              <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 12, shadowColor: '#4be277', shadowOpacity: 0.6, shadowRadius: 20, elevation: 15 }}>
                  <MaterialIcons name="mail-outline" size={56} color="#4be277" />
                </Animated.View>
                <Text style={styles.title}>LUPA PASSWORD?</Text>
                <Text style={styles.subtitle}>Tenang, kami akan bantu. Masukkan email Anda dan kami akan mengirimkan link untuk reset password.</Text>
              </Animated.View>

              <Animated.View style={[styles.glassCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                {message && (
                  <Animated.View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess, { opacity: messageAnim, transform: [{ translateY: messageAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
                    <MaterialIcons name={message.type === 'error' ? 'error-outline' : 'check-circle'} size={18} color={message.type === 'error' ? '#ffb4ab' : '#4be277'} />
                    <Text style={[styles.messageText, { flex: 1 }]}>{message.text}</Text>
                  </Animated.View>
                )}

                <FloatingInput
                  ref={inputRef}
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={sendResetEmail}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#0e2a14" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>KIRIM LINK</Text>
                      <MaterialIcons name="send" size={20} color="#005321" style={{ marginLeft: 8 }} />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            <Animated.View style={{ opacity: successAnim }}>
              <Animated.View style={[styles.successHeader, { transform: [{ scale: successScaleAnim }] }]}>
                <View style={styles.successIconCircle}>
                  <MaterialIcons name="mark-email-read" size={48} color="#4be277" />
                </View>
                <Text style={styles.successTitle}>LINK TELAH DIKIRIM!</Text>
                <Text style={styles.successSubtitle}>Cek inbox email</Text>
                <Text style={styles.successEmail}>{maskEmail(email)}</Text>
              </Animated.View>

              <View style={styles.infoCard}>
                <MaterialIcons name="info-outline" size={18} color={MUTED} />
                <Text style={styles.infoText}>Link berlaku selama 60 menit. Periksa folder spam jika tidak ditemukan.</Text>
              </View>

              {message && (
                <Animated.View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess, { opacity: messageAnim, transform: [{ translateY: messageAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
                  <MaterialIcons name={message.type === 'error' ? 'error-outline' : 'check-circle'} size={18} color={message.type === 'error' ? '#ffb4ab' : '#4be277'} />
                  <Text style={[styles.messageText, { flex: 1 }]}>{message.text}</Text>
                </Animated.View>
              )}

              <TouchableOpacity
                style={[styles.button, (loading || cooldown > 0) && styles.buttonDisabled]}
                onPress={resendEmail}
                disabled={loading || cooldown > 0}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#0e2a14" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>
                      {cooldown > 0 ? `KIRIM ULANG (${cooldown}s)` : 'KIRIM ULANG'}
                    </Text>
                    <MaterialIcons name="refresh" size={20} color="#005321" style={{ marginLeft: 8 }} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={goBackToLogin}
                activeOpacity={0.8}
              >
                <MaterialIcons name="arrow-back" size={18} color="#4be277" />
                <Text style={styles.secondaryButtonText}>Kembali ke Login</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {!emailSent && (
            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
              <TouchableOpacity onPress={goBackToLogin} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="arrow-back" size={16} color="#4be277" style={{ marginRight: 4 }} />
                <Text style={styles.footerLink}>Kembali ke Login</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const MUTED = '#627369';

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
    fontSize: 36,
    fontWeight: '900',
    color: '#4be277',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: 'rgba(75, 226, 119, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#bccbb9',
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  glassCard: {
    backgroundColor: 'rgba(30,30,30,0.7)',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
  },
  button: {
    backgroundColor: '#4be277',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4be277',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#2a8b46',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#002109',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(75,226,119,0.1)',
    borderRadius: 14,
    height: 56,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(75,226,119,0.2)',
  },
  secondaryButtonText: {
    color: '#4be277',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerLink: {
    color: '#4be277',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
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
    fontSize: 14,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(75,226,119,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(75,226,119,0.25)',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4be277',
    letterSpacing: 1,
    textShadowColor: 'rgba(75, 226, 119, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#bccbb9',
    marginTop: 8,
    fontWeight: '500',
  },
  successEmail: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(30,30,30,0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    color: '#bccbb9',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
