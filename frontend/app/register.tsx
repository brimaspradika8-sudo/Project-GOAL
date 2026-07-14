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
import { setRegistering } from './_layout';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const showMessage = (text: string, type: 'error' | 'success') => {
    setMessage({ text, type });
  };

  async function signUpWithEmail() {
    setMessage(null);
    Keyboard.dismiss();

    if (!name || !email || !password || !confirmPassword) {
      showMessage('Semua kolom wajib diisi.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showMessage('Kata sandi dan konfirmasi kata sandi tidak sesuai.', 'error');
      return;
    }

    if (password.length < 6) {
      showMessage('Kata sandi minimal 6 karakter.', 'error');
      return;
    }

    setLoading(true);
    setRegistering(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { full_name: name.trim() }
        }
      });

      if (error) {
        setRegistering(false);
        showMessage(error.message, 'error');
      } else {
        await supabase.auth.signOut();
        setRegistering(false);
        setSubmitted(true);
        showMessage('Pendaftaran berhasil. Mengarahkan ke halaman masuk...', 'success');
        setTimeout(() => {
          if (mountedRef.current) router.replace('/login');
        }, 1500);
      }
    } catch (err: any) {
      setRegistering(false);
      showMessage(err?.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveWrapper}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="sports-soccer" size={56} color="#4be277" />
            </View>
            <Text style={styles.title}>DAFTAR</Text>
            <Text style={styles.subtitle}>Bergabunglah dengan GOAL untuk memulai.</Text>
          </View>

          <View style={styles.glassCard}>
            {message && (
              <View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess]}>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            )}

              <FloatingInput
              label="Nama Lengkap"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <FloatingInput
              label="Alamat Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <FloatingInput
              label="Kata Sandi"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
            />

            <FloatingInput
              label="Konfirmasi Kata Sandi"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
            />

            <TouchableOpacity
              style={[styles.button, (loading || submitted) && styles.buttonDisabled]}
              onPress={signUpWithEmail}
              disabled={loading || submitted}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0e2a14" />
              ) : (
                <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>DAFTAR</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#005321" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Sudah memiliki akun? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.footerLink}>Masuk</Text>
            </TouchableOpacity>
          </View>
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
  iconCircle: {
    marginBottom: 12,
    boxShadow: '0px 0px 20px rgba(75, 226, 119, 0.6)',
    elevation: 15,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#4be277',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadow: '0px 2px 10px rgba(75, 226, 119, 0.4)',
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
    boxShadow: '0px 15px 25px rgba(0, 0, 0, 0.5)',
    elevation: 10,
  },
  button: {
    backgroundColor: '#4be277',
    height: 60,
    borderRadius: 12,
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
