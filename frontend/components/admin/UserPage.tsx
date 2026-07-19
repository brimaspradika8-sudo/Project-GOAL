import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, TextInput, RefreshControl,
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

export default function UserPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
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

  const handleRoleChange = (userId: number, currentRole: string) => {
    const options = ROLES.filter(r => r !== currentRole);
    Alert.alert(
      'Ubah Role',
      'Pilih role baru:',
      [
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
      ]
    );
  };

  const handleDelete = (userId: number, name: string) => {
    Alert.alert('Hapus User', `Hapus "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          const token = await AsyncStorage.getItem(TOKEN_KEY);
          const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) { Alert.alert('Berhasil', 'User dihapus.'); fetchUsers(search); }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={st.loadingWrap}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={st.loadingText}>Memuat pengguna...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={st.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" colors={['#4ade80']} />}
      showsVerticalScrollIndicator={false}
    >
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

      <View style={st.countRow}>
        <View style={st.countPill}>
          <MaterialIcons name="group" size={12} color="#4ade80" />
          <Text style={st.countText}>{users.length} pengguna</Text>
        </View>
      </View>

      {users.length === 0 ? (
        <View style={st.emptyWrap}>
          <MaterialIcons name="person-search" size={52} color="#1e293b" />
          <Text style={st.emptyText}>Tidak ada hasil</Text>
        </View>
      ) : (
        users.map((u: any) => {
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
  countRow: { flexDirection: 'row', marginBottom: 12 },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#052e16', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#166534',
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#4ade80' },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: '#334155', fontSize: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0d1117', borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#1e293b',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 46, height: 46, borderRadius: 14, justifyContent: 'center',
    alignItems: 'center', marginRight: 13, borderWidth: 1.5,
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#e2e8f0', marginBottom: 2 },
  email: { fontSize: 12, color: '#475569', marginBottom: 6 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8,
    alignSelf: 'flex-start', borderWidth: 1,
  },
  roleDot: { width: 5, height: 5, borderRadius: 3 },
  roleText: { fontSize: 10, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginLeft: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
