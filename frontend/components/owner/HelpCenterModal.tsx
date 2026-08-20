import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Modal, Pressable
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useProfileStore } from '../../store/profileStore';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useToastStore } from '../../store/toastStore';
import { useTheme } from '../../lib/theme';
import { useIsMobileWeb } from '../../lib/responsive';
import { logout } from '../../lib/session';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    question: 'Bagaimana cara menambahkan atau mengedit lapangan?',
    answer: 'Anda dapat mengelola lapangan Anda di menu "Kelola Lapangan". Tekan tombol "Tambah Lapangan" atau pilih tombol edit pada lapangan yang terdaftar.',
  },
  {
    question: 'Bagaimana proses konfirmasi booking dari pelanggan?',
    answer: 'Setiap pesanan baru akan masuk di halaman "Kelola Booking". Anda dapat memeriksa bukti pembayaran lalu menekan tombol Setujui / Tolak.',
  },
  {
    question: 'Bagaimana cara mengatur slot waktu & harga sewa?',
    answer: 'Buka menu "Booking Settings" untuk menyesuaikan jam operasional, durasi slot, dan skema harga khusus pada hari libur atau akhir pekan.',
  },
  {
    question: 'Kapan dana pendapatan sewa lapangan dicairkan?',
    answer: 'Pendapatan yang terkumpul dapat dipantau pada menu "Kelola Pendapatan" dan dikirimkan otomatis ke rekening Anda sesuai jadwal pencairan harian/mingguan.',
  },
];

export default function HelpCenterModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, resolved } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleContactWhatsApp = () => {
    Linking.openURL('https://wa.me/6281234567890?text=Halo%20Admin%20GOAL,%20saya%20Owner%20butuh%20bantuan').catch(() => {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: 'Tidat dapat membuka WhatsApp.' });
    });
  };

  const handleSendEmail = () => {
    Linking.openURL('mailto:support@goalapp.id?subject=Bantuan%20Owner%20GOAL').catch(() => {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: 'Tidak dapat membuka aplikasi email.' });
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={helpStyles.overlay}>
        <View style={[helpStyles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[helpStyles.header, { borderBottomColor: colors.outline }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[helpStyles.headerIconBox, { backgroundColor: colors.primaryContainer }]}>
                <MaterialIcons name="help-center" size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={[helpStyles.title, { color: colors.text }]}>Pusat Bantuan Owner</Text>
                <Text style={[helpStyles.subtitle, { color: colors.textSecondary }]}>FAQ & Layanan Dukungan GOAL</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[helpStyles.closeBtn, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialIcons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={helpStyles.content} showsVerticalScrollIndicator={false}>
            {/* Direct Support Contact Banner */}
            <Text style={[helpStyles.sectionTitle, { color: colors.textSecondary }]}>HUBUNGI KAMI</Text>
            <View style={helpStyles.contactGrid}>
              <TouchableOpacity
                style={[helpStyles.contactCard, { backgroundColor: resolved === 'dark' ? '#0d3822' : '#e8f8f0', borderColor: colors.primary + '40' }]}
                onPress={handleContactWhatsApp}
                activeOpacity={0.8}
              >
                <View style={[helpStyles.contactIconBox, { backgroundColor: colors.primary }]}>
                  <MaterialIcons name="chat" size={22} color="#fff" />
                </View>
                <Text style={[helpStyles.contactTitle, { color: colors.text }]}>WhatsApp Live Support</Text>
                <Text style={[helpStyles.contactSub, { color: colors.textSecondary }]}>Respon cepat (08:00 - 22:00)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[helpStyles.contactCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}
                onPress={handleSendEmail}
                activeOpacity={0.8}
              >
                <View style={[helpStyles.contactIconBox, { backgroundColor: colors.primaryContainer }]}>
                  <MaterialIcons name="email" size={22} color={colors.primary} />
                </View>
                <Text style={[helpStyles.contactTitle, { color: colors.text }]}>Email Support</Text>
                <Text style={[helpStyles.contactSub, { color: colors.textSecondary }]}>support@goalapp.id</Text>
              </TouchableOpacity>
            </View>

            {/* FAQ Section */}
            <Text style={[helpStyles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>PERTANYAAN POPULER (FAQ)</Text>
            <View style={[helpStyles.faqCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              {FAQ_LIST.map((faq, idx) => {
                const isOpen = expandedIndex === idx;
                return (
                  <View key={idx}>
                    <TouchableOpacity
                      style={helpStyles.faqHeader}
                      onPress={() => toggleFAQ(idx)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="quiz" size={18} color={colors.primary} style={{ marginTop: 2 }} />
                      <Text style={[helpStyles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                      <MaterialIcons
                        name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                        size={22}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={[helpStyles.faqBody, { backgroundColor: resolved === 'dark' ? colors.surfaceContainerHigh : colors.surfaceContainerLow }]}>
                        <Text style={[helpStyles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
                      </View>
                    )}
                    {idx < FAQ_LIST.length - 1 && <View style={[helpStyles.divider, { backgroundColor: colors.outline }]} />}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const helpStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '60%',
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...FONTS.headlineSm,
    fontWeight: '700',
  },
  subtitle: {
    ...FONTS.bodySm,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    ...FONTS.labelSm,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontWeight: '700',
  },
  contactGrid: {
    gap: 12,
  },
  contactCard: {
    flexDirection: 'column',
    padding: 16,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    gap: 6,
  },
  contactIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactTitle: {
    ...FONTS.bodyMd,
    fontWeight: '700',
  },
  contactSub: {
    ...FONTS.bodySm,
  },
  faqCard: {
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    ...FONTS.bodyMd,
    fontWeight: '600',
    lineHeight: 22,
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: SIZES.borderRadius,
  },
  faqAnswer: {
    ...FONTS.bodySm,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
});
