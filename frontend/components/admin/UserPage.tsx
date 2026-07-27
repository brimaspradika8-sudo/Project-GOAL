import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, RefreshControl,
  Modal, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfileStore } from '../../store/profileStore';
import { TOKEN_KEY } from '../../lib/auth';
import { API_BASE_URL, getErrorMessage, DEFAULT_HEADERS } from '../../lib/api';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import { useDebounce } from '../../hooks/useDebounce';
import { SkeletonCards } from '../Skeleton';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useToastStore } from '../../store/toastStore';
import { useTheme, type ThemeColors } from '../../lib/theme';

const getRoleConfig = (colors: ThemeColors): Record<string, { label: string; color: string; bg: string }> => ({
  player:      { label: 'Pemain',      color: colors.accentPurple, bg: colors.accentPurpleLight },
  owner:       { label: 'Pemilik',     color: colors.primary, bg: colors.primaryContainer },
  super_admin: { label: 'Super Admin', color: colors.floodlight, bg: colors.floodlight + '20' },
});

type Tab = 'user' | 'owner';

const EMPTY_CREATE = { name: '', email: '', password: '', role: 'player' };
const EMPTY_EDIT   = { name: '', email: '', password: '' };

export default function UserPage() {
  const { colors } = useTheme();
  const st = makeStyles(colors);
  const ROLE_CONFIG = getRoleConfig(colors);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('user');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCreatePwd, setShowCreatePwd] = useState(false);

  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showEditPwd, setShowEditPwd] = useState(false);

  const [upgradeTarget, setUpgradeTarget] = useState<{ id: number; name: string; currentRole: string } | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const loggedInUserRole = useProfileStore((state) => state.profile?.role);
  const loggedInUserId = useProfileStore((state) => state.profile?.user_id);
  const isSuperAdmin = loggedInUserRole === 'super_admin';

  const fetchUsers = useCallback(async (q?: string) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const params = q ? `?search=${encodeURIComponent(q)}` : '';
      const res = await fetch(`${API_BASE_URL}/admin/users${params}`, {
        headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data?.data ?? []);
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Gagal memuat data pengguna.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (!loading) fetchUsers(debouncedSearch);
  }, [debouncedSearch]);

  const onRefresh = () => { setRefreshing(true); fetchUsers(search); };

  const updateUserRole = async (userId: number, role: string) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Gagal memperbarui role.');
    return data;
  };

  // ── CREATE ──────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError('Semua field wajib diisi.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createForm.email.trim())) {
      setCreateError('Format email tidak valid.');
      return;
    }
    if (createForm.password.length < 8) {
      setCreateError('Password minimal 8 karakter.');
      return;
    }
    if (!/[a-z]/.test(createForm.password) || !/[A-Z]/.test(createForm.password) || !/[0-9]/.test(createForm.password)) {
      setCreateError('Password harus mengandung huruf besar, huruf kecil, dan angka.');
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: createForm.name, email: createForm.email, password: createForm.password, role: createForm.role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(getErrorMessage(data, 'Gagal membuat user.'));
        return;
      }
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'User baru berhasil ditambahkan.' });
      fetchUsers(search);
    } catch {
      setCreateError('Gagal terhubung ke server.');
    } finally {
      setCreateLoading(false);
    }
  };

  // ── EDIT (ungu) ─────────────────────────────────────────
  const openEdit = (u: any) => {
    setEditTarget(u);
    setEditForm({ name: u.name || '', email: u.email || '', password: '' });
    setEditError(null);
    setShowEditPwd(false);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditError('Nama dan email wajib diisi.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email.trim())) {
      setEditError('Format email tidak valid.');
      return;
    }
    if (editForm.password.trim() && editForm.password.length < 8) {
      setEditError('Password minimal 8 karakter.');
      return;
    }
    if (editForm.password.trim() && (!/[a-z]/.test(editForm.password) || !/[A-Z]/.test(editForm.password) || !/[0-9]/.test(editForm.password))) {
      setEditError('Password harus mengandung huruf besar, huruf kecil, dan angka.');
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const body: any = { name: editForm.name, email: editForm.email };
      if (editForm.password.trim()) body.password = editForm.password;
      const res = await fetch(`${API_BASE_URL}/admin/users/${editTarget.id}`, {
        method: 'PUT',
        headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(getErrorMessage(data, 'Gagal menyimpan perubahan.'));
        return;
      }
      setEditTarget(null);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Data user berhasil diperbarui.' });
      fetchUsers(search);
    } catch {
      setEditError('Gagal terhubung ke server.');
    } finally {
      setEditLoading(false);
    }
  };

  // ── UPGRADE (oranye) ────────────────────────────────────
  const handleUpgrade = async (newRole: string) => {
    if (!upgradeTarget) return;
    setUpgradeLoading(true);
    setUpgradeError(null);
    try {
      await updateUserRole(upgradeTarget.id, newRole);
      setUpgradeTarget(null);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: `Role berhasil diubah menjadi ${ROLE_CONFIG[newRole]?.label ?? newRole}.` });
      fetchUsers(search);
    } catch (e: any) {
      setUpgradeError(e.message || 'Gagal memperbarui role.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  // ── DELETE (merah) ──────────────────────────────────────
  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.message || 'Gagal menghapus user.');
        return;
      }
      setDeleteTarget(null);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'User dihapus.' });
      fetchUsers(search);
    } catch {
      setDeleteError('Tidak dapat terhubung ke server.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Filter ──────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const role = u.profile?.role || 'player';
    if (activeTab === 'owner') return role === 'owner';
    // TODO: Pisahkan role admin dari tab Pengguna jika nanti ada tab/filter khusus admin.
    return role !== 'owner';
  });

  const ownerCount = users.filter(u => (u.profile?.role || 'player') === 'owner').length;
  const userCount  = users.filter(u => (u.profile?.role || 'player') !== 'owner').length;

  if (loading) {
    return (
      <View style={st.screen}>
        <DashboardHeader title="Kelola Pengguna" subtitle="Manajemen user & owner" />
        <SkeletonCards count={5} />
      </View>
    );
  }

  return (
    <>
      <View style={st.screen}>
        <DashboardHeader title="Kelola Pengguna" subtitle="Manajemen user & owner" />

        <View style={st.searchWrap}>
          <View style={[st.searchBox, focused && st.searchBoxFocused]}>
            <MaterialIcons name="search" size={19} color={focused ? colors.primary : colors.textTertiary} />
            <TextInput
              style={st.searchInput}
              placeholder="Cari nama atau email..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={st.tabRow}>
          <TouchableOpacity
            style={[st.tab, activeTab === 'user' && st.tabActive]}
            onPress={() => setActiveTab('user')}
            activeOpacity={0.75}
          >
            <MaterialIcons name="person" size={15} color={activeTab === 'user' ? colors.primary : colors.textTertiary} />
            <Text style={[st.tabLabel, activeTab === 'user' && st.tabLabelActive]}>Pengguna</Text>
            <View style={[st.tabBadge, activeTab === 'user' && st.tabBadgeActive]}>
              <Text style={[st.tabBadgeText, activeTab === 'user' && st.tabBadgeTextActive]}>{userCount}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[st.tab, activeTab === 'owner' && st.tabOwnerActive]}
            onPress={() => setActiveTab('owner')}
            activeOpacity={0.75}
          >
            <MaterialIcons name="store" size={15} color={activeTab === 'owner' ? colors.primary : colors.textTertiary} />
            <Text style={[st.tabLabel, activeTab === 'owner' && st.tabLabelActive]}>Owner</Text>
            <View style={[st.tabBadge, activeTab === 'owner' && st.tabOwnerBadgeActive]}>
              <Text style={[st.tabBadgeText, activeTab === 'owner' && st.tabBadgeTextActive]}>{ownerCount}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {activeTab === 'owner' && (
          <TouchableOpacity
            style={st.addBtn}
            onPress={() => { setCreateError(null); setCreateForm(EMPTY_CREATE); setShowCreate(true); }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add-circle-outline" size={17} color={colors.primary} />
            <Text style={st.addBtnText}>Tambah Owner Baru</Text>
          </TouchableOpacity>
        )}

        <ScrollView
          contentContainerStyle={st.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredUsers.length === 0 ? (
            <View style={st.emptyWrap}>
              <View style={st.emptyIcon}>
                <MaterialIcons name={activeTab === 'owner' ? 'store' : 'person-search'} size={40} color={colors.textTertiary} />
              </View>
              <Text style={st.emptyTitle}>{activeTab === 'owner' ? 'Belum ada owner terdaftar.' : 'Tidak ada hasil.'}</Text>
              {activeTab === 'owner' && (
                <TouchableOpacity
                  style={st.emptyAction}
                  onPress={() => { setCreateError(null); setCreateForm(EMPTY_CREATE); setShowCreate(true); }}
                >
                  <MaterialIcons name="add" size={16} color={colors.onPrimary} />
                  <Text style={st.emptyActionText}>Tambah Owner</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredUsers.map((u: any) => {
              const roleKey = u.profile?.role || 'player';
              const rc = ROLE_CONFIG[roleKey] ?? ROLE_CONFIG.player;
              const isOwnRow = u.id === loggedInUserId;

              return (
                <View key={u.id} style={st.card}>
                  <View style={st.cardLeft}>
                    <View style={[st.avatar, { backgroundColor: rc.bg }]}>
                      <Text style={[st.avatarText, { color: rc.color }]}>{(u.name || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={st.info}>
                      <Text style={st.name} numberOfLines={1}>{u.name}</Text>
                      <Text style={st.email} numberOfLines={1}>{u.email}</Text>
                      <View style={[st.roleBadge, { backgroundColor: rc.bg }]}>
                        <View style={[st.roleDot, { backgroundColor: rc.color }]} />
                        <Text style={[st.roleText, { color: rc.color }]}>{rc.label}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={st.actions}>
                    {/* Ungu — Edit User (semua baris) */}
                    <TouchableOpacity
                      style={[st.actionBtn, { backgroundColor: colors.accentPurpleLight }]}
                      onPress={() => openEdit(u)}
                      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    >
                      <MaterialIcons name="edit" size={16} color={colors.accentPurple} />
                    </TouchableOpacity>

                    {/* Oranye — Upgrade Role (super_admin only, bukan baris super_admin) */}
                    {isSuperAdmin && roleKey !== 'super_admin' && (
                      <TouchableOpacity
                        style={[st.actionBtn, { backgroundColor: colors.accentOrangeLight }]}
                        onPress={() => {
                          setUpgradeTarget({ id: u.id, name: u.name, currentRole: roleKey });
                          setUpgradeError(null);
                        }}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <MaterialIcons name="admin-panel-settings" size={15} color={colors.accentOrange} />
                      </TouchableOpacity>
                    )}

                    {/* Merah — Hapus User */}
                    {!isOwnRow && (
                      <TouchableOpacity
                        style={[st.actionBtn, { backgroundColor: colors.errorContainer }]}
                        onPress={() => {
                          setDeleteTarget({ id: u.id, name: u.name });
                          setDeleteError(null);
                        }}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <MaterialIcons name="delete-outline" size={17} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* ── CREATE MODAL ── */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowCreate(false)} />
          <View style={st.sheet}>
            <View style={st.sheetHeader}>
              <View style={st.sheetHeaderLeft}>
                <View style={st.sheetIconWrap}>
                  <MaterialIcons name="person-add-alt-1" size={20} color={colors.primary} />
                </View>
                <Text style={st.sheetTitle}>Tambah User</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreate(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {createError ? (
              <View style={st.errorBox}>
                <MaterialIcons name="error-outline" size={14} color={colors.error} />
                <Text style={st.errorText}>{createError}</Text>
              </View>
            ) : null}

            <FormField label="Nama Lengkap" icon="person-outline" value={createForm.name}
              onChangeText={v => setCreateForm(p => ({ ...p, name: v }))} st={st} colors={colors} />
            <FormField label="Email" icon="mail-outline" value={createForm.email}
              onChangeText={v => setCreateForm(p => ({ ...p, email: v }))}
              keyboardType="email-address" autoCapitalize="none" st={st} colors={colors} />
            <FormField label="Password" icon="lock-outline" value={createForm.password}
              onChangeText={v => setCreateForm(p => ({ ...p, password: v }))}
              secureTextEntry={!showCreatePwd}
              rightIcon={showCreatePwd ? 'visibility-off' : 'visibility'}
              onRightIconPress={() => setShowCreatePwd(p => !p)} st={st} colors={colors} />

            <View style={st.roleSelectWrap}>
              <Text style={st.fieldLabel}>Role</Text>
              <View style={st.roleChipRow}>
                {['player', 'owner', 'super_admin'].map(r => {
                  const rc = ROLE_CONFIG[r];
                  const active = createForm.role === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[st.roleChip, active && { backgroundColor: rc.bg, borderColor: rc.color }]}
                      onPress={() => setCreateForm(p => ({ ...p, role: r }))}
                      activeOpacity={0.7}
                    >
                      <View style={[st.roleDot, { backgroundColor: rc.color }]} />
                      <Text style={[st.roleChipText, active && { color: rc.color }]}>{rc.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={st.sheetActions}>
              <TouchableOpacity style={st.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={st.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.submitBtn, createLoading && { opacity: 0.6 }]} onPress={handleCreate} disabled={createLoading}>
                {createLoading
                  ? <ActivityIndicator color={colors.onPrimary} size="small" />
                  : <Text style={st.submitText}>Tambah</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal visible={!!editTarget} transparent animationType="fade" onRequestClose={() => setEditTarget(null)}>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setEditTarget(null)} />
          <View style={st.sheet}>
            <View style={st.sheetHeader}>
              <View style={st.sheetHeaderLeft}>
                <View style={[st.sheetIconWrap, { backgroundColor: colors.accentPurpleLight }]}>
                  <MaterialIcons name="edit" size={20} color={colors.accentPurple} />
                </View>
                <Text style={st.sheetTitle}>Edit User</Text>
              </View>
              <TouchableOpacity onPress={() => setEditTarget(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editError ? (
              <View style={st.errorBox}>
                <MaterialIcons name="error-outline" size={14} color={colors.error} />
                <Text style={st.errorText}>{editError}</Text>
              </View>
            ) : null}

            <FormField label="Nama Lengkap" icon="person-outline" value={editForm.name}
              onChangeText={v => setEditForm(p => ({ ...p, name: v }))} st={st} colors={colors} />
            <FormField label="Email" icon="mail-outline" value={editForm.email}
              onChangeText={v => setEditForm(p => ({ ...p, email: v }))}
              keyboardType="email-address" autoCapitalize="none" st={st} colors={colors} />
            <FormField label="Password Baru (opsional)" icon="lock-outline" value={editForm.password}
              onChangeText={v => setEditForm(p => ({ ...p, password: v }))}
              secureTextEntry={!showEditPwd}
              rightIcon={showEditPwd ? 'visibility-off' : 'visibility'}
              onRightIconPress={() => setShowEditPwd(p => !p)}
              placeholder="Kosongkan jika tidak diubah" st={st} colors={colors} />

            <View style={st.sheetActions}>
              <TouchableOpacity style={st.cancelBtn} onPress={() => setEditTarget(null)}>
                <Text style={st.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.submitBtn, { backgroundColor: colors.accentPurple }, editLoading && { opacity: 0.6 }]} onPress={handleEdit} disabled={editLoading}>
                {editLoading
                  ? <ActivityIndicator color={colors.onPrimary} size="small" />
                  : <Text style={st.submitText}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── UPGRADE ROLE MODAL ── */}
      <ConfirmDialog
        visible={!!upgradeTarget}
        title={`Ubah Role — ${upgradeTarget?.name ?? ''}`}
        description="Pilih role baru untuk user ini."
        icon="admin-panel-settings"
        iconColor={colors.accentOrange}
        iconBg={colors.accentOrangeLight}
        loading={upgradeLoading}
        error={upgradeError}
        onCancel={() => setUpgradeTarget(null)}
        options={[
          ...(upgradeTarget?.currentRole !== 'player'
            ? [{
                label: 'Jadikan Pemain',
                icon: 'person',
                onPress: () => handleUpgrade('player'),
              }]
            : []),
          ...(upgradeTarget?.currentRole !== 'owner'
            ? [{
                label: 'Jadikan Owner',
                icon: 'store',
                onPress: () => handleUpgrade('owner'),
              }]
            : []),
          ...(isSuperAdmin && upgradeTarget?.currentRole !== 'super_admin'
            ? [{
                label: 'Jadikan Super Admin',
                icon: 'shield',
                color: colors.accentOrange,
                onPress: () => handleUpgrade('super_admin'),
              }]
            : []),
        ]}
      />

      {/* ── DELETE CONFIRM MODAL ── */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title={`Hapus "${deleteTarget?.name ?? ''}"?`}
        description="Tindakan ini tidak bisa dibatalkan. User dan semua data terkait akan dihapus permanen."
        destructive
        loading={deleteLoading}
        error={deleteError}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Ya, Hapus"
        onConfirm={handleDeleteUser}
      />
    </>
  );
}

function FormField({ label, icon, value, onChangeText, keyboardType, autoCapitalize, secureTextEntry, rightIcon, onRightIconPress, placeholder, st, colors }: {
  label: string; icon: string; value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any; autoCapitalize?: any;
  secureTextEntry?: boolean;
  rightIcon?: string; onRightIconPress?: () => void;
  placeholder?: string;
  st: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={st.fieldWrap}>
      <Text style={st.fieldLabel}>{label}</Text>
      <View style={st.fieldRow}>
        <MaterialIcons name={icon as any} size={17} color={colors.textSecondary} style={{ marginRight: 10 }} />
        <TextInput
          style={st.fieldInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder ?? label}
          placeholderTextColor={colors.textTertiary}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name={rightIcon as any} size={17} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  searchWrap: { paddingHorizontal: SIZES.gutter, paddingTop: 14, paddingBottom: 4 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1.5, borderColor: colors.outline,
  },
  searchBoxFocused: { borderColor: colors.primary, backgroundColor: colors.surfaceContainer },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },

  tabRow: { flexDirection: 'row', gap: 10, marginHorizontal: SIZES.gutter, marginTop: 10, marginBottom: 4 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 11, borderRadius: 12,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.outline,
  },
  tabActive:      { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '60' },
  tabOwnerActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '60' },
  tabLabel:        { ...FONTS.titleSm, color: colors.textTertiary },
  tabLabelActive:  { color: colors.primary },
  tabBadge:        { backgroundColor: colors.surfaceContainerHigh, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  tabBadgeActive:  { backgroundColor: colors.primary + '20' },
  tabOwnerBadgeActive: { backgroundColor: colors.primary + '20' },
  tabBadgeText:     { ...FONTS.labelSm, color: colors.textSecondary },
  tabBadgeTextActive: { color: colors.primary },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.surfaceContainer, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.primary + '50',
    paddingVertical: 12, marginHorizontal: SIZES.gutter, marginTop: 10,
  },
  addBtnText: { ...FONTS.titleSm, color: colors.primary },

  list: { padding: SIZES.gutter, paddingBottom: 60 },

  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.outline,
  },
  emptyTitle: { ...FONTS.titleMd, color: colors.textSecondary },
  emptyAction: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: SIZES.borderRadius,
  },
  emptyActionText: { ...FONTS.titleSm, color: colors.onPrimary },

  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.outline,
    ...SHADOWS.xs,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 13 },
  avatarText: { ...FONTS.headlineSm, fontSize: 18 },
  info: { flex: 1 },
  name: { ...FONTS.titleMd, color: colors.text, marginBottom: 2 },
  email: { ...FONTS.bodySm, color: colors.textSecondary, marginBottom: 6 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start' },
  roleDot: { width: 5, height: 5, borderRadius: 3 },
  roleText: { ...FONTS.labelSm },
  actions: { flexDirection: 'row', gap: 6, marginLeft: 6 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 20 },
  sheet: {
    backgroundColor: colors.surfaceWhite, borderRadius: 24, padding: 24,
    width: '100%', maxWidth: 500,
    borderWidth: 1, borderColor: colors.outline,
    ...SHADOWS.lg,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sheetHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetTitle: { ...FONTS.headlineSm, color: colors.text },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.errorContainer, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: colors.error + '30' },
  errorText: { ...FONTS.bodySm, color: colors.error, flex: 1 },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { ...FONTS.labelSm, color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceContainer, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.outline,
  },
  fieldInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
  roleSelectWrap: { marginBottom: 14 },
  roleChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.outline,
  },
  roleChipText: { ...FONTS.labelMd, color: colors.textSecondary },

  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.surfaceContainer, alignItems: 'center', borderWidth: 1, borderColor: colors.outline },
  cancelText: { ...FONTS.titleSm, color: colors.textSecondary },
  submitBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  submitText: { ...FONTS.titleSm, color: colors.onPrimary },
});
