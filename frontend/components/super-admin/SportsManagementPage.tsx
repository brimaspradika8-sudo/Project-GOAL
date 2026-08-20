import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  RefreshControl, TextInput, Modal, KeyboardAvoidingView,
  Platform, ActivityIndicator, Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getErrorMessage } from '../../lib/api';
import { apiFetch } from '../../lib/apiClient';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import AlertBox from '../shared/AlertBox';
import AnimatedDeleteButton from '../shared/AnimatedDeleteButton';
import { useToastStore } from '../../store/toastStore';
import { useTheme, type ThemeColors } from '../../lib/theme';
import { useIsMobileWeb } from '../../lib/responsive';

export type SportItem = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
};

// ── Validation (mirrors the same pattern used for the "Tambah Lapangan" form
// in lib/fieldValidation.ts: real-time per-field checks, max-length caps that
// match what the backend actually enforces, inline error messages). ──────────
const MAX_NAME_LENGTH = 100;   // matches backend: 'name' => 'required|string|max:100'
const MAX_SLUG_LENGTH = 50;    // matches backend: 'slug' => 'nullable|string|max:50'
const MAX_DESC_LENGTH = 500;   // matches backend: 'description' => 'nullable|string|max:500'

type SportFormErrors = { name: string; slug: string; description: string };
const EMPTY_SPORT_ERRORS: SportFormErrors = { name: '', slug: '', description: '' };
type SportFormTouched = { name: boolean; slug: boolean; description: boolean };
const EMPTY_SPORT_TOUCHED: SportFormTouched = { name: false, slug: false, description: false };

function validateSportName(value: string): string {
  const v = value.trim();
  if (!v) return 'Nama jenis olahraga wajib diisi.';
  if (v.length < 3) return 'Nama jenis olahraga minimal 3 karakter.';
  if (v.length > MAX_NAME_LENGTH) return `Nama jenis olahraga tidak boleh lebih dari ${MAX_NAME_LENGTH} karakter.`;
  return '';
}

function validateSportSlug(value: string): string {
  const v = value.trim();
  if (!v) return ''; // optional - auto-generated from name if left empty
  if (v.length > MAX_SLUG_LENGTH) return `Slug tidak boleh lebih dari ${MAX_SLUG_LENGTH} karakter.`;
  if (!/^[a-zA-Z0-9_-]+$/.test(v)) return 'Slug hanya boleh berisi huruf, angka, garis bawah (_), dan strip (-).';
  return '';
}

function validateSportDescription(value: string): string {
  const v = value.trim();
  if (!v) return '';
  if (v.length > MAX_DESC_LENGTH) return `Deskripsi tidak boleh lebih dari ${MAX_DESC_LENGTH} karakter.`;
  return '';
}

function validateAllSportFields(name: string, slug: string, description: string): SportFormErrors {
  return {
    name: validateSportName(name),
    slug: validateSportSlug(slug),
    description: validateSportDescription(description),
  };
}

function hasSportErrors(errors: SportFormErrors): boolean {
  return Object.values(errors).some((e) => e !== '');
}

// Only show an error once the user has actually interacted with the field,
// so the form doesn't flash red the instant the modal opens.
function fieldErr(err: string, touched: boolean): string {
  return touched ? err : '';
}

function FieldError({ message, colors }: { message: string; colors: ThemeColors }) {
  if (!message) return null;
  return (
    <View style={styles.fieldErrorRow}>
      <MaterialIcons name="warning" size={13} color={colors.error} />
      <Text style={[styles.fieldErrorText, { color: colors.error }]}>{message}</Text>
    </View>
  );
}

