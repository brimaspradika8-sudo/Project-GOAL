import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl, Image,
  Modal, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { TOKEN_KEY } from '../../app/_layout';
import { API_BASE_URL } from '../../lib/api';

const IMG_PLACEHOLDER = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop';

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  approved: { label: 'Aktif',    bg: 'rgba(6,78,59,0.5)', color: '#34d399' },
  pending:  { label: 'Menunggu', bg: 'rgba(69,26,3,0.6)', color: '#f59e0b' },
  rejected: { label: 'Ditolak', bg: 'rgba(69,10,10,0.6)', color: '#f87171' },
};

const SPORT_OPTIONS = ['Futsal', 'Basket', 'Badminton', 'Voli', 'Tenis', 'Mini Soccer', 'Lainnya'];

const EMPTY_FORM = {
  name: '',
  sport_type: '',
  description: '',
  price_per_hour: '',
  image_url: '',   // final URL after upload
  image_uri: '',   // local preview uri
};

export default function OwnerFieldsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchFields = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/my/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFields(data?.data ?? []);
    } catch {
      Alert.alert('Error', 'Gagal memuat data lapangan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFields(); }, [fetchFields]);
  const onRefresh = () => { setRefreshing(true); fetchFields(); };

  const pickImage = async (setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Diperlukan akses ke galeri foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setForm(p => ({ ...p, image_uri: result.assets[0].uri, image_url: '' }));
    }
  };

  const uploadImage = async (uri: string, token: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('image', blob, filename);
      } else {
        formData.append('image', { uri, name: filename, type: mime } as any);
      }

      const res = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) return null;
      return data.url;
    } catch {
      return null;
    }
  };

  const openCreate = () => {
    setCreateForm(EMPTY_FORM);
    setCreateError(null);
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.sport_type.trim()) {
      setCreateError('Nama dan jenis olahraga wajib diisi.');
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      let imageUrl = createForm.image_url;
      if (createForm.image_uri && !imageUrl) {
        const uploaded = await uploadImage(createForm.image_uri, token!);
        if (!uploaded) { setCreateError('Gagal mengunggah foto. Coba lagi.'); return; }
        imageUrl = uploaded;
      }

      const body: any = {
        name:       createForm.name.trim(),
        sport_type: createForm.sport_type.trim(),
      };
      if (createForm.description.trim())    body.description    = createForm.description.trim();
      if (createForm.price_per_hour.trim()) body.price_per_hour = parseInt(createForm.price_per_hour.replace(/\D/g, ''), 10);
      if (imageUrl)                          body.image_url      = imageUrl;

      const res = await fetch(`${API_BASE_URL}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.errors
          ? Object.values(data.errors).flat().join(' ')
          : data.message || 'Gagal menambah lapangan.';
        setCreateError(msg);
        return;
      }
      setShowCreate(false);
      Alert.alert('Berhasil', 'Lapangan berhasil ditambahkan dan sudah aktif.');
      fetchFields();
    } catch {
      setCreateError('Gagal terhubung ke server.');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (f: any) => {
    setEditTarget(f);
    setEditForm({
      name:           f.name || '',
      sport_type:     f.sport_type || '',
      description:    f.description || '',
      price_per_hour: f.price_per_hour ? String(f.price_per_hour) : '',
      image_url:      f.image_url || '',
      image_uri:      '',
    });
    setEditError(null);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim() || !editForm.sport_type.trim()) {
      setEditError('Nama dan jenis olahraga wajib diisi.');
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      let imageUrl = editForm.image_url;
      if (editForm.image_uri) {
        const uploaded = await uploadImage(editForm.image_uri, token!);
        if (!uploaded) { setEditError('Gagal mengunggah foto. Coba lagi.'); return; }
        imageUrl = uploaded;
      }

      const body: any = {
        name:        editForm.name.trim(),
        sport_type:  editForm.sport_type.trim(),
        description: editForm.description.trim() || null,
      };
      if (editForm.price_per_hour.trim()) body.price_per_hour = parseInt(editForm.price_per_hour.replace(/\D/g, ''), 10);
      if (imageUrl) body.image_url = imageUrl;

      const res = await fetch(`${API_BASE_URL}/fields/${editTarget.id}`, {
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
      Alert.alert('Berhasil', 'Data lapangan berhasil diperbarui.');
      fetchFields();
    } catch {
      setEditError('Gagal terhubung ke server.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    const doDelete = async () => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (Platform.OS !== 'web') Alert.alert('Berhasil', 'Lapangan dihapus.');
        else alert('Lapangan dihapus.');
        fetchFields();
      } else {
        if (Platform.OS !== 'web') Alert.alert('Error', 'Gagal menghapus lapangan.');
        else alert('Gagal menghapus lapangan.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Apakah Anda yakin ingin menghapus lapangan "${name}"?`)) {
        doDelete();
      }
      return;
    }

    Alert.alert('Hapus Lapangan', `Apakah Anda yakin ingin menghapus lapangan "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: doDelete },
    ]);
  };

  if (loading) {
    return (
      <View style={st.loadingWrap}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={st.loadingText}>Memuat venue Anda...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={st.container}>
        <View style={st.headerBar}>
          <View>
            <Text style={st.pageTitle}>Venue Anda</Text>
            <Text style={st.pageSubtitle}>Kelola aset properti olahraga Anda.</Text>
          </View>
          <TouchableOpacity style={st.addBtn} activeOpacity={0.8} onPress={openCreate}>
            <MaterialIcons name="add" size={20} color="#064e3b" />
            <Text style={st.addBtnText}>Baru</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={st.contentList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" />}
          showsVerticalScrollIndicator={false}
        >
          {fields.length === 0 ? (
            <View style={st.emptyWrap}>
              <View style={st.emptyIcon}>
                <MaterialIcons name="sports-soccer" size={40} color="#334155" />
              </View>
              <Text style={st.emptyTitle}>Belum ada lapangan</Text>
              <Text style={st.emptyDesc}>Ketuk tombol "Baru" di ujung atas untuk mulai menambahkan aset Anda.</Text>
            </View>
          ) : (
            fields.map((f: any) => {
              const status = STATUS_CFG[f.status] || STATUS_CFG.pending;
              const img = f.image_url || IMG_PLACEHOLDER;
              const priceStr = f.price_per_hour
                ? `Rp${Number(f.price_per_hour).toLocaleString('id-ID')}`
                : 'Hubungi';
              return (
                <View key={f.id} style={st.card}>
                  <View style={st.cardImgWrap}>
                    <Image source={{ uri: img }} style={st.cardImg} />
                    <View style={st.cardOverlay}>
                      <View style={[st.statusBadge, { backgroundColor: status.bg, borderColor: status.color + '40' }]}>
                        <View style={[st.statusDot, { backgroundColor: status.color }]} />
                        <Text style={[st.statusText, { color: status.color }]}>{status.label}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={st.cardBody}>
                    <View style={st.cardTop}>
                      <Text style={st.name} numberOfLines={1}>{f.name}</Text>
                      <View style={st.pricePill}>
                        <Text style={st.price}>{priceStr}<Text style={st.priceSub}>/jam</Text></Text>
                      </View>
                    </View>
                    <View style={st.detailRow}>
                      <MaterialIcons name="sports" size={14} color="#64748b" />
                      <Text style={st.detailText}>{f.sport_type?.toUpperCase()}</Text>
                    </View>
                    {f.description ? (
                      <View style={st.detailRow}>
                        <MaterialIcons name="notes" size={14} color="#64748b" />
                        <Text style={st.detailText} numberOfLines={2}>{f.description}</Text>
                      </View>
                    ) : null}
                    <View style={st.actions}>
                      <TouchableOpacity style={st.editBtn} activeOpacity={0.8} onPress={() => openEdit(f)}>
                        <MaterialIcons name="edit" size={16} color="#e2e8f0" />
                        <Text style={st.editBtnText}>Edit Venue</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={st.delBtn} activeOpacity={0.8} onPress={() => handleDelete(f.id, f.name)}>
                        <MaterialIcons name="delete-outline" size={18} color="#f87171" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* ── CREATE MODAL ── */}
      <FieldModal
        visible={showCreate}
        title="Penambahan Venue"
        iconName="add-business"
        iconColor="#4ade80"
        iconBg="rgba(74,222,128,0.1)"
        form={createForm}
        setForm={setCreateForm}
        error={createError}
        loading={createLoading}
        onPickImage={() => pickImage(setCreateForm)}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        submitLabel="Simpan Lapangan"
        submitBg="#4ade80"
      />

      {/* ── EDIT MODAL ── */}
      <FieldModal
        visible={!!editTarget}
        title="Edit Venue"
        iconName="edit"
        iconColor="#60a5fa"
        iconBg="rgba(96,165,250,0.1)"
        form={editForm}
        setForm={setEditForm}
        error={editError}
        loading={editLoading}
        onPickImage={() => pickImage(setEditForm)}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        submitLabel="Simpan Perubahan"
        submitBg="#3b82f6"
      />
    </>
  );
}

// ── Field Form Modal ──────────────────────────────────────────────────────────
function FieldModal({
  visible, title, iconName, iconColor, iconBg,
  form, setForm, error, loading,
  onPickImage, onClose, onSubmit, submitLabel, submitBg,
}: {
  visible: boolean; title: string;
  iconName: string; iconColor: string; iconBg: string;
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  error: string | null; loading: boolean;
  onPickImage: () => void;
  onClose: () => void; onSubmit: () => void;
  submitLabel: string; submitBg: string;
}) {
  const set = (key: keyof typeof EMPTY_FORM) => (val: string) => setForm(p => ({ ...p, [key]: val }));
  const previewUri = form.image_uri || form.image_url || null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={st.sheet}>
          <View style={st.sheetHandle} />

          <View style={st.sheetHeader}>
            <View style={[st.sheetIconWrap, { backgroundColor: iconBg }]}>
              <MaterialIcons name={iconName as any} size={22} color={iconColor} />
            </View>
            <Text style={st.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={st.sheetClose}>
              <MaterialIcons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={st.errorBox}>
              <MaterialIcons name="error-outline" size={16} color="#fca5a5" />
              <Text style={st.errorText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Image picker */}
            <Text style={st.fieldLabel}>Foto Venue (Utama)</Text>
            <TouchableOpacity style={st.imagePicker} onPress={onPickImage} activeOpacity={0.8}>
              {previewUri ? (
                <>
                  <Image source={{ uri: previewUri }} style={st.imagePreview} />
                  <View style={st.imageEditOverlay}>
                    <MaterialIcons name="photo-camera" size={20} color="#fff" />
                    <Text style={st.imageEditText}>Ganti Foto</Text>
                  </View>
                </>
              ) : (
                <View style={st.imageEmpty}>
                  <View style={st.imgDashedCircle}>
                    <MaterialIcons name="add-photo-alternate" size={26} color="#64748b" />
                  </View>
                  <Text style={st.imageEmptyText}>Tap untuk memilih foto</Text>
                  <Text style={st.imageEmptyHint}>Dari Galeri perangkat Anda (Maks 5MB)</Text>
                </View>
              )}
            </TouchableOpacity>

            <FField label="Nama Lapangan" icon="stadium" value={form.name} onChangeText={set('name')} placeholder="Contoh: Futsal Arena Gemilang" />

            <Text style={st.fieldLabel}>Jenis Olahraga</Text>
            <View style={st.sportRow}>
              {SPORT_OPTIONS.map(s => {
                const active = form.sport_type.toLowerCase() === s.toLowerCase();
                return (
                  <TouchableOpacity
                    key={s}
                    style={[st.sportChip, active && st.sportChipActive]}
                    onPress={() => setForm(p => ({ ...p, sport_type: s.toLowerCase() }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[st.sportChipText, active && st.sportChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FField label="Deskripsi" icon="notes" value={form.description} onChangeText={set('description')} placeholder="Fasilitas yang tersedia..." multiline />
            <FField label="Sewa Per Jam (Rp)" icon="payments" value={form.price_per_hour} onChangeText={set('price_per_hour')} placeholder="Contoh: 150000" keyboardType="numeric" />
          </ScrollView>

          <View style={st.sheetActions}>
            <TouchableOpacity style={[st.submitBtn, { backgroundColor: submitBg }, loading && { opacity: 0.6 }]} onPress={onSubmit} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#0f172a" size="small" />
                : <Text style={[st.submitText, submitBg === '#4ade80' ? { color: '#064e3b' } : { color: '#fff' }]}>{submitLabel}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FField({ label, icon, value, onChangeText, placeholder, keyboardType, multiline }: {
  label: string; icon: string; value: string;
  onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean;
}) {
  return (
    <View style={st.fieldWrap}>
      <Text style={st.fieldLabel}>{label}</Text>
      <View style={[st.fieldRow, multiline && { alignItems: 'flex-start', paddingTop: 14 }]}>
        <MaterialIcons name={icon as any} size={18} color="#64748b" style={{ marginRight: 12, marginTop: multiline ? 2 : 0 }} />
        <TextInput
          style={[st.fieldInput, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? label}
          placeholderTextColor="#475569"
          keyboardType={keyboardType}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d14' }, // Premium deep dark
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 13, fontWeight: '500' },

  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#0d121c',
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc', marginBottom: 2 },
  pageSubtitle: { fontSize: 13, color: '#64748b' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#4ade80', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12,
    shadowColor: '#4ade80', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width:0, height:4 }, elevation: 4,
  },
  addBtnText: { fontSize: 14, fontWeight: '800', color: '#064e3b' },

  contentList: { padding: 20, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#0d121c', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#f1f5f9' },
  emptyDesc: { fontSize: 14, color: '#475569', textAlign: 'center', paddingHorizontal: 20 },

  card: { 
    backgroundColor: '#0d121c', borderRadius: 20, marginBottom: 20, 
    borderWidth: 1, borderColor: '#1e293b',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 5,
  },
  cardImgWrap: { borderTopLeftRadius: 19, borderTopRightRadius: 19, overflow: 'hidden' },
  cardImg: { width: '100%', height: 160 },
  cardOverlay: { position: 'absolute', top: 14, right: 14 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, backdropFilter: 'blur(10px)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },
  
  cardBody: { padding: 18 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 17, fontWeight: '800', color: '#f8fafc', flex: 1, marginRight: 10 },
  pricePill: { backgroundColor: 'rgba(74,222,128,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)' },
  price: { fontSize: 14, fontWeight: '800', color: '#4ade80' },
  priceSub: { fontSize: 10, fontWeight: '600', color: '#64748b' },
  
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  detailText: { fontSize: 13, color: '#94a3b8', flex: 1, lineHeight: 18 },
  
  actions: { flexDirection: 'row', gap: 12, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1e293b', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  editBtnText: { color: '#e2e8f0', fontSize: 14, fontWeight: '700' },
  delBtn: { width: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#450a0a', borderRadius: 12, borderWidth: 1, borderColor: '#7f1d1d', paddingVertical: 12 },

  // Modal styling (Premium)
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(5,8,12,0.85)' },
  sheet: {
    backgroundColor: '#0d121c', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1, borderColor: '#1e293b', maxHeight: '90%',
  },
  sheetHandle: { width: 48, height: 5, borderRadius: 3, backgroundColor: '#334155', alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sheetIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { fontSize: 19, fontWeight: '800', color: '#f8fafc', flex: 1 },
  sheetClose: { padding: 6, backgroundColor: '#1e293b', borderRadius: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(127,29,29,0.5)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#991b1b' },
  errorText: { color: '#fca5a5', fontSize: 13, flex: 1, fontWeight: '500' },

  // Image picker
  imagePicker: {
    borderRadius: 16, overflow: 'hidden', marginBottom: 20,
    backgroundColor: '#111827', borderWidth: 2, borderStyle: 'dashed', borderColor: '#334155',
  },
  imagePreview: { width: '100%', height: 180 },
  imageEditOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8, paddingVertical: 12,
  },
  imageEditText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  imageEmpty: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 40 },
  imgDashedCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  imageEmptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  imageEmptyHint: { color: '#475569', fontSize: 12 },

  // Sport chips
  sportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  sportChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  sportChipActive: { backgroundColor: 'rgba(74,222,128,0.15)', borderColor: '#4ade80' },
  sportChipText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  sportChipTextActive: { color: '#4ade80', fontWeight: '700' },

  // Field input
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#334155' },
  fieldInput: { flex: 1, color: '#f1f5f9', fontSize: 15, paddingVertical: 0 },

  sheetActions: { marginTop: 10 },
  submitBtn: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width:0, height:4 }, elevation: 3 },
  submitText: { fontSize: 16, fontWeight: '800' },
});
