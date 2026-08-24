import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, RefreshControl,
  Modal, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useProfileStore } from '../../store/profileStore';
import { getErrorMessage } from '../../lib/api';
import { apiFetch } from '../../lib/apiClient';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import { useDebounce } from '../../hooks/useDebounce';
import { SkeletonCards } from '../Skeleton';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import AlertBox from '../shared/AlertBox';
import AnimatedDeleteButton from '../shared/AnimatedDeleteButton';
import SelectCheckbox from '../shared/SelectCheckbox';
import BulkActionBar from '../shared/BulkActionBar';
import { useToastStore } from '../../store/toastStore';
import { useTheme, type ThemeColors } from '../../lib/theme';
import { fieldError } from '../../lib/formValidation';
import { USER_ROLES, type UserRole } from '../../types/roles';
import { useIsMobileWeb } from '../../lib/responsive';
import OwnerRequestPage from './OwnerRequestPage';

const getRoleConfig = (colors: ThemeColors): Record<string, { label: string; color: string; bg: string }> => ({
  player:      { label: 'Pemain',      color: colors.textSecondary, bg: colors.surfaceContainerHigh },
  owner:       { label: 'Pemilik',     color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  super_admin: { label: 'Super Admin', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' },
});

type Tab = 'user' | 'owner';

const EMPTY_CREATE: { name: string; email: string; password: string; role: UserRole } = {
  name: '',
  email: '',
  password: '',
  role: USER_ROLES.PLAYER,
};
const EMPTY_EDIT   = { name: '', email: '', password: '' };

export default function UserPage() {
  const { colors } = useTheme();
  const isMobile = useIsMobileWeb();
  const st = useMemo(() => makeStyles(colors, isMobile), [colors, isMobile]);
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

  const [createFieldErrors, setCreateFieldErrors] = useState({ name: '', email: '', password: '' });
  const [editFieldErrors, setEditFieldErrors] = useState({ name: '', email: '', password: '' });
  const [createTouched, setCreateTouched] = useState({ name: false, email: false, password: false });
  const [editTouched, setEditTouched] = useState({ name: false, email: false, password: false });

  const valName = (v: string) => { if (!v.trim()) return 'Nama wajib diisi.'; return ''; };
  const valEmail = (v: string) => { if (!v.trim()) return 'Email wajib diisi.'; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Format email tidak valid.'; return ''; };
  const valPwd = (v: string) => { if (v && v.length < 8) return 'Password minimal 8 karakter.'; if (v && (!/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/[0-9]/.test(v))) return 'Password harus mengandung huruf besar, kecil, dan angka.'; return ''; };

  const [upgradeTarget, setUpgradeTarget] = useState<{ id: number; name: string; currentRole: string } | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const loggedInUserRole = useProfileStore((state) => state.profile?.role);
  const loggedInUserId = useProfileStore((state) => state.profile?.user_id);
  const isSuperAdmin = loggedInUserRole === USER_ROLES.SUPER_ADMIN;

  const [requestCount, setRequestCount] = useState<number>(0);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const fetchUsers = useCallback(async (q?: string) => {
    try {
      const [res, reqRes] = await Promise.allSettled([
        apiFetch('/super-admin/users', { params: { search: q } }),
        apiFetch('/owner-requests/pending'),
      ]);

      if (res.status === 'fulfilled' && res.value.ok) {
        const data = await res.value.json();
        setUsers(data?.data?.data ?? data?.data ?? []);
      }
      if (reqRes.status === 'fulfilled' && reqRes.value.ok) {
        const reqData = await reqRes.value.json();
        setRequestCount((reqData?.data ?? []).length);
      }
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
  }, [debouncedSearch, fetchUsers, loading]);

  const onRefresh = () => { setRefreshing(true); fetchUsers(search); };

  const updateUserRole = async (userId: number, role: UserRole) => {
    const res = await apiFetch(`/super-admin/users/${userId}/role`, { method: 'PUT', body: { role } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Gagal memperbarui role.');
    return data;
  };

  // ── CREATE ──────────────────────────────────────────────
  const openCreate = () => {
    setCreateError(null);
    setCreateForm(EMPTY_CREATE);
    setCreateFieldErrors({ name: '', email: '', password: '' });
    setCreateTouched({ name: false, email: false, password: false });
    setShowCreatePwd(false);
    setShowCreate(true);
  };

  const handleCreate = async () => {
    setCreateTouched({ name: true, email: true, password: true });
    const nErr = valName(createForm.name);
    const eErr = valEmail(createForm.email);
    const pErr = valPwd(createForm.password);
    setCreateFieldErrors({ name: nErr, email: eErr, password: pErr });
    if (nErr || eErr || pErr) {
      setCreateError('Periksa kembali isian Anda.');
      return;
    }
    if (!createForm.password.trim()) {
      setCreateError('Password wajib diisi.');
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await apiFetch('/super-admin/users', {
        method: 'POST',
        body: { name: createForm.name, email: createForm.email, password: createForm.password, role: createForm.role },
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
    setEditFieldErrors({ name: '', email: '', password: '' });
    setEditTouched({ name: false, email: false, password: false });
    setShowEditPwd(false);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setEditTouched({ name: true, email: true, password: true });
    const nErr = valName(editForm.name);
    const eErr = valEmail(editForm.email);
    const pErr = valPwd(editForm.password);
    setEditFieldErrors({ name: nErr, email: eErr, password: pErr });
    if (nErr || eErr || pErr) {
      setEditError('Periksa kembali isian Anda.');
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      const body: any = { name: editForm.name, email: editForm.email };
      if (editForm.password.trim()) body.password = editForm.password;
      const res = await apiFetch(`/super-admin/users/${editTarget.id}`, { method: 'PUT', body });
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
  const handleUpgrade = async (newRole: UserRole) => {
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
      const res = await apiFetch(`/super-admin/users/${deleteTarget.id}`, { method: 'DELETE' });
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

  // ── BULK DELETE ────────────────────────────────────────
  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredUsers.filter(u => u.id !== loggedInUserId).map(u => u.id);
    setSelected(prev => {
      const allPicked = visibleIds.length > 0 && visibleIds.every(id => prev.has(id));
      if (allPicked) return new Set();
      return new Set(visibleIds);
    });
  };

  const confirmBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleteLoading(true);
    setBulkDeleteError(null);
    try {
      const res = await apiFetch('/super-admin/users/bulk-delete', {
        method: 'POST',
        body: { ids: Array.from(selected) },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBulkDeleteError(data.message || 'Gagal menghapus user.');
        return;
      }
      setBulkDeleteTarget(false);
      setSelected(new Set());
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: data.message || 'User berhasil dihapus.' });
      fetchUsers(search);
    } catch {
      setBulkDeleteError('Tidak dapat terhubung ke server.');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const [roleFilter, setRoleFilter] = useState<'all' | 'player' | 'owner' | 'super_admin'>('all');

  const filteredUsers = users.filter(u => {
    const role = u.profile?.role || USER_ROLES.PLAYER;
    if (activeTab === 'owner' && role !== USER_ROLES.OWNER) return false;
    if (activeTab === 'user' && role === USER_ROLES.OWNER) return false;
    if (roleFilter !== 'all' && role !== roleFilter) return false;
    return true;
  });

  const ownerCount = users.filter(u => (u.profile?.role || USER_ROLES.PLAYER) === USER_ROLES.OWNER).length;
  const userCount  = users.filter(u => (u.profile?.role || USER_ROLES.PLAYER) !== USER_ROLES.OWNER).length;
  const totalCount = users.length;

  if (loading) {
    return (
      <View style={st.screen}>
        <DashboardHeader title="Kelola Pengguna" subtitle="Manajemen user & owner" showBack={false} />
        <SkeletonCards count={5} />
      </View>
    );
  }

  return (
    <>
      <View style={st.screen}>
        <DashboardHeader
          title="Kelola Pengguna"
          subtitle="Manajemen user & owner"
          showBack={false}
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={st.requestHeaderBtn}
                activeOpacity={0.8}
                onPress={openCreate}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Tambah Pengguna Baru"
              >
                <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={st.requestHeaderBtn}
                activeOpacity={0.8}
                onPress={() => setIsRequestModalOpen(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Pengajuan Owner & Riwayat"
              >
                <MaterialIcons name="inventory" size={20} color="#FFFFFF" />
                {requestCount > 0 && <View style={st.notifBadgeDot} />}
              </TouchableOpacity>
            </View>
          }
        />

        {/* ── STAT CARDS ── */}
        <View style={st.statCardsRow}>
          <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <View style={[st.statIconWrap, { backgroundColor: colors.primaryContainer }]}>
              <MaterialIcons name="group" size={18} color={colors.primary} />
            </View>
            <View style={st.statTextWrap}>
              <Text style={[st.statValue, { color: colors.text }]}>{totalCount}</Text>
              <Text style={[st.statLabel, { color: colors.textSecondary }]}>Total Pengguna</Text>
            </View>
          </View>

          <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <View style={[st.statIconWrap, { backgroundColor: '#10B98115' }]}>
              <MaterialIcons name="store" size={18} color="#10B981" />
            </View>
            <View>
              <Text style={[st.statValue, { color: colors.text }]}>{ownerCount}</Text>
              <Text style={[st.statLabel, { color: colors.textSecondary }]}>Owner Aktif</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}
            onPress={() => setIsRequestModalOpen(true)}
            activeOpacity={0.85}
          >
            <View style={[st.statIconWrap, { backgroundColor: '#F59E0B15' }]}>
              <MaterialIcons name="pending-actions" size={18} color="#F59E0B" />
            </View>
            <View>
              <Text style={[st.statValue, { color: colors.text }]}>{requestCount}</Text>
              <Text style={[st.statLabel, { color: colors.textSecondary }]}>Pengajuan Pending</Text>
            </View>
          </TouchableOpacity>
        </View>

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

        {/* ── QUICK FILTER CHIPS ── */}
        <View style={st.filterChipsRow}>
          {[
            { key: 'all', label: 'Semua' },
            { key: 'player', label: 'Pemain' },
            { key: 'owner', label: 'Owner' },
            { key: 'super_admin', label: 'Super Admin' },
          ].map(chip => (
            <TouchableOpacity
              key={chip.key}
              style={[st.filterChip, roleFilter === chip.key && st.filterChipActive]}
              onPress={() => setRoleFilter(chip.key as any)}
              activeOpacity={0.75}
            >
              <Text style={[st.filterChipText, roleFilter === chip.key && st.filterChipTextActive]}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
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
            onPress={openCreate}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add-circle-outline" size={17} color={colors.primary} />
            <Text style={st.addBtnText}>Tambah Owner Baru</Text>
          </TouchableOpacity>
        )}

        <ScrollView
          style={st.scroll}
          contentContainerStyle={st.gridList}
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
                  onPress={openCreate}
                >
                  <MaterialIcons name="add" size={16} color={colors.onPrimary} />
                  <Text style={st.emptyActionText}>Tambah Owner</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredUsers.map((u: any) => {
              const roleKey = u.profile?.role || USER_ROLES.PLAYER;
              const rc = ROLE_CONFIG[roleKey] ?? ROLE_CONFIG.player;
              const isOwnRow = u.id === loggedInUserId;

              return (
                <View key={u.id} style={[st.card, selected.has(u.id) && { borderColor: colors.primary, backgroundColor: colors.primaryContainer + '20' }]}>
                  {!isOwnRow && (
                    <TouchableOpacity
                      onPress={() => toggleSelect(u.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={st.checkbox}
                      activeOpacity={0.7}
                    >
                      <SelectCheckbox selected={selected.has(u.id)} colors={colors} size={20} />
                    </TouchableOpacity>
                  )}
                  <View style={st.cardLeft}>
                    <View style={[st.avatar, { backgroundColor: colors.surfaceContainerHigh }]}>
                      <Text style={[st.avatarText, { color: roleKey === USER_ROLES.SUPER_ADMIN ? '#F59E0B' : '#60A5FA' }]}>
                        {(u.name || '?').charAt(0).toUpperCase()}
                      </Text>
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
                    {/* Edit User */}
                    <TouchableOpacity
                      style={[st.actionBtn, { backgroundColor: '#10B981', borderColor: '#10B981' }]}
                      onPress={() => openEdit(u)}
                      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    >
                      <MaterialIcons name="edit" size={16} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Upgrade / Change Role */}
                    {isSuperAdmin && roleKey !== USER_ROLES.SUPER_ADMIN && (
                      <TouchableOpacity
                        style={[st.actionBtn, { backgroundColor: '#10B981', borderColor: '#10B981' }]}
                        onPress={() => {
                          setUpgradeTarget({ id: u.id, name: u.name, currentRole: roleKey });
                          setUpgradeError(null);
                        }}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <MaterialIcons name="shield" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}

                    {/* Hapus User */}
                    {!isOwnRow && (
                      <AnimatedDeleteButton
                        size={36}
                        onPress={() => {
                          setDeleteTarget({ id: u.id, name: u.name });
                          setDeleteError(null);
                        }}
                      />
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <BulkActionBar
          count={selected.size}
          allSelected={filteredUsers.filter(u => u.id !== loggedInUserId).length > 0 && filteredUsers.filter(u => u.id !== loggedInUserId).every(u => selected.has(u.id))}
          onSelectAll={toggleSelectAll}
          onClear={() => setSelected(new Set())}
          actions={[{ label: 'Hapus', icon: 'delete', color: colors.error, onPress: () => { setBulkDeleteError(null); setBulkDeleteTarget(true); } }]}
        />
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
              <AlertBox type="error" title={createError} style={st.alertBox} />
            ) : null}

            <FormField label="Nama Lengkap" icon="person-outline" value={createForm.name}
              onChangeText={v => { setCreateForm(p => ({ ...p, name: v })); setCreateFieldErrors(p => ({ ...p, name: fieldError(v, valName(v), createTouched.name) })); }}
              onBlur={() => { setCreateTouched(p => ({ ...p, name: true })); setCreateFieldErrors(p => ({ ...p, name: valName(createForm.name) })); }}
              st={st} colors={colors} error={createFieldErrors.name} />
            <FormField label="Email" icon="mail-outline" value={createForm.email}
              onChangeText={v => { setCreateForm(p => ({ ...p, email: v })); setCreateFieldErrors(p => ({ ...p, email: fieldError(v, valEmail(v), createTouched.email) })); }}
              onBlur={() => { setCreateTouched(p => ({ ...p, email: true })); setCreateFieldErrors(p => ({ ...p, email: valEmail(createForm.email) })); }}
              keyboardType="email-address" autoCapitalize="none" st={st} colors={colors} error={createFieldErrors.email} />
            <FormField label="Password" icon="lock-outline" value={createForm.password}
              onChangeText={v => { setCreateForm(p => ({ ...p, password: v })); setCreateFieldErrors(p => ({ ...p, password: fieldError(v, valPwd(v), createTouched.password) })); }}
              onBlur={() => { setCreateTouched(p => ({ ...p, password: true })); setCreateFieldErrors(p => ({ ...p, password: valPwd(createForm.password) })); }}
              secureTextEntry={!showCreatePwd}
              rightIcon={showCreatePwd ? 'visibility-off' : 'visibility'}
              onRightIconPress={() => setShowCreatePwd(p => !p)} st={st} colors={colors} error={createFieldErrors.password} />

            <View style={st.roleSelectWrap}>
              <Text style={st.fieldLabel}>Role</Text>
              <View style={st.roleChipRow}>
                {Object.values(USER_ROLES).map(r => {
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
                <View style={[st.sheetIconWrap, { backgroundColor: colors.primaryContainer }]}>
                  <MaterialIcons name="edit" size={20} color={colors.primary} />
                </View>
                <Text style={st.sheetTitle}>Edit User</Text>
              </View>
              <TouchableOpacity onPress={() => setEditTarget(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editError ? (
              <AlertBox type="error" title={editError} style={st.alertBox} />
            ) : null}

            <FormField label="Nama Lengkap" icon="person-outline" value={editForm.name}
              onChangeText={v => { setEditForm(p => ({ ...p, name: v })); setEditFieldErrors(p => ({ ...p, name: fieldError(v, valName(v), editTouched.name) })); }}
              onBlur={() => { setEditTouched(p => ({ ...p, name: true })); setEditFieldErrors(p => ({ ...p, name: valName(editForm.name) })); }}
              st={st} colors={colors} error={editFieldErrors.name} />
            <FormField label="Email" icon="mail-outline" value={editForm.email}
              onChangeText={v => { setEditForm(p => ({ ...p, email: v })); setEditFieldErrors(p => ({ ...p, email: fieldError(v, valEmail(v), editTouched.email) })); }}
              onBlur={() => { setEditTouched(p => ({ ...p, email: true })); setEditFieldErrors(p => ({ ...p, email: valEmail(editForm.email) })); }}
              keyboardType="email-address" autoCapitalize="none" st={st} colors={colors} error={editFieldErrors.email} />
            <FormField label="Password (opsional)" icon="lock-outline" value={editForm.password}
              onChangeText={v => { setEditForm(p => ({ ...p, password: v })); setEditFieldErrors(p => ({ ...p, password: fieldError(v, valPwd(v), editTouched.password) })); }}
              onBlur={() => { setEditTouched(p => ({ ...p, password: true })); setEditFieldErrors(p => ({ ...p, password: valPwd(editForm.password) })); }}
              secureTextEntry={!showEditPwd}
              rightIcon={showEditPwd ? 'visibility-off' : 'visibility'}
              onRightIconPress={() => setShowEditPwd(p => !p)}
              placeholder="Kosongkan jika tidak diubah" st={st} colors={colors} error={editFieldErrors.password} />

            <View style={st.sheetActions}>
              <TouchableOpacity style={st.cancelBtn} onPress={() => setEditTarget(null)}>
                <Text style={st.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.submitBtn, editLoading && { opacity: 0.6 }]} onPress={handleEdit} disabled={editLoading}>
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
        icon="shield"
        iconColor={colors.primary}
        iconBg={colors.primaryContainer}
        loading={upgradeLoading}
        error={upgradeError}
        onCancel={() => setUpgradeTarget(null)}
        options={[
          ...(upgradeTarget?.currentRole !== USER_ROLES.PLAYER
            ? [{
                label: 'Jadikan Pemain',
                icon: 'person',
                onPress: () => handleUpgrade(USER_ROLES.PLAYER),
              }]
            : []),
          ...(upgradeTarget?.currentRole !== USER_ROLES.OWNER
            ? [{
                label: 'Jadikan Owner',
                icon: 'store',
                onPress: () => handleUpgrade(USER_ROLES.OWNER),
              }]
            : []),
          ...(isSuperAdmin && upgradeTarget?.currentRole !== USER_ROLES.SUPER_ADMIN
            ? [{
                label: 'Jadikan Super Admin',
                icon: 'shield',
                onPress: () => handleUpgrade(USER_ROLES.SUPER_ADMIN),
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

      {/* ── BULK DELETE CONFIRM MODAL ── */}
      <ConfirmDialog
        visible={bulkDeleteTarget}
        title={`Hapus ${selected.size} user terpilih?`}
        description="Tindakan ini tidak bisa dibatalkan. User dan semua data terkait akan dihapus permanen."
        destructive
        loading={bulkDeleteLoading}
        error={bulkDeleteError}
        onCancel={() => setBulkDeleteTarget(false)}
        confirmLabel="Ya, Hapus"
        onConfirm={confirmBulkDelete}
      />

      {/* ── OWNER REQUESTS & HISTORY MODAL ── */}
      <Modal
        visible={isRequestModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsRequestModalOpen(false)}
      >
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setIsRequestModalOpen(false)} />
          <View style={st.requestSheet}>
            <View style={st.modalHandle} />
            <View style={st.modalHeaderRow}>
              <View style={st.modalTitleGroup}>
                <MaterialIcons name="inventory" size={22} color={colors.primary} />
                <Text style={[st.sheetTitle, { color: colors.text }]}>Pengajuan Owner & Riwayat</Text>
              </View>
              <TouchableOpacity
                style={st.modalCloseBtn}
                activeOpacity={0.7}
                onPress={() => setIsRequestModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <OwnerRequestPage hideHeader />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function FormField({ label, icon, value, onChangeText, onBlur, keyboardType, autoCapitalize, secureTextEntry, rightIcon, onRightIconPress, placeholder, error, st, colors }: {
  label: string; icon: string; value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  keyboardType?: any; autoCapitalize?: any;
  secureTextEntry?: boolean;
  rightIcon?: string; onRightIconPress?: () => void;
  placeholder?: string;
  error?: string;
  st: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={st.fieldWrap}>
      <Text style={st.fieldLabel}>{label}</Text>
      <View style={[st.fieldRow, error ? { borderColor: colors.error } : undefined]}>
        <MaterialIcons name={icon as any} size={17} color={error ? colors.error : colors.textSecondary} style={{ marginRight: 10 }} />
        <TextInput
          style={st.fieldInput}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
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
      {error ? <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 4 }}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors, isMobile: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  statCardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: SIZES.gutter,
    marginTop: 14,
    marginBottom: 4,
    ...(isMobile ? {} : { maxWidth: 1200, alignSelf: 'center', width: '100%' }),
  },
  statCard: {
    flex: 1,
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isMobile ? 6 : 10,
    padding: isMobile ? 10 : 12,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 0,
    ...SHADOWS.xs,
  },
  statIconWrap: {
    width: isMobile ? 30 : 36,
    height: isMobile ? 30 : 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextWrap: {
    minWidth: 0,
    alignItems: isMobile ? 'center' : 'flex-start',
  },
  statValue: {
    ...FONTS.titleLg,
    fontSize: isMobile ? 16 : 18,
    fontWeight: '800',
    lineHeight: isMobile ? 19 : 22,
    textAlign: isMobile ? 'center' : 'left',
  },
  statLabel: {
    ...FONTS.labelSm,
    fontSize: isMobile ? 9.5 : 11,
    textAlign: isMobile ? 'center' : 'left',
  },

  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SIZES.gutter,
    marginTop: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
    ...(isMobile ? {} : { maxWidth: 1200, alignSelf: 'center', width: '100%' }),
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...FONTS.labelSm,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  requestHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outline,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  requestSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  searchWrap: { paddingHorizontal: SIZES.gutter, paddingTop: 14, paddingBottom: 4, ...(isMobile ? {} : { maxWidth: 1200, alignSelf: 'center', width: '100%' }) },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1.5, borderColor: colors.outline,
  },
  searchBoxFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.bgElevated,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },

  tabRow: { flexDirection: 'row', gap: 10, marginHorizontal: SIZES.gutter, marginTop: 10, marginBottom: 4, ...(isMobile ? {} : { maxWidth: 1200, alignSelf: 'center', width: '100%' }) },
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
    ...(isMobile ? {} : { maxWidth: 1200, alignSelf: 'center', width: '100%' }),
  },
  addBtnText: { ...FONTS.titleSm, color: colors.primary },

  gridList: {
    padding: SIZES.gutter,
    paddingBottom: 24,
    gap: 10,
    ...(isMobile
      ? {}
      : {
          maxWidth: 1200,
          alignSelf: 'center',
          width: '100%',
        }),
  },
  list: { padding: SIZES.gutter, paddingBottom: 24, ...(isMobile ? {} : { maxWidth: 1200, alignSelf: 'center', width: '100%' }) },
  scroll: { flex: 1 },

  checkbox: { marginRight: 10, justifyContent: 'center', alignItems: 'center' },

  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12, width: '100%' },
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
    width: '100%',
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
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 6 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outline,
  },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 20 },
  sheet: {
    backgroundColor: colors.surface, borderRadius: 24, padding: 24,
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

  alertBox: { marginBottom: 14 },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { ...FONTS.labelSm, color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgElevated, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.outline,
  },
  fieldInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
  roleSelectWrap: { marginBottom: 14 },
  roleChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.outline,
  },
  roleChipText: { ...FONTS.labelMd, color: colors.textSecondary },

  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.bgElevated, alignItems: 'center', borderWidth: 1, borderColor: colors.outline },
  cancelText: { ...FONTS.titleSm, color: colors.textSecondary },
  submitBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  submitText: { ...FONTS.titleSm, color: colors.onPrimary },
});
