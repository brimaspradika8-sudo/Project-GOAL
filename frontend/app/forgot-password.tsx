import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Keyboard, Image
} from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FloatingInput from '../components/FloatingInput';
import { API_BASE_URL } from '../lib/api';

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

function translateSupabaseError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Terlalu banyak percobaan. Silakan tunggu beberapa menit lagi.';
  }
  if (m.includes('invalid email') || m.includes('valid email')) {
    return 'Format email tidak valid. Periksa kembali.';
  }
  if (m.includes('unable') || m.includes('fetch')) {
    return 'Gagal mengirim. Periksa koneksi internet Anda.';
  }
  return 'Gagal mengirim tautan. Silakan coba lagi nanti.';
}

async function checkEmailExists(email: string): Promise<boolean | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.exists;
  } catch {
    return null;
  }
}

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const inputRef = useRef<any>(null);

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
  };

  const showSuccess = () => {
    setEmailSent(true);
    setCooldown(COOLDOWN_SECONDS);
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
      const exists = await checkEmailExists(email.trim());

      if (exists === false) {
        showMessage('Email belum terdaftar dalam sistem. Silakan daftar terlebih dahulu.', 'error');
        setLoading(false);
        return;
      }

      if (exists === null) {
        showMessage('Gagal memverifikasi email. Periksa koneksi internet Anda.', 'error');
        setLoading(false);
        return;
      }

      const redirectUrl = getResetPasswordRedirectUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        showMessage(translateSupabaseError(error.message), 'error');
      } else {
        showSuccess();
      }
    } catch (err: any) {
      showMessage('Terjadi kesalahan sistem. Silakan coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function resendEmail() {
    if (cooldown > 0) return;
    setMessage(null);
    setLoading(true);
    try {
      const exists = await checkEmailExists(email.trim());

      if (exists === false) {
        showMessage('Email tidak lagi terdaftar dalam sistem.', 'error');
        setLoading(false);
        return;
      }

      if (exists === null) {
        showMessage('Gagal memverifikasi email. Periksa koneksi internet Anda.', 'error');
        setLoading(false);
        return;
      }

      const redirectUrl = getResetPasswordRedirectUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        showMessage(translateSupabaseError(error.message), 'error');
      } else {
        setCooldown(COOLDOWN_SECONDS);
        showMessage('Tautan baru telah dikirim.', 'success');
      }
    } catch (err: any) {
      showMessage('Gagal mengirim ulang. Periksa koneksi internet Anda.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    router.replace('/login');
  }

  function goToRegister() {
    router.replace('/register');
  }

  function changeEmail() {
    setEmailSent(false);
    setEmail('');
    setMessage(null);
    setTimeout(() => inputRef.current?.focus(), 300);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      <View style={StyleSheet.absoluteFill}>
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNgBJlBY97_QaewYW2r-DjSlc7y1DcxBuTyd2FT01aWpOMDdC6E5Ojftib57g020fqnyp0_maN4R5MEHbvA5mKvbvL62-rTz8r9ur1HeYAdQRNcHj2N8UkRNLsr6n30pKT8wvR2ALUnlrVoH30n83mprQd7LqD0c88IYJTTyGNiDVyADu8naOoqsrI2DdszdWsC6qGeg9DMNEPKErslJTkraaMEw-PLU4zYb0RM7Qzcqh4FeFxhc1IHMBcbbO-zGz4b_LtpTKBW06d' }}
          style={styles.bgImage}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.responsiveWrapper}>
          {!emailSent ? (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={goToLogin} activeOpacity={0.7}>
                <MaterialIcons name="arrow-back" size={20} color="#4be277" />
                <Text style={styles.backBtnText}>Kembali</Text>
              </TouchableOpacity>

              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <MaterialIcons name="mail-outline" size={56} color="#4be277" />
                </View>
                <Text style={styles.title}>LUPA KATA SANDI?</Text>
                <Text style={styles.subtitle}>Masukkan alamat email yang terdaftar, kami akan mengirimkan tautan untuk mengatur ulang kata sandi.</Text>
              </View>

              <View style={styles.glassCard}>
                {message && (
                  <View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess]}>
                    <MaterialIcons name={message.type === 'error' ? 'error-outline' : 'check-circle'} size={18} color={message.type === 'error' ? '#ffb4ab' : '#4be277'} />
                    <Text style={[styles.messageText, { flex: 1 }]}>{message.text}</Text>
                  </View>
                )}

                <FloatingInput
                  ref={inputRef}
                  label="Alamat Email"
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (message) setMessage(null); }}
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
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Belum memiliki akun? </Text>
                <TouchableOpacity onPress={goToRegister}>
                  <Text style={styles.footerLink}>Daftar sekarang</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View>
              <View style={styles.successHeader}>
                <View style={styles.successIconCircle}>
                  <MaterialIcons name="mark-email-read" size={48} color="#4be277" />
                </View>
                <Text style={styles.successTitle}>TAUTAN TELAH DIKIRIM!</Text>
                <Text style={styles.successSubtitle}>Silakan cek inbox email Anda</Text>
                <Text style={styles.successEmail}>{maskEmail(email)}</Text>
              </View>

              <View style={styles.infoCard}>
                <MaterialIcons name="info-outline" size={18} color={MUTED} />
                <Text style={styles.infoText}>Tautan berlaku selama 60 menit. Silakan periksa folder spam jika tidak ditemukan.</Text>
              </View>

              {message && (
                <View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess]}>
                  <MaterialIcons name={message.type === 'error' ? 'error-outline' : 'check-circle'} size={18} color={message.type === 'error' ? '#ffb4ab' : '#4be277'} />
                  <Text style={[styles.messageText, { flex: 1 }]}>{message.text}</Text>
                </View>
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

              <TouchableOpacity style={styles.changeEmailBtn} onPress={changeEmail} activeOpacity={0.8}>
                <MaterialIcons name="edit" size={18} color="#4be277" />
                <Text style={styles.changeEmailText}>Ubah Email</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={goToLogin} activeOpacity={0.8}>
                <MaterialIcons name="arrow-back" size={18} color="#4be277" />
                <Text style={styles.secondaryButtonText}>Kembali ke Halaman Masuk</Text>
              </TouchableOpacity>
            </View>
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
    gap: 4,
  },
  backBtnText: {
    color: '#4be277',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    marginBottom: 12,
    boxShadow: '0px 0px 20px rgba(75, 226, 119, 0.6)',
    elevation: 15,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#4be277',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadow: '0px 2px 10px rgba(75, 226, 119, 0.4)',
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
    boxShadow: '0px 15px 25px rgba(0, 0, 0, 0.5)',
    elevation: 10,
  },
  button: {
    backgroundColor: '#4be277',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 6px 12px rgba(75, 226, 119, 0.4)',
    elevation: 6,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#2a8b46',
    boxShadow: 'none',
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
  changeEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(75,226,119,0.08)',
    borderRadius: 14,
    height: 52,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(75,226,119,0.15)',
  },
  changeEmailText: {
    color: '#4be277',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    height: 52,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  secondaryButtonText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  footerLink: {
    color: '#4be277',
    fontSize: 14,
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
    textShadow: '0px 2px 8px rgba(75, 226, 119, 0.3)',
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
