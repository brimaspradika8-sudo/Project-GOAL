import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DashboardHeader from '../shared/DashboardHeader';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import { useTheme, type ThemeColors } from '../../lib/theme';
import { useIsMobileWeb } from '../../lib/responsive';
import { useToastStore } from '../../store/toastStore';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  icon: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    category: 'Pengajuan Owner',
    question: 'Bagaimana cara meninjau permohonan Owner baru?',
    answer: 'Buka halaman Kelola Pengguna, lalu klik icon kotak berkas (Pengajuan) di baris header sebelah lonceng notifikasi. Di modal yang muncul, Anda dapat melihat detail permohonan dan memilih "Setujui" atau "Tolak" beserta alasannya.',
    icon: 'inventory',
  },
  {
    id: '2',
    category: 'Manajemen Pengguna',
    question: 'Bagaimana cara mengedit data atau merubah role pengguna?',
    answer: 'Pada halaman Kelola Pengguna, gunakan tombol edit (icon pensil) di baris pengguna untuk mengubah nama/email/password, atau klik icon perisai untuk memperbarui role pengguna menjadi Pemain, Owner, atau Super Admin.',
    icon: 'people-alt',
  },
  {
    id: '3',
    category: 'Kelola Lapangan',
    question: 'Bagaimana cara mengatur aturan validasi data lapangan?',
    answer: 'Masuk ke Kelola Lapangan, lalu klik icon Pengaturan (gear) di header sebelah kanan. Anda dapat mengatur panjang karakter nama, batas harga minimal, dan aturan kelayakan deskripsi.',
    icon: 'stadium',
  },
  {
    id: '4',
    category: 'Kategori Olahraga',
    question: 'Bagaimana cara menaikkan atau menambah jenis olahraga baru?',
    answer: 'Masuk ke modal Pengaturan di Kelola Lapangan, pilih tab "Jenis Olahraga", lalu Anda dapat melakukan CRUD (Tambah, Edit, Hapus) jenis olahraga yang tersedia pada aplikasi.',
    icon: 'sports-soccer',
  },
];

