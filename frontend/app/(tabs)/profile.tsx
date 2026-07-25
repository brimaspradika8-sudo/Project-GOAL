import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
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
import ThemeToggle from '../../components/ThemeToggle';
import { useTheme } from '../../lib/theme';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useToastStore } from '../../store/toastStore';

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
  const { colors, resolved } = useTheme();
  const isDarkMode = resolved === 'dark';
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
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
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Pengajuan owner berhasil dikirim. Menunggu persetujuan admin.' });
    } catch {
      setSubmitError('Gagal terhubung ke server.');
    } finally {
      setSubmitting(false);
    }
  }

  const handleSignOut = () => {
    setShowLogoutConfirm(true);
  };

  const doActualLogout = async () => {
    setLogoutLoading(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      await AsyncStorage.removeItem(TOKEN_KEY);
      await clearProfile();
      router.replace('/login');
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: 'Terjadi kesalahan saat keluar akun.' });
    } finally {
      setLogoutLoading(false);
    }
  };

  const role = profile?.role;
  const isDesktop = width >= 900;
  const cardSurface = isDarkMode ? '#1E293B' : colors.surfaceWhite;
  const ownerGreenSurface = isDarkMode ? '#1E293B' : '#f0fdf4';
  const ownerGreenBorder = isDarkMode ? colors.divider : '#bbf7d0';
  const ownerRedSurface = isDarkMode ? '#2A1F26' : '#fef2f2';
  const ownerRedBorder = isDarkMode ? colors.divider : '#fecaca';
  const ownerYellowSurface = isDarkMode ? '#2B2418' : '#fffbeb';
  const ownerYellowBorder = isDarkMode ? colors.divider : '#fde68a';

  function renderOwnerSection() {
    if (role === 'player') {
      if (ownerStatus === 'pending') {
        return (
          <View style={[styles.ownerCard, styles.pendingCard, { backgroundColor: ownerYellowSurface, borderColor: ownerYellowBorder }]}>
            <View style={styles.ownerCardLeft}>
              <View style={[styles.ownerIconBox, { backgroundColor: '#fef3c7' }]}>
                <MaterialIcons name="hourglass-top" size={20} color="#d97706" />
              </View>
              <View style={styles.ownerCardInfo}>
                <Text style={[styles.ownerCardTitle, { color: colors.text }]}>Pengajuan Owner</Text>
                <Text style={[styles.ownerCardDesc, { color: colors.textSecondary }]}>Menunggu persetujuan admin...</Text>
              </View>
            </View>
          </View>
        );
      }

      if (ownerStatus === 'rejected') {
        return (
          <TouchableOpacity style={[styles.ownerCard, styles.rejectedCard, { backgroundColor: ownerRedSurface, borderColor: ownerRedBorder }]} activeOpacity={0.8} onPress={() => setShowOwnerModal(true)}>
            <View style={styles.ownerCardLeft}>
              <View style={[styles.ownerIconBox, { backgroundColor: isDarkMode ? '#3B1A1A' : colors.errorLight }]}>
                <MaterialIcons name="cancel" size={20} color={colors.error} />
              </View>
              <View style={styles.ownerCardInfo}>
                <Text style={[styles.ownerCardTitle, { color: colors.text }]}>Pengajuan Ditolak</Text>
                <Text style={[styles.ownerCardDesc, { color: colors.textSecondary }]}>{ownerRequestData?.rejection_reason ?? 'Ketuk untuk ajukan ulang.'}</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.error} />
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity style={[styles.ownerCard, styles.ownerActionCard, { backgroundColor: ownerGreenSurface, borderColor: ownerGreenBorder }]} activeOpacity={0.8} onPress={() => setShowOwnerModal(true)}>
          <View style={styles.ownerCardLeft}>
            <View style={[styles.ownerIconBox, { backgroundColor: isDarkMode ? colors.surfaceContainerHigh : colors.successLight }]}>
              <MaterialIcons name="store" size={20} color={colors.primary} />
            </View>
            <View style={styles.ownerCardInfo}>
              <Text style={[styles.ownerCardTitle, { color: colors.text }]}>Ajukan Jadi Owner</Text>
              <Text style={[styles.ownerCardDesc, { color: colors.textSecondary }]}>Kelola lapangan Anda sendiri.</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      );
    }

    if (role === 'owner') {
      return (
        <TouchableOpacity
          style={[styles.ownerCard, styles.approvedCard, { backgroundColor: ownerGreenSurface, borderColor: ownerGreenBorder }]}
          onPress={() => router.push('/(owner)/fields' as any)}
        >
          <View style={styles.ownerCardLeft}>
            <View style={[styles.ownerIconBox, { backgroundColor: isDarkMode ? colors.surfaceContainerHigh : colors.successLight }]}>
              <MaterialIcons name="stadium" size={20} color={colors.primary} />
            </View>
            <View style={styles.ownerCardInfo}>
              <Text style={[styles.ownerCardTitle, { color: colors.text }]}>Lapangan Saya</Text>
              <Text style={[styles.ownerCardDesc, { color: colors.textSecondary }]}>Kelola lapangan yang Anda miliki.</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      );
    }

    if (role === 'admin' || role === 'super_admin') {
      return (
        <>
          <TouchableOpacity
            style={[styles.ownerCard, styles.approvedCard, { backgroundColor: ownerGreenSurface, borderColor: ownerGreenBorder }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/my-fields')}
          >
            <View style={styles.ownerCardLeft}>
              <View style={[styles.ownerIconBox, { backgroundColor: isDarkMode ? colors.surfaceContainerHigh : colors.successLight }]}>
                <MaterialIcons name="stadium" size={20} color={colors.primary} />
              </View>
              <View style={styles.ownerCardInfo}>
                <Text style={[styles.ownerCardTitle, { color: colors.text }]}>Kelola Lapangan</Text>
                <Text style={[styles.ownerCardDesc, { color: colors.textSecondary }]}>Lihat dan kelola semua lapangan.</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {role === 'super_admin' && (
            <TouchableOpacity
              style={[styles.ownerCard, { backgroundColor: isDarkMode ? cardSurface : '#f5f3ff', borderColor: isDarkMode ? colors.divider : '#c4b5fd' }]}
              activeOpacity={0.8}
              onPress={() => router.push('/(admin)/dashboard')}
            >
              <View style={styles.ownerCardLeft}>
                <View style={[styles.ownerIconBox, { backgroundColor: '#ede9fe' }]}>
                  <MaterialIcons name="admin-panel-settings" size={20} color="#7c3aed" />
                </View>
              <View style={styles.ownerCardInfo}>
                  <Text style={[styles.ownerCardTitle, { color: colors.text }]}>Panel Super Admin</Text>
                  <Text style={[styles.ownerCardDesc, { color: colors.textSecondary }]}>Approve field dan owner request.</Text>
              </View>
            </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </>
      );
    }

    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.pageShell}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.pageTitle, { color: isDarkMode ? '#FFFFFF' : colors.text }]}>Profil</Text>
          <ThemeToggle />
        </View>

        <View style={[styles.profileGrid, isDesktop && styles.profileGridDesktop]}>
        <View style={styles.profileColumn}>
        <View style={[styles.profileCard, { backgroundColor: isDarkMode ? '#1E293B' : colors.surfaceWhite, borderColor: colors.divider }]}>
          <Image
            source={{ uri: profile?.avatar_url || 'https://api.dicebear.com/7.x/bottts/png?seed=goal&backgroundColor=ffffff&textColor=00A651' }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{profile?.full_name ?? profile?.username ?? 'Pengguna'}</Text>
            {profile?.username ? <Text style={[styles.profileHandle, { color: colors.textSecondary }]}>@{profile.username}</Text> : null}
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={14} color={colors.textSecondary} />
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>{profile?.region ?? 'Belum diatur'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.8} onPress={() => router.push('/onboarding')}>
            <MaterialIcons name="edit" size={16} color={COLORS.onPrimary} />
          </TouchableOpacity>
        </View>

        {profile?.role && (
          <View style={[styles.roleBadge, { backgroundColor: isDarkMode ? '#1E293B' : colors.surfaceWhite, borderColor: colors.divider }]}>
            <MaterialIcons
              name={profile.role === 'super_admin' ? 'shield' : profile.role === 'admin' ? 'admin-panel-settings' : profile.role === 'owner' ? 'store' : 'person'}
              size={14}
              color={COLORS.primary}
            />
            <Text style={[styles.roleBadgeText, { color: colors.text }]}>{profile.role === 'super_admin' ? 'SUPER ADMIN' : profile.role === 'owner' ? 'OWNER' : profile.role.toUpperCase()}</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>OLAHRAGA</Text>
        <View style={[styles.sportsCard, { backgroundColor: isDarkMode ? '#1E293B' : colors.surfaceWhite, borderColor: colors.divider }]}>
          {profile?.sports?.length ? (
            <View style={styles.tagsRow}>
              {profile.sports.map((sport: string) => (
                <View key={sport} style={[styles.tagChip, { backgroundColor: isDarkMode ? colors.surfaceContainerHigh : '#e6f4ea' }]}>
                  <MaterialIcons name={(SPORT_ICONS[sport] ?? 'sports') as any} size={14} color={colors.primary} />
                  <Text style={[styles.tagText, { color: isDarkMode ? '#FFFFFF' : '#0f5132' }]}>{sport.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Belum ada preferensi olahraga.</Text>
          )}
        </View>
        </View>

        <View style={styles.profileColumn}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>AKUN</Text>
        {renderOwnerSection()}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PENGATURAN</Text>
        <View style={[styles.settingsCard, { backgroundColor: isDarkMode ? '#1E293B' : colors.surfaceWhite, borderColor: colors.divider }]}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={() => router.push('/onboarding')}>
            <View style={[styles.settingIconBox, { backgroundColor: isDarkMode ? colors.surfaceContainerHigh : '#ecfdf5' }]}>
              <MaterialIcons name="person-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Ubah Profil</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={() => useToastStore.getState().show({ type: 'info', title: 'Segera Hadir', description: 'Fitur notifikasi akan segera tersedia.' })}>
            <View style={[styles.settingIconBox, { backgroundColor: isDarkMode ? colors.surfaceContainerHigh : '#ecfdf5' }]}>
              <MaterialIcons name="notifications-none" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Notifikasi</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={() => router.push('/change-password')}>
            <View style={[styles.settingIconBox, { backgroundColor: isDarkMode ? colors.surfaceContainerHigh : '#ecfdf5' }]}>
              <MaterialIcons name="lock-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Ubah Kata Sandi</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={() => useToastStore.getState().show({ type: 'info', title: 'Segera Hadir', description: 'Pusat bantuan akan segera tersedia.' })}>
            <View style={[styles.settingIconBox, { backgroundColor: isDarkMode ? colors.surfaceContainerHigh : '#ecfdf5' }]}>
              <MaterialIcons name="help-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Pusat Bantuan</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
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

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Keluar Akun"
        description="Yakin ingin keluar dari akun?"
        confirmLabel="Keluar"
        destructive
        loading={logoutLoading}
        onConfirm={doActualLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
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
    maxWidth: 720,
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
    backgroundColor: '#e6f4ea',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 0,
  },
  tagText: {
    ...FONTS.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f5132',
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
    borderRadius: 14,
    borderWidth: 0,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  signOutText: {
    ...FONTS.bodyMd,
    fontWeight: '700',
    color: '#dc2626',
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
