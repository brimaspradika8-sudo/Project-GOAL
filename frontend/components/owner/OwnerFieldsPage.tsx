import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl, Image,
  Modal, KeyboardAvoidingView, Platform, TextInput, Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useFieldStore } from '../../store/fieldStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getErrorMessage, getResponseData } from '../../lib/api';
import { apiFetch } from '../../lib/apiClient';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import { SkeletonCards } from '../Skeleton';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import AlertBox from '../shared/AlertBox';
import AnimatedDeleteButton from '../shared/AnimatedDeleteButton';
import { useToastStore } from '../../store/toastStore';
import { useTheme, type ThemeColors } from '../../lib/theme';
import { useIsMobileWeb } from '../../lib/responsive';
import { fieldError } from '../../lib/formValidation';
import {
  SPORT_OPTIONS, SPORT_MAP,
  type FieldFormErrors, type FieldFormData,
  EMPTY_ERRORS, validateAllFields, hasErrors,
  validateFieldName, validateFieldSportType, validateFieldPrice,
  validateFieldImage, validateFieldImageSize, validateFieldDescription,
  validateFieldLocation, mimeFromExt,
} from '../../lib/fieldValidation';

const IMG_PLACEHOLDER = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop';
const FIELD_DRAFT_KEY = 'goal_field_create_draft';

const getStatusCfg = (colors: ThemeColors): Record<string, { label: string; bg: string; color: string }> => ({
  approved: { label: 'Aktif',    bg: colors.primaryContainer, color: colors.primary },
  pending:  { label: 'Menunggu', bg: colors.floodlight + '20', color: colors.floodlight },
  rejected: { label: 'Ditolak',  bg: colors.errorContainer, color: colors.error },
});

const EMPTY_FORM: FieldFormData = {
  name: '',
  sport_type: '',
  description: '',
  price_per_hour: '',
  image_url: '',
  image_uri: '',
  image_mime: '',
  location: '',
};

type FieldTouched = { name: boolean; sport_type: boolean; price_per_hour: boolean; description: boolean; location: boolean };
const EMPTY_TOUCHED: FieldTouched = { name: false, sport_type: false, price_per_hour: false, description: false, location: false };