export default function HelpCenterPage() {
  const { colors } = useTheme();
  const isMobile = useIsMobileWeb();
  const st = makeStyles(colors, isMobile);

  const [search, setSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>('1');

  // Support Form State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);

  const filteredFaqs = FAQ_DATA.filter(f =>
    f.question.toLowerCase().includes(search.toLowerCase()) ||
    f.answer.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFaq = (id: string) => {
    setExpandedFaq(prev => (prev === id ? null : id));
  };

  const handleSendTicket = () => {
    if (!subject.trim() || !message.trim()) {
      useToastStore.getState().show({
        type: 'error',
        title: 'Form Belum Lengkap',
        description: 'Mohon isi subjek dan deskripsi masalah.',
      });
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubject('');
      setMessage('');
      useToastStore.getState().show({
        type: 'success',
        title: 'Pesan Terkirim',
        description: 'Laporan masalah Anda telah terkirim ke Tim Pengembang.',
      });
    }, 600);
  };

  return (
    <View style={st.screen}>
      <DashboardHeader
        title="Pusat Bantuan"
        subtitle="Panduan operasional, status sistem, & bantuan teknis"
        showBack={false}
      />

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── STATUS SISTEM ── */}
        <Text style={st.sectionHeaderTitle}>Status Layanan & Sistem</Text>
        <View style={st.statusGrid}>
          {[
            { label: 'Backend API', status: 'Normal', color: '#10B981', icon: 'cloud-done' },
            { label: 'Database', status: 'Terhubung', color: '#10B981', icon: 'storage' },
            { label: 'Layanan Notifikasi', status: 'Aktif', color: '#10B981', icon: 'notifications-active' },
            { label: 'Penyimpanan Media', status: '98% Hemat', color: '#3B82F6', icon: 'folder-special' },
          ].map((item, idx) => (
            <View key={idx} style={[st.statusCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              <View style={[st.statusIconWrap, { backgroundColor: item.color + '15' }]}>
                <MaterialIcons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={st.statusCardInfo}>
                <Text style={[st.statusCardLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                <View style={st.statusRow}>
                  <View style={[st.statusDot, { backgroundColor: item.color }]} />
                  <Text style={[st.statusCardVal, { color: colors.text }]}>{item.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── SEARCH BAR PANDUAN ── */}
        <Text style={[st.sectionHeaderTitle, { marginTop: 22 }]}>Panduan Operasional & FAQ</Text>
        <View style={st.searchBox}>
          <MaterialIcons name="search" size={20} color={colors.primary} />
          <TextInput
            style={st.searchInput}
            placeholder="Cari panduan (misal: pengajuan owner, edit user)..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── FAQ ACCORDION ── */}
        <View style={st.faqList}>
          {filteredFaqs.length === 0 ? (
            <View style={[st.emptyFaq, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              <MaterialIcons name="search-off" size={32} color={colors.textTertiary} />
              <Text style={[st.emptyFaqTitle, { color: colors.text }]}>Panduan tidak ditemukan</Text>
              <Text style={[st.emptyFaqDesc, { color: colors.textSecondary }]}>Coba gunakan kata kunci pencarian yang lain.</Text>
            </View>
          ) : (
            filteredFaqs.map(faq => {
              const isOpen = expandedFaq === faq.id;
              return (
                <View key={faq.id} style={[st.faqCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
                  <TouchableOpacity
                    style={st.faqHeader}
                    onPress={() => toggleFaq(faq.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[st.faqCategoryIcon, { backgroundColor: colors.primaryContainer }]}>
                      <MaterialIcons name={faq.icon as any} size={18} color={colors.primary} />
                    </View>
                    <View style={st.faqHeaderTextWrap}>
                      <Text style={[st.faqCategoryTag, { color: colors.primary }]}>{faq.category}</Text>
                      <Text style={[st.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                    </View>
                    <MaterialIcons
                      name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                      size={22}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={[st.faqBody, { borderTopColor: colors.outline }]}>
                      <Text style={[st.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* ── FORM HUBUNGI DEVELOPER ── */}
        <Text style={[st.sectionHeaderTitle, { marginTop: 26 }]}>Hubungi Tim Pengembang</Text>
        <View style={[st.supportFormCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          <Text style={[st.formTitle, { color: colors.text }]}>Kirim Laporan Masalah / Ticket</Text>
          <Text style={[st.formSub, { color: colors.textSecondary }]}>Jika Anda mengalami kendala teknis sistem yang memerlukan penanganan tim pengembang.</Text>

          <View style={st.inputWrap}>
            <Text style={[st.inputLabel, { color: colors.textSecondary }]}>SUBJEK LAPORAN</Text>
            <TextInput
              style={[st.textInput, { backgroundColor: colors.bgElevated, borderColor: colors.outline, color: colors.text }]}
              placeholder="Contoh: Error saat generate laporan data..."
              placeholderTextColor={colors.textTertiary}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={st.inputWrap}>
            <Text style={[st.inputLabel, { color: colors.textSecondary }]}>PRIORITAS KENDALA</Text>
            <View style={st.priorityRow}>
              {[
                { key: 'low', label: 'Rendah', color: '#10B981' },
                { key: 'medium', label: 'Sedang', color: '#F59E0B' },
                { key: 'high', label: 'Tinggi (Urgent)', color: '#EF4444' },
              ].map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    st.priorityBtn,
                    { borderColor: colors.outline },
                    priority === item.key && { backgroundColor: item.color + '20', borderColor: item.color },
                  ]}
                  onPress={() => setPriority(item.key as any)}
                  activeOpacity={0.8}
                >
                  <View style={[st.priorityDot, { backgroundColor: item.color }]} />
                  <Text style={[st.priorityText, { color: priority === item.key ? item.color : colors.textSecondary }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={st.inputWrap}>
            <Text style={[st.inputLabel, { color: colors.textSecondary }]}>DESKRIPSI KENDALA</Text>
            <TextInput
              style={[st.textAreaInput, { backgroundColor: colors.bgElevated, borderColor: colors.outline, color: colors.text }]}
              placeholder="Tuliskan kronologi atau langkah-langkah kendala yang Anda alami..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <TouchableOpacity
            style={[st.sendTicketBtn, { backgroundColor: colors.primary }]}
            onPress={handleSendTicket}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <>
                <MaterialIcons name="send" size={17} color={colors.onPrimary} />
                <Text style={[st.sendTicketBtnText, { color: colors.onPrimary }]}>Kirim Laporan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, isMobile: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: {
    padding: SIZES.gutter,
    paddingBottom: 40,
    ...(isMobile ? {} : { maxWidth: 900, alignSelf: 'center', width: '100%' }),
  },
  sectionHeaderTitle: {
    ...FONTS.titleLg,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },

  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusCard: {
    flex: 1,
    minWidth: isMobile ? '47%' : 190,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    ...SHADOWS.xs,
  },
  statusIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCardInfo: { flex: 1 },
  statusCardLabel: { ...FONTS.labelSm, fontSize: 12, marginBottom: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusCardVal: { ...FONTS.titleSm, fontWeight: '700' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: colors.outline,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },

  faqList: { gap: 10 },
  faqCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.xs,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  faqCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqHeaderTextWrap: { flex: 1 },
  faqCategoryTag: { ...FONTS.labelSm, fontSize: 11, fontWeight: '800', marginBottom: 2 },
  faqQuestion: { ...FONTS.titleMd, fontSize: 14, fontWeight: '700' },
  faqBody: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  faqAnswer: { ...FONTS.bodyMd, fontSize: 13, lineHeight: 20 },

  emptyFaq: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  emptyFaqTitle: { ...FONTS.titleMd },
  emptyFaqDesc: { ...FONTS.bodySm },

  supportFormCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  formTitle: { ...FONTS.titleLg, fontSize: 17, fontWeight: '800', marginBottom: 4 },
  formSub: { ...FONTS.bodySm, marginBottom: 16, lineHeight: 18 },

  inputWrap: { marginBottom: 14 },
  inputLabel: { ...FONTS.labelSm, fontSize: 11, fontWeight: '800', marginBottom: 6, letterSpacing: 0.5 },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    fontSize: 14,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  priorityRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  priorityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { ...FONTS.labelSm, fontWeight: '600' },

  textAreaInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  sendTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 6,
  },
  sendTicketBtnText: { ...FONTS.titleSm, fontWeight: '800' },
});
