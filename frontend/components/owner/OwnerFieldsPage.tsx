import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl, Image,
  Modal, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useFieldStore } from '../../store/fieldStore';
import * as SecureStore from '../../lib/secureStorage';
import { TOKEN_KEY } from '../../lib/auth';
import { API_BASE_URL, getErrorMessage, DEFAULT_HEADERS } from '../../lib/api';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import { SkeletonCards } from '../Skeleton';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import AlertBox from '../shared/AlertBox';
import AnimatedDeleteButton from '../shared/AnimatedDeleteButton';
import { useToastStore } from '../../store/toastStore';
import { useTheme, type ThemeColors } from '../../lib/theme';
import {
  SPORT_OPTIONS, SPORT_MAP,
  type FieldFormErrors, type FieldFormData,
  EMPTY_ERRORS, validateAllFields, hasErrors,
  validateFieldName, validateFieldSportType, validateFieldPrice,
  validateFieldImage, validateFieldImageSize, validateFieldDescription,
  validateFieldLocation, mimeFromExt,
} from '../../lib/fieldValidation';

const IMG_PLACEHOLDER = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop';

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

export default function OwnerFieldsPage() {
  const { colors } = useTheme();
  const st = makeStyles(colors);
  const STATUS_CFG = getStatusCfg(colors);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createErrors, setCreateErrors] = useState<FieldFormErrors>(EMPTY_ERRORS);

  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editErrors, setEditErrors] = useState<FieldFormErrors>(EMPTY_ERRORS);

  const fetchFields = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/my/list`, {
        headers: {
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${token}`,
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
  }, []);

  useEffect(() => { fetchFields(); }, [fetchFields]);
  const onRefresh = () => { setRefreshing(true); fetchFields(); };

  const validateSingleField = (
    key: keyof FieldFormData,
    value: string,
    form: FieldFormData,
    isCreate: boolean,
  ) => {
    let err = '';
    switch (key) {
      case 'name': err = validateFieldName(value); break;
      case 'sport_type': err = validateFieldSportType(value); break;
      case 'price_per_hour': err = validateFieldPrice(value); break;
      case 'description': err = validateFieldDescription(value); break;
      case 'location': err = validateFieldLocation(value); break;
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
    if (isCreate) {
      setCreateForm(p => {
        const next = { ...p, [key]: value };
        validateSingleField(key, value, next, true);
        return next;
      });
    } else {
      setEditForm(p => {
        const next = { ...p, [key]: value };
        validateSingleField(key, value, next, false);
        return next;
      });
    }
  };

  const onAllFieldsTouched = (isCreate: boolean) => {
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

  const openCreate = () => {
    setCreateForm(EMPTY_FORM);
    setCreateError(null);
    setCreateErrors(EMPTY_ERRORS);
    setShowCreate(true);
  };

  const handleCreate = async () => {
    onAllFieldsTouched(true);
    const errs = validateAllFields(createForm);
    setCreateErrors(errs);
    if (hasErrors(errs)) return;

    setCreateLoading(true);
    setCreateError(null);
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);

      let imageUrl = createForm.image_url;
      if (createForm.image_uri && !imageUrl) {
        const uploadRes = await uploadImageDetailed(createForm.image_uri, token!, createForm.image_mime);
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

      const res = await fetch(`${API_BASE_URL}/fields`, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(getErrorMessage(data, 'Gagal menambah lapangan.'));
        return;
      }
      setShowCreate(false);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Lapangan berhasil ditambahkan dan menunggu approval Super Admin.' });
      await useFieldStore.getState().clearCache().catch(() => {});
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
      const token = await SecureStore.getItemAsync(TOKEN_KEY);

      let imageUrl = editForm.image_url;
      if (editForm.image_uri) {
        const uploaded = await uploadImage(editForm.image_uri, token!, editForm.image_mime);
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

      const res = await fetch(`${API_BASE_URL}/fields/${editTarget.id}`, {
        method: 'PUT',
        headers: {
          ...DEFAULT_HEADERS,
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
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

  const uploadImageDetailed = async (uri: string, token: string, mime?: string): Promise<{ url: string | null; error?: string }> => {
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
        headers: {
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { url: null, error: data.message || 'Gagal mengunggah foto. Silakan coba lagi.' };
      }
      return { url: data.url };
    } catch (err: any) {
      return { url: null, error: 'Gagal terhubung ke server upload.' };
    }
  };

  const uploadImage = async (uri: string, token: string, mime?: string): Promise<string | null> => {
    const res = await uploadImageDetailed(uri, token, mime);
    return res.url;
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = (id: number, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const res = await fetch(`${API_BASE_URL}/fields/${deleteTarget.id}`, {
      method: 'DELETE',
      headers: {
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${token}`,
      },
    });
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

  if (loading) {
    return (
      <View style={st.screen}>
        <DashboardHeader title="Kelola Lapangan" subtitle="Kelola aset lapangan olahraga Anda" onBack={() => router.push('/(tabs)')} />
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
          onBack={() => router.push('/(tabs)')}
          right={
            <TouchableOpacity style={st.headerAddBtn} activeOpacity={0.8} onPress={openCreate}>
              <MaterialIcons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          }
        />

        <View style={st.statsRow}>
          <View style={st.statItem}>
            <Text style={st.statNum}>{fields.length}</Text>
            <Text style={st.statLabel}>Total Lapangan</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.statItem}>
            <Text style={[st.statNum, { color: colors.primary }]}>{activeCount}</Text>
            <Text style={st.statLabel}>Aktif</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.statItem}>
            <Text style={[st.statNum, { color: colors.floodlight }]}>{pendingCount}</Text>
            <Text style={st.statLabel}>Menunggu</Text>
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
                        style={[st.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => openEdit(f)}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <MaterialIcons name="edit" size={16} color={colors.onPrimary} />
                      </TouchableOpacity>
                      <AnimatedDeleteButton
                        onPress={() => handleDelete(f.id, f.name)}
                      />
                    </View>
                  </View>
                </View>
              );
            })
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
        onPickImage={() => pickImage(setCreateForm, setCreateErrors, true)}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
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
    </>
  );
}

function FieldModal({
  visible, title, iconName, iconColor, iconBg,
  form, errors, error, loading,
  onFieldChange, onPickImage, onClose, onSubmit, submitLabel, submitBg, st, colors,
}: {
  visible: boolean; title: string;
  iconName: string; iconColor: string; iconBg: string;
  form: FieldFormData;
  errors: FieldFormErrors;
  error: string | null; loading: boolean;
  onFieldChange: (key: keyof FieldFormData, val: string) => void;
  onPickImage: () => void;
  onClose: () => void; onSubmit: () => void;
  submitLabel: string; submitBg: string;
  st: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  const set = (key: keyof FieldFormData) => (val: string) => onFieldChange(key, val);
  const previewUri = form.image_uri || form.image_url || null;
  const isSubmitDisabled = loading || hasErrors(errors);

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
              placeholder="Contoh: Jl. Merdeka No. 10, Kota Bandung"
              error={errors.location}
              st={st}
              colors={colors}
            />
          </ScrollView>

          <View style={st.sheetActions}>
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
        </View>
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
function FField({ label, icon, value, onChangeText, placeholder, keyboardType, multiline, error, st, colors }: {
  label: string; icon: string; value: string;
  onChangeText: (v: string) => void;
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

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  headerAddBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.xs,
  },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: SIZES.gutter, marginTop: 8,
    borderRadius: SIZES.borderRadius, borderWidth: 1,
    borderColor: colors.outline, paddingVertical: 8, paddingHorizontal: 16,
    ...SHADOWS.xs,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { ...FONTS.headlineSm, color: colors.text },
  statLabel: { ...FONTS.bodySm, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.outline },

  contentList: { padding: SIZES.gutter, paddingBottom: 60 },
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
    backgroundColor: colors.surface, borderRadius: 20, marginBottom: 16,
    borderWidth: 1, borderColor: colors.outline,
    ...SHADOWS.sm,
  },
  cardImgWrap: { borderTopLeftRadius: 19, borderTopRightRadius: 19, overflow: 'hidden' },
  cardImg: { width: '100%', height: 160 },
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
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
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
