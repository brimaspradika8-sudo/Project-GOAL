import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl, Image,
  Modal, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFieldStore } from '../../store/fieldStore';
import { TOKEN_KEY } from '../../app/_layout';
import { API_BASE_URL, getErrorMessage } from '../../lib/api';
import { COLORS, FONTS, SIZES, SHADOWS } from '../goalTheme';
import { SkeletonCards } from '../Skeleton';
import DashboardHeader from '../shared/DashboardHeader';
import {
  SPORT_OPTIONS, SPORT_MAP,
  type FieldFormErrors, type FieldFormData,
  EMPTY_ERRORS, validateAllFields, hasErrors,
  validateFieldName, validateFieldSportType, validateFieldPrice,
  validateFieldImage, validateFieldImageSize, validateFieldDescription,
  mimeFromExt,
} from '../../lib/fieldValidation';

const IMG_PLACEHOLDER = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop';

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  approved: { label: 'Aktif',    bg: COLORS.primaryContainer, color: COLORS.primary },
  pending:  { label: 'Menunggu', bg: COLORS.floodlight + '25', color: '#92400e' },
  rejected: { label: 'Ditolak',  bg: COLORS.errorContainer,    color: COLORS.error },
};

const EMPTY_FORM: FieldFormData = {
  name: '',
  sport_type: '',
  description: '',
  price_per_hour: '',
  image_url: '',
  image_uri: '',
  image_mime: '',
};

