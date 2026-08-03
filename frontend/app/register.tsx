import React, { useState, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView,
  Platform, ScrollView, Keyboard, useWindowDimensions
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FloatingInput from '../components/FloatingInput';
import { AUTH_DARK_COLORS } from '../lib/theme';
import { useAuthAnimations } from '../hooks/useAuthAnimations';
import { API_BASE_URL, getErrorMessage, DEFAULT_HEADERS } from '../lib/api';
import { fieldError } from '../lib/formValidation';

function regValidateName(v: string): string {
  if (!v.trim()) return 'Nama wajib diisi.';
  if (v.trim().length > 255) return 'Nama maksimal 255 karakter.';
  return '';
}
function regValidateEmail(v: string): string {
  if (!v.trim()) return 'Email wajib diisi.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Format email tidak valid.';
  return '';
}
function regValidatePassword(v: string): string {
  if (!v) return 'Password wajib diisi.';
  if (v.length < 8) return 'Password minimal 8 karakter.';
  if (!/[a-z]/.test(v)) return 'Password harus mengandung huruf kecil.';
  if (!/[A-Z]/.test(v)) return 'Password harus mengandung huruf besar.';
  if (!/[0-9]/.test(v)) return 'Password harus mengandung angka.';
  return '';
}
function regValidateConfirm(v: string, password: string): string {
  if (!v) return 'Verifikasi password wajib diisi.';
  if (v !== password) return 'Password dan Verifikasi Password tidak cocok!';
  return '';
}

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
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
      showMessage('Periksa kembali isian Anda.', 'error');
      return;
    }

    setMessage(null);
    Keyboard.dismiss();

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          password_confirmation: confirmPassword,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        showMessage('Registrasi berhasil! Silakan masuk.', 'success');
        setTimeout(() => router.replace('/login'), 1500);
      } else {
        showMessage(getErrorMessage(data, 'Gagal mendaftar.'), 'error');
      }
    } catch (err: any) {
      showMessage(err?.message || 'Terjadi kesalahan sistem.', 'error');
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
              <MaterialIcons name="sports-soccer" size={56} color="#4be277" />
            </Animated.View>
            <Text style={[styles.title, { fontSize: Math.min(48, width * 0.13) }]}>REGISTER</Text>
            <Text style={styles.subtitle}>Gabung G.O.A.L dan mulai bermain</Text>
          </Animated.View>

          <Animated.View style={[styles.glassCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {message && (
              <Animated.View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess, { opacity: messageAnim, transform: [{ translateY: messageAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
                <Text style={styles.messageText}>{message.text}</Text>
              </Animated.View>
            )}

            <FloatingInput
              label="Nama Lengkap"
              value={name}
              onChangeText={onRegNameChange}
              onBlur={onRegNameBlur}
              autoCapitalize="words"
              error={nameErr}
              colors={AUTH_DARK_COLORS}
            />

            <FloatingInput
              label="Email"
              value={email}
              onChangeText={onRegEmailChange}
              onBlur={onRegEmailBlur}
              keyboardType="email-address"
              error={emailErr}
              colors={AUTH_DARK_COLORS}
            />

            <FloatingInput
              label="Password"
              value={password}
              onChangeText={onRegPasswordChange}
              onBlur={onRegPasswordBlur}
              secureTextEntry={true}
              error={passwordErr}
              colors={AUTH_DARK_COLORS}
            />

            <FloatingInput
              label="Verifikasi Password"
              value={confirmPassword}
              onChangeText={onRegConfirmChange}
              onBlur={onRegConfirmBlur}
              secureTextEntry={true}
              error={confirmErr}
              colors={AUTH_DARK_COLORS}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={signUpWithEmail}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0e2a14" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>SIGN UP</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#005321" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.footerLink}>Masuk</Text>
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
    fontSize: 48,
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
    fontSize: 16,
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
    marginTop: 8,
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