export default function SportsManagementPage({ hideHeader }: { hideHeader?: boolean } = {}) {
  const { colors } = useTheme();
  const isMobile = useIsMobileWeb();
  const st = useMemo(() => makeStyles(colors, isMobile), [colors, isMobile]);

  const [sports, setSports] = useState<SportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Modal form states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SportItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<SportFormErrors>(EMPTY_SPORT_ERRORS);
  const [formTouched, setFormTouched] = useState<SportFormTouched>(EMPTY_SPORT_TOUCHED);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<SportItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSports = useCallback(async () => {
    try {
      const res = await apiFetch('/super-admin/sports');
      const data = await res.json().catch(() => ({}));
      setSports(data?.data ?? []);
    } catch {
      useToastStore.getState().show({
        type: 'error',
        title: 'Error',
        description: 'Gagal memuat daftar jenis olahraga.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSports();
  }, [fetchSports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSports();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormIsActive(true);
    setFormError(null);
    setFormErrors(EMPTY_SPORT_ERRORS);
    setFormTouched(EMPTY_SPORT_TOUCHED);
    setModalVisible(true);
  };

  const openEditModal = (item: SportItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormSlug(item.slug);
    setFormDescription(item.description || '');
    setFormIsActive(item.is_active);
    setFormError(null);
    setFormErrors(EMPTY_SPORT_ERRORS);
    setFormTouched(EMPTY_SPORT_TOUCHED);
    setModalVisible(true);
  };

  const handleNameChange = (v: string) => {
    setFormName(v);
    if (formTouched.name) {
      setFormErrors((prev) => ({ ...prev, name: validateSportName(v) }));
    }
  };
  const handleSlugChange = (v: string) => {
    setFormSlug(v);
    if (formTouched.slug) {
      setFormErrors((prev) => ({ ...prev, slug: validateSportSlug(v) }));
    }
  };
  const handleDescriptionChange = (v: string) => {
    setFormDescription(v);
    if (formTouched.description) {
      setFormErrors((prev) => ({ ...prev, description: validateSportDescription(v) }));
    }
  };

  const handleNameBlur = () => {
    setFormTouched((p) => ({ ...p, name: true }));
    setFormErrors((prev) => ({ ...prev, name: validateSportName(formName) }));
  };
  const handleSlugBlur = () => {
    setFormTouched((p) => ({ ...p, slug: true }));
    setFormErrors((prev) => ({ ...prev, slug: validateSportSlug(formSlug) }));
  };
  const handleDescriptionBlur = () => {
    setFormTouched((p) => ({ ...p, description: true }));
    setFormErrors((prev) => ({ ...prev, description: validateSportDescription(formDescription) }));
  };

  const handleSave = async () => {
    setFormTouched({ name: true, slug: true, description: true });
    const errs = validateAllSportFields(formName, formSlug, formDescription);
    setFormErrors(errs);
    if (hasSportErrors(errs)) {
      setFormError('Periksa kembali isian yang belum valid.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const url = editingItem
        ? `/super-admin/sports/${editingItem.id}`
        : '/super-admin/sports';
      const method = editingItem ? 'PUT' : 'POST';

      const body = {
        name: formName.trim(),
        slug: formSlug.trim() || undefined,
        description: formDescription.trim() || null,
        is_active: formIsActive,
      };

      const res = await apiFetch(url, { method, body });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormError(getErrorMessage(data, 'Gagal menyimpan jenis olahraga.'));
        return;
      }

      setModalVisible(false);
      useToastStore.getState().show({
        type: 'success',
        title: 'Berhasil',
        description: data.message || 'Jenis olahraga berhasil disimpan.',
      });
      fetchSports();
    } catch {
      setFormError('Tidak dapat terhubung ke server.');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`/super-admin/sports/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        useToastStore.getState().show({
          type: 'success',
          title: 'Berhasil',
          description: 'Jenis olahraga berhasil dihapus.',
        });
        setDeleteTarget(null);
        fetchSports();
      } else {
        useToastStore.getState().show({
          type: 'error',
          title: 'Gagal',
          description: getErrorMessage(data, 'Gagal menghapus jenis olahraga.'),
        });
      }
    } catch {
      useToastStore.getState().show({
        type: 'error',
        title: 'Error',
        description: 'Gagal terhubung ke server.',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredSports = useMemo(() => {
    if (!search.trim()) return sports;
    const q = search.toLowerCase();
    return sports.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [sports, search]);

  const isSubmitDisabled = formLoading || hasSportErrors(validateAllSportFields(formName, formSlug, formDescription));

  if (loading) {
    return (
      <View style={st.screen}>
        {!hideHeader && (
          <DashboardHeader
            title="Jenis Olahraga"
            subtitle="Kelola semua kategori & jenis olahraga di aplikasi"
            showBack={false}
          />
        )}
        <View style={st.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={st.screen}>
        {!hideHeader && (
          <DashboardHeader
            title="Jenis Olahraga"
            subtitle="Kelola semua kategori & jenis olahraga di aplikasi"
            showBack={false}
          />
        )}

        <View style={st.topBar}>
          <View
            style={[
              st.searchBar,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderColor: colors.outline,
              },
            ]}
          >
            <MaterialIcons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              style={[st.searchInput, { color: colors.text }]}
              placeholder="Cari jenis olahraga..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialIcons name="close" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[st.addBtn, { backgroundColor: colors.primary }]}
            onPress={openAddModal}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={20} color={colors.onPrimary} />
            <Text style={[st.addBtnText, { color: colors.onPrimary }]}>
              Tambah
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={st.scroll}
          contentContainerStyle={st.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {filteredSports.length === 0 ? (
            <View style={st.emptyWrap}>
              <MaterialIcons
                name="sports-soccer"
                size={48}
                color={colors.textTertiary}
              />
              <Text style={[st.emptyTitle, { color: colors.text }]}>
                Tidak Ada Jenis Olahraga
              </Text>
              <Text style={[st.emptyDesc, { color: colors.textSecondary }]}>
                {search ? 'Tidak ada hasil yang sesuai.' : 'Belum ada jenis olahraga ditambahkan.'}
              </Text>
            </View>
          ) : (
            filteredSports.map((item) => (
              <View
                key={item.id}
                style={[
                  st.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.outline,
                  },
                ]}
              >
                <View style={st.cardHeader}>
                  <View style={st.cardTitleWrap}>
                    <Text style={[st.cardTitle, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[st.cardBadge, { color: colors.textTertiary }]}>
                      slug: {item.slug}
                    </Text>
                  </View>
                  <View
                    style={[
                      st.statusPill,
                      {
                        backgroundColor: item.is_active
                          ? colors.successLight
                          : colors.errorContainer,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        st.statusText,
                        {
                          color: item.is_active
                            ? colors.primary
                            : colors.error,
                        },
                      ]}
                    >
                      {item.is_active ? 'Aktif' : 'Non-Aktif'}
                    </Text>
                  </View>
                </View>

                {item.description ? (
                  <Text
                    style={[st.cardDesc, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                ) : null}

                <View style={st.cardActions}>
                  <TouchableOpacity
                    style={[
                      st.actionBtn,
                      {
                        backgroundColor: colors.surfaceContainerLow,
                        borderColor: colors.outline,
                      },
                    ]}
                    onPress={() => openEditModal(item)}
                  >
                    <MaterialIcons name="edit" size={16} color={colors.primary} />
                    <Text style={[st.actionBtnText, { color: colors.primary }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <AnimatedDeleteButton onPress={() => setDeleteTarget(item)} />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* ── Add / Edit Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={st.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={st.sheet}>
            <View style={st.sheetHandle} />
            <View style={st.sheetHeader}>
              <Text style={[st.sheetTitle, { color: colors.text }]}>
                {editingItem ? 'Edit Jenis Olahraga' : 'Tambah Jenis Olahraga'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {formError ? <AlertBox type="error" title={formError} style={{ marginBottom: 12 }} /> : null}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={st.fieldWrap}>
                <View style={st.fieldLabelRow}>
                  <Text style={[st.fieldLabel, { color: colors.textSecondary }]}>
                    Nama Olahraga *
                  </Text>
                  <Text style={[st.charCount, { color: colors.textTertiary }]}>
                    {formName.length}/{MAX_NAME_LENGTH}
                  </Text>
                </View>
                <TextInput
                  style={[
                    st.fieldInput,
                    {
                      backgroundColor: colors.surfaceContainerLow,
                      borderColor: fieldErr(formErrors.name, formTouched.name) ? colors.error : colors.outline,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Contoh: Pickleball, Squash"
                  placeholderTextColor={colors.textTertiary}
                  value={formName}
                  onChangeText={handleNameChange}
                  onBlur={handleNameBlur}
                  maxLength={MAX_NAME_LENGTH}
                />
                <FieldError message={fieldErr(formErrors.name, formTouched.name)} colors={colors} />
              </View>

              <View style={st.fieldWrap}>
                <View style={st.fieldLabelRow}>
                  <Text style={[st.fieldLabel, { color: colors.textSecondary }]}>
                    Kode / Slug (Opsional)
                  </Text>
                  <Text style={[st.charCount, { color: colors.textTertiary }]}>
                    {formSlug.length}/{MAX_SLUG_LENGTH}
                  </Text>
                </View>
                <TextInput
                  style={[
                    st.fieldInput,
                    {
                      backgroundColor: colors.surfaceContainerLow,
                      borderColor: fieldErr(formErrors.slug, formTouched.slug) ? colors.error : colors.outline,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Contoh: pickleball (otomatis jika kosong)"
                  placeholderTextColor={colors.textTertiary}
                  value={formSlug}
                  onChangeText={handleSlugChange}
                  onBlur={handleSlugBlur}
                  autoCapitalize="none"
                  maxLength={MAX_SLUG_LENGTH}
                />
                <FieldError message={fieldErr(formErrors.slug, formTouched.slug)} colors={colors} />
              </View>

              <View style={st.fieldWrap}>
                <View style={st.fieldLabelRow}>
                  <Text style={[st.fieldLabel, { color: colors.textSecondary }]}>
                    Deskripsi (Opsional)
                  </Text>
                  <Text style={[st.charCount, { color: colors.textTertiary }]}>
                    {formDescription.length}/{MAX_DESC_LENGTH}
                  </Text>
                </View>
                <TextInput
                  style={[
                    st.fieldInput,
                    st.textArea,
                    {
                      backgroundColor: colors.surfaceContainerLow,
                      borderColor: fieldErr(formErrors.description, formTouched.description) ? colors.error : colors.outline,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Penjelasan singkat mengenai jenis olahraga"
                  placeholderTextColor={colors.textTertiary}
                  value={formDescription}
                  onChangeText={handleDescriptionChange}
                  onBlur={handleDescriptionBlur}
                  multiline
                  numberOfLines={3}
                  maxLength={MAX_DESC_LENGTH}
                />
                <FieldError message={fieldErr(formErrors.description, formTouched.description)} colors={colors} />
              </View>

              <View style={st.switchRow}>
                <Text style={[st.fieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                  Status Aktif
                </Text>
                <Switch
                  value={formIsActive}
                  onValueChange={setFormIsActive}
                  trackColor={{ false: colors.outline, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>

            <View style={st.sheetActions}>
              <TouchableOpacity
                style={[
                  st.submitBtn,
                  { backgroundColor: colors.primary },
                  isSubmitDisabled && { opacity: 0.5 },
                ]}
                onPress={handleSave}
                disabled={isSubmitDisabled}
              >
                {formLoading ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={[st.submitText, { color: colors.onPrimary }]}>
                    Simpan
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title={`Hapus "${deleteTarget?.name ?? ''}"?`}
        description="Jenis olahraga akan dihapus secara permanen. Pastikan tidak ada lapangan yang menggunakannya."
        destructive
        loading={deleteLoading}
        confirmLabel="Ya, Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  fieldErrorText: {
    fontSize: 12,
    flex: 1,
  },
});

const makeStyles = (colors: ThemeColors, isMobile: boolean) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: SIZES.gutter,
      marginBottom: 12,
      ...(isMobile ? {} : { maxWidth: 900, alignSelf: 'center', width: '100%' }),
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 1.5,
    },
    searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 14,
    },
    addBtnText: { ...FONTS.titleSm, fontSize: 13, fontWeight: '700' },
    scroll: { flex: 1 },
    list: {
      padding: SIZES.gutter,
      paddingBottom: 24,
      gap: 12,
      ...(isMobile ? {} : { maxWidth: 900, alignSelf: 'center', width: '100%' }),
    },
    emptyWrap: { alignItems: 'center', marginTop: 80, gap: 10 },
    emptyTitle: { ...FONTS.titleLg },
    emptyDesc: { ...FONTS.bodyMd },
    card: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      ...SHADOWS.sm,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    cardTitleWrap: { flex: 1, marginRight: 8 },
    cardTitle: { ...FONTS.titleLg, fontSize: 16 },
    cardBadge: { ...FONTS.labelSm, fontSize: 11, marginTop: 2 },
    statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { ...FONTS.labelSm, fontSize: 11, fontWeight: '700' },
    cardDesc: { ...FONTS.bodySm, marginBottom: 12 },
    cardActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 8,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      borderWidth: 1,
    },
    actionBtnText: { ...FONTS.labelMd, fontSize: 12 },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: '85%',
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center',
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.outline,
      alignSelf: 'center',
      marginBottom: 16,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sheetTitle: { ...FONTS.titleLg, fontSize: 18 },
    fieldWrap: { marginBottom: 14 },
    fieldLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    fieldLabel: {
      ...FONTS.labelSm,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    charCount: {
      ...FONTS.labelSm,
      fontSize: 10,
      fontWeight: '600',
    },
    fieldInput: {
      borderRadius: 12,
      borderWidth: 1.5,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
    },
    textArea: { minHeight: 70, textAlignVertical: 'top' },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 10,
    },
    sheetActions: { marginTop: 16, paddingTop: 12 },
    submitBtn: {
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitText: { ...FONTS.titleSm, fontSize: 14, fontWeight: '700' },
  });
