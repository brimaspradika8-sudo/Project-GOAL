import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView, 
  Platform, ScrollView
} from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const FloatingInput = ({ 
  label, value, onChangeText, secureTextEntry = false, keyboardType = 'default', autoCapitalize = 'none' 
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value === '' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: (isFocused || value !== '') ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // Must be false for color interpolation
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as 'absolute',
    left: 16,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -10],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ['#869585', '#4be277'],
    }),
    backgroundColor: animatedIsFocused.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['transparent', 'transparent', '#1c1b1b'],
    }),
    paddingHorizontal: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 6],
    }),
    zIndex: 2,
    borderRadius: 4,
  };

  return (
    <View style={styles.inputContainer}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        style={[styles.input, isFocused && styles.inputFocused]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChangeText={onChangeText}
        value={value}
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {secureTextEntry && (
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          <MaterialIcons 
            name={isPasswordVisible ? 'visibility' : 'visibility-off'} 
            size={22} 
            color={isFocused ? '#4be277' : '#888'} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current; 
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bgScaleAnim = useRef(new Animated.Value(1.1)).current;

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fadeAnim.setValue(0);
    slideAnim.setValue(100);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgScaleAnim, {
          toValue: 1.3,
          duration: 12000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(bgScaleAnim, {
          toValue: 1.1,
          duration: 12000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        })
      ])
    ).start();

    return () => { isMounted.current = false; };
  }, []);

  async function handleResetPassword() {
    setMessage(null);

    if (!password || !confirmPassword) {
      setMessage({ text: 'Semua kolom wajib diisi.', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: 'Password dan Verifikasi Password tidak cocok!', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setMessage({ text: 'Password minimal 6 karakter.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setMessage({ text: error.message, type: 'error' });
      } else {
        setMessage({ text: 'Password berhasil diperbarui! Mengarahkan ke login...', type: 'success' });
        
        await supabase.auth.signOut();
        
        setTimeout(() => {
          if (isMounted.current) router.replace('/login');
        }, 2000);
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'Terjadi kesalahan sistem.', type: 'error' });
    } finally {
      if (isMounted.current) setLoading(false);
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
            <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 12, shadowColor: '#4be277', shadowOpacity: 0.6, shadowRadius: 20, elevation: 15 }}>
              <MaterialIcons name="password" size={56} color="#4be277" />
            </Animated.View>
            <Text style={styles.title}>NEW PASSWORD</Text>
            <Text style={styles.subtitle}>Masukkan password baru Anda di bawah ini dan berhati-hatilah.</Text>
          </Animated.View>

          <Animated.View style={[styles.glassCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {message && (
              <View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess]}>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            )}

            <FloatingInput 
              label="Password Baru"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
            />

            <FloatingInput 
              label="Ulangi Password Baru"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0e2a14" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>PERBARUI</Text>
                  <MaterialIcons name="done-all" size={20} color="#005321" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
             <TouchableOpacity onPress={() => router.replace('/login')} style={{flexDirection: 'row', alignItems: 'center'}}>
               <MaterialIcons name="arrow-back" size={16} color="#4be277" style={{ marginRight: 4 }} />
               <Text style={styles.footerLink}>Kembali ke Login</Text>
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
    fontSize: 42,
    fontWeight: '900',
    color: '#4be277',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: 'rgba(75, 226, 119, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#bccbb9',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
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
  inputContainer: {
    marginBottom: 24,
    position: 'relative',
    height: 60,
  },
  input: {
    backgroundColor: '#1c1b1b',
    color: '#e5e2e1',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    height: 60,
    paddingHorizontal: 16,
    fontSize: 16,
    zIndex: 1,
  },
  inputFocused: {
    borderColor: '#4be277',
    backgroundColor: '#181f18',
    shadowColor: '#4be277',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 19,
    zIndex: 3,
  },
  button: {
    backgroundColor: '#4be277',
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4be277',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
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
