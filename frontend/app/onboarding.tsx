import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView,
  Platform, ScrollView, Image, Modal, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/api';
import { useUsernameCheck } from '../hooks/useUsernameCheck';

const SPORTS = [
  { id: 'futsal',      label: 'FUTSAL',       icon: 'sports-soccer' as const },
  { id: 'basketball',  label: 'BASKET',       icon: 'sports-basketball' as const },
  { id: 'badminton',   label: 'BADMINTON',    icon: 'sports-tennis' as const },
  { id: 'volleyball',  label: 'VOLI',         icon: 'sports-volleyball' as const },
  { id: 'minisoccer',  label: 'MINI SOCCER',  icon: 'sports-soccer' as const },
  { id: 'tennis',      label: 'TENIS',        icon: 'sports-tennis' as const },
  { id: 'tabletennis', label: 'TENIS MEJA',   icon: 'sports' as const },
  { id: 'others',      label: 'LAINNYA',      icon: 'more-horiz' as const },
];

const SPORT_PREFIXES = [
  'Striker', 'GoalGetter', 'Slamdunk', 'Pebulutangkis', 'SmashMaster',
  'Playmaker', 'Defender', 'AceSpiker', 'FastDribbler', 'CourtKing',
  'NetViper', 'MidfieldGenius', 'Jumper', 'Winger', 'Keeper',
  'StrikerMaut', 'KiperGanteng', 'MaestroFutsal', 'RajaLapangan'
];

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/bottts/png?seed=goal&backgroundColor=131313';
const TOTAL_STEPS = 4;

const PROVINCES = [
  'DKI JAKARTA',
  'JAWA BARAT',
  'JAWA TENGAH',
  'JAWA TIMUR',
];

