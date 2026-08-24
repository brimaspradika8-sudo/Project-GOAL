import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  RefreshControl, TextInput, Image, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getErrorMessage, getAssetUrl, getResponseData } from '../../lib/api';
import { apiFetch } from '../../lib/apiClient';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import { SkeletonCards } from '../Skeleton';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import AlertBox from '../shared/AlertBox';
import AnimatedDeleteButton from '../shared/AnimatedDeleteButton';
import SelectCheckbox from '../shared/SelectCheckbox';
import BulkActionBar from '../shared/BulkActionBar';
import { useToastStore } from '../../store/toastStore';
import { useTheme, type ThemeColors } from '../../lib/theme';
import { getSportBadgeStyle } from '../../utils/sportBadge';
import { useDebounce } from '../../hooks/useDebounce';
import { useSportStore } from '../../store/sportStore';
import { fieldError } from '../../lib/formValidation';
import { useIsMobileWeb } from '../../lib/responsive';
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

type FieldTouched = { name: boolean; sport_type: boolean; price_per_hour: boolean; description: boolean; location: boolean };
const EMPTY_TOUCHED: FieldTouched = { name: false, sport_type: false, price_per_hour: false, description: false, location: false };

export default function ActiveFieldsPage({ hideHeader }: { hideHeader?: boolean } = {}) {
  const router = useRouter();
  const { colors } = useTheme();
  const isMobile = useIsMobileWeb();
  const st = useMemo(() => makeStyles(colors, isMobile), [colors, isMobile]);
  const { sports, fetchSports } = useSportStore();

  useEffect(() => {
    fetchSports();
  }, [fetchSports]);

  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSport, setFilterSport] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<FieldFormData>(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editErrors, setEditErrors] = useState<FieldFormErrors>(EMPTY_ERRORS);
  const [editTouched, setEditTouched] = useState<FieldTouched>(EMPTY_TOUCHED);

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const fetchFields = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await apiFetch('/fields/my/list', {
        params: { search: debouncedSearch, sport: filterSport, page: '1' },
      });
      const data = await res.json().catch(() => ({}));
      setFields(data?.data ?? []);
    } catch {
      if (!silent) {
        useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Gagal memuat data lapangan.' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, filterSport]);

  useEffect(() => {
    fetchFields(false);
    const interval = setInterval(() => {
      fetchFields(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchFields]);
  const onRefresh = () => { setRefreshing(true); fetchFields(false); };

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
    setEditTouched(EMPTY_TOUCHED);
  };

  const validateSingleField = (key: keyof FieldFormData, value: string, form: FieldFormData, touched: boolean) => {
    let err = '';
    switch (key) {
      case 'name': err = fieldError(value, validateFieldName(value), touched); break;
      case 'sport_type': err = fieldError(value, validateFieldSportType(value), touched); break;
      case 'price_per_hour': err = fieldError(value, validateFieldPrice(value), touched); break;
      case 'description': err = fieldError(value, validateFieldDescription(value), touched); break;
      case 'location': err = fieldError(value, validateFieldLocation(value), touched); break;
      case 'image_uri': err = validateFieldImage(value, form.image_url, form.image_mime); break;
    }
    setEditErrors(prev => ({ ...prev, [key]: err }));
  };

  const onFormFieldChange = (key: keyof FieldFormData, value: string) => {
    const isSport = key === 'sport_type';
    if (isSport) setEditTouched(p => ({ ...p, sport_type: true }));
    setEditForm(p => {
      const next = { ...p, [key]: value };
      validateSingleField(key, value, next, isSport || editTouched[key as keyof FieldTouched]);
      return next;
    });
  };

  const onFormFieldBlur = (key: keyof FieldTouched) => {
    setEditTouched(p => ({ ...p, [key]: true }));
    validateSingleField(key, editForm[key], editForm, true);
  };

  const onAllFieldsTouched = () => {
    setEditTouched({ ...EMPTY_TOUCHED, name: true, sport_type: true, price_per_hour: true, description: true, location: true });
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

  const uploadImage = async (uri: string, mime?: string): Promise<{ url: string | null; error?: string }> => {
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
        console.error('[uploadImage] gagal:', res.status, data);
        return { url: null, error: getErrorMessage(data, 'Gagal mengunggah foto. Coba lagi.') };
      }
      const uploaded = getResponseData<{ url?: string }>(data);
      return { url: uploaded?.url ?? data?.url ?? null };
    } catch (err: any) {
      console.error('[uploadImage] exception:', err?.message ?? err);
      return { url: null, error: 'Gagal terhubung ke server upload.' };
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
      let imageUrl = editForm.image_url;
      if (editForm.image_uri) {
        const uploaded = await uploadImage(editForm.image_uri, editForm.image_mime);
        if (!uploaded.url) { setEditError(uploaded.error || 'Gagal mengunggah foto. Coba lagi.'); return; }
        imageUrl = uploaded.url;
      }
      const body: any = {
        name: editForm.name.trim(),
        sport_type: editForm.sport_type.trim(),
        description: editForm.description.trim() || null,
        location: editForm.location.trim() || null,
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
      const res = await apiFetch(`/fields/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: data?.message || 'Lapangan dihapus.' });
        setDeleteTarget(null);
        try {
          const { useFieldStore } = require('../../store/fieldStore');
          await useFieldStore.getState().clearCache().catch(() => {});
        } catch {}
        fetchFields();
      } else {
        useToastStore.getState().show({ type: 'error', title: 'Gagal', description: getErrorMessage(data, 'Gagal menghapus lapangan.') });
      }
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Error', description: 'Gagal menghapus lapangan.' });
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
    const visibleIds = fields.map(f => f.id);
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
      const res = await apiFetch('/fields/bulk-delete', {
        method: 'POST',
        body: { ids: Array.from(selected) },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBulkDeleteError(getErrorMessage(data, 'Gagal menghapus lapangan.'));
        return;
      }
      setBulkDeleteTarget(false);
      setSelected(new Set());
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: data.message || 'Lapangan berhasil dihapus.' });
      fetchFields();
    } catch {
      setBulkDeleteError('Tidak dapat terhubung ke server.');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const sportChips = useMemo(() => [
    { label: 'Semua', value: null, icon: 'sports' },
    ...(sports || []).map(s => ({
      label: s.name,
      value: s.slug,
      icon: getSportBadgeStyle(s.slug).icon || 'sports',
    })),
  ], [sports]);

  if (loading) {
    return (
      <View style={st.screen}>
        {!hideHeader && <DashboardHeader title="Lapangan Aktif" subtitle="Kelola semua lapangan yang sudah disetujui" showBack={false} />}
        <SkeletonCards count={3} />
      </View>
    );
  }

  return (
    <>
      <View style={st.screen}>
        {!hideHeader && <DashboardHeader title="Lapangan Aktif" subtitle="Kelola semua lapangan yang sudah disetujui" showBack={false} />}

        <View style={st.searchWrap}>
          <View style={st.searchAndFilterRow}>
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

            <TouchableOpacity
              style={[
                st.filterBtn,
                {
                  backgroundColor: filterSport ? colors.primaryContainer : colors.surfaceContainerLow,
                  borderColor: filterSport ? colors.primary : colors.outline,
                }
              ]}
              onPress={() => setIsFilterModalOpen(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="tune" size={18} color={filterSport ? colors.primary : colors.textSecondary} />
              <Text style={[st.filterBtnText, { color: filterSport ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
                {filterSport ? (sports.find(s => s.slug === filterSport)?.name || filterSport) : 'Filter Olahraga'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={18} color={filterSport ? colors.primary : colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={st.resultRow}>
          <Text style={[st.resultText, { color: colors.textTertiary }]}>
            Menampilkan {fields.length} lapangan
          </Text>
          {(search || filterSport) && (
            <TouchableOpacity
              onPress={() => { setSearch(''); setFilterSport(null); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={st.resultResetBtn}
            >
              <MaterialIcons name="filter-alt-off" size={14} color={colors.primary} />
              <Text style={[st.resultReset, { color: colors.primary }]}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={st.scroll}
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
                ? `Rp ${Number(f.price_per_hour).toLocaleString('id-ID')}`
                : '-';
              const badge = getSportBadgeStyle(f.sport_type);
              const sportLabel = ((sports || []).find(s => s.slug === f.sport_type)?.name || SPORT_LABELS[f.sport_type] || f.sport_type)?.toUpperCase();
              return (
                <View key={f.id} style={[st.card, { backgroundColor: colors.surface, borderColor: colors.outline }, selected.has(f.id) && { borderColor: colors.primary, backgroundColor: colors.primaryContainer + '20' }]}>
                  <View style={st.cardImgWrap}>
                    <Image source={{ uri: getAssetUrl(img) || img }} style={st.cardImg} resizeMode="cover" />
                    
                    <TouchableOpacity
                      onPress={() => toggleSelect(f.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={st.imageCheckbox}
                      activeOpacity={0.8}
                    >
                      <SelectCheckbox selected={selected.has(f.id)} colors={colors} size={20} />
                    </TouchableOpacity>

                    {/* Sport & Status Badges (Top Right) */}
                    <View style={{ position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 10 }}>
                      <View style={[st.sportPillBadge, { position: 'relative', top: 0, right: 0, backgroundColor: badge.bg, borderColor: badge.border }]}>
                        <MaterialIcons name={badge.icon} size={13} color={badge.color} />
                        <Text style={[st.sportPillText, { color: badge.color }]}>{sportLabel}</Text>
                      </View>
                      {f.status && f.status !== 'approved' && (
                        <View style={{
                          paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
                          backgroundColor: f.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                          borderColor: f.status === 'pending' ? '#F59E0B40' : '#EF444440',
                          borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 4,
                        }}>
                          <MaterialIcons
                            name={f.status === 'pending' ? 'pending' : 'cancel'}
                            size={12}
                            color={f.status === 'pending' ? '#D97706' : '#DC2626'}
                          />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: f.status === 'pending' ? '#D97706' : '#DC2626' }}>
                            {f.status === 'pending' ? 'Pending' : 'Ditolak'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={st.cardBody}>
                    <View style={st.cardTop}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={[st.fieldName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                          {f.name}
                        </Text>
                      </View>
                      <View style={[st.pricePill, { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '35' }]}>
                        <Text style={[st.price, { color: colors.primary }]}>{priceStr}<Text style={[st.priceSub, { color: colors.primary }]}> / jam</Text></Text>
                      </View>
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
                        style={[st.cardActionBtn, { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '30' }]}
                        activeOpacity={0.8}
                        onPress={() => openEdit(f)}
                      >
                        <MaterialIcons name="edit" size={15} color={colors.primary} />
                        <Text style={[st.cardActionText, { color: colors.primary, fontWeight: '700' }]}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[st.cardActionBtn, { backgroundColor: colors.errorContainer + '40', borderColor: colors.error + '30' }]}
                        activeOpacity={0.8}
                        onPress={() => setDeleteTarget({ id: f.id, name: f.name })}
                      >
                        <MaterialIcons name="delete-outline" size={15} color={colors.error} />
                        <Text style={[st.cardActionText, { color: colors.error, fontWeight: '700' }]}>Hapus</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <BulkActionBar
          count={selected.size}
          allSelected={fields.length > 0 && fields.every(f => selected.has(f.id))}
          onSelectAll={toggleSelectAll}
          onClear={() => setSelected(new Set())}
          actions={[{ label: 'Hapus', icon: 'delete', color: colors.error, onPress: () => { setBulkDeleteError(null); setBulkDeleteTarget(true); } }]}
        />
      </View>

      {/* ─── Edit Modal ─── */}
      <Modal visible={!!editTarget} transparent animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setEditTarget(null)} />
          <View style={st.sheet}>
            <View style={st.sheetHandle} />
            <View style={st.sheetHeader}>
              <View style={[st.sheetIconWrap, { backgroundColor: colors.primaryContainer }]}>
                <MaterialIcons name="edit" size={22} color={colors.primary} />
              </View>
              <Text style={[st.sheetTitle, { color: colors.text }]}>Edit Lapangan</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)} style={[st.sheetClose, { backgroundColor: colors.surfaceContainerLow }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editError ? (
              <AlertBox type="error" title={editError} style={st.alertBox} />
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
                onBlur={() => onFormFieldBlur('name')}
                placeholder="Contoh: Futsal Arena Gemilang"
                error={editErrors.name} st={st} colors={colors}
              />

              <View style={st.fieldWrap}>
                <Text style={[st.fieldLabel, { color: colors.textSecondary }]}>Jenis Olahraga</Text>
                <View style={[st.sportRow, editErrors.sport_type ? { borderColor: colors.error } : null]}>
                  {(sports || []).map(s => {
                    const active = editForm.sport_type === s.slug;
                    return (
                      <TouchableOpacity
                        key={s.slug || s.id}
                        style={[st.sportChip, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outline }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => onFormFieldChange('sport_type', s.slug)}
                      >
                        <Text style={[st.sportChipText, { color: colors.textSecondary }, active && { color: colors.onPrimary }]}>{s.name}</Text>
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
                onBlur={() => onFormFieldBlur('description')}
                placeholder="Fasilitas yang tersedia..."
                multiline error={editErrors.description} st={st} colors={colors}
              />

              <FField
                label="Sewa Per Jam (Rp)" icon="payments"
                value={editForm.price_per_hour}
                onChangeText={(v) => onFormFieldChange('price_per_hour', v)}
                onBlur={() => onFormFieldBlur('price_per_hour')}
                placeholder="Contoh: 150000"
                keyboardType="numeric"
                error={editErrors.price_per_hour} st={st} colors={colors}
              />

              <FField
                label="Lokasi (opsional)" icon="location-on"
                value={editForm.location}
                onChangeText={(v) => onFormFieldChange('location', v)}
                onBlur={() => onFormFieldBlur('location')}
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

      <Modal visible={isFilterModalOpen} transparent animationType="fade" onRequestClose={() => setIsFilterModalOpen(false)}>
        <View style={st.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setIsFilterModalOpen(false)} />
          <View style={[st.filterModalBox, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <View style={st.filterModalHead}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="tune" size={20} color={colors.primary} />
                <Text style={[st.filterModalTitle, { color: colors.text }]}>Filter Olahraga</Text>
              </View>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {sportChips.map(chip => {
                const active = (filterSport === null && chip.value === null) || filterSport === chip.value;
                return (
                  <TouchableOpacity
                    key={chip.value || chip.label}
                    style={[
                      st.filterOptionItem,
                      active && { backgroundColor: colors.primaryContainer }
                    ]}
                    onPress={() => {
                      setFilterSport(chip.value);
                      setIsFilterModalOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <MaterialIcons name={(chip.icon as any) || 'sports'} size={18} color={active ? colors.primary : colors.textSecondary} />
                      <Text style={[st.filterOptionText, { color: active ? colors.primary : colors.text }, active && { fontWeight: '700' }]}>
                        {chip.label}
                      </Text>
                    </View>
                    {active && <MaterialIcons name="check" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={bulkDeleteTarget}
        title={`Hapus ${selected.size} lapangan terpilih?`}
        description="Lapangan akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan."
        destructive
        loading={bulkDeleteLoading}
        error={bulkDeleteError}
        confirmLabel="Ya, Hapus"
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleteTarget(false)}
      />
    </>
  );
}

// ── Reusable field components (same pattern as OwnerFieldsPage) ──

function FField({ label, icon, value, onChangeText, onBlur, placeholder, keyboardType, multiline, error, st, colors }: {
  label: string; icon: string; value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean;
  error?: string; st: ReturnType<typeof makeStyles>; colors: ThemeColors;
}) {
  const isNumeric = keyboardType === 'numeric' || keyboardType === 'number-pad';
  const numericVal = isNumeric && value ? value.replace(/\D/g, '') : '';
  const formattedRupiah = numericVal ? `Rp ${parseInt(numericVal, 10).toLocaleString('id-ID')}` : '';

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
          onChangeText={(v) => {
            if (isNumeric) {
              onChangeText(v.replace(/\D/g, ''));
            } else {
              onChangeText(v);
            }
          }}
          onBlur={onBlur}
          placeholder={placeholder ?? label}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
        />
      </View>
      {isNumeric && formattedRupiah ? (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
          alignSelf: 'flex-start',
          backgroundColor: colors.primaryContainer,
          borderColor: colors.primary + '35',
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 10,
        }}>
          <MaterialIcons name="payments" size={15} color={colors.primary} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
            Terbaca: <Text style={{ fontWeight: '800' }}>{formattedRupiah}</Text>
          </Text>
        </View>
      ) : null}
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

const makeStyles = (colors: ThemeColors, isMobile: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  searchWrap: { paddingHorizontal: SIZES.gutter, marginBottom: 12, ...(isMobile ? {} : { maxWidth: 1200, alignSelf: 'center', width: '100%' }) },
  searchAndFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    minHeight: 44,
  },
  filterBtnText: {
    ...FONTS.labelMd,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 130,
  },
  filterModalBox: {
    width: '90%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    alignSelf: 'center',
    marginVertical: 'auto',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 10 }),
  },
  filterModalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  filterModalTitle: {
    ...FONTS.headlineSm,
    fontSize: 16,
    fontWeight: '700',
  },
  filterOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  filterOptionText: {
    ...FONTS.bodyMd,
    fontSize: 14,
  },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.gutter,
    marginBottom: 10,
    ...(isMobile ? {} : { maxWidth: 1200, alignSelf: 'center', width: '100%' }),
  },
  resultText: { ...FONTS.labelMd, fontSize: 12 },
  resultResetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultReset: { ...FONTS.labelMd, fontSize: 12, fontWeight: '700' },

  list: {
    padding: SIZES.gutter,
    paddingBottom: 24,
    ...(isMobile
      ? {}
      : {
          maxWidth: 1200,
          alignSelf: 'center',
          width: '100%',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
        }),
  },
  scroll: { flex: 1 },

  checkbox: { padding: 4, alignSelf: 'flex-start', marginBottom: 6 },
  imageCheckbox: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: colors.surface + 'EE',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.outline,
    ...SHADOWS.xs,
  },
  sportPillBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    ...SHADOWS.xs,
  },
  sportPillText: {
    ...FONTS.labelSm,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 12, width: '100%' },
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
    ...(isMobile
      ? { width: '100%' }
      : {
          width: 'calc(33.333% - 11px)' as any,
          minWidth: 320,
          maxWidth: 380,
          marginBottom: 0,
        }),
  },
  cardImgWrap: { aspectRatio: 16 / 9, height: undefined, position: 'relative', overflow: 'hidden', backgroundColor: colors.surfaceContainerLow },
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.outline,
  },
  cardActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 36, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1,
  },
  cardActionText: { ...FONTS.labelMd, fontSize: 12, fontWeight: '600' },
  detailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 9, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1,
  },
  detailBtnText: { ...FONTS.titleSm, fontSize: 12, fontWeight: '600' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1,
  },
  editBtnText: { ...FONTS.titleSm, fontSize: 12, fontWeight: '700' },

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
  alertBox: { marginBottom: 16 },

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
  fieldInput: { flex: 1, fontSize: 14, paddingVertical: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },

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