export default function OwnerFieldsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createErrors, setCreateErrors] = useState<FieldFormErrors>(EMPTY_ERRORS);
  const createTouched = useRef<Record<string, boolean>>({});

  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editErrors, setEditErrors] = useState<FieldFormErrors>(EMPTY_ERRORS);
  const editTouched = useRef<Record<string, boolean>>({});

  const fetchFields = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/my/list`, {
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
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
    const touchedRef = isCreate ? createTouched : editTouched;
    const shouldValidate = touchedRef.current[key] || key === 'sport_type' || key === 'image_uri';
    if (isCreate) {
      setCreateForm(p => {
        const next = { ...p, [key]: value };
        if (shouldValidate) {
          validateSingleField(key, value, next, true);
        }
        return next;
      });
    } else {
      setEditForm(p => {
        const next = { ...p, [key]: value };
        if (shouldValidate) {
          validateSingleField(key, value, next, false);
        }
        return next;
      });
    }
  };

  const onFieldBlur = (key: keyof FieldFormData, isCreate: boolean) => {
    const touchedRef = isCreate ? createTouched : editTouched;
    touchedRef.current[key] = true;
    const form = isCreate ? createForm : editForm;
    validateSingleField(key, form[key], form, isCreate);
  };

  const onAllFieldsTouched = (isCreate: boolean) => {
    const touchedRef = isCreate ? createTouched : editTouched;
    const fields: (keyof FieldFormData)[] = ['name', 'sport_type', 'price_per_hour', 'image_uri', 'description'];
    fields.forEach(f => { touchedRef.current[f] = true; });
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
    createTouched.current = {};
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
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      let imageUrl = createForm.image_url;
      if (createForm.image_uri && !imageUrl) {
        const uploaded = await uploadImage(createForm.image_uri, token!, createForm.image_mime);
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
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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
      Alert.alert('Berhasil', 'Lapangan berhasil ditambahkan dan menunggu approval Super Admin.');
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
    });
    setEditError(null);
    setEditErrors(EMPTY_ERRORS);
    editTouched.current = {};
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
      const token = await AsyncStorage.getItem(TOKEN_KEY);

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
      };
      if (editForm.price_per_hour.trim()) body.price_per_hour = parseInt(editForm.price_per_hour.replace(/\D/g, ''), 10);
      if (imageUrl) body.image_url = imageUrl;

      const res = await fetch(`${API_BASE_URL}/fields/${editTarget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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
      Alert.alert('Berhasil', 'Data lapangan berhasil diperbarui.');
      await useFieldStore.getState().clearCache().catch(() => {});
      fetchFields();
    } catch {
      setEditError('Gagal terhubung ke server.');
    } finally {
      setEditLoading(false);
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
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return null;
      return data.url;
    } catch {
      return null;
    }
  };

  const handleDelete = (id: number, name: string) => {
    const doDelete = async () => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/fields/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        Alert.alert('Berhasil', 'Lapangan dihapus.');
        await useFieldStore.getState().clearCache().catch(() => {});
        fetchFields();
      } else {
        Alert.alert('Error', 'Gagal menghapus lapangan.');
      }
    };

    Alert.alert('Hapus Lapangan', `Apakah Anda yakin ingin menghapus lapangan "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: doDelete },
    ]);
  };

  const activeCount = fields.filter(f => f.status === 'approved').length;
  const pendingCount = fields.filter(f => f.status === 'pending').length;

  if (loading) {
    return (
      <View style={st.screen}>
        <DashboardHeader title="Kelola Lapangan" subtitle="Kelola aset lapangan olahraga Anda" />
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
          right={
            <TouchableOpacity style={st.headerAddBtn} activeOpacity={0.8} onPress={openCreate}>
              <MaterialIcons name="add" size={20} color={COLORS.primary} />
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
            <Text style={[st.statNum, { color: COLORS.primary }]}>{activeCount}</Text>
            <Text style={st.statLabel}>Aktif</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.statItem}>
            <Text style={[st.statNum, { color: COLORS.floodlight }]}>{pendingCount}</Text>
            <Text style={st.statLabel}>Menunggu</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={st.contentList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {fields.length === 0 ? (
            <View style={st.emptyWrap}>
              <View style={st.emptyIcon}>
                <MaterialIcons name="sports-soccer" size={40} color={COLORS.textTertiary} />
              </View>
              <Text style={st.emptyTitle}>Belum ada lapangan</Text>
              <Text style={st.emptyDesc}>Mulai tambahkan aset lapangan Anda untuk menerima booking.</Text>
              <TouchableOpacity style={st.emptyAddBtn} activeOpacity={0.85} onPress={openCreate}>
                <MaterialIcons name="add" size={18} color={COLORS.onPrimary} />
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
                      <MaterialIcons name="sports" size={14} color={COLORS.textSecondary} />
                      <Text style={st.detailText}>{(Object.keys(SPORT_MAP).find(k => SPORT_MAP[k] === f.sport_type) || f.sport_type)?.toUpperCase()}</Text>
                    </View>
                    {f.description ? (
                      <View style={st.detailRow}>
                        <MaterialIcons name="notes" size={14} color={COLORS.textSecondary} />
                        <Text style={st.detailText} numberOfLines={2}>{f.description}</Text>
                      </View>
                    ) : null}
                    <View style={st.actions}>
                      <TouchableOpacity
                        style={st.editBtn}
                        activeOpacity={0.8}
                        onPress={() => openEdit(f)}
                      >
                        <MaterialIcons name="edit" size={16} color={COLORS.primary} />
                        <Text style={st.editBtnText}>Edit Venue</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={st.delBtn}
                        activeOpacity={0.8}
                        onPress={() => handleDelete(f.id, f.name)}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <MaterialIcons name="delete-outline" size={18} color={COLORS.error} />
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
        iconColor={COLORS.primary}
        iconBg={COLORS.primaryContainer}
        form={createForm}
        errors={createErrors}
        error={createError}
        loading={createLoading}
        onFieldChange={(key, val) => onFormFieldChange(key, val, true)}
        onFieldBlur={(key) => onFieldBlur(key, true)}
        onPickImage={() => pickImage(setCreateForm, setCreateErrors, true)}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        submitLabel="Simpan Lapangan"
        submitBg={COLORS.primary}
      />

      {/* ── EDIT MODAL ── */}
      <FieldModal
        visible={!!editTarget}
        title="Edit Venue"
        iconName="edit"
        iconColor="#6d28d9"
        iconBg="#ede9fe"
        form={editForm}
        errors={editErrors}
        error={editError}
        loading={editLoading}
        onFieldChange={(key, val) => onFormFieldChange(key, val, false)}
        onFieldBlur={(key) => onFieldBlur(key, false)}
        onPickImage={() => pickImage(setEditForm, setEditErrors, false)}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        submitLabel="Simpan Perubahan"
        submitBg="#6d28d9"
      />
    </>
  );
}

// ── Field Form Modal ──────────────────────────────────────────────────────────
function FieldModal({
  visible, title, iconName, iconColor, iconBg,
  form, errors, error, loading,
  onFieldChange, onFieldBlur, onPickImage, onClose, onSubmit, submitLabel, submitBg,
}: {
  visible: boolean; title: string;
  iconName: string; iconColor: string; iconBg: string;
  form: FieldFormData;
  errors: FieldFormErrors;
  error: string | null; loading: boolean;
  onFieldChange: (key: keyof FieldFormData, val: string) => void;
  onFieldBlur: (key: keyof FieldFormData) => void;
  onPickImage: () => void;
  onClose: () => void; onSubmit: () => void;
  submitLabel: string; submitBg: string;
}) {
  const set = (key: keyof FieldFormData) => (val: string) => onFieldChange(key, val);
  const blur = (key: keyof FieldFormData) => () => onFieldBlur(key);
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
              <MaterialIcons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={st.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={COLORS.error} />
              <Text style={st.errorText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Image picker */}
            <Text style={st.fieldLabel}>Foto Venue (Utama)</Text>
            <TouchableOpacity style={[st.imagePicker, errors.image && st.imagePickerError]} onPress={onPickImage} activeOpacity={0.8}>
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
                    <MaterialIcons name="add-photo-alternate" size={26} color={COLORS.primary} />
                  </View>
                  <Text style={st.imageEmptyText}>Tap untuk memilih foto</Text>
                  <Text style={st.imageEmptyHint}>Dari Galeri perangkat Anda (Maks 5MB)</Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.image ? <FieldError message={errors.image} /> : null}

            {/* Nama Lapangan */}
            <FField
              label="Nama Lapangan" icon="stadium"
              value={form.name}
              onChangeText={set('name')}
              onBlur={blur('name')}
              placeholder="Contoh: Futsal Arena Gemilang"
              error={errors.name}
            />

            {/* Jenis Olahraga */}
            <Text style={st.fieldLabel}>Jenis Olahraga</Text>
            <View style={[st.sportRow, errors.sport_type && st.sportRowError]}>
              {SPORT_OPTIONS.map(s => {
                const active = form.sport_type === SPORT_MAP[s];
                return (
                  <TouchableOpacity
                    key={s}
                    style={[st.sportChip, active && st.sportChipActive]}
                    onPress={() => onFieldChange('sport_type', SPORT_MAP[s])}
                    activeOpacity={0.7}
                  >
                    <Text style={[st.sportChipText, active && st.sportChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.sport_type ? <FieldError message={errors.sport_type} /> : null}

            {/* Deskripsi */}
            <FField
              label="Deskripsi" icon="notes"
              value={form.description}
              onChangeText={set('description')}
              onBlur={blur('description')}
              placeholder="Fasilitas yang tersedia..."
              multiline
              error={errors.description}
            />

            {/* Harga */}
            <FField
              label="Sewa Per Jam (Rp)" icon="payments"
              value={form.price_per_hour}
              onChangeText={set('price_per_hour')}
              onBlur={blur('price_per_hour')}
              placeholder="Contoh: 150000"
              keyboardType="numeric"
              error={errors.price_per_hour}
            />
          </ScrollView>

          <View style={st.sheetActions}>
            <TouchableOpacity
              style={[st.submitBtn, { backgroundColor: submitBg }, isSubmitDisabled && { opacity: 0.5 }]}
              onPress={onSubmit}
              disabled={isSubmitDisabled}
            >
              {loading
                ? <ActivityIndicator color={COLORS.onPrimary} size="small" />
                : <Text style={st.submitText}>{submitLabel}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Inline error message ──────────────────────────────────────────────────────
function FieldError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={st.fieldErrorRow}>
      <MaterialIcons name="warning" size={13} color={COLORS.error} />
      <Text style={st.fieldErrorText}>{message}</Text>
    </View>
  );
}

// ── Text input field ──────────────────────────────────────────────────────────
function FField({ label, icon, value, onChangeText, onBlur, placeholder, keyboardType, multiline, error }: {
  label: string; icon: string; value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean;
  error?: string;
}) {
  return (
    <View style={st.fieldWrap}>
      <Text style={st.fieldLabel}>{label}</Text>
      <View style={[
        st.fieldRow,
        multiline && { alignItems: 'flex-start', paddingTop: 14 },
        error && st.fieldRowError,
      ]}>
        <MaterialIcons name={icon as any} size={18} color={error ? COLORS.error : COLORS.textSecondary} style={{ marginRight: 12, marginTop: multiline ? 2 : 0 }} />
        <TextInput
          style={[st.fieldInput, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder ?? label}
          placeholderTextColor={COLORS.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
        />
      </View>
      {error ? <FieldError message={error} /> : null}
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  headerAddBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.xs,
  },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.gutter, marginTop: 14,
    borderRadius: SIZES.borderRadius, borderWidth: 1,
    borderColor: COLORS.outline, paddingVertical: 12, paddingHorizontal: 16,
    ...SHADOWS.xs,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { ...FONTS.headlineSm, color: COLORS.text },
  statLabel: { ...FONTS.bodySm, color: COLORS.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: COLORS.outline },

  contentList: { padding: SIZES.gutter, paddingBottom: 60 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.outline,
  },
  emptyTitle: { ...FONTS.titleLg, color: COLORS.text },
  emptyDesc: { ...FONTS.bodyMd, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: SIZES.borderRadius, marginTop: 8, ...SHADOWS.primary,
  },
  emptyAddText: { ...FONTS.titleSm, color: COLORS.onPrimary },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 20, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.outline,
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
  name: { ...FONTS.titleLg, color: COLORS.text, flex: 1, marginRight: 10 },
  pricePill: {
    backgroundColor: COLORS.primaryContainer, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  price: { ...FONTS.titleMd, color: COLORS.primary },
  priceSub: { ...FONTS.bodySm, color: COLORS.textSecondary },

  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  detailText: { ...FONTS.bodyMd, color: COLORS.textSecondary, flex: 1 },

  actions: {
    flexDirection: 'row', gap: 12, marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: COLORS.outline,
  },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primaryContainer, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary + '30',
    minHeight: 44,
  },
  editBtnText: { ...FONTS.titleSm, color: COLORS.primary },
  delBtn: {
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.errorContainer, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.error + '30',
  },

  // Modal styling
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1, borderColor: COLORS.outline, maxHeight: '90%',
  },
  sheetHandle: { width: 48, height: 5, borderRadius: 3, backgroundColor: COLORS.outline, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sheetIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { ...FONTS.headlineSm, color: COLORS.text, flex: 1 },
  sheetClose: { padding: 6, backgroundColor: COLORS.surfaceContainerLow, borderRadius: 20 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.errorContainer, borderRadius: 12,
    padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.error + '30',
  },
  errorText: { color: COLORS.error, ...FONTS.bodySm, flex: 1 },

  // Image picker
  imagePicker: {
    borderRadius: 16, overflow: 'hidden', marginBottom: 6,
    backgroundColor: COLORS.surfaceContainerLow, borderWidth: 2,
    borderStyle: 'dashed', borderColor: COLORS.outline,
  },
  imagePickerError: { borderColor: COLORS.error },
  imagePreview: { width: '100%', height: 180 },
  imageEditOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8, paddingVertical: 12,
  },
  imageEditText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  imageEmpty: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 36 },
  imgDashedCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORS.primaryContainer, justifyContent: 'center',
    alignItems: 'center', marginBottom: 4,
  },
  imageEmptyText: { ...FONTS.titleSm, color: COLORS.text },
  imageEmptyHint: { ...FONTS.bodySm, color: COLORS.textSecondary },

  // Sport chips
  sportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  sportRowError: { borderColor: COLORS.error },
  sportChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow, borderWidth: 1, borderColor: COLORS.outline,
  },
  sportChipActive: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primary },
  sportChipText: { ...FONTS.labelMd, color: COLORS.textSecondary },
  sportChipTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Field input
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { ...FONTS.labelSm, color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: COLORS.outline,
  },
  fieldRowError: { borderColor: COLORS.error, backgroundColor: COLORS.errorContainer + '30' },
  fieldInput: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 0 },

  fieldErrorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 6, paddingHorizontal: 4,
  },
  fieldErrorText: { ...FONTS.bodySm, color: COLORS.error, flex: 1 },

  sheetActions: { marginTop: 10 },
  submitBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', minHeight: 50, justifyContent: 'center',
  },
  submitText: { ...FONTS.titleSm, color: COLORS.onPrimary },
});