const CITIES_BY_PROVINCE: Record<string, string[]> = {
  'DKI JAKARTA': [
    'JAKARTA SELATAN, ID',
    'JAKARTA PUSAT, ID',
    'JAKARTA UTARA, ID',
    'JAKARTA BARAT, ID',
    'JAKARTA TIMUR, ID',
  ],
  'JAWA BARAT': [
    'BANDUNG, ID',
    'BEKASI, ID',
    'BOGOR, ID',
    'DEPOK, ID',
    'TANGERANG, ID',
    'CIREBON, ID',
    'CIAMIS, ID', 
    'TASIKMALAYA, ID',

  ],
  'JAWA TENGAH': [
    'SEMARANG, ID',
    'YOGYAKARTA, ID',
    'SURAKARTA, ID',
    'PURWOKERTO, ID',
    'PURBALINGGA, ID',
    'BANJARNEGARA, ID',
    'CILACAP, ID',
    'KUDUS, ID',
    'PEKALONGAN, ID',
    'TEGAL, ID',
    'MAGELANG, ID',
    'SALATIGA, ID',
    'BLORA, ID',
    'BOYOLALI, ID',
    'BREBES, ID',
    'DEMAK, ID',
    'GROBOGAN, ID',
    'JEPARA, ID',
    'KENDAL, ID',
    'KLATEN, ID',
    'KUDUS, ID',
    'KUNINGAN, ID',
    'MAGELANG, ID',
    'PATI, ID',
    'PEKALONGAN, ID',
    'PEMALANG, ID',
    'PURBALINGGA, ID',
    'PURWOKERTO, ID',
    'PURWOREJO, ID',
    'SALATIGA, ID',
    'SEMARANG, ID',
    'SRAGEN, ID',
    'SUKOHARJO, ID',
    'SURAKARTA, ID',
    'TEGAL, ID',
    'TEMANGGUNG, ID',
    'WONOGIRI, ID',
    'WONOSOBO, ID',
  ],
  'JAWA TIMUR': [
    'SURABAYA, ID',
    'MALANG, ID',
    'KEDIRI, ID',
    'GRESIK, ID',
    'LAMONGAN, ID',
    'SIDOARJO, ID',
    'JOMBANG, ID',
    'NGANJUK, ID'
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// Main Screen
// ────────────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  // Navigation Steps
  const [step, setStep] = useState(1);

  // Form State
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const usernameStatus = useUsernameCheck(username);

  // Profile Customization State
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
  const [region, setRegion] = useState(CITIES_BY_PROVINCE[PROVINCES[0]][0]);

  // Pick avatar from gallery
  const pickAvatarFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Izinkan akses galeri di pengaturan untuk memilih foto profil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  // Modal Open States
  const [isProvinceModalOpen, setIsProvinceModalOpen] = useState(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
 
  // Custom search string in city selector search text input
  const [regionSearch, setRegionSearch] = useState('');

  // Animations
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  // Dice icon rotation animation
  const diceRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 800,
        easing: Easing.out(Easing.cubic), useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 800,
        easing: Easing.out(Easing.cubic), useNativeDriver: false,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 3500, useNativeDriver: false })
    ).start();
  }, [step]);

  const parsedAge = Number(age);
  const canCompleteUsername =
    usernameStatus === 'available' &&
    username.trim().length >= 3 &&
    termsAccepted;
  const canCompleteProfile =
    age.trim().length > 0 &&
    Number.isInteger(parsedAge) &&
    parsedAge >= 10 &&
    parsedAge <= 80;
  const canCompleteRegion = !!selectedProvince && !!region;
  const canCompleteSports = selectedSports.length > 0;
  const canGoNext =
    step === 1 ? canCompleteUsername :
    step === 2 ? canCompleteProfile :
    step === 3 ? canCompleteRegion :
    canCompleteSports;
  const canSubmit = canCompleteSports && !isSubmitting;

  function toggleSport(id: string) {
    setSelectedSports(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      router.replace('/login');
    } catch (e) {
      console.log('Error signing out:', e);
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  }

  async function handleNextStep() {
    if (!canGoNext) return;
    setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${API_BASE_URL}/me/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username,
          age: parsedAge,
          sports: selectedSports,
          region,
          avatar_url: avatarUrl,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.json();
        const messages = err?.errors
          ? Object.values(err.errors as Record<string, string[]>).flat().join(' ')
          : (err?.message ?? 'Terjadi kesalahan.');
        setSubmitError(messages);
        return;
      }

      // Redirect to main app dashboard
      router.replace('/(tabs)');
    } catch {
      setSubmitError('Gagal terhubung ke server. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const triggerDiceRoll = () => {
    Animated.sequence([
      Animated.timing(diceRotateAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.timing(diceRotateAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start();

    const rand = SPORT_PREFIXES[Math.floor(Math.random() * SPORT_PREFIXES.length)] + '_' + (Math.floor(Math.random() * 900) + 100);
    setUsername(rand);
  };

  // Username status indicators
  const renderStatus = () => {
    switch (usernameStatus) {
      case 'checking':
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="sync" size={14} color="#869585" />
            <Text style={[styles.statusText, { color: '#869585' }]}>Validating ID...</Text>
          </View>
        );
      case 'available':
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="check-circle" size={14} color="#4be277" />
            <Text style={[styles.statusText, { color: '#4be277' }]}>USERNAME TERSEDIA</Text>
          </View>
        );
      case 'taken':
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="cancel" size={14} color="#ffb4ab" />
            <Text style={[styles.statusText, { color: '#ffb4ab' }]}>Username sudah dipakai</Text>
          </View>
        );
      case 'invalid':
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="error" size={14} color="#ffb4ab" />
            <Text style={[styles.statusText, { color: '#ffb4ab' }]}>Terlalu pendek</Text>
          </View>
        );
      default:
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="info-outline" size={14} color="#869585" />
            <Text style={[styles.statusText, { color: '#869585' }]}>Input Username Anda</Text>
          </View>
        );
    }
  };

  const filteredKabupatens = (CITIES_BY_PROVINCE[selectedProvince] || []).filter(k => 
    k.toLowerCase().includes(regionSearch.toLowerCase())
  );

  const spin = diceRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      {/* ── Progress Glow Top Bar ── */}
      <View style={styles.progressBarWrapper} pointerEvents="none">
        <View style={[styles.progressBar, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>

      {/* ── Atmospheric Background Glows ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.glowTopLeft} />
        <View style={styles.glowBottomRight} />
        <View style={styles.radialOverlay} />
      </View>

      {/* ── Fixed Premium Header ── */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={[styles.headerLeft, step === 1 && styles.headerLeftDisabled]}
          onPress={handleBack}
          disabled={step === 1}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#4be277" />
          <Text style={styles.headerTitle}>
            {step === 1 ? 'NAMA ARENA' : step === 2 ? 'PROFIL PEMAIN' : step === 3 ? 'WILAYAH' : 'KARIER OLAHRAGA'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerGoal}>GOAL</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {step < 4 ? (
            /* ──────────────────────────────────────────────────────────────────
               STEP 1: LENGKAPI IDENTITAS (CARD BIODATA)
               ────────────────────────────────────────────────────────────────── */
            <View>
              {/* Head instruction */}
              <View style={styles.sectionHeading}>
                <Text style={styles.stepEyebrow}>LANGKAH {step}/{TOTAL_STEPS}</Text>
                <Text style={styles.headingBig}>
                  {step === 1 ? 'SIAPA NAMA ARENAMU?' : step === 2 ? 'TAMBAHKAN FOTOMU' : 'DI MANA ARENAMU?'}
                </Text>
                <Text style={styles.headingSub}>
                  {step === 1
                    ? 'Nama ini yang akan dilihat pemain lain. Kamu bisa acak atau edit sendiri.'
                    : step === 2
                      ? 'Foto opsional, umur wajib supaya profil pemainmu lengkap.'
                      : 'Pilih kabupaten/kota tempat kamu biasa main.'}
                </Text>
              </View>

              {/* Player Card Frame */}
              <View style={styles.card}>
                {/* Visual scanline scanning card */}
                <Animated.View
                  style={[
                    styles.scanline,
                    {
                      top: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                  pointerEvents="none"
                />

                <View style={styles.cardGradientOverlay} pointerEvents="none" />

                <View style={styles.cardPadding}>
                  {/* Card Identifier bar */}
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={styles.cardLabel}>PRO PLAYER CARD</Text>
                      <Text style={styles.cardTitle}>
                        {step === 1 ? 'NAMA ARENA' : step === 2 ? 'PROFIL PEMAIN' : 'LOKASI ARENA'}
                      </Text>
                    </View>
                    <View style={styles.qrIcon}>
                      <MaterialIcons name="qr-code-2" size={24} color="#4be277" />
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  {step === 2 && (
                  <View style={styles.topFormRow}>
                    {/* Avatar interactive selection area */}
                    <TouchableOpacity
                      style={styles.avatarWrapper}
                      onPress={pickAvatarFromGallery}
                      activeOpacity={0.8}
                    >
                      <Animated.View style={[styles.avatarPulseBorder, { opacity: pulseAnim.interpolate({ inputRange: [1, 1.12], outputRange: [0.4, 0.9] }) }]} />
                      <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                      <View style={styles.avatarEditBadge}>
                        <MaterialIcons name="camera-alt" size={12} color="#002109" />
                      </View>
                    </TouchableOpacity>

                    {/* Age Input Box */}
                    <View style={styles.ageContainer}>
                      <Text style={styles.cardInputLabel}>UMUR (TAHUN)</Text>
                      <TextInput
                        style={styles.ageInput}
                        placeholder="00"
                        placeholderTextColor="rgba(75, 226, 119, 0.2)"
                        keyboardType="numeric"
                        value={age}
                        onChangeText={text => setAge(text.replace(/[^0-9]/g, ''))}
                        maxLength={3}
                      />
                    </View>
                  </View>
                  )}

                  {step === 1 && (
                  <View style={styles.usernameCardSection}>
                    <Text style={styles.cardInputLabel}>USERNAME</Text>
                    <View style={styles.usernameInputWrapper}>
                      <MaterialIcons name="alternate-email" size={20} color="rgba(255,255,255,0.4)" style={{ marginRight: 6 }} />
                      <TextInput
                        style={styles.usernameInput}
                        placeholder="username_kamu"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={username}
                        onChangeText={text => setUsername(text.replace(/[^a-zA-Z0-9_]/g, ''))}
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={20}
                      />
                      <TouchableOpacity
                        style={styles.randomButton}
                        onPress={triggerDiceRoll}
                        activeOpacity={0.7}
                      >
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                          <MaterialIcons name="casino" size={24} color="#4be277" />
                        </Animated.View>
                      </TouchableOpacity>
                    </View>
                    <View style={[
                      styles.usernameUnderline,
                      usernameStatus === 'available' && { backgroundColor: '#4be277' },
                      usernameStatus === 'taken' && { backgroundColor: '#ffb4ab' },
                    ]} />
                    {renderStatus()}
                  </View>
                  )}

                  {step === 3 && <View style={styles.cardDivider} />}

                  {step === 3 && (
                  <View style={styles.locationFieldsContainer}>
                    <TouchableOpacity
                      style={styles.dropdownTrigger}
                      onPress={() => setIsProvinceModalOpen(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cardInputLabel}>LOKASI (PROVINSI)</Text>
                      <View style={styles.dropdownContent}>
                        <Text style={styles.dropdownValueText}>{selectedProvince}</Text>
                        <MaterialIcons name="expand-more" size={22} color="#869585" />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.dropdownTrigger}
                      onPress={() => {
                        setRegionSearch('');
                        setIsRegionModalOpen(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cardInputLabel}>KABUPATEN/KOTA</Text>
                      <View style={styles.dropdownContent}>
                        <Text style={styles.dropdownValueText}>{region.replace(', ID', '')}</Text>
                        <MaterialIcons name="expand-more" size={22} color="#869585" />
                      </View>
                    </TouchableOpacity>
                  </View>
                  )}
                </View>
              </View>

              {step === 1 && (
              <TouchableOpacity
                style={styles.termsBox}
                activeOpacity={0.8}
                onPress={() => setTermsAccepted(!termsAccepted)}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && (
                    <MaterialIcons name="check" size={14} color="#002109" />
                  )}
                </View>
                <Text style={styles.termsText}>
                  Saya menyetujui <Text style={styles.termsLink}>Syarat & Ketentuan</Text> serta penggunaan data untuk profil atlet professional saya.
                </Text>
              </TouchableOpacity>
              )}
            </View>
          ) : (
            /* ──────────────────────────────────────────────────────────────────
               STEP 2: OLAHRAGA APA YANG KAMU SUKA? (SPORTS PREFERENCE)
               ────────────────────────────────────────────────────────────────── */
            <View>
              {/* Heading */}
              <View style={styles.sectionHeadingCenter}>
                <Text style={styles.stepEyebrow}>LANGKAH {step}/{TOTAL_STEPS}</Text>
                <Text style={styles.headingBig}>OLAHRAGA APA YANG KAMU SUKA?</Text>
                <Text style={styles.headingSub}>Pilih minimal 1, boleh lebih.</Text>
              </View>

              {/* Bento Chips Grid */}
              <View style={styles.bentoGrid}>
                {SPORTS.map((sport) => {
                  const isSelected = selectedSports.includes(sport.id);
                  return (
                    <TouchableOpacity
                      key={sport.id}
                      style={[styles.bentoBox, isSelected && styles.bentoBoxSelected]}
                      onPress={() => toggleSport(sport.id)}
                      activeOpacity={0.85}
                    >
                      <MaterialIcons
                        name={sport.icon}
                        size={40}
                        color={isSelected ? '#002109' : '#bccbb9'}
                        style={styles.bentoIcon}
                      />
                      <Text style={[styles.bentoLabel, isSelected && styles.bentoLabelSelected]}>
                        {sport.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.bentoSelectedGlow} pointerEvents="none" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Lower Card Preview card block */}
              <View style={styles.previewBox}>
                <View style={styles.previewContent}>
                  <View style={styles.previewAvatarBorder}>
                    <Image source={{ uri: avatarUrl }} style={styles.previewAvatarImg} />
                  </View>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewTitle}>KARTU PEMAIN</Text>
                    <Text style={styles.previewSubtitle}>Hampir siap untuk bertanding!</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* submit error banner */}
          {submitError && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color="#ffb4ab" />
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}

          {/* Spacer block */}
          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* ── Persistent Bottom CTA ── */}
      <View style={styles.footer}>
        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
          {step < 4 ? (
            <TouchableOpacity
              style={[styles.stampButton, !canGoNext && styles.stampButtonDisabled]}
              onPress={handleNextStep}
              disabled={!canGoNext}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaText, !canGoNext && styles.ctaTextDisabled]}>
                Lanjut
              </Text>
              <MaterialIcons
                name="arrow-forward"
                size={22}
                color={canGoNext ? '#002109' : '#3d4a3d'}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.stampButton, !canSubmit && styles.stampButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#002109" />
              ) : (
                <View style={styles.ctaContent}>
                  <Text style={[styles.ctaText, !canSubmit && styles.ctaTextDisabled]}>
                    Aktifkan Kartu
                  </Text>
                  <MaterialIcons
                    name="rocket-launch"
                    size={22}
                    color={canSubmit ? '#002109' : '#3d4a3d'}
                    style={{ marginLeft: 8 }}
                  />
                </View>
              )}
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>


      <Modal
        visible={isProvinceModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsProvinceModalOpen(false)}
      >
        <View style={styles.modalBackdropHorizontal}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setIsProvinceModalOpen(false)} />
          <View style={styles.modalContainerRegion}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PILIH PROVINSI</Text>
              <TouchableOpacity onPress={() => setIsProvinceModalOpen(false)}>
                <MaterialIcons name="close" size={24} color="#e5e2e1" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalDivider} />

            <ScrollView style={styles.regionList} showsVerticalScrollIndicator={true}>
              {PROVINCES.map((prov) => (
                <TouchableOpacity
                  key={prov}
                  style={[styles.regionItem, selectedProvince === prov && styles.regionItemSelected]}
                  onPress={() => {
                    setSelectedProvince(prov);
                    // Default to first city of selected province
                    setRegion(CITIES_BY_PROVINCE[prov][0]);
                    setIsProvinceModalOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.regionItemText, selectedProvince === prov && styles.regionItemTextSelected]}>
                    {prov}
                  </Text>
                  {selectedProvince === prov && (
                    <MaterialIcons name="check" size={18} color="#4be277" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Region Selection Modal (Cities) ── */}
      <Modal
        visible={isRegionModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsRegionModalOpen(false)}
      >
        <View style={styles.modalBackdropHorizontal}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setIsRegionModalOpen(false)} />
          <View style={[styles.modalContainerRegion, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PILIH KABUPATEN / KOTA</Text>
              <TouchableOpacity onPress={() => setIsRegionModalOpen(false)}>
                <MaterialIcons name="close" size={24} color="#e5e2e1" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalDivider} />

            {/* Search Input Box */}
            <View style={styles.regionSearchWrapper}>
              <MaterialIcons name="search" size={20} color="#869585" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.regionSearchInput}
                placeholder="Cari kabupaten/kota..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={regionSearch}
                onChangeText={setRegionSearch}
                autoCorrect={false}
              />
            </View>

            <ScrollView style={styles.regionList} showsVerticalScrollIndicator={true}>
              {filteredKabupatens.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.regionItem, region === item && styles.regionItemSelected]}
                  onPress={() => {
                    setRegion(item);
                    setIsRegionModalOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.regionItemText, region === item && styles.regionItemTextSelected]}>
                    {item.replace(', ID', '')}
                  </Text>
                  {region === item && (
                    <MaterialIcons name="check" size={18} color="#4be277" />
                  )}
                </TouchableOpacity>
              ))}
              {filteredKabupatens.length === 0 && (
                <View style={styles.emptyRegion}>
                  <Text style={styles.emptyRegionText}>Kabupaten tidak ditemukan</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Premium Glassmorphism Styles (Colors: #4be277 Green, #131313 Dark Background)
// ────────────────────────────────────────────────────────────────────────────
const GREEN = '#4be277';
const DARK  = '#131313';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },

  // Glowing Top Progress Line
  progressBarWrapper: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
    backgroundColor: '#201f1f', zIndex: 60,
  },
  progressBar: {
    height: '100%', backgroundColor: GREEN,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6, shadowRadius: 8,
  },

  // Atmospheric glows
  glowTopLeft: {
    position: 'absolute', top: '-15%', left: '-15%',
    width: '65%', height: '55%',
    backgroundColor: GREEN, borderRadius: 9999,
    opacity: 0.12,
  },
  glowBottomRight: {
    position: 'absolute', bottom: '-15%', right: '-15%',
    width: '60%', height: '60%',
    backgroundColor: '#22c55e', borderRadius: 9999,
    opacity: 0.12,
  },
  radialOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19,19,19,0.85)',
  },

  // Header styles
  fixedHeader: {
    position: 'absolute', top: 4, left: 0, right: 0, zIndex: 50,
    height: 48,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(19,19,19,0.4)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLeftDisabled: { opacity: 0.35 },
  headerTitle: {
    fontSize: 16, fontWeight: '800', color: GREEN, letterSpacing: -0.5,
    fontStyle: 'italic', textTransform: 'uppercase'
  },
  headerGoal: {
    fontSize: 22, fontWeight: '900', color: GREEN, fontStyle: 'italic',
    letterSpacing: -1, opacity: 0.25,
  },

  // Scroll View Container
  scrollContent: { paddingTop: 72, paddingHorizontal: 16, paddingBottom: 100 },

  // Heading styles
  sectionHeading: { marginBottom: 12 },
  stepEyebrow: { fontSize: 10, color: GREEN, fontWeight: '900', letterSpacing: 1.6, marginBottom: 4 },
  headingBig: { fontSize: 18, fontWeight: '900', color: '#e5e2e1', textTransform: 'uppercase', letterSpacing: -0.5 },
  headingSub: { fontSize: 12, color: '#bccbb9', marginTop: 2, fontWeight: '500', opacity: 0.8 },

  sectionHeadingCenter: { marginBottom: 14, alignItems: 'center' },

  // Player Card Frame matching cabor look
  card: {
    backgroundColor: 'rgba(30,30,30,0.65)',
    borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
    marginBottom: 12,
  },
  cardPadding: { padding: 14 },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  scanline: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: 'rgba(75,226,119,0.25)',
    zIndex: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 11, fontWeight: '700', color: GREEN,
    letterSpacing: 2, textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 20, fontWeight: '900', color: '#fff', opacity: 0.9,
    letterSpacing: 0.5,
  },
  qrIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#353534',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardDivider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 10,
  },

  // Card Content inputs
  topFormRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 10 },
  avatarWrapper: { width: 76, height: 76, position: 'relative' },
  avatarPulseBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12,
    borderWidth: 2, borderColor: GREEN,
  },
  avatarImg: { width: 76, height: 76, borderRadius: 12 },
  lvlBadge: {
    position: 'absolute', bottom: -6, right: -6,
    backgroundColor: GREEN, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  lvlText: { fontSize: 9, fontWeight: '900', color: '#002109', letterSpacing: 0.5 },
  barcodeContainer: { flex: 1, height: 100, justifyContent: 'center', alignItems: 'center'},
  
  // Age Box style
  ageContainer: { flex: 1, justifyContent: 'center' },
  ageInput: {
    backgroundColor: '#201f1f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 48,
    fontSize: 22,
    fontWeight: '900',
    color: GREEN,
    textAlign: 'center',
    marginTop: 4,
  },

  // Input styling
  cardInputLabel: { fontSize: 10, color: '#869585', fontWeight: '800', letterSpacing: 1.0, textTransform: 'uppercase' },
  
  usernameCardSection: { marginTop: 2 },
  usernameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    height: 38,
  },
  usernameInput: {
    color: '#fff', fontSize: 15, fontWeight: '900',
    textTransform: 'uppercase', letterSpacing: 0.5,
    flex: 1,
    height: '100%',
    padding: 0,
  },
  randomButton: {
    padding: 8,
  },
  usernameUnderline: {
    height: 2, backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 6, borderRadius: 1,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },

  // Location dropdown elements
  locationFieldsContainer: { gap: 8 },
  dropdownTrigger: {
    backgroundColor: '#201f1f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  dropdownValueText: { fontSize: 14, color: '#fff', fontWeight: '700' },

  // Terms and conditions
  termsBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(14,14,14,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 10, marginBottom: 8,
  },
  checkbox: {
    width: 18, height: 18, borderRadius: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  termsText: { fontSize: 11, color: '#bccbb9', flex: 1, lineHeight: 15 },
  termsLink: { color: GREEN, textDecorationLine: 'underline' },

  // STEP 2 styles (Hobi Olahraga)
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  bentoBox: {
    width: '48%',
    height: 88,
    backgroundColor: 'rgba(30, 30, 30, 0.5)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  bentoBoxSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  bentoIcon: {
    marginBottom: 6,
  },
  bentoLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#bccbb9',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bentoLabelSelected: {
    color: '#002109',
  },
  bentoSelectedGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 18,
  },

  // Sport card preview at the bottom of Stage 2
  previewBox: {
    backgroundColor: 'rgba(30,30,30,0.5)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    marginTop: 6,
  },
  previewContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewAvatarBorder: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: GREEN, overflow: 'hidden',
  },
  previewAvatarImg: { width: '100%', height: '100%' },
  previewInfo: { flex: 1 },
  previewTitle: { fontSize: 13, color: '#fff', fontWeight: '900' },
  previewSubtitle: { fontSize: 11, color: '#bccbb9', opacity: 0.8 },

  // Submit error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(58,13,16,0.85)',
    borderLeftWidth: 3, borderLeftColor: '#ffb4ab',
    borderRadius: 10, padding: 14, marginVertical: 10,
  },
  errorText: { color: '#ffb4ab', fontSize: 13, flex: 1 },

  // Bottom Fixed CTA Bar
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  stampButton: {
    flexDirection: 'row',
    height: 50, borderRadius: 14,
    backgroundColor: GREEN,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: GREEN, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 18, elevation: 8,
  },
  stampButtonDisabled: {
    backgroundColor: '#1d3da3', // faint dim color
    opacity: 0.4,
    shadowOpacity: 0, elevation: 0,
  },
  ctaContent: { flexDirection: 'row', alignItems: 'center' },
  ctaText: {
    fontSize: 18, fontWeight: '900', color: '#002109',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  ctaTextDisabled: { color: '#3d4a3d' },

  // Modals Overlay Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBackdropHorizontal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContainerRegion: {
    backgroundColor: 'rgba(30, 30, 30, 0.98)',
    borderWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 22,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: GREEN,
    letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  modalSub: {
    fontSize: 13,
    color: '#bccbb9',
    marginBottom: 16,
    opacity: 0.8,
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  avatarGridItem: {
    width: 86,
    height: 86,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarGridItemSelected: {
    borderColor: GREEN,
  },
  avatarGridImg: {
    width: '100%',
    height: '100%',
  },
  avatarGridItemBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: GREEN,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: GREEN,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DARK,
  },
  regionSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
  },
  regionSearchInput: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
    padding: 0,
  },
  regionList: {
    maxHeight: 260,
  },
  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  regionItemSelected: {
    backgroundColor: 'rgba(75, 226, 119, 0.08)',
    borderRadius: 8,
  },
  regionItemText: {
    fontSize: 14,
    color: '#bccbb9',
    fontWeight: '500',
  },
  regionItemTextSelected: {
    color: GREEN,
    fontWeight: '800',
  },
  emptyRegion: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyRegionText: {
    fontSize: 13,
    color: '#869585',
  },
}) as any;
