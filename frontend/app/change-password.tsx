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
import { useTheme } from '../lib/theme';
import { useAuthAnimations } from '../hooks/useAuthAnimations';
import { getErrorMessage } from '../lib/api';
import { apiFetch } from '../lib/apiClient';
import { fieldError } from '../lib/formValidation';
import ThemeToggle from '../components/ThemeToggle';

function cpValidateCurrent(v: string): string {
  if (!v) return 'Current password is required.';
  return '';
}
function cpValidatePassword(v: string): string {
  if (!v) return 'New password is required.';
  if (v.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-z]/.test(v)) return 'Password must contain a lowercase letter.';
  if (!/[A-Z]/.test(v)) return 'Password must contain an uppercase letter.';
  if (!/[0-9]/.test(v)) return 'Password must contain a number.';
  return '';
}
function cpValidateConfirm(v: string, password: string): string {
  if (!v) return 'Please confirm your password.';
  if (v !== password) return 'New passwords do not match!';
  return '';
}

export default function ChangePasswordScreen() {
  const { colors, resolved } = useTheme();
  const isDark = resolved === 'dark';
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
  const { fadeAnim, slideAnim, pulseAnim } = useAuthAnimations();
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
      showMessage('Please check your entries.', 'error');
      return;
    }
    if (password === currentPassword) {
      showMessage('New password must be different from the current password.', 'error');
      return;
    }

    setMessage(null);
    Keyboard.dismiss();

    setLoading(true);
    try {
      const res = await apiFetch('/me/password', {
        method: 'PUT',
        body: { current_password: currentPassword, password, password_confirmation: confirmPassword },
      });
      const data = await res.json();

      if (res.ok) {
        showMessage('Password updated successfully!', 'success');
        setTimeout(() => router.back(), 1500);
      } else {
        showMessage(getErrorMessage(data, 'Failed to update password.'), 'error');
      }
    } catch {
      showMessage('Something went wrong.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
        <View style={[styles.glowTopLeft, { backgroundColor: colors.primary, opacity: isDark ? 0.12 : 0.06 }]} />
        <View style={[styles.glowBottomRight, { backgroundColor: colors.primary, opacity: isDark ? 0.10 : 0.05 }]} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveWrapper}>
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }], backgroundColor: isDark ? 'rgba(31, 203, 139, 0.15)' : 'rgba(31, 203, 139, 0.1)' }]}>
              <MaterialIcons name="lock" size={48} color={colors.primary} />
            </Animated.View>
            <Text style={[styles.title, { color: colors.primary }]}>Change Password</Text>
          </Animated.View>
          <Animated.View style={[styles.glassCard, { backgroundColor: colors.surfaceWhite, borderColor: colors.borderSubtle, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {message && (
              <Animated.View style={[styles.messageBox, message.type === 'error' ? { backgroundColor: colors.errorContainer, borderLeftColor: colors.error } : { backgroundColor: colors.successLight, borderLeftColor: colors.success }, { opacity: messageAnim, transform: [{ translateY: messageAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
                <Text style={[styles.messageText, { color: message.type === 'error' ? colors.error : colors.success }]}>{message.text}</Text>
              </Animated.View>
            )}
            <FloatingInput label="Current Password" value={currentPassword} onChangeText={onCpCurrentChange} onBlur={onCpCurrentBlur} secureTextEntry error={currentError} colors={colors} />
            <FloatingInput label="New Password" value={password} onChangeText={onCpPasswordChange} onBlur={onCpPasswordBlur} secureTextEntry error={passwordError} colors={colors} />
            <FloatingInput label="Confirm New Password" value={confirmPassword} onChangeText={onCpConfirmChange} onBlur={onCpConfirmBlur} secureTextEntry error={confirmError} colors={colors} />
            <TouchableOpacity style={[styles.button, { backgroundColor: loading ? colors.primaryMuted : colors.primary }]} onPress={handleChangePassword} disabled={loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color={colors.onPrimary} /> : (
                <View style={styles.buttonContent}>
                  <Text style={[styles.buttonText, { color: colors.onPrimary }]}>SAVE</Text>
                  <MaterialIcons name="save" size={20} color={colors.onPrimary} style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="arrow-back" size={16} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.footerLink, { color: colors.primary }]}>Back</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      <View style={styles.themeToggleWrap}>
        <ThemeToggle variant="button" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  glowTopLeft: { position: 'absolute', top: -160, left: -140, width: 420, height: 420, borderRadius: 210 },
  glowBottomRight: { position: 'absolute', bottom: -180, right: -140, width: 460, height: 460, borderRadius: 230 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  themeToggleWrap: { position: 'absolute', top: 24, right: 24, zIndex: 50 },
  responsiveWrapper: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  iconWrapper: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 36, fontWeight: '900', color: '#4be277', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 2, ...(Platform.OS === 'web' ? { textShadow: '0px 2px 10px rgba(75,226,119,0.4)' } : { textShadowColor: 'rgba(75,226,119,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }), textAlign: 'center' },
  glassCard: { backgroundColor: '#1C2635', borderRadius: 20, padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', ...(Platform.OS === 'web' ? { boxShadow: '0 15px 25px rgba(0,0,0,0.5)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.5, shadowRadius: 25, elevation: 10 }) },
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

