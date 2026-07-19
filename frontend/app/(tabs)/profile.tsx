import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useProfileStore } from '../../store/profileStore';
import { TOKEN_KEY } from '../_layout';
import { API_BASE_URL } from '../../lib/api';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../components/goalTheme';
import AuthInput from '../../components/AuthInput';

const SPORT_ICONS: Record<string, string> = {
  futsal: 'sports-soccer',
  basketball: 'sports-basketball',
  badminton: 'sports-tennis',
  volleyball: 'sports-volleyball',
  minisoccer: 'sports-soccer',
  tennis: 'sports-tennis',
  tabletennis: 'sports',
  others: 'more-horiz',
};

type OwnerRequestStatus = 'none' | 'pending' | 'approved' | 'rejected';

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const { profile, clearProfile, fetchProfile } = useProfileStore();
  const [ownerStatus, setOwnerStatus] = useState<OwnerRequestStatus>('none');
  const [ownerRequestData, setOwnerRequestData] = useState<any>(null);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', business_name: '', address: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOwnerStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(`${API_BASE_URL}/me/owner-request`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.status) {
        setOwnerStatus(data.status);
        setOwnerRequestData(data);
      } else {
        setOwnerStatus('none');
      }
    } catch {
      // network error — silent
    }
  }, []);

  useEffect(() => {
    fetchOwnerStatus();
  }, [fetchOwnerStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchOwnerStatus()]);
    setRefreshing(false);
  }, [fetchProfile, fetchOwnerStatus]);

  useEffect(() => {
    if (profile) {
      setOwnerForm((prev) => ({
        ...prev,
        name: profile.full_name || '',
        email: profile.email || '',
      }));
    }
  }, [profile]);

  async function handleSubmitOwner() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/me/owner-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ownerForm),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.errors
          ? Object.values(data.errors).flat().join(' ')
          : data.message || 'Gagal mengirim pengajuan.';
        setSubmitError(msg);
        return;
      }
      setShowOwnerModal(false);
      setOwnerStatus('pending');
      setOwnerRequestData(data);
      Alert.alert('Berhasil', 'Pengajuan owner berhasil dikirim. Menunggu persetujuan admin.');
    } catch {
      setSubmitError('Gagal terhubung ke server.');
    } finally {
      setSubmitting(false);
    }
  }

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Yakin ingin keluar dari akun?')) {
        AsyncStorage.removeItem(TOKEN_KEY);
        clearProfile();
        router.replace('/login');
      }
      return;
    }

    Alert.alert('Keluar Akun', 'Yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            if (token) {
              await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              }).catch(() => {});
            }
            await AsyncStorage.removeItem(TOKEN_KEY);
            clearProfile();
            router.replace('/login');
          } catch {
            Alert.alert('Gagal', 'Terjadi kesalahan saat keluar akun.');
          }
        },
      },
    ]);
  };

  const role = profile?.role;
  const isDesktop = width >= 900;

  function renderOwnerSection() {
    if (role === 'player') {
      if (ownerStatus === 'pending') {
        return (
          <View style={[styles.ownerCard, styles.pendingCard]}>
            <View style={styles.ownerCardLeft}>
              <View style={[styles.ownerIconBox, { backgroundColor: '#fef3c7' }]}>
                <MaterialIcons name="hourglass-top" size={20} color="#d97706" />
              </View>
              <View style={styles.ownerCardInfo}>
                <Text style={styles.ownerCardTitle}>Pengajuan Owner</Text>
                <Text style={styles.ownerCardDesc}>Menunggu persetujuan admin...</Text>
              </View>
            </View>
          </View>
        );
      }

      if (ownerStatus === 'rejected') {
        return (
          <TouchableOpacity style={[styles.ownerCard, styles.rejectedCard]} activeOpacity={0.8} onPress={() => setShowOwnerModal(true)}>
            <View style={styles.ownerCardLeft}>
              <View style={[styles.ownerIconBox, { backgroundColor: COLORS.errorLight }]}>
                <MaterialIcons name="cancel" size={20} color={COLORS.error} />
              </View>
              <View style={styles.ownerCardInfo}>
                <Text style={styles.ownerCardTitle}>Pengajuan Ditolak</Text>
                <Text style={styles.ownerCardDesc}>{ownerRequestData?.rejection_reason ?? 'Ketuk untuk ajukan ulang.'}</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.error} />
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity style={[styles.ownerCard, styles.ownerActionCard]} activeOpacity={0.8} onPress={() => setShowOwnerModal(true)}>
          <View style={styles.ownerCardLeft}>
            <View style={[styles.ownerIconBox, { backgroundColor: COLORS.successLight }]}>
              <MaterialIcons name="store" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.ownerCardInfo}>
              <Text style={styles.ownerCardTitle}>Ajukan Jadi Owner</Text>
              <Text style={styles.ownerCardDesc}>Kelola lapangan Anda sendiri.</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      );
    }

    if (role === 'owner') {
      return (
        <TouchableOpacity
          style={[styles.ownerCard, styles.approvedCard]}
          onPress={() => router.push('/(owner)/fields' as any)}
        >
          <View style={styles.ownerCardLeft}>
            <View style={[styles.ownerIconBox, { backgroundColor: COLORS.successLight }]}>
              <MaterialIcons name="stadium" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.ownerCardInfo}>
              <Text style={styles.ownerCardTitle}>Lapangan Saya</Text>
              <Text style={styles.ownerCardDesc}>Kelola lapangan yang Anda miliki.</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      );
    }

    if (role === 'admin' || role === 'super_admin') {
      return (
        <>
          <TouchableOpacity
            style={[styles.ownerCard, styles.approvedCard]}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/my-fields')}
          >
            <View style={styles.ownerCardLeft}>
              <View style={[styles.ownerIconBox, { backgroundColor: COLORS.successLight }]}>
                <MaterialIcons name="stadium" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.ownerCardInfo}>
                <Text style={styles.ownerCardTitle}>Kelola Lapangan</Text>
                <Text style={styles.ownerCardDesc}>Lihat dan kelola semua lapangan.</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {role === 'super_admin' && (
            <TouchableOpacity
              style={[styles.ownerCard, { backgroundColor: '#f5f3ff', borderColor: '#c4b5fd' }]}
              activeOpacity={0.8}
              onPress={() => router.push('/(admin)/dashboard')}
            >
              <View style={styles.ownerCardLeft}>
                <View style={[styles.ownerIconBox, { backgroundColor: '#ede9fe' }]}>
                  <MaterialIcons name="admin-panel-settings" size={20} color="#7c3aed" />
                </View>
                <View style={styles.ownerCardInfo}>
                  <Text style={styles.ownerCardTitle}>Panel Super Admin</Text>
                  <Text style={styles.ownerCardDesc}>Approve field dan owner request.</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </>
      );
    }

    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.pageShell}>
        <Text style={styles.pageTitle}>Profil</Text>

        <View style={[styles.profileGrid, isDesktop && styles.profileGridDesktop]}>
        <View style={styles.profileColumn}>
        <View style={styles.profileCard}>
          <Image
            source={{ uri: profile?.avatar_url || 'https://api.dicebear.com/7.x/bottts/png?seed=goal&backgroundColor=ffffff&textColor=00A651' }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name ?? profile?.username ?? 'Pengguna'}</Text>
            {profile?.username ? <Text style={styles.profileHandle}>@{profile.username}</Text> : null}
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={14} color={COLORS.textSecondary} />
              <Text style={styles.locationText}>{profile?.region ?? 'Belum diatur'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.8} onPress={() => router.push('/onboarding')}>
            <MaterialIcons name="edit" size={16} color={COLORS.onPrimary} />
          </TouchableOpacity>
        </View>

        {profile?.role && (
          <View style={styles.roleBadge}>
            <MaterialIcons
              name={profile.role === 'super_admin' ? 'shield' : profile.role === 'admin' ? 'admin-panel-settings' : profile.role === 'owner' ? 'store' : 'person'}
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.roleBadgeText}>{profile.role === 'super_admin' ? 'SUPER ADMIN' : profile.role === 'owner' ? 'OWNER' : profile.role.toUpperCase()}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>OLAHRAGA</Text>
        <View style={styles.sportsCard}>
          {profile?.sports?.length ? (
            <View style={styles.tagsRow}>
              {profile.sports.map((sport: string) => (
                <View key={sport} style={styles.tagChip}>
                  <MaterialIcons name={(SPORT_ICONS[sport] ?? 'sports') as any} size={14} color={COLORS.primary} />
                  <Text style={styles.tagText}>{sport.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Belum ada preferensi olahraga.</Text>
          )}
        </View>
        </View>

        <View style={styles.profileColumn}>
        <Text style={styles.sectionTitle}>AKUN</Text>
        {renderOwnerSection()}

        <Text style={styles.sectionTitle}>PENGATURAN</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={() => router.push('/onboarding')}>
            <View style={styles.settingIconBox}>
              <MaterialIcons name="person-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingLabel}>Ubah Profil</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.outline} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={() => Alert.alert('Segera Hadir', 'Fitur notifikasi akan segera tersedia.')}>
            <View style={styles.settingIconBox}>
              <MaterialIcons name="notifications-none" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingLabel}>Notifikasi</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.outline} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={() => router.push('/change-password')}>
            <View style={styles.settingIconBox}>
              <MaterialIcons name="lock-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingLabel}>Ubah Kata Sandi</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.outline} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={() => Alert.alert('Segera Hadir', 'Pusat bantuan akan segera tersedia.')}>
            <View style={styles.settingIconBox}>
              <MaterialIcons name="help-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingLabel}>Pusat Bantuan</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.outline} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={20} color={COLORS.error} />
          <Text style={styles.signOutText}>Keluar Akun</Text>
        </TouchableOpacity>

        <Text style={styles.version}>GOAL v1.0.0</Text>
        </View>
        </View>
        </View>
      </ScrollView>

      <Modal visible={showOwnerModal} transparent animationType="slide" onRequestClose={() => setShowOwnerModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowOwnerModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Ajukan Jadi Owner</Text>
            <Text style={styles.modalSubtitle}>Isi data usaha Anda untuk menjadi owner lapangan.</Text>

            {submitError ? (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{submitError}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <AuthInput
                label="Nama Lengkap"
                icon="person-outline"
                value={ownerForm.name}
                onChangeText={(value) => setOwnerForm((prev) => ({ ...prev, name: value }))}
                containerStyle={styles.inputContainer}
              />
              <AuthInput
                label="Email"
                icon="mail-outline"
                value={ownerForm.email}
                onChangeText={(value) => setOwnerForm((prev) => ({ ...prev, email: value }))}
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={styles.inputContainer}
              />
              <AuthInput
                label="Nama Usaha"
                icon="store"
                value={ownerForm.business_name}
                onChangeText={(value) => setOwnerForm((prev) => ({ ...prev, business_name: value }))}
                containerStyle={styles.inputContainer}
              />
              <AuthInput
                label="Alamat"
                icon="location-on"
                value={ownerForm.address}
                onChangeText={(value) => setOwnerForm((prev) => ({ ...prev, address: value }))}
                containerStyle={styles.inputContainer}
              />
              <AuthInput
                label="Nomor Telepon"
                icon="phone"
                value={ownerForm.phone}
                onChangeText={(value) => setOwnerForm((prev) => ({ ...prev, phone: value }))}
                keyboardType="phone-pad"
                containerStyle={styles.inputContainer}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowOwnerModal(false)} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSubmitOwner} disabled={submitting} activeOpacity={0.8}>
                {submitting ? <ActivityIndicator color={COLORS.onPrimary} /> : <Text style={styles.submitText}>Kirim Pengajuan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageShell: {
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
  },
  profileGrid: {
    gap: 0,
  },
  profileGridDesktop: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  profileColumn: {
    flex: 1,
  },
  pageTitle: {
    ...FONTS.headlineLg,
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 18,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainer,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    ...FONTS.headlineSm,
    fontSize: 17,
    color: COLORS.text,
    marginBottom: 2,
  },
  profileHandle: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  roleBadgeText: {
    ...FONTS.labelMd,
    color: COLORS.text,
  },
  sectionTitle: {
    ...FONTS.labelMd,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  sportsCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 14,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  tagText: {
    ...FONTS.labelMd,
    fontSize: 11,
    color: COLORS.primary,
  },
  emptyText: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  ownerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  ownerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerCardInfo: {
    flex: 1,
  },
  ownerCardTitle: {
    ...FONTS.headlineSm,
    fontSize: 14,
    color: COLORS.text,
  },
  ownerCardDesc: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pendingCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  approvedCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  rejectedCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  ownerActionCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  settingsCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingVertical: 4,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  settingIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    flex: 1,
    ...FONTS.bodyMd,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginHorizontal: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1.5,
    borderColor: COLORS.errorLight,
    paddingVertical: 15,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: COLORS.surfaceWhite,
  },
  signOutText: {
    ...FONTS.bodyMd,
    fontWeight: '700',
    color: COLORS.error,
  },
  version: {
    ...FONTS.bodySm,
    color: COLORS.outline,
    textAlign: 'center',
    marginBottom: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surfaceWhite,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingTop: 12,
    maxHeight: '85%',
    ...SHADOWS.xl,
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.outlineVariant,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...FONTS.headlineMd,
    fontSize: 20,
    color: COLORS.text,
  },
  modalSubtitle: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 18,
  },
  inputContainer: {
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 14,
    marginBottom: 14,
  },
  errorText: {
    color: COLORS.error,
    ...FONTS.bodySm,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.surfaceWhite,
    alignItems: 'center',
  },
  cancelText: {
    ...FONTS.bodyMd,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    ...SHADOWS.primary,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitText: {
    ...FONTS.bodyMd,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
});
