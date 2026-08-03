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
import { fieldError } from '../lib/formValidation';

function cpValidateCurrent(v: string): string {
  if (!v) return 'Password saat ini wajib diisi.';
  return '';
}
function cpValidatePassword(v: string): string {
  if (!v) return 'Password baru wajib diisi.';
  if (v.length < 8) return 'Password minimal 8 karakter.';
  if (!/[a-z]/.test(v)) return 'Password harus mengandung huruf kecil.';
  if (!/[A-Z]/.test(v)) return 'Password harus mengandung huruf besar.';
  if (!/[0-9]/.test(v)) return 'Password harus mengandung angka.';
  return '';
}
function cpValidateConfirm(v: string, password: string): string {
  if (!v) return 'Verifikasi password wajib diisi.';
  if (v !== password) return 'Password baru tidak cocok!';
  return '';
}

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentTouched, setCurrentTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [currentError, setCurrentError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const { fadeAnim, slideAnim, pulseAnim, bgScaleAnim } = useAuthAnimations();
  const messageAnim = useRef(new Animated.Value(0)).current;
  const showMessage = (text: string, type: 'error' | 'success') => {
    setMessage({ text, type });
    messageAnim.setValue(0);
    Animated.timing(messageAnim, {
      toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  };

  function onCpCurrentChange(v: string) { setCurrentPassword(v); setCurrentError(fieldError(v, cpValidateCurrent(v), currentTouched)); }
  function onCpPasswordChange(v: string) {
    setPassword(v);
    setPasswordError(fieldError(v, cpValidatePassword(v), passwordTouched));
    if (confirmPassword) setConfirmError(cpValidateConfirm(confirmPassword, v));
  }
  function onCpConfirmChange(v: string) { setConfirmPassword(v); setConfirmError(fieldError(v, cpValidateConfirm(v, password), confirmTouched)); }

  function onCpCurrentBlur() { setCurrentTouched(true); setCurrentError(cpValidateCurrent(currentPassword)); }
  function onCpPasswordBlur() { setPasswordTouched(true); setPasswordError(cpValidatePassword(password)); }
  function onCpConfirmBlur() { setConfirmTouched(true); setConfirmError(cpValidateConfirm(confirmPassword, password)); }

  async function handleChangePassword() {
    setCurrentTouched(true); setPasswordTouched(true); setConfirmTouched(true);
    const cErr = cpValidateCurrent(currentPassword);
    const pErr = cpValidatePassword(password);
    const cfErr = cpValidateConfirm(confirmPassword, password);
    setCurrentError(cErr); setPasswordError(pErr); setConfirmError(cfErr);
    if (cErr || pErr || cfErr) {
      showMessage('Periksa kembali isian Anda.', 'error');
      return;
    }
    if (password === currentPassword) {
      showMessage('Password baru harus berbeda dari password saat ini.', 'error');
      return;
    }

    setMessage(null);
    Keyboard.dismiss();

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/me/password`, {
        method: 'PUT',
        headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, password, password_confirmation: confirmPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        showMessage('Password berhasil diperbarui!', 'success');
        setTimeout(() => router.back(), 1500);
      } else {
        showMessage(getErrorMessage(data, 'Gagal memperbarui password.'), 'error');
      }
    } catch {
      showMessage('Terjadi kesalahan sistem.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <View style={StyleSheet.absoluteFill}>
        <Animated.Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNgBJlBY97_QaewYW2r-DjSlc7y1DcxBuTyd2FT01aWpOMDdC6E5Ojftib57g020fqnyp0_maN4R5MEHbvA5mKvbvL62-rTz8r9ur1HeYAdQRNcHj2N8UkRNLsr6n30pKT8wvR2ALUnlrVoH30n83mprQd7LqD0c88IYJTTyGNiDVyADu8naOoqsrI2DdszdWsC6qGeg9DMNEPKErslJTkraaMEw-PLU4zYb0RM7Qzcqh4FeFxhc1IHMBcbbO-zGz4b_LtpTKBW06d' }}
          style={[styles.bgImage, { transform: [{ scale: bgScaleAnim }] }]} resizeMode="cover"
        />
        <View style={styles.overlay} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveWrapper}>
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={[{ transform: [{ scale: pulseAnim }], marginBottom: 12 }, Platform.OS === 'web' ? { boxShadow: '0 0 20px rgba(75,226,119,0.6)' } : { shadowColor: '#4be277', shadowOpacity: 0.6, shadowRadius: 20, elevation: 15 }]}>
              <MaterialIcons name="lock" size={56} color="#4be277" />
            </Animated.View>
            <Text style={styles.title}>UBAH PASSWORD</Text>
          </Animated.View>
          <Animated.View style={[styles.glassCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {message && (
              <Animated.View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess, { opacity: messageAnim, transform: [{ translateY: messageAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
                <Text style={styles.messageText}>{message.text}</Text>
              </Animated.View>
            )}
            <FloatingInput label="Password Saat Ini" value={currentPassword} onChangeText={onCpCurrentChange} onBlur={onCpCurrentBlur} secureTextEntry={true} error={currentError} colors={AUTH_DARK_COLORS} />
            <FloatingInput label="Password Baru" value={password} onChangeText={onCpPasswordChange} onBlur={onCpPasswordBlur} secureTextEntry={true} error={passwordError} colors={AUTH_DARK_COLORS} />
            <FloatingInput label="Ulangi Password Baru" value={confirmPassword} onChangeText={onCpConfirmChange} onBlur={onCpConfirmBlur} secureTextEntry={true} error={confirmError} colors={AUTH_DARK_COLORS} />
            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleChangePassword} disabled={loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#0e2a14" /> : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>SIMPAN</Text>
                  <MaterialIcons name="save" size={20} color="#005321" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="arrow-back" size={16} color="#4be277" style={{ marginRight: 4 }} />
              <Text style={styles.footerLink}>Kembali</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  bgImage: { width: '100%', height: '100%', opacity: 0.5 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  responsiveWrapper: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 36, fontWeight: '900', color: '#4be277', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 2, ...(Platform.OS === 'web' ? { textShadow: '0px 2px 10px rgba(75,226,119,0.4)' } : { textShadowColor: 'rgba(75,226,119,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }), textAlign: 'center' },
  glassCard: { backgroundColor: 'rgba(30,30,30,0.7)', borderRadius: 20, padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', ...(Platform.OS === 'web' ? { boxShadow: '0 15px 25px rgba(0,0,0,0.5)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.5, shadowRadius: 25, elevation: 10 }) },
  button: { backgroundColor: '#4be277', height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8, ...(Platform.OS === 'web' ? { boxShadow: '0 6px 12px rgba(75,226,119,0.4)' } : { shadowColor: '#4be277', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }) },
  buttonDisabled: { backgroundColor: '#2a8b46', ...(Platform.OS === 'web' ? { boxShadow: 'none' } : { shadowOpacity: 0, elevation: 0 }) },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#002109', fontSize: 18, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerLink: { color: '#4be277', fontSize: 16, fontWeight: 'bold' },
  messageBox: { borderRadius: 8, padding: 14, marginBottom: 20 },
  messageError: { backgroundColor: '#3a0d10', borderLeftWidth: 4, borderLeftColor: '#ffb4ab' },
  messageSuccess: { backgroundColor: '#0a2614', borderLeftWidth: 4, borderLeftColor: '#4be277' },
  messageText: { color: '#e5e2e1', fontSize: 15 },
});
