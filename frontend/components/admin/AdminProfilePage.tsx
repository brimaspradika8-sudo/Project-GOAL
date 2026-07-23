import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from '../../lib/secureStorage';
import { router } from 'expo-router';
import { useProfileStore } from '../../store/profileStore';
import { TOKEN_KEY } from '../../app/_layout';
import { API_BASE_URL } from '../../lib/api';
import { COLORS, FONTS, SIZES, SHADOWS } from '../goalTheme';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useToastStore } from '../../store/toastStore';

const ROLE_LABEL: Record<string, string> = {
  admin:       'Admin',
  super_admin: 'Super Admin',
};

export default function AdminProfilePage() {
  const { profile, clearProfile } = useProfileStore();
  const role = profile?.role ?? 'admin';
  const initials = (profile?.full_name || profile?.username || 'A').charAt(0).toUpperCase();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const doActualLogout = async () => {
    setLogoutLoading(true);
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await clearProfile();
      router.dismissAll();
      router.replace('/login');
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: 'Terjadi kesalahan saat keluar akun.' });
    } finally {
      setLogoutLoading(false);
    }
  };

  const MENU_ITEMS = [
    {
      icon: 'lock-outline' as const,
      label: 'Ubah Kata Sandi',
      onPress: () => router.push('/change-password'),
    },
    {
      icon: 'help-outline' as const,
      label: 'Pusat Bantuan',
      onPress: () => useToastStore.getState().show({ type: 'info', title: 'Segera Hadir', description: 'Pusat bantuan akan segera tersedia.' }),
    },
  ];

  return (
    <View style={st.screen}>
      <DashboardHeader
        title="Profil Admin"
        subtitle={ROLE_LABEL[role] ?? role}
      />
      <ScrollView
        contentContainerStyle={st.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar card */}
        <View style={st.avatarCard}>
          <View style={st.avatarCircle}>
            <Text style={st.avatarText}>{initials}</Text>
          </View>
          <View style={st.profileInfo}>
            <Text style={st.profileName} numberOfLines={1}>
              {profile?.full_name || profile?.username || 'Admin'}
            </Text>
            <Text style={st.profileEmail} numberOfLines={1}>
              {profile?.email || ''}
            </Text>
            <View style={st.rolePill}>
              <MaterialIcons
                name={role === 'super_admin' ? 'shield' : 'admin-panel-settings'}
                size={12}
                color={COLORS.primary}
              />
              <Text style={st.rolePillText}>{ROLE_LABEL[role] ?? role}</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <Text style={st.sectionTitle}>PENGATURAN</Text>
        <View style={st.menuCard}>
          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={st.menuRow} onPress={item.onPress} activeOpacity={0.75}>
                <View style={st.menuIconBox}>
                  <MaterialIcons name={item.icon} size={20} color={COLORS.primary} />
                </View>
                <Text style={st.menuLabel}>{item.label}</Text>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.outline} />
              </TouchableOpacity>
              {idx < MENU_ITEMS.length - 1 && <View style={st.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={st.signOutBtn} onPress={() => setShowLogoutConfirm(true)} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={20} color={COLORS.error} />
          <Text style={st.signOutText}>Keluar Akun</Text>
        </TouchableOpacity>

        <Text style={st.version}>GOAL v1.0.0</Text>
      </ScrollView>

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

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, paddingBottom: 120 },

  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: 18,
    marginBottom: 24,
    gap: 16,
    ...SHADOWS.sm,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  avatarText: { ...FONTS.headlineMd, color: COLORS.primary },
  profileInfo: { flex: 1 },
  profileName: { ...FONTS.headlineSm, color: COLORS.text, marginBottom: 3 },
  profileEmail: { ...FONTS.bodySm, color: COLORS.textSecondary, marginBottom: 8 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, alignSelf: 'flex-start',
  },
  rolePillText: { ...FONTS.labelSm, color: COLORS.primary },

  sectionTitle: {
    ...FONTS.labelSm,
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.outline,
    marginBottom: 24,
    paddingVertical: 4,
    ...SHADOWS.sm,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 14, paddingHorizontal: 16, paddingVertical: 15,
    minHeight: 54,
  },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { flex: 1, ...FONTS.bodyMd, fontWeight: '600', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.outline, marginHorizontal: 16 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: SIZES.borderRadius,
    borderWidth: 1.5, borderColor: COLORS.errorContainer,
    paddingVertical: 15, marginBottom: 20,
    backgroundColor: COLORS.surface,
  },
  signOutText: { ...FONTS.bodyMd, fontWeight: '700', color: COLORS.error },
  version: { ...FONTS.bodySm, color: COLORS.outline, textAlign: 'center' },
});
