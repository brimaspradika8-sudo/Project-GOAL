import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  RefreshControl, TextInput, Image, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { TOKEN_KEY } from '../../lib/auth';
import { API_BASE_URL, getErrorMessage, DEFAULT_HEADERS, getAssetUrl } from '../../lib/api';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import { SkeletonCards } from '../Skeleton';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useToastStore } from '../../store/toastStore';
import { useTheme, type ThemeColors } from '../../lib/theme';
import { useDebounce } from '../../hooks/useDebounce';
import {
  SPORT_OPTIONS, SPORT_MAP, SPORT_LABELS,
  type FieldFormErrors, type FieldFormData,
  EMPTY_ERRORS, validateAllFields, hasErrors,
  validateFieldName, validateFieldSportType, validateFieldPrice,
  validateFieldImage, validateFieldImageSize, validateFieldDescription,
  validateFieldLocation, mimeFromExt,
} from '../../lib/fieldValidation';

const IMG_PLACEHOLDER = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop';

const EMPTY_FORM: FieldFormData = {
  name: '', sport_type: '', description: '', price_per_hour: '',
  image_url: '', image_uri: '', image_mime: '', location: '',
};

export default function ActiveFieldsPage({ hideHeader }: { hideHeader?: boolean } = {}) {
  const { colors } = useTheme();
  const st = makeStyles(colors);

  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSport, setFilterSport] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<FieldFormData>(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editErrors, setEditErrors] = useState<FieldFormErrors>(EMPTY_ERRORS);
  const editTouched = useRef<Record<string, boolean>>({});

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFields = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterSport) params.set('sport', filterSport);
      params.set('page', '1');

      const res = await fetch(`${API_BASE_URL}/fields?${params.toString()}`, {
        headers: {
          ...DEFAULT_HEADERS,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      setFields(data?.data ?? []);
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Gagal memuat data lapangan.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, filterSport]);

  useEffect(() => { fetchFields(); }, [fetchFields]);
  const onRefresh = () => { setRefreshing(true); fetchFields(); };

  const openEdit = (f: any) => {
    setEditTarget(f);
    setEditForm({
      name: f.name || '', sport_type: f.sport_type || '',
      description: f.description || '',
      price_per_hour: f.price_per_hour ? String(f.price_per_hour) : '',
      image_url: f.image_url || '', image_uri: '', image_mime: '',
      location: f.location || '',
    });
    setEditError(null);
    setEditErrors(EMPTY_ERRORS);
    editTouched.current = {};
  };

  const validateSingleField = (key: keyof FieldFormData, value: string, form: FieldFormData) => {
    let err = '';
    switch (key) {
      case 'name': err = validateFieldName(value); break;
      case 'sport_type': err = validateFieldSportType(value); break;
      case 'price_per_hour': err = validateFieldPrice(value); break;
      case 'description': err = validateFieldDescription(value); break;
      case 'location': err = validateFieldLocation(value); break;
      case 'image_uri': err = validateFieldImage(value, form.image_url, form.image_mime); break;
    }
    setEditErrors(prev => ({ ...prev, [key]: err }));
  };

  const onFormFieldChange = (key: keyof FieldFormData, value: string) => {
    const shouldValidate = editTouched.current[key] || key === 'sport_type' || key === 'image_uri';
    setEditForm(p => {
      const next = { ...p, [key]: value };
      if (shouldValidate) validateSingleField(key, value, next);
      return next;
    });
  };

  const onFieldBlur = (key: keyof FieldFormData) => {
    editTouched.current[key] = true;
    validateSingleField(key, editForm[key], editForm);
  };

  const onAllFieldsTouched = () => {
    const fields: (keyof FieldFormData)[] = ['name', 'sport_type', 'price_per_hour', 'image_uri', 'description', 'location'];
    fields.forEach(f => { editTouched.current[f] = true; });
    const errs = validateAllFields(editForm);
    setEditErrors(errs);
  };

  const pickEditImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Diperlukan akses ke galeri foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [16, 9], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const mime = asset.mimeType || '';
      const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
      const typeErr = validateFieldImage(uri, '', mime || ext);
      if (typeErr) { setEditErrors(prev => ({ ...prev, image: typeErr })); return; }
      const sizeErr = validateFieldImageSize(asset.fileSize ?? 0);
      if (sizeErr) { setEditErrors(prev => ({ ...prev, image: sizeErr })); return; }
      const finalMime = mime || mimeFromExt(ext);
      setEditForm(p => ({ ...p, image_uri: uri, image_url: '', image_mime: finalMime }));
      setEditErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const uploadImage = async (uri: string, token: string, mime?: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const finalMime = mime || mimeFromExt(ext);
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('image', blob, filename);
      } else {
        formData.append('image', { uri, name: filename, type: finalMime } as any);
      }
      const res = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { console.error('[uploadImage] gagal:', res.status, data); return null; }
      return data.url;
    } catch (err: any) {
      console.error('[uploadImage] exception:', err?.message ?? err);
      return null;
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    onAllFieldsTouched();
    const errs = validateAllFields(editForm);
    setEditErrors(errs);
    if (hasErrors(errs)) return;

    setEditLoading(true);
    setEditError(null);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      let imageUrl = editForm.image_url;
      if (editForm.image_uri) {
        const uploaded = await uploadImage(editForm.image_uri, token!, editForm.image_mime);
        if (!uploaded) { setEditError('Gagal mengunggah foto. Coba lagi.'); return; }
        imageUrl = uploaded;
      }
      const body: any = {
        name: editForm.name.trim(),
        sport_type: editForm.sport_type.trim(),
        description: editForm.description.trim() || null,
        location: editForm.location.trim() || null,
      };
      if (editForm.price_per_hour.trim()) body.price_per_hour = parseInt(editForm.price_per_hour.replace(/\D/g, ''), 10);
      if (imageUrl) body.image_url = imageUrl;

      const res = await fetch(`${API_BASE_URL}/fields/${editTarget.id}`, {
        method: 'PUT',
        headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(getErrorMessage(data, 'Gagal menyimpan perubahan.'));
        return;
      }
      setEditTarget(null);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Data lapangan berhasil diperbarui.' });
      fetchFields();
    } catch {
      setEditError('Gagal terhubung ke server.');
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Lapangan dihapus.' });
        setDeleteTarget(null);
        fetchFields();
      } else {
        const data = await res.json().catch(() => ({}));
        useToastStore.getState().show({ type: 'error', title: 'Gagal', description: getErrorMessage(data, 'Gagal menghapus lapangan.') });
      }
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Gagal menghapus lapangan.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const SPORT_CHIPS = ['Semua', ...SPORT_OPTIONS];
  const sportValue = (s: string) => s === 'Semua' ? null : (SPORT_MAP[s] ?? null);

  if (loading) {
    return (
      <View style={st.screen}>
        {!hideHeader && <DashboardHeader title="Lapangan Aktif" subtitle="Kelola semua lapangan yang sudah disetujui" />}
        <SkeletonCards count={3} />
      </View>
    );
  }

  return (
    <>
      <View style={st.screen}>
        {!hideHeader && <DashboardHeader title="Lapangan Aktif" subtitle="Kelola semua lapangan yang sudah disetujui" />}

        <View style={st.searchWrap}>
          <View style={[st.searchBar, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline }]}>
            <MaterialIcons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              style={[st.searchInput, { color: colors.text }]}
              placeholder="Cari nama atau lokasi..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chipScroll}>
          {SPORT_CHIPS.map(s => {
            const active = (filterSport === null && s === 'Semua') || filterSport === sportValue(s);
            return (
              <TouchableOpacity
                key={s}
                style={[st.chip, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setFilterSport(sportValue(s))}
                activeOpacity={0.8}
              >
                <Text style={[st.chipText, { color: colors.textSecondary }, active && { color: colors.onPrimary }]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          contentContainerStyle={st.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {fields.length === 0 ? (
            <View style={st.emptyWrap}>
              <View style={[st.emptyIconWrap, { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '30' }]}>
                <MaterialIcons name="stadium" size={40} color={colors.primary} />
              </View>
              <Text style={[st.emptyTitle, { color: colors.text }]}>Tidak Ada Lapangan</Text>
              <Text style={[st.emptyDesc, { color: colors.textSecondary }]}>
                {search || filterSport ? 'Tidak ada lapangan yang cocok dengan filter.' : 'Belum ada lapangan aktif.'}
              </Text>
            </View>
          ) : (
            fields.map((f: any) => {
              const img = f.image_url || IMG_PLACEHOLDER;
              const priceStr = f.price_per_hour
                ? `Rp${Number(f.price_per_hour).toLocaleString('id-ID')}`
                : '-';
              return (
                <View key={f.id} style={[st.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
                  <View style={st.cardImgWrap}>
                    <Image source={{ uri: getAssetUrl(img) || img }} style={st.cardImg} />
                  </View>
                  <View style={st.cardBody}>
                    <View style={st.cardTop}>
                      <Text style={[st.fieldName, { color: colors.text }]} numberOfLines={1}>{f.name}</Text>
                      <View style={[st.pricePill, { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '30' }]}>
                        <Text style={[st.price, { color: colors.primary }]}>{priceStr}<Text style={[st.priceSub, { color: colors.textSecondary }]}>/jam</Text></Text>
                      </View>
                    </View>
                    <View style={st.detailRow}>
                      <MaterialIcons name="sports" size={14} color={colors.textSecondary} />
                      <Text style={[st.detailText, { color: colors.textSecondary }]}>{(SPORT_LABELS[f.sport_type] || f.sport_type)?.toUpperCase()}</Text>
                    </View>
                    {f.owner && (
                      <View style={st.detailRow}>
                        <MaterialIcons name="person" size={14} color={colors.textSecondary} />
                        <Text style={[st.detailText, { color: colors.textSecondary }]} numberOfLines={1}>{f.owner.name}</Text>
                      </View>
                    )}
                    {f.location && (
                      <View style={st.detailRow}>
                        <MaterialIcons name="location-on" size={14} color={colors.textSecondary} />
                        <Text style={[st.detailText, { color: colors.textSecondary }]} numberOfLines={1}>{f.location}</Text>
                      </View>
                    )}

                    <View style={st.actions}>
                      <TouchableOpacity
                        style={[st.editBtn, { backgroundColor: colors.successLight, borderColor: colors.primary + '30' }]}
                        activeOpacity={0.8}
                        onPress={() => openEdit(f)}
                      >
                        <MaterialIcons name="edit" size={16} color={colors.primary} />
                        <Text style={[st.editBtnText, { color: colors.primary }]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[st.delBtn, { backgroundColor: colors.errorLight, borderColor: colors.error + '30' }]}
                        activeOpacity={0.8}
                        onPress={() => setDeleteTarget({ id: f.id, name: f.name })}
                      >
                        <MaterialIcons name="delete-outline" size={16} color={colors.error} />
                        <Text style={[st.delBtnText, { color: colors.error }]}>Hapus</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* ─── Edit Modal ─── */}
      <Modal visible={!!editTarget} transparent animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setEditTarget(null)} />
          <View style={st.sheet}>
            <View style={st.sheetHandle} />
            <View style={st.sheetHeader}>
              <View style={[st.sheetIconWrap, { backgroundColor: colors.accentPurpleLight }]}>
                <MaterialIcons name="edit" size={22} color={colors.accentPurple} />
              </View>
              <Text style={[st.sheetTitle, { color: colors.text }]}>Edit Lapangan</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)} style={[st.sheetClose, { backgroundColor: colors.surfaceContainerLow }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editError ? (
              <View style={[st.errorBox, { backgroundColor: colors.errorContainer, borderColor: colors.error + '30' }]}>
                <MaterialIcons name="error-outline" size={16} color={colors.error} />
                <Text style={[st.errorText, { color: colors.error }]}>{editError}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={st.fieldWrap}>
                <Text style={[st.fieldLabel, { color: colors.textSecondary }]}>Foto Venue (Utama)</Text>
                <TouchableOpacity
                  style={[st.imagePicker, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline }, editErrors.image && { borderColor: colors.error }]}
                  onPress={pickEditImage} activeOpacity={0.8}
                >
                  {editForm.image_uri || editForm.image_url ? (
                    <View style={st.imagePreviewWrap}>
                      <Image source={{ uri: editForm.image_uri || editForm.image_url }} style={st.imagePreview} resizeMode="cover" />
                      <View style={st.imageEditOverlay}>
                        <MaterialIcons name="photo-camera" size={18} color="#fff" />
                        <Text style={st.imageEditText}>Ganti Foto</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={st.imageEmpty}>
                      <View style={[st.imgDashedCircle, { backgroundColor: colors.primaryContainer }]}>
                        <MaterialIcons name="add-photo-alternate" size={22} color={colors.primary} />
                      </View>
                      <View style={st.imageEmptyTextCol}>
                        <Text style={[st.imageEmptyText, { color: colors.text }]}>Tap untuk memilih foto</Text>
                        <Text style={[st.imageEmptyHint, { color: colors.textSecondary }]}>Format JPG, PNG, WEBP (Maks 5MB)</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
                {editErrors.image ? (
                  <View style={st.fieldErrorRow}>
                    <MaterialIcons name="warning" size={13} color={colors.error} />
                    <Text style={[st.fieldErrorText, { color: colors.error }]}>{editErrors.image}</Text>
                  </View>
                ) : null}
              </View>

              <FField
                label="Nama Lapangan" icon="stadium"
                value={editForm.name}
                onChangeText={(v) => onFormFieldChange('name', v)}
                onBlur={() => onFieldBlur('name')}
                placeholder="Contoh: Futsal Arena Gemilang"
                error={editErrors.name} st={st} colors={colors}
              />

              <View style={st.fieldWrap}>
                <Text style={[st.fieldLabel, { color: colors.textSecondary }]}>Jenis Olahraga</Text>
                <View style={[st.sportRow, editErrors.sport_type ? { borderColor: colors.error } : null]}>
                  {SPORT_OPTIONS.map(s => {
                    const active = editForm.sport_type === SPORT_MAP[s];
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[st.sportChip, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => onFormFieldChange('sport_type', SPORT_MAP[s])}
                      >
                        <Text style={[st.sportChipText, { color: colors.textSecondary }, active && { color: colors.onPrimary }]}>{s}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {editErrors.sport_type ? (
                  <View style={st.fieldErrorRow}>
                    <MaterialIcons name="warning" size={13} color={colors.error} />
                    <Text style={[st.fieldErrorText, { color: colors.error }]}>{editErrors.sport_type}</Text>
                  </View>
                ) : null}
              </View>

              <FField
                label="Deskripsi" icon="notes"
                value={editForm.description}
                onChangeText={(v) => onFormFieldChange('description', v)}
                onBlur={() => onFieldBlur('description')}
                placeholder="Fasilitas yang tersedia..."
                multiline error={editErrors.description} st={st} colors={colors}
              />

              <FField
                label="Sewa Per Jam (Rp)" icon="payments"
                value={editForm.price_per_hour}
                onChangeText={(v) => onFormFieldChange('price_per_hour', v)}
                onBlur={() => onFieldBlur('price_per_hour')}
                placeholder="Contoh: 150000"
                keyboardType="numeric"
                error={editErrors.price_per_hour} st={st} colors={colors}
              />

              <FField
                label="Lokasi (opsional)" icon="location-on"
                value={editForm.location}
                onChangeText={(v) => onFormFieldChange('location', v)}
                onBlur={() => onFieldBlur('location')}
                placeholder="Contoh: Jl. Merdeka No. 10"
                error={editErrors.location} st={st} colors={colors}
              />
            </ScrollView>

            <View style={st.sheetActions}>
              <TouchableOpacity
                style={[st.submitBtn, { backgroundColor: colors.primary }, (editLoading || hasErrors(editErrors)) && { opacity: 0.5 }]}
                onPress={handleEdit}
                disabled={editLoading || hasErrors(editErrors)}
              >
                {editLoading
                  ? <ActivityIndicator color={colors.onPrimary} size="small" />
                  : <Text style={[st.submitText, { color: colors.onPrimary }]}>Simpan Perubahan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={!!deleteTarget}
        title={`Hapus "${deleteTarget?.name ?? ''}"?`}
        description="Lapangan akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan."
        destructive
        loading={deleteLoading}
        confirmLabel="Ya, Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

// ── Reusable field components (same pattern as OwnerFieldsPage) ──

function FField({ label, icon, value, onChangeText, onBlur, placeholder, keyboardType, multiline, error, st, colors }: {
  label: string; icon: string; value: string;
  onChangeText: (v: string) => void; onBlur?: () => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean;
  error?: string; st: ReturnType<typeof makeStyles>; colors: ThemeColors;
}) {
  return (
    <View style={st.fieldWrap}>
      <Text style={[st.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[
        st.fieldRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline },
        multiline && { alignItems: 'flex-start', paddingTop: 14 },
        error && { borderColor: colors.error, backgroundColor: colors.errorContainer + '30' },
      ]}>
        <MaterialIcons name={icon as any} size={18} color={error ? colors.error : colors.textSecondary} style={{ marginRight: 12, marginTop: multiline ? 2 : 0 }} />
        <TextInput
          style={[st.fieldInput, { color: colors.text }, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder ?? label}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
        />
      </View>
      {error ? (
        <View style={st.fieldErrorRow}>
          <MaterialIcons name="warning" size={13} color={colors.error} />
          <Text style={[st.fieldErrorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ── Styles ──

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  searchWrap: { paddingHorizontal: SIZES.gutter, marginBottom: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  chipScroll: { paddingHorizontal: SIZES.gutter, gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { ...FONTS.labelMd, fontSize: 12, fontWeight: '600' },

  list: { padding: SIZES.gutter, paddingBottom: 60 },

  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, marginBottom: 4,
  },
  emptyTitle: { ...FONTS.titleLg },
  emptyDesc: { ...FONTS.bodyMd, textAlign: 'center', paddingHorizontal: 20 },

  card: {
    borderRadius: 20, marginBottom: 16,
    borderWidth: 1, ...SHADOWS.sm, overflow: 'hidden',
  },
  cardImgWrap: { height: 140 },
  cardImg: { width: '100%', height: '100%' },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fieldName: { ...FONTS.titleLg, flex: 1, marginRight: 10 },
  pricePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  price: { ...FONTS.titleMd },
  priceSub: { ...FONTS.bodySm },

  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  detailText: { ...FONTS.bodyMd, flex: 1 },

  actions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
    marginTop: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.outline,
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1,
  },
  editBtnText: { ...FONTS.titleSm, fontSize: 12 },
  delBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1,
  },
  delBtnText: { ...FONTS.titleSm, fontSize: 12 },

  // Edit modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopWidth: 1, borderColor: colors.outline, maxHeight: '90%',
    maxWidth: 640, width: '100%', alignSelf: 'center',
    ...(Platform.OS === 'web' ? {
      borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      marginBottom: 'auto', marginTop: 'auto',
    } : {}),
  },
  sheetHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: colors.outline, alignSelf: 'center', marginBottom: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  sheetIconWrap: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { ...FONTS.headlineSm, fontSize: 18, flex: 1 },
  sheetClose: { padding: 6, borderRadius: 20 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1,
  },
  errorText: { ...FONTS.bodySm, flex: 1 },

  imagePicker: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1.5,
    borderStyle: 'dashed', minHeight: 90, justifyContent: 'center',
  },
  imagePreviewWrap: { width: '100%', height: 130, position: 'relative' },
  imagePreview: { width: '100%', height: '100%' },
  imageEditOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6, paddingVertical: 8,
  },
  imageEditText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  imageEmpty: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16 },
  imageEmptyTextCol: { flex: 1 },
  imgDashedCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  imageEmptyText: { ...FONTS.titleSm, fontSize: 13 },
  imageEmptyHint: { ...FONTS.bodySm, fontSize: 11, marginTop: 2 },

  sportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderWidth: 1.5, borderRadius: 14, padding: 12, borderColor: colors.outline },
  sportChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1,
  },
  sportChipText: { ...FONTS.labelMd, fontSize: 12, fontWeight: '600' },

  fieldWrap: { marginBottom: 20 },
  fieldLabel: { ...FONTS.labelSm, fontSize: 11, fontWeight: '700', marginBottom: 10, letterSpacing: 0.6, textTransform: 'uppercase' },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5,
  },
  fieldInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  fieldErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, paddingHorizontal: 4 },
  fieldErrorText: { ...FONTS.bodySm, flex: 1 },

  sheetActions: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.outline, flexDirection: 'row', justifyContent: 'flex-end' },
  submitBtn: {
    maxWidth: 320, width: '100%', paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: 14, alignItems: 'center', minHeight: 48, justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(30,138,76,0.15)' }
      : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 }
    ),
  },
  submitText: { ...FONTS.titleSm, fontSize: 14, fontWeight: '700' },
});