export default function OwnerFieldsPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const isMobile = useIsMobileWeb();
  const st = React.useMemo(() => makeStyles(colors, isMobile), [colors, isMobile]);
  const STATUS_CFG = React.useMemo(() => getStatusCfg(colors), [colors]);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createErrors, setCreateErrors] = useState<FieldFormErrors>(EMPTY_ERRORS);
  const [createTouched, setCreateTouched] = useState<FieldTouched>(EMPTY_TOUCHED);
  const [draftAvailable, setDraftAvailable] = useState(false);

  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editErrors, setEditErrors] = useState<FieldFormErrors>(EMPTY_ERRORS);
  const [editTouched, setEditTouched] = useState<FieldTouched>(EMPTY_TOUCHED);

  const fetchFields = useCallback(async () => {
    try {
      const res = await apiFetch('/fields/my/list');
      const data = await res.json().catch(() => ({}));
      setFields(data?.data ?? []);
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Gagal memuat data lapangan.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFields(); }, [fetchFields]);
  const onRefresh = () => { setRefreshing(true); fetchFields(); };

  const validateSingleField = (
    key: keyof FieldFormData,
    value: string,
    form: FieldFormData,
    isCreate: boolean,
    touched: boolean,
  ) => {
    let err = '';
    switch (key) {
      case 'name': err = fieldError(value, validateFieldName(value), touched); break;
      case 'sport_type': err = fieldError(value, validateFieldSportType(value), touched); break;
      case 'price_per_hour': err = fieldError(value, validateFieldPrice(value), touched); break;
      case 'description': err = fieldError(value, validateFieldDescription(value), touched); break;
      case 'location': err = fieldError(value, validateFieldLocation(value), touched); break;
      case 'image_uri': err = validateFieldImage(value, form.image_url, form.image_mime); break;
    }
    if (isCreate) {
      setCreateErrors(prev => ({ ...prev, [key]: err }));
    } else {
      setEditErrors(prev => ({ ...prev, [key]: err }));
    }
  };

  const onFormFieldChange = (
    key: keyof FieldFormData,
    value: string,
    isCreate: boolean,
  ) => {
    const touched = isCreate ? createTouched[key as keyof FieldTouched] : editTouched[key as keyof FieldTouched];
    const isSport = key === 'sport_type';
    if (isSport) {
      if (isCreate) setCreateTouched(p => ({ ...p, sport_type: true }));
      else setEditTouched(p => ({ ...p, sport_type: true }));
    }
    if (isCreate) {
      setCreateForm(p => {
        const next = { ...p, [key]: value };
        validateSingleField(key, value, next, true, isSport || touched);
        return next;
      });
    } else {
      setEditForm(p => {
        const next = { ...p, [key]: value };
        validateSingleField(key, value, next, false, isSport || touched);
        return next;
      });
    }
  };

  const onFormFieldBlur = (key: keyof FieldTouched, isCreate: boolean) => {
    if (isCreate) {
      setCreateTouched(p => ({ ...p, [key]: true }));
      validateSingleField(key, createForm[key], createForm, true, true);
    } else {
      setEditTouched(p => ({ ...p, [key]: true }));
      validateSingleField(key, editForm[key], editForm, false, true);
    }
  };

  const onAllFieldsTouched = (isCreate: boolean) => {
    const touchedAll = { ...EMPTY_TOUCHED, name: true, sport_type: true, price_per_hour: true, description: true, location: true };
    if (isCreate) {
      setCreateTouched(touchedAll);
    } else {
      setEditTouched(touchedAll);
    }
    const form = isCreate ? createForm : editForm;
    const errs = validateAllFields(form);
    if (isCreate) {
      setCreateErrors(errs);
    } else {
      setEditErrors(errs);
    }
  };

  const pickImage = async (
    setForm: React.Dispatch<React.SetStateAction<FieldFormData>>,
    setErrors: React.Dispatch<React.SetStateAction<FieldFormErrors>>,
    isCreate: boolean,
  ) => {
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
      const asset = result.assets[0];
      const uri = asset.uri;
      const mime = asset.mimeType || '';
      const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || '';

      const typeErr = validateFieldImage(uri, '', mime || ext);
      if (typeErr) {
        setErrors(prev => ({ ...prev, image: typeErr }));
        return;
      }

      const sizeErr = validateFieldImageSize(asset.fileSize ?? 0);
      if (sizeErr) {
        setErrors(prev => ({ ...prev, image: sizeErr }));
        return;
      }

      const finalMime = mime || mimeFromExt(ext);
      setForm(p => ({ ...p, image_uri: uri, image_url: '', image_mime: finalMime }));
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const openCreate = async () => {
    setCreateForm(EMPTY_FORM);
    setCreateError(null);
    setCreateErrors(EMPTY_ERRORS);
    setCreateTouched(EMPTY_TOUCHED);
    setDraftAvailable(false);
    setShowCreate(true);

    try {
      const raw = await AsyncStorage.getItem(FIELD_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        const hasContent = Object.values(draft).some((v) => typeof v === 'string' && v.trim());
        if (hasContent) setDraftAvailable(true);
      }
    } catch {}
  };

  const restoreDraft = async () => {
    try {
      const raw = await AsyncStorage.getItem(FIELD_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      setCreateForm({ ...EMPTY_FORM, ...draft });
      setCreateErrors(EMPTY_ERRORS);
      setCreateTouched(EMPTY_TOUCHED);
      await clearDraft();
      setDraftAvailable(false);
      useToastStore.getState().show({
        type: 'success',
        title: 'Draft Dipulihkan',
        description: 'Isian draft sebelumnya dikembalikan.',
      });
    } catch {}
  };

  const saveDraft = async () => {
    try {
      await AsyncStorage.setItem(FIELD_DRAFT_KEY, JSON.stringify(createForm));
      setShowCreate(false);
      useToastStore.getState().show({
        type: 'success',
        title: 'Draft Tersimpan',
        description: 'Formulir disimpan sementara. Anda bisa melanjutkannya kapan saja.',
      });
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: 'Gagal menyimpan draft.' });
    }
  };

  const clearDraft = async () => {
    try { await AsyncStorage.removeItem(FIELD_DRAFT_KEY); } catch {}
  };

  const handleCreate = async () => {
    onAllFieldsTouched(true);
    const errs = validateAllFields(createForm);
    setCreateErrors(errs);
    if (hasErrors(errs)) return;

    setCreateLoading(true);
    setCreateError(null);
    try {
      let imageUrl = createForm.image_url;
      if (createForm.image_uri && !imageUrl) {
        const uploadRes = await uploadImageDetailed(createForm.image_uri, createForm.image_mime);
        if (!uploadRes.url) {
          setCreateError(uploadRes.error || 'Gagal mengunggah foto. Coba lagi.');
          return;
        }
        imageUrl = uploadRes.url;
      }

      const body: any = {
        name:       createForm.name.trim(),
        sport_type: createForm.sport_type.trim(),
      };
      if (createForm.description.trim())    body.description    = createForm.description.trim();
      if (createForm.price_per_hour.trim()) body.price_per_hour = parseInt(createForm.price_per_hour.replace(/\D/g, ''), 10);
      if (createForm.location.trim())       body.location       = createForm.location.trim();
      if (imageUrl)                          body.image_url      = imageUrl;

      const res = await apiFetch('/fields', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(getErrorMessage(data, 'Gagal menambah lapangan.'));
        return;
      }
      setShowCreate(false);
      setDraftAvailable(false);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Lapangan berhasil ditambahkan dan menunggu approval Super Admin.' });
      await useFieldStore.getState().clearCache().catch(() => {});
      clearDraft();
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
      image_mime:     '',
      location:       f.location || '',
    });
    setEditError(null);
    setEditErrors(EMPTY_ERRORS);
    setEditTouched(EMPTY_TOUCHED);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    onAllFieldsTouched(false);
    const errs = validateAllFields(editForm);
    setEditErrors(errs);
    if (hasErrors(errs)) return;

    setEditLoading(true);
    setEditError(null);
    try {
      let imageUrl = editForm.image_url;
      if (editForm.image_uri) {
        const uploaded = await uploadImage(editForm.image_uri, editForm.image_mime);
        if (!uploaded) { setEditError('Gagal mengunggah foto. Coba lagi.'); return; }
        imageUrl = uploaded;
      }

      const body: any = {
        name:        editForm.name.trim(),
        sport_type:  editForm.sport_type.trim(),
        description: editForm.description.trim() || null,
        location:    editForm.location.trim() || null,
      };
      if (editForm.price_per_hour.trim()) body.price_per_hour = parseInt(editForm.price_per_hour.replace(/\D/g, ''), 10);
      if (imageUrl) body.image_url = imageUrl;

      const res = await apiFetch(`/fields/${editTarget.id}`, { method: 'PUT', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(getErrorMessage(data, 'Gagal menyimpan perubahan.'));
        return;
      }
      setEditTarget(null);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Data lapangan berhasil diperbarui.' });
      await useFieldStore.getState().clearCache().catch(() => {});
      fetchFields();
    } catch {
      setEditError('Gagal terhubung ke server.');
    } finally {
      setEditLoading(false);
    }
  };

  const uploadImageDetailed = async (uri: string, mime?: string): Promise<{ url: string | null; error?: string }> => {
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

      const res = await apiFetch('/upload/image', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { url: null, error: data.message || 'Gagal mengunggah foto. Silakan coba lagi.' };
      }
      const uploaded = getResponseData<{ url?: string }>(data);
      return { url: uploaded?.url ?? data?.url ?? null };
    } catch {
      return { url: null, error: 'Gagal terhubung ke server upload.' };
    }
  };

  const uploadImage = async (uri: string, mime?: string): Promise<string | null> => {
    const res = await uploadImageDetailed(uri, mime);
    return res.url;
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Gallery (multi-image) ──────────────────────────────────────────────────
  const [galleryTarget, setGalleryTarget] = useState<any | null>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [galleryBusyId, setGalleryBusyId] = useState<number | null>(null);

  const uploadFieldImage = async (uri: string, mime?: string): Promise<{ url: string | null; error?: string }> => {
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

      const res = await apiFetch(`/owner/fields/${galleryTarget.id}/images`, { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { url: null, error: data?.message || 'Gagal mengunggah foto. Silakan coba lagi.' };
      }
      const uploaded = getResponseData<any>(data);
      return { url: uploaded?.image_url ?? uploaded?.id ? 'ok' : null };
    } catch {
      return { url: null, error: 'Gagal terhubung ke server upload.' };
    }
  };

  const openGallery = (f: any) => {
    setGalleryTarget(f);
    setGalleryError(null);
  };

  const closeGallery = () => {
    setGalleryTarget(null);
    setGalleryUploading(false);
    setGalleryError(null);
    setGalleryBusyId(null);
  };

  const refreshGalleryField = async () => {
    try {
      const res = await apiFetch('/fields/my/list');
      const data = await res.json().catch(() => ({}));
      setFields(data?.data ?? []);
      const updated = (data?.data ?? []).find((x: any) => x.id === galleryTarget?.id);
      if (updated) setGalleryTarget(updated);
    } catch {}
  };

  const addGalleryImage = async () => {
    if (!galleryTarget) return;
    const current = (galleryTarget.images ?? []).length;
    if (current >= 5) {
      setGalleryError('Maksimal 5 foto per lapangan.');
      return;
    }
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
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mime = asset.mimeType || '';
    const ext = asset.uri.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
    const finalMime = mime || mimeFromExt(ext);

    setGalleryUploading(true);
    setGalleryError(null);
    const { error } = await uploadFieldImage(asset.uri, finalMime);
    setGalleryUploading(false);
    if (error) {
      setGalleryError(error);
      return;
    }
    await refreshGalleryField();
  };

  const setPrimaryImage = async (image: any) => {
    if (!image.is_primary) {
      setGalleryBusyId(image.id);
      setGalleryError(null);
      try {
        const res = await apiFetch(`/owner/images/${image.id}/primary`, { method: 'PATCH' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setGalleryError(data?.message || 'Gagal mengubah foto utama.');
        } else {
          await refreshGalleryField();
        }
      } catch {
        setGalleryError('Gagal terhubung ke server.');
      } finally {
        setGalleryBusyId(null);
      }
    }
  };

  const deleteGalleryImage = async (image: any) => {
    setGalleryBusyId(image.id);
    setGalleryError(null);
    try {
      const res = await apiFetch(`/owner/images/${image.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setGalleryError(data?.message || 'Gagal menghapus foto.');
      } else {
        await refreshGalleryField();
      }
    } catch {
      setGalleryError('Gagal terhubung ke server.');
    } finally {
      setGalleryBusyId(null);
    }
  };

  const handleDelete = (id: number, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await apiFetch(`/fields/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Lapangan dihapus.' });
      setDeleteTarget(null);
      await useFieldStore.getState().clearCache().catch(() => {});
      fetchFields();
    } else {
      useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Gagal menghapus lapangan.' });
    }
    setDeleteLoading(false);
  };

  const activeCount = fields.filter(f => f.status === 'approved').length;
  const pendingCount = fields.filter(f => f.status === 'pending').length;
  const filteredFields = search.trim()
    ? fields.filter(f => f.name.toLowerCase().includes(search.trim().toLowerCase()))
    : fields;

  if (loading) {
    return (
      <View style={st.screen}>
        <DashboardHeader title="Kelola Lapangan" subtitle="Kelola aset lapangan olahraga Anda" showBack={false} />
        <SkeletonCards count={3} />
      </View>
    );
  }

  return (
    <>
      <View style={st.screen}>
        <DashboardHeader
          title="Kelola Lapangan"
          subtitle="Kelola aset lapangan olahraga Anda"
          showBack={false}
          right={
            <TouchableOpacity style={st.headerAddBtn} activeOpacity={0.8} onPress={openCreate}>
              <MaterialIcons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          }
        />

        <View style={st.searchBar}>
          <MaterialIcons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={st.searchInput}
            placeholder="Cari nama lapangan..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={st.statsRow}>
          <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <View style={[st.statIconWrap, { backgroundColor: colors.primaryContainer }]}>
              <MaterialIcons name="stadium" size={20} color={colors.primary} />
            </View>
            <View style={st.statTextWrap}>
              <Text style={[st.statNum, { color: colors.text }]}>{fields.length}</Text>
              <Text style={[st.statLabel, { color: colors.textSecondary }]}>Total Lapangan</Text>
            </View>
          </View>

          <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <View style={[st.statIconWrap, { backgroundColor: '#10B98118' }]}>
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
            </View>
            <View style={st.statTextWrap}>
              <Text style={[st.statNum, { color: colors.text }]}>{activeCount}</Text>
              <Text style={[st.statLabel, { color: colors.textSecondary }]}>Aktif</Text>
            </View>
          </View>

          <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <View style={[st.statIconWrap, { backgroundColor: '#F59E0B18' }]}>
              <MaterialIcons name="pending-actions" size={20} color="#F59E0B" />
            </View>
            <View style={st.statTextWrap}>
              <Text style={[st.statNum, { color: colors.text }]}>{pendingCount}</Text>
              <Text style={[st.statLabel, { color: colors.textSecondary }]}>Menunggu</Text>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={st.contentList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {fields.length === 0 ? (
            <View style={st.emptyWrap}>
              <View style={st.emptyIcon}>
                <MaterialIcons name="sports-soccer" size={40} color={colors.textTertiary} />
              </View>
              <Text style={st.emptyTitle}>Belum ada lapangan</Text>
              <Text style={st.emptyDesc}>Mulai tambahkan aset lapangan Anda untuk menerima booking.</Text>
              <TouchableOpacity style={st.emptyAddBtn} activeOpacity={0.85} onPress={openCreate}>
                <MaterialIcons name="add" size={18} color={colors.onPrimary} />
                <Text style={st.emptyAddText}>Tambah Lapangan Pertama</Text>
              </TouchableOpacity>
            </View>
          ) : filteredFields.length === 0 ? (
            <View style={st.emptyWrap}>
              <View style={st.emptyIcon}>
                <MaterialIcons name="search-off" size={40} color={colors.textTertiary} />
              </View>
              <Text style={st.emptyTitle}>Tidak ditemukan</Text>
              <Text style={st.emptyDesc}>Tidak ada lapangan yang cocok dengan pencarian &quot;{search}&quot;.</Text>
            </View>
          ) : (
            <View style={st.cardGrid}>
              {filteredFields.map((f: any) => {
              const status = STATUS_CFG[f.status] || STATUS_CFG.pending;
              const img = f.image_url || IMG_PLACEHOLDER;
              const priceStr = f.price_per_hour
                ? `Rp${Number(f.price_per_hour).toLocaleString('id-ID')}`
                : 'Hubungi';
              return (
                <View key={f.id} style={st.card}>
                  <View style={st.cardImgWrap}>
                    <Image source={{ uri: img }} style={st.cardImg} resizeMode="cover" />
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
                      <MaterialIcons name="sports" size={14} color={colors.textSecondary} />
                      <Text style={st.detailText}>{(Object.keys(SPORT_MAP).find(k => SPORT_MAP[k] === f.sport_type) || f.sport_type)?.toUpperCase()}</Text>
                    </View>
                    {f.description ? (
                      <View style={st.detailRow}>
                        <MaterialIcons name="notes" size={14} color={colors.textSecondary} />
                        <Text style={st.detailText} numberOfLines={2}>{f.description}</Text>
                      </View>
                    ) : null}
                    <View style={st.actions}>
                      <TouchableOpacity
                        style={[st.detailBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline }]}
                        onPress={() => router.push(`/venue-detail?id=${f.id}`)}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name="visibility" size={15} color={colors.textSecondary} />
                        <Text style={[st.detailBtnText, { color: colors.textSecondary }]}>Detail</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[st.actionBtn, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outline }]}
                        onPress={() => openGallery(f)}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                        activeOpacity={0.8}
                        accessibilityLabel="Kelola Galeri Foto"
                      >
                        <MaterialIcons name="photo-library" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[st.editBtn, { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '30' }]}
                        onPress={() => openEdit(f)}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name="edit" size={15} color={colors.primary} />
                        <Text style={[st.editBtnText, { color: colors.primary }]}>Edit</Text>
                      </TouchableOpacity>

                      <AnimatedDeleteButton
                        onPress={() => handleDelete(f.id, f.name)}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
            </View>
          )}
        </ScrollView>
      </View>

      <FieldModal
        visible={showCreate}
        title="Penambahan Venue"
        iconName="add-business"
        iconColor={colors.primary}
        iconBg={colors.primaryContainer}
        form={createForm}
        errors={createErrors}
        error={createError}
        loading={createLoading}
        onFieldChange={(key, val) => onFormFieldChange(key, val, true)}
        onFieldBlur={key => onFormFieldBlur(key, true)}
        onPickImage={() => pickImage(setCreateForm, setCreateErrors, true)}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        onSaveDraft={saveDraft}
        draftAvailable={draftAvailable}
        onRestoreDraft={restoreDraft}
        submitLabel="Simpan Lapangan"
        submitBg={colors.primary}
        st={st}
        colors={colors}
      />

      <FieldModal
        visible={!!editTarget}
        title="Edit Venue"
        iconName="edit"
        iconColor={colors.primary}
        iconBg={colors.primaryContainer}
        form={editForm}
        errors={editErrors}
        error={editError}
        loading={editLoading}
        onFieldChange={(key, val) => onFormFieldChange(key, val, false)}
        onFieldBlur={key => onFormFieldBlur(key, false)}
        onPickImage={() => pickImage(setEditForm, setEditErrors, false)}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        submitLabel="Simpan Perubahan"
        submitBg={colors.primary}
        st={st}
        colors={colors}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title={`Hapus "${deleteTarget?.name ?? ''}"?`}
        description="Apakah Anda yakin ingin menghapus lapangan ini? Tindakan ini tidak bisa dibatalkan."
        destructive
        loading={deleteLoading}
        confirmLabel="Ya, Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <GalleryModal
        visible={!!galleryTarget}
        field={galleryTarget}
        uploading={galleryUploading}
        error={galleryError}
        busyId={galleryBusyId}
        onAdd={addGalleryImage}
        onSetPrimary={setPrimaryImage}
        onDelete={deleteGalleryImage}
        onClose={closeGallery}
        st={st}
        colors={colors}
      />
    </>
  );
}

function GalleryModal({
  visible, field, uploading, error, busyId,
  onAdd, onSetPrimary, onDelete, onClose, st, colors,
}: {
  visible: boolean;
  field: any | null;
  uploading: boolean;
  error: string | null;
  busyId: number | null;
  onAdd: () => void;
  onSetPrimary: (image: any) => void;
  onDelete: (image: any) => void;
  onClose: () => void;
  st: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  const images: any[] = field?.images ?? [];
  const maxReached = images.length >= 5;
  const primary = images.find((i) => i.is_primary);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={st.sheet}>
          <View style={st.sheetHandle} />

          <View style={st.sheetHeader}>
            <View style={[st.sheetIconWrap, { backgroundColor: colors.primaryContainer }]}>
              <MaterialIcons name="photo-library" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.sheetTitle}>Foto Lapangan</Text>
              <Text style={st.gallerySubtitle}>{field?.name ?? ''}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={st.sheetClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {error ? (
            <AlertBox type="error" title={error} style={st.alertBox} />
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={st.galleryGrid}>
              {images.map((img) => (
                <View key={img.id} style={st.galleryItem}>
                  <Image source={{ uri: img.image_path }} style={st.galleryImg} resizeMode="cover" />
                  {img.is_primary ? (
                    <View style={[st.galleryPrimaryBadge, { backgroundColor: colors.primary }]}>
                      <MaterialIcons name="star" size={10} color={colors.onPrimary} />
                      <Text style={st.galleryPrimaryText}>Utama</Text>
                    </View>
                  ) : null}
                  <View style={st.galleryActions}>
                    {!img.is_primary ? (
                      <TouchableOpacity
                        style={st.galleryActionBtn}
                        onPress={() => onSetPrimary(img)}
                        disabled={busyId === img.id}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        {busyId === img.id ? (
                          <ActivityIndicator size="small" color={colors.onPrimary} />
                        ) : (
                          <MaterialIcons name="star-border" size={16} color={colors.onPrimary} />
                        )}
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      style={[st.galleryActionBtn, { backgroundColor: colors.error }]}
                      onPress={() => onDelete(img)}
                      disabled={busyId === img.id}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      {busyId === img.id ? (
                        <ActivityIndicator size="small" color={colors.onPrimary} />
                      ) : (
                        <MaterialIcons name="delete" size={16} color={colors.onPrimary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {!maxReached ? (
                <TouchableOpacity style={st.galleryAdd} onPress={onAdd} disabled={uploading} activeOpacity={0.8}>
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <View style={[st.galleryAddCircle, { borderColor: colors.primary }]}>
                        <MaterialIcons name="add" size={22} color={colors.primary} />
                      </View>
                      <Text style={st.galleryAddText}>Tambah Foto</Text>
                      <Text style={st.galleryAddHint}>{images.length}/5</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={st.galleryAdd}>
                  <View style={[st.galleryAddCircle, { borderColor: colors.textTertiary }]}>
                    <MaterialIcons name="check" size={22} color={colors.textTertiary} />
                  </View>
                  <Text style={[st.galleryAddText, { color: colors.textTertiary }]}>Maksimal 5 foto</Text>
                  <Text style={st.galleryAddHint}>{images.length}/5</Text>
                </View>
              )}
            </View>

            <Text style={st.galleryNote}>
              {primary
                ? `Foto utama saat ini: ${primary.image_path.split('/').pop()?.slice(0, 24) ?? 'Utama'}`
                : 'Foto utama wajib ada. Foto pertama yang diunggah otomatis menjadi foto utama.'}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function FieldModal({
  visible, title, iconName, iconColor, iconBg,
  form, errors, error, loading,
  onFieldChange, onFieldBlur, onPickImage, onClose, onSubmit, onSaveDraft, draftAvailable, onRestoreDraft, submitLabel, submitBg, st, colors,
}: {
  visible: boolean; title: string;
  iconName: string; iconColor: string; iconBg: string;
  form: FieldFormData;
  errors: FieldFormErrors;
  error: string | null; loading: boolean;
  onFieldChange: (key: keyof FieldFormData, val: string) => void;
  onFieldBlur: (key: keyof FieldTouched) => void;
  onPickImage: () => void;
  onClose: () => void; onSubmit: () => void;
  onSaveDraft?: () => void;
  draftAvailable?: boolean;
  onRestoreDraft?: () => void;
  submitLabel: string; submitBg: string;
  st: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  const sheetAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) sheetAnim.setValue(0);
  }, [visible, sheetAnim]);
  const set = (key: keyof FieldFormData) => (val: string) => onFieldChange(key, val);
  const blur = (key: keyof FieldFormData) => () => onFieldBlur(key as keyof FieldTouched);
  const previewUri = form.image_uri || form.image_url || null;
  const isSubmitDisabled = loading || hasErrors(errors);

  const handleSaveDraft = () => {
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start(() => onSaveDraft?.());
  };

  const handleDraftButton = () => {
    if (draftAvailable && onRestoreDraft) {
      onRestoreDraft();
    } else {
      handleSaveDraft();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            st.sheet,
            {
              transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 640] }) }],
              opacity: sheetAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] }),
            },
          ]}
        >
          <View style={st.sheetHandle} />

          <View style={st.sheetHeader}>
            <View style={[st.sheetIconWrap, { backgroundColor: iconBg }]}>
              <MaterialIcons name={iconName as any} size={22} color={iconColor} />
            </View>
            <Text style={st.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={st.sheetClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {error ? (
            <AlertBox type="error" title={error} style={st.alertBox} />
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={st.fieldWrap}>
              <Text style={st.fieldLabel}>Foto Venue (Utama)</Text>
              <TouchableOpacity style={[st.imagePicker, errors.image && st.imagePickerError]} onPress={onPickImage} activeOpacity={0.8}>
                {previewUri ? (
                  <View style={st.imagePreviewWrap}>
                    <Image source={{ uri: previewUri }} style={st.imagePreview} resizeMode="cover" />
                    <View style={st.imageEditOverlay}>
                      <MaterialIcons name="photo-camera" size={18} color={colors.onPrimary} />
                      <Text style={st.imageEditText}>Ganti Foto</Text>
                    </View>
                  </View>
                ) : (
                  <View style={st.imageEmpty}>
                    <View style={st.imgDashedCircle}>
                      <MaterialIcons name="add-photo-alternate" size={22} color={colors.primary} />
                    </View>
                    <View style={st.imageEmptyTextCol}>
                      <Text style={st.imageEmptyText}>Tap untuk memilih foto</Text>
                      <Text style={st.imageEmptyHint}>Format JPG (Maks 2MB)</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
              {errors.image ? <FieldError message={errors.image} st={st} colors={colors} /> : null}
            </View>

            <FField
              label="Nama Lapangan" icon="stadium"
              value={form.name}
              onChangeText={set('name')}
              onBlur={blur('name')}
              placeholder="Contoh: Futsal Arena Gemilang"
              error={errors.name}
              st={st}
              colors={colors}
            />

            <View style={st.fieldWrap}>
              <Text style={st.fieldLabel}>Jenis Olahraga</Text>
              <View style={[st.sportRow, errors.sport_type ? st.sportRowError : null]}>
                {SPORT_OPTIONS.map(s => {
                  const active = form.sport_type === SPORT_MAP[s];
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[st.sportChip, active && st.sportChipActive]}
                      onPress={() => onFieldChange('sport_type', SPORT_MAP[s])}
                    >
                      <Text style={[st.sportChipText, active && st.sportChipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.sport_type ? <FieldError message={errors.sport_type} st={st} colors={colors} /> : null}
            </View>

            <FField
              label="Deskripsi" icon="notes"
              value={form.description}
              onChangeText={set('description')}
              onBlur={blur('description')}
              placeholder="Fasilitas yang tersedia..."
              multiline
              error={errors.description}
              st={st}
              colors={colors}
            />

            <FField
              label="Sewa Per Jam (Rp)" icon="payments"
              value={form.price_per_hour}
              onChangeText={set('price_per_hour')}
              onBlur={blur('price_per_hour')}
              placeholder="Contoh: 150000"
              keyboardType="numeric"
              error={errors.price_per_hour}
              st={st}
              colors={colors}
            />

            <FField
              label="Lokasi (opsional)" icon="location-on"
              value={form.location}
              onChangeText={set('location')}
              onBlur={blur('location')}
              placeholder="Contoh: Jl. Merdeka No. 10, Kota Bandung"
              error={errors.location}
              st={st}
              colors={colors}
            />
          </ScrollView>

          <View style={st.sheetActions}>
            {onSaveDraft ? (
              <TouchableOpacity
                style={[
                  st.draftBtn,
                  draftAvailable
                    ? { borderColor: colors.primary, backgroundColor: colors.primaryMuted }
                    : { borderColor: colors.divider },
                ]}
                onPress={handleDraftButton}
                disabled={loading}
                activeOpacity={0.7}
                accessibilityLabel={draftAvailable ? 'Pulihkan draft' : 'Simpan sementara'}
              >
                <MaterialIcons name="drafts" size={20} color={draftAvailable ? colors.primary : colors.textSecondary} />
                {draftAvailable ? <View style={[st.draftBadge, { backgroundColor: colors.primary }]} /> : null}
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[st.submitBtn, { backgroundColor: submitBg }, isSubmitDisabled && { opacity: 0.5 }]}
              onPress={onSubmit}
              disabled={isSubmitDisabled}
            >
              {loading
                ? <ActivityIndicator color={colors.onPrimary} size="small" />
                : <Text style={st.submitText}>{submitLabel}</Text>}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Inline error message ──────────────────────────────────────────────────────
function FieldError({ message, st, colors }: { message: string; st: ReturnType<typeof makeStyles>; colors: ThemeColors }) {
  if (!message) return null;
  return (
    <View style={st.fieldErrorRow}>
      <MaterialIcons name="warning" size={13} color={colors.error} />
      <Text style={st.fieldErrorText}>{message}</Text>
    </View>
  );
}

// ── Text input field ──────────────────────────────────────────────────────────
function FField({ label, icon, value, onChangeText, onBlur, placeholder, keyboardType, multiline, error, st, colors }: {
  label: string; icon: string; value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean;
  error?: string;
  st: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={st.fieldWrap}>
      <Text style={st.fieldLabel}>{label}</Text>
      <View style={[
        st.fieldRow,
        multiline && { alignItems: 'flex-start', paddingTop: 14 },
        error && st.fieldRowError,
      ]}>
        <MaterialIcons name={icon as any} size={18} color={error ? colors.error : colors.textSecondary} style={{ marginRight: 12, marginTop: multiline ? 2 : 0 }} />
        <TextInput
          style={[st.fieldInput, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder ?? label}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
        />
      </View>
      {error ? <FieldError message={error} st={st} colors={colors} /> : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors, isMobile: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  headerAddBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.xs,
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surfaceContainerLow,
    marginHorizontal: SIZES.gutter, marginTop: 12,
    borderRadius: 12, borderWidth: 1, borderColor: colors.outline,
    paddingHorizontal: 14, minHeight: 44,
    ...(isMobile ? {} : { maxWidth: 1100, alignSelf: 'center', width: '100%' }),
  },
  searchInput: {
    flex: 1, color: colors.text, ...FONTS.bodyMd,
    padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: SIZES.gutter,
    marginTop: 14,
    marginBottom: 8,
    ...(isMobile ? {} : { maxWidth: 1100, alignSelf: 'center', width: '100%' }),
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  statNum: {
    ...FONTS.titleLg,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  statLabel: {
    ...FONTS.labelSm,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 1,
  },

  contentList: { padding: SIZES.gutter, paddingBottom: 60, ...(isMobile ? {} : { maxWidth: 1100, alignSelf: 'center', width: '100%' }) },
  cardGrid: isMobile ? {} : { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.outline,
  },
  emptyTitle: { ...FONTS.titleLg, color: colors.text },
  emptyDesc: { ...FONTS.bodyMd, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: SIZES.borderRadius, marginTop: 8, ...SHADOWS.primary,
  },
  emptyAddText: { ...FONTS.titleSm, color: colors.onPrimary },

  card: {
    backgroundColor: colors.surface, borderRadius: 20, marginBottom: isMobile ? 16 : 0,
    borderWidth: 1, borderColor: colors.outline,
    ...SHADOWS.sm, overflow: 'hidden',
    ...(isMobile ? {} : { flex: 1, minWidth: 320 }),
  },
  cardImgWrap: { height: 200, position: 'relative', overflow: 'hidden', backgroundColor: colors.surfaceContainerLow },
  cardImg: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', top: 14, right: 14 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...FONTS.labelSm },

  cardBody: { padding: 18 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  name: { ...FONTS.titleLg, color: colors.text, flex: 1, marginRight: 10 },
  pricePill: {
    backgroundColor: colors.primaryContainer, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: colors.primary + '30',
  },
  price: { ...FONTS.titleMd, color: colors.primary },
  priceSub: { ...FONTS.bodySm, color: colors.textSecondary },

  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  detailText: { ...FONTS.bodyMd, color: colors.textSecondary, flex: 1 },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  detailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
  },
  detailBtnText: { ...FONTS.titleSm, fontSize: 12, fontWeight: '600' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
  },
  editBtnText: { ...FONTS.titleSm, fontSize: 12, fontWeight: '700', color: colors.primary },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outline,
  },

  // Modal styling
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopWidth: 1, borderColor: colors.outline, maxHeight: '90%',
    maxWidth: 640, width: '100%', alignSelf: 'center',
    ...(Platform.OS === 'web' ? {
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      marginBottom: 'auto',
      marginTop: 'auto',
    } : {}),
  },
  sheetHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: colors.outline, alignSelf: 'center', marginBottom: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  sheetIconWrap: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { ...FONTS.headlineSm, fontSize: 18, color: colors.text, flex: 1 },
  sheetClose: { padding: 6, backgroundColor: colors.surfaceContainerLow, borderRadius: 20 },
  alertBox: { marginBottom: 16 },
  gallerySubtitle: { ...FONTS.bodySm, color: colors.textSecondary, marginTop: 2 },

  // Gallery grid
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  galleryItem: {
    width: '31%',
    aspectRatio: 1.4,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outline,
    position: 'relative',
  },
  galleryImg: { width: '100%', height: '100%' },
  galleryPrimaryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  galleryPrimaryText: { ...FONTS.labelSm, fontSize: 9, color: colors.onPrimary, fontWeight: '700' },
  galleryActions: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    gap: 6,
  },
  galleryActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryAdd: {
    width: '31%',
    aspectRatio: 1.4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.outline,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  galleryAddCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryAddText: { ...FONTS.labelMd, fontSize: 11, color: colors.primary, fontWeight: '700' },
  galleryAddHint: { ...FONTS.bodySm, fontSize: 10, color: colors.textTertiary },
  galleryNote: { ...FONTS.bodySm, color: colors.textSecondary, marginTop: 16, paddingHorizontal: 2 },

  // Image picker
  imagePicker: {
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow, borderWidth: 1.5,
    borderStyle: 'dashed', borderColor: colors.outline,
    minHeight: 90, justifyContent: 'center',
  },
  imagePickerError: { borderColor: colors.error },
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
    backgroundColor: colors.primaryContainer, justifyContent: 'center',
    alignItems: 'center',
  },
  imageEmptyText: { ...FONTS.titleSm, fontSize: 13, color: colors.text },
  imageEmptyHint: { ...FONTS.bodySm, fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  // Sport chips
  sportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportRowError: { borderColor: colors.error },
  sportChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.outline,
  },
  sportChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sportChipText: { ...FONTS.labelMd, fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  sportChipTextActive: { color: colors.onPrimary, fontWeight: '700' },

  // Field input
  fieldWrap: { marginBottom: 20 },
  fieldLabel: { ...FONTS.labelSm, fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 10, letterSpacing: 0.6, textTransform: 'uppercase' },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: colors.outline,
  },
  fieldRowError: { borderColor: colors.error, backgroundColor: colors.errorContainer + '30' },
  fieldInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}) },

  fieldErrorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 6, paddingHorizontal: 4,
  },
  fieldErrorText: { ...FONTS.bodySm, color: colors.error, flex: 1 },

  sheetActions: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  draftBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.surfaceWhite,
  },
  submitBtn: {
    maxWidth: 320, width: '100%', paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: 14, alignItems: 'center', minHeight: 48, justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(30,138,76,0.15)' }
      : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 }
    ),
  },
  submitText: { ...FONTS.titleSm, fontSize: 14, fontWeight: '700', color: colors.onPrimary },
});
