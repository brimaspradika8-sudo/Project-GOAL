import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, TextInput, RefreshControl,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../../app/_layout';
import { API_BASE_URL } from '../../lib/api';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  player:      { label: 'Pemain',      color: '#60a5fa', bg: '#1e3a5f' },
  owner:       { label: 'Pemilik',     color: '#34d399', bg: '#064e3b' },
  admin:       { label: 'Admin',       color: '#a78bfa', bg: '#2e1065' },
  super_admin: { label: 'Super Admin', color: '#f59e0b', bg: '#451a03' },
};

const ROLES = ['player', 'owner', 'admin'];

type Tab = 'user' | 'owner';

const EMPTY_CREATE = { name: '', email: '', password: '' };
const EMPTY_EDIT   = { name: '', email: '', password: '' };

export default function UserPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('user');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCreatePwd, setShowCreatePwd] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showEditPwd, setShowEditPwd] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (q?: string) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const params = q ? `?search=${encodeURIComponent(q)}` : '';
      const res = await fetch(`${API_BASE_URL}/admin/users${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data?.data ?? []);
    } catch {
      Alert.alert('Error', 'Gagal memuat data pengguna.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const onRefresh = () => { setRefreshing(true); fetchUsers(search); };

  const onSearchChange = (text: string) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchUsers(text), 400);
  };

  // ── CREATE OWNER ──────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError('Semua field wajib diisi.');
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...createForm, role: 'owner' }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.errors
          ? Object.values(data.errors).flat().join(' ')
          : data.message || 'Gagal membuat owner.';
        setCreateError(msg);
        return;
      }
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
      Alert.alert('Berhasil', 'Owner baru berhasil ditambahkan.');
      fetchUsers(search);
    } catch {
      setCreateError('Gagal terhubung ke server.');
    } finally {
      setCreateLoading(false);
    }
  };

  // ── EDIT OWNER ────────────────────────────────────────────
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
    setEditLoading(true);
    setEditError(null);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const body: any = { name: editForm.name, email: editForm.email };
      if (editForm.password.trim()) body.password = editForm.password;
      const res = await fetch(`${API_BASE_URL}/admin/users/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.errors
          ? Object.values(data.errors).flat().join(' ')
          : data.message || 'Gagal menyimpan perubahan.';
        setEditError(msg);
        return;
      }
      setEditTarget(null);
      Alert.alert('Berhasil', 'Data owner berhasil diperbarui.');
      fetchUsers(search);
    } catch {
      setEditError('Gagal terhubung ke server.');
    } finally {
      setEditLoading(false);
    }
  };

  // ── ROLE CHANGE ───────────────────────────────────────────
  const handleRoleChange = (userId: number, currentRole: string) => {
    const options = ROLES.filter(r => r !== currentRole);
    Alert.alert('Ubah Role', 'Pilih role baru:', [
      ...options.map(r => ({
        text: ROLE_CONFIG[r]?.label ?? r,
        onPress: async () => {
          const token = await AsyncStorage.getItem(TOKEN_KEY);
          const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ role: r }),
          });
          if (res.ok) { Alert.alert('Berhasil', 'Role diperbarui.'); fetchUsers(search); }
          else Alert.alert('Error', 'Gagal memperbarui role.');
        },
      })),
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  // ── DELETE ────────────────────────────────────────────────
  const handleDelete = (userId: number, name: string) => {
    Alert.alert('Hapus User', `Hapus "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
              method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              Alert.alert('Berhasil', 'User dihapus.');
              fetchUsers(search);
            } else {
              const d = await res.json().catch(() => ({}));
              Alert.alert('Gagal', d.message || 'Gagal menghapus user.');
            }
          } catch {
            Alert.alert('Error Koneksi', 'Tidak dapat terhubung ke server.');
          }
        },
      },
    ]);
  };

  // Filter sesuai tab
  const filteredUsers = users.filter(u => {
    const role = u.profile?.role || 'player';
    if (activeTab === 'owner') return role === 'owner';
    return role !== 'owner';
  });

  const ownerCount = users.filter(u => (u.profile?.role || 'player') === 'owner').length;
  const userCount  = users.filter(u => (u.profile?.role || 'player') !== 'owner').length;

  if (loading) {
    return (
      <View style={st.loadingWrap}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={st.loadingText}>Memuat pengguna...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={st.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" colors={['#4ade80']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={[st.searchWrap, focused && st.searchFocused]}>
          <MaterialIcons name="search" size={19} color={focused ? '#4ade80' : '#475569'} />
          <TextInput
            style={st.searchInput}
            placeholder="Cari nama atau email..."
            placeholderTextColor="#334155"
            value={search}
            onChangeText={onSearchChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); fetchUsers(); }}>
              <MaterialIcons name="close" size={15} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={st.tabRow}>
          <TouchableOpacity
            style={[st.tab, activeTab === 'user' && st.tabActive]}
            onPress={() => setActiveTab('user')}
            activeOpacity={0.75}
          >
            <MaterialIcons name="person" size={15} color={activeTab === 'user' ? '#60a5fa' : '#475569'} />
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
            <MaterialIcons name="store" size={15} color={activeTab === 'owner' ? '#34d399' : '#475569'} />
            <Text style={[st.tabLabel, activeTab === 'owner' && st.tabLabelOwner]}>Owner</Text>
            <View style={[st.tabBadge, activeTab === 'owner' && st.tabBadgeOwner]}>
              <Text style={[st.tabBadgeText, activeTab === 'owner' && st.tabBadgeTextOwner]}>{ownerCount}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Add Owner Button (only on Owner tab) */}
        {activeTab === 'owner' && (
          <TouchableOpacity style={st.addBtn} onPress={() => { setCreateError(null); setCreateForm(EMPTY_CREATE); setShowCreate(true); }} activeOpacity={0.8}>
            <MaterialIcons name="add-circle-outline" size={17} color="#34d399" />
            <Text style={st.addBtnText}>Tambah Owner Baru</Text>
          </TouchableOpacity>
        )}

        {/* List */}
        {filteredUsers.length === 0 ? (
          <View style={st.emptyWrap}>
            <MaterialIcons name={activeTab === 'owner' ? 'store' : 'person-search'} size={52} color="#1e293b" />
            <Text style={st.emptyText}>{activeTab === 'owner' ? 'Belum ada owner terdaftar.' : 'Tidak ada hasil.'}</Text>
          </View>
        ) : (
          filteredUsers.map((u: any) => {
            const roleKey = u.profile?.role || 'player';
            const rc = ROLE_CONFIG[roleKey] ?? ROLE_CONFIG.player;
            return (
              <View key={u.id} style={st.card}>
                <View style={st.cardLeft}>
                  <View style={[st.avatar, { backgroundColor: rc.bg, borderColor: rc.color + '55' }]}>
                    <Text style={[st.avatarText, { color: rc.color }]}>{(u.name || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={st.info}>
                    <Text style={st.name} numberOfLines={1}>{u.name}</Text>
                    <Text style={st.email} numberOfLines={1}>{u.email}</Text>
                    <View style={[st.roleBadge, { backgroundColor: rc.bg, borderColor: rc.color + '40' }]}>
                      <View style={[st.roleDot, { backgroundColor: rc.color }]} />
                      <Text style={[st.roleText, { color: rc.color }]}>{rc.label}</Text>
                    </View>
                  </View>
                </View>
                <View style={st.actions}>
                  {activeTab === 'owner' && (
                    <TouchableOpacity style={[st.actionBtn, { backgroundColor: '#022c22' }]} onPress={() => openEdit(u)}>
                      <MaterialIcons name="edit" size={16} color="#34d399" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[st.actionBtn, { backgroundColor: '#1e3a5f' }]} onPress={() => handleRoleChange(u.id, roleKey)}>
                    <MaterialIcons name="manage-accounts" size={17} color="#60a5fa" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[st.actionBtn, { backgroundColor: '#2d0f0f' }]} onPress={() => handleDelete(u.id, u.name)}>
                    <MaterialIcons name="delete-outline" size={17} color="#f87171" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── CREATE OWNER MODAL ── */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowCreate(false)} />
          <View style={st.sheet}>
            <View style={st.sheetHandle} />
            <View style={st.sheetHeader}>
              <View style={st.sheetIconWrap}>
                <MaterialIcons name="person-add-alt-1" size={20} color="#34d399" />
              </View>
              <Text style={st.sheetTitle}>Tambah Owner</Text>
            </View>

            {createError ? (
              <View style={st.errorBox}>
                <MaterialIcons name="error-outline" size={14} color="#f87171" />
                <Text style={st.errorText}>{createError}</Text>
              </View>
            ) : null}

            <FormField label="Nama Lengkap" icon="person-outline" value={createForm.name}
              onChangeText={v => setCreateForm(p => ({ ...p, name: v }))} />
            <FormField label="Email" icon="mail-outline" value={createForm.email}
              onChangeText={v => setCreateForm(p => ({ ...p, email: v }))}
              keyboardType="email-address" autoCapitalize="none" />
            <FormField label="Password" icon="lock-outline" value={createForm.password}
              onChangeText={v => setCreateForm(p => ({ ...p, password: v }))}
              secureTextEntry={!showCreatePwd}
              rightIcon={showCreatePwd ? 'visibility-off' : 'visibility'}
              onRightIconPress={() => setShowCreatePwd(p => !p)} />

            <View style={st.sheetActions}>
              <TouchableOpacity style={st.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={st.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.submitBtn, createLoading && { opacity: 0.6 }]} onPress={handleCreate} disabled={createLoading}>
                {createLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={st.submitText}>Tambah</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── EDIT OWNER MODAL ── */}
      <Modal visible={!!editTarget} transparent animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setEditTarget(null)} />
          <View style={st.sheet}>
            <View style={st.sheetHandle} />
            <View style={st.sheetHeader}>
              <View style={[st.sheetIconWrap, { backgroundColor: '#1e3a5f' }]}>
                <MaterialIcons name="edit" size={20} color="#60a5fa" />
              </View>
              <Text style={st.sheetTitle}>Edit Owner</Text>
            </View>

            {editError ? (
              <View style={st.errorBox}>
                <MaterialIcons name="error-outline" size={14} color="#f87171" />
                <Text style={st.errorText}>{editError}</Text>
              </View>
            ) : null}

            <FormField label="Nama Lengkap" icon="person-outline" value={editForm.name}
              onChangeText={v => setEditForm(p => ({ ...p, name: v }))} />
            <FormField label="Email" icon="mail-outline" value={editForm.email}
              onChangeText={v => setEditForm(p => ({ ...p, email: v }))}
              keyboardType="email-address" autoCapitalize="none" />
            <FormField label="Password Baru (opsional)" icon="lock-outline" value={editForm.password}
              onChangeText={v => setEditForm(p => ({ ...p, password: v }))}
              secureTextEntry={!showEditPwd}
              rightIcon={showEditPwd ? 'visibility-off' : 'visibility'}
              onRightIconPress={() => setShowEditPwd(p => !p)}
              placeholder="Kosongkan jika tidak diubah" />

            <View style={st.sheetActions}>
              <TouchableOpacity style={st.cancelBtn} onPress={() => setEditTarget(null)}>
                <Text style={st.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.submitBtn, { backgroundColor: '#1e4976' }, editLoading && { opacity: 0.6 }]} onPress={handleEdit} disabled={editLoading}>
                {editLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={st.submitText}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ── Reusable field input ──────────────────────────────────────────────────────
function FormField({ label, icon, value, onChangeText, keyboardType, autoCapitalize, secureTextEntry, rightIcon, onRightIconPress, placeholder }: {
  label: string; icon: string; value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any; autoCapitalize?: any;
  secureTextEntry?: boolean;
  rightIcon?: string; onRightIconPress?: () => void;
  placeholder?: string;
}) {
  return (
    <View style={st.fieldWrap}>
      <Text style={st.fieldLabel}>{label}</Text>
      <View style={st.fieldRow}>
        <MaterialIcons name={icon as any} size={17} color="#475569" style={{ marginRight: 10 }} />
        <TextInput
          style={st.fieldInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder ?? label}
          placeholderTextColor="#334155"
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress}>
            <MaterialIcons name={rightIcon as any} size={17} color="#475569" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 80 },
  loadingText: { color: '#475569', fontSize: 14 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0d1117', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 12, borderWidth: 1.5, borderColor: '#1e293b',
  },
  searchFocused: { borderColor: '#4ade80', backgroundColor: '#061910' },
  searchInput: { flex: 1, color: '#e2e8f0', fontSize: 14, paddingVertical: 0 },

  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 11, borderRadius: 12,
    backgroundColor: '#0d1117', borderWidth: 1.5, borderColor: '#1e293b',
  },
  tabActive:      { backgroundColor: '#0f233d', borderColor: '#1e4976' },
  tabOwnerActive: { backgroundColor: '#022c22', borderColor: '#065f46' },
  tabLabel:        { fontSize: 13, fontWeight: '700', color: '#475569' },
  tabLabelActive:  { color: '#60a5fa' },
  tabLabelOwner:   { color: '#34d399' },
  tabBadge:        { backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  tabBadgeActive:  { backgroundColor: '#1e3a5f' },
  tabBadgeOwner:   { backgroundColor: '#064e3b' },
  tabBadgeText:     { fontSize: 11, fontWeight: '800', color: '#475569' },
  tabBadgeTextActive: { color: '#60a5fa' },
  tabBadgeTextOwner:  { color: '#34d399' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#022c22', borderRadius: 12, borderWidth: 1.5, borderColor: '#065f46',
    paddingVertical: 12, marginBottom: 14,
  },
  addBtnText: { color: '#34d399', fontSize: 13, fontWeight: '700' },

  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: '#334155', fontSize: 14 },

  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0d1117', borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#1e293b',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 13, borderWidth: 1.5 },
  avatarText: { fontSize: 18, fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#e2e8f0', marginBottom: 2 },
  email: { fontSize: 12, color: '#475569', marginBottom: 6 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start', borderWidth: 1 },
  roleDot: { width: 5, height: 5, borderRadius: 3 },
  roleText: { fontSize: 10, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 6, marginLeft: 6 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // Modal / Sheet
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: '#0d1117', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1, borderColor: '#1e293b',
  },
  sheetHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: '#334155', alignSelf: 'center', marginBottom: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  sheetIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#022c22',
    justifyContent: 'center', alignItems: 'center',
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#f1f5f9' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2d0f0f', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#7f1d1d' },
  errorText: { color: '#fca5a5', fontSize: 12, flex: 1 },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#334155',
  },
  fieldInput: { flex: 1, color: '#e2e8f0', fontSize: 14, paddingVertical: 0 },

  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  cancelText: { color: '#64748b', fontSize: 14, fontWeight: '700' },
  submitBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#064e3b', alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
