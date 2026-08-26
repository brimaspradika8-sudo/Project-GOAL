import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useProfileStore } from '../../store/profileStore';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useToastStore } from '../../store/toastStore';
import { useTheme } from '../../lib/theme';
import { logout } from '../../lib/session';
import { useIsMobileWeb } from '../../lib/responsive';
import { apiFetch } from '../../lib/apiClient';

export default function SuperAdminProfilePage() {
  const { profile } = useProfileStore();
  const { colors, mode, setMode, resolved } = useTheme();
  const isMobile = useIsMobileWeb();
  const st = makeStyles(colors, resolved, isMobile);

  const role = profile?.role ?? 'super_admin';
  const fullName = profile?.full_name || profile?.username || 'Super Admin';
  const email = profile?.email || 'admin@goal.id';
  const initials = fullName.charAt(0).toUpperCase();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Edit Profile Modal
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(fullName);
  const [editLoading, setEditLoading] = useState(false);

  const [isLogoutAnimVisible, setIsLogoutAnimVisible] = useState(false);

  const doActualLogout = async () => {
    setShowLogoutConfirm(false);
    setIsLogoutAnimVisible(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      await logout();
    } catch {
      setIsLogoutAnimVisible(false);
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: 'Terjadi kesalahan saat keluar akun.' });
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: 'Nama tidak boleh kosong.' });
      return;
    }
    setEditLoading(true);
    try {
      const res = await apiFetch('/profile', {
        method: 'PUT',
        body: { full_name: editName },
      });
      if (res.ok) {
        useProfileStore.setState({ profile: { ...profile, full_name: editName } as any });
        setShowEditProfile(false);
        useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Profil berhasil diperbarui.' });
      } else {
        useToastStore.getState().show({ type: 'error', title: 'Gagal', description: 'Gagal memperbarui profil.' });
      }
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Tidak dapat terhubung ke server.' });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <View style={st.screen}>
      <DashboardHeader
        title="Profil Admin"
        subtitle="Manajemen akun & preferensi sistem"
        showBack={false}
      />

      <ScrollView
        contentContainerStyle={st.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO BANNER CARD ── */}
        <View style={[st.heroCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          <View style={[st.bannerGradient, { backgroundColor: colors.primary + '18' }]}>
            <MaterialIcons name="shield" size={100} color={colors.primary + '12'} style={st.bannerWatermark} />
          </View>

          <View style={st.heroBody}>
            <View style={st.avatarWrapper}>
              <View style={[st.avatarCircle, { backgroundColor: colors.primaryContainer, borderColor: colors.primary }]}>
                <Text style={[st.avatarText, { color: colors.primary }]}>{initials}</Text>
              </View>

              <View style={st.verifiedBadge}>
                <MaterialIcons name="verified" size={16} color="#FFFFFF" />
              </View>
            </View>

            <View style={st.heroInfo}>
              <Text style={[st.heroName, { color: colors.text }]} numberOfLines={1}>{fullName}</Text>
              <Text style={[st.heroEmail, { color: colors.textSecondary }]} numberOfLines={1}>{email}</Text>

              <View style={st.badgeRow}>
                <View style={[st.roleBadge, { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '40' }]}>
                  <MaterialIcons name="security" size={12} color={colors.primary} />
                  <Text style={[st.roleBadgeText, { color: colors.primary }]}>Super Admin</Text>
                </View>

                <View style={[st.roleBadge, { backgroundColor: '#10B98118', borderColor: '#10B98140' }]}>
                  <MaterialIcons name="check-circle" size={12} color="#10B981" />
                  <Text style={[st.roleBadgeText, { color: '#10B981' }]}>Otoritas Penuh</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[st.editQuickBtn, { backgroundColor: colors.bgElevated, borderColor: colors.outline }]}
              onPress={() => { setEditName(fullName); setShowEditProfile(true); }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="edit" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── MENU NAVIGASI ── */}
        <Text style={[st.sectionTitle, { color: colors.textSecondary }]}>KEAMANAN & BANTUAN</Text>
        <View style={[st.menuCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          <TouchableOpacity
            style={st.menuRow}
            onPress={() => router.push('/change-password')}
            activeOpacity={0.75}
          >
            <View style={[st.menuIconBox, { backgroundColor: colors.primaryContainer }]}>
              <MaterialIcons name="lock-outline" size={20} color={colors.primary} />
            </View>
            <View style={st.menuTextWrap}>
              <Text style={[st.menuTitle, { color: colors.text }]}>Ubah Kata Sandi</Text>
              <Text style={[st.menuSub, { color: colors.textSecondary }]}>Perbarui kredensial keamanan akun</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={[st.divider, { backgroundColor: colors.outline }]} />

          <TouchableOpacity
            style={st.menuRow}
            onPress={() => router.push('/(super-admin)/help-center' as any)}
            activeOpacity={0.75}
          >
            <View style={[st.menuIconBox, { backgroundColor: '#3B82F618' }]}>
              <MaterialIcons name="help-outline" size={20} color="#3B82F6" />
            </View>
            <View style={st.menuTextWrap}>
              <Text style={[st.menuTitle, { color: colors.text }]}>Pusat Bantuan</Text>
              <Text style={[st.menuSub, { color: colors.textSecondary }]}>Panduan operasional & status sistem</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* ── KELUAR AKUN ── */}
        <TouchableOpacity
          style={[st.signOutBtn, { backgroundColor: colors.surface, borderColor: colors.error + '40' }]}
          onPress={() => setShowLogoutConfirm(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={[st.signOutText, { color: colors.error }]}>Keluar dari Akun</Text>
        </TouchableOpacity>

        <Text style={[st.versionText, { color: colors.textTertiary }]}>GOAL Super Admin v1.2.0 • Hak Cipta Dilindungi</Text>
      </ScrollView>

      {/* ── EDIT PROFILE MODAL ── */}
      <Modal visible={showEditProfile} transparent animationType="fade" onRequestClose={() => setShowEditProfile(false)}>
        <View style={st.modalOverlay}>
          <View style={[st.modalCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <View style={st.modalHeaderRow}>
              <Text style={[st.modalTitle, { color: colors.text }]}>Edit Profil Admin</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={st.inputGroup}>
              <Text style={[st.inputLabel, { color: colors.textSecondary }]}>NAMA LENGKAP</Text>
              <TextInput
                style={[st.textInput, { backgroundColor: colors.bgElevated, borderColor: colors.outline, color: colors.text }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Masukkan nama..."
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={st.modalActions}>
              <TouchableOpacity style={[st.modalCancelBtn, { backgroundColor: colors.bgElevated, borderColor: colors.outline }]} onPress={() => setShowEditProfile(false)}>
                <Text style={[st.modalCancelText, { color: colors.textSecondary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.modalSaveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveProfile} disabled={editLoading}>
                {editLoading ? <ActivityIndicator color={colors.onPrimary} size="small" /> : <Text style={[st.modalSaveText, { color: colors.onPrimary }]}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Keluar Akun"
        description="Yakin ingin keluar dari akun Super Admin?"
        confirmLabel="Ya, Keluar"
        destructive
        loading={logoutLoading}
        onConfirm={doActualLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* ── LOGOUT ANIMATION OVERLAY ── */}
      <Modal visible={isLogoutAnimVisible} transparent animationType="fade">
        <View style={st.logoutOverlay}>
          <View style={[st.logoutCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <View style={[st.logoutPulseRing, { backgroundColor: colors.error + '18' }]}>
              <ActivityIndicator color={colors.error} size="large" />
            </View>
            <Text style={[st.logoutTitle, { color: colors.text }]}>Mengakhiri Sesi Admin...</Text>
            <Text style={[st.logoutSub, { color: colors.textSecondary }]}>Membersihkan data autentikasi. Sampai jumpa!</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], resolved: 'light' | 'dark', isMobile: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: SIZES.gutter, paddingBottom: 60, ...(isMobile ? {} : { maxWidth: 850, alignSelf: 'center', width: '100%', paddingTop: 20 }) },

  logoutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoutCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOWS.lg,
  },
  logoutPulseRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  logoutTitle: {
    ...FONTS.titleLg,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  logoutSub: {
    ...FONTS.bodySm,
    textAlign: 'center',
    lineHeight: 18,
  },

  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  bannerGradient: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerWatermark: {
    position: 'absolute',
    right: -15,
    top: -20,
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    paddingTop: 0,
    marginTop: -26,
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  avatarText: { ...FONTS.headlineLg, fontSize: 26, fontWeight: '800' },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  heroInfo: { flex: 1 },
  heroName: { ...FONTS.titleLg, fontSize: 18, fontWeight: '800', marginBottom: 2 },
  heroEmail: { ...FONTS.bodySm, fontSize: 13, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleBadgeText: { ...FONTS.labelSm, fontSize: 11, fontWeight: '700' },
  editQuickBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  sectionTitle: {
    ...FONTS.labelSm,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  themeCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    ...SHADOWS.xs,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeLabel: { ...FONTS.labelSm, fontWeight: '700' },

  menuCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
    ...SHADOWS.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextWrap: { flex: 1 },
  menuTitle: { ...FONTS.titleMd, fontSize: 14, fontWeight: '700' },
  menuSub: { ...FONTS.bodySm, fontSize: 12 },
  divider: { height: 1, marginHorizontal: 16 },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  signOutText: { ...FONTS.titleSm, fontWeight: '800' },
  versionText: { ...FONTS.labelSm, textAlign: 'center', fontSize: 11 },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalCard: { width: '100%', maxWidth: 440, borderRadius: 20, borderWidth: 1, padding: 20, ...SHADOWS.lg },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { ...FONTS.titleLg, fontWeight: '800' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { ...FONTS.labelSm, fontSize: 11, fontWeight: '800', marginBottom: 6 },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    fontSize: 14,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  modalCancelText: { ...FONTS.titleSm, fontWeight: '600' },
  modalSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalSaveText: { ...FONTS.titleSm, fontWeight: '800' },
});
