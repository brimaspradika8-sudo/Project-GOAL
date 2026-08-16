import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SHADOWS, FONT_FAMILY } from '../../components/goalTheme';
import { FadeInView } from '../../components/FadeInView';
import { useTheme } from '../../lib/theme';
import { useIsMobileWeb } from '../../lib/responsive';
import { useBookingHistory } from '../../hooks/useBooking';
import { cancelBooking, type Booking, type BookingStatus } from '../../services/bookingService';
import { BookingCard, formatDateDisplay, isCancelableBooking } from '../../components/booking';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import BulkActionBar from '../../components/shared/BulkActionBar';
import { useToastStore } from '../../store/toastStore';

// ─── Constants ────────────────────────────────────────────────────────────────

type TabKey = 'aktif' | 'riwayat';

const ACTIVE_STATUSES: BookingStatus[] = ['WAITING_CONFIRMATION', 'CONFIRMED'];
const PAST_STATUSES: BookingStatus[] = ['COMPLETED', 'CANCELLED', 'REJECTED'];

const CANCEL_REASON = 'Dibatalkan oleh pengguna';

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab, colors }: { tab: TabKey, colors: any }) {
  const emptySt = makeEmptySt(colors);
  const isActive = tab === 'aktif';
  return (
    <FadeInView>
      <View style={emptySt.container}>
        <View style={emptySt.iconWrap}>
          <MaterialIcons
            name={isActive ? 'event-busy' : 'history'}
            size={52}
            color={colors.primary}
          />
        </View>
        <Text style={emptySt.title}>
          {isActive ? 'Belum ada booking aktif' : 'Belum ada riwayat booking'}
        </Text>
        <Text style={emptySt.subtitle}>
          {isActive
            ? 'Yuk cari lapangan dan mulai bermain!'
            : 'Semua riwayat booking kamu akan muncul di sini.'}
        </Text>
        {isActive && (
          <TouchableOpacity
            style={emptySt.btn}
            onPress={() => router.push('/(tabs)/fields')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="search" size={16} color={colors.onPrimary} />
            <Text style={emptySt.btnText}>Cari Lapangan</Text>
          </TouchableOpacity>
        )}
      </View>
    </FadeInView>
  );
}

const makeEmptySt = (colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  btnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BookingTabScreen() {
  const { colors, resolved } = useTheme();
  const st = makeStyles(colors, resolved);
  const isMobile = useIsMobileWeb();
  const { bookings, loading, refreshing, error, refresh } = useBookingHistory();
  const showToast = useToastStore((s) => s.show);
  const [activeTab, setActiveTab] = useState<TabKey>('aktif');
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmTarget, setConfirmTarget] = useState<Booking | null>(null);
  const [bulkCancel, setBulkCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  const upcoming = bookings.filter(b => ACTIVE_STATUSES.includes(b.status));
  const history = bookings.filter(b => PAST_STATUSES.includes(b.status));
  const displayed = activeTab === 'aktif' ? upcoming : history;
  const isHistoryTab = activeTab === 'riwayat';
  const selectableIds = isHistoryTab ? history.map(b => b.id) : [];
  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedIds.has(id));

  function navigateToBooking(b: Booking) {
    if (selecting) return;
    if (!b || !b.id) {
      showToast({ type: 'error', title: 'Error Navigasi', description: 'ID booking tidak valid.' });
      return;
    }
    router.push({ pathname: '/booking-detail/[id]', params: { id: String(b.id), booking_id: String(b.id) } });
  }

  function enterSelect() {
    if (!isHistoryTab) return;
    setSelecting(true);
    setSelectedIds(new Set());
  }

  function exitSelect() {
    setSelecting(false);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: number) {
    if (!isHistoryTab) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!isHistoryTab) return;
    setSelectedIds(allSelected ? new Set() : new Set(selectableIds));
  }

  function openSingleCancel(b: Booking) {
    setConfirmTarget(b);
  }

  function openBulkCancel() {
    setBulkCancel(true);
  }

  async function performCancel(ids: number[]) {
    setCancelling(true);
    try {
      if (ids.length > 1) {
        const res = await bulkDeleteBookings(ids);
        showToast({
          type: 'success',
          title: 'Booking Dihapus',
          description: `${res.data?.deleted_count || ids.length} booking berhasil dihapus dari riwayat.`,
        });
      } else if (ids.length === 1) {
        await cancelBooking(ids[0], CANCEL_REASON);
        showToast({
          type: 'success',
          title: 'Booking Dibatalkan',
          description: 'Booking berhasil dibatalkan.',
        });
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Booking',
        description: e?.message || 'Terjadi kesalahan saat menghapus booking.',
      });
    } finally {
      setCancelling(false);
      setConfirmTarget(null);
      setBulkCancel(false);
      exitSelect();
      await refresh();
    }
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    if (selecting) exitSelect();
  }

  const hasSelectable = isHistoryTab && history.length > 0;

  return (
    <View style={[st.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* ── Header ── */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <Text style={st.headerTitle}>My Booking</Text>
          <Text style={st.headerSubtitle}>Lihat dan kelola semua booking kamu</Text>
        </View>
        {selecting && isHistoryTab ? (
          <TouchableOpacity
            style={st.headerSelectBtn}
            onPress={exitSelect}
            activeOpacity={0.85}
          >
            <MaterialIcons name="close" size={18} color={colors.primary} />
            <Text style={st.headerSelectBtnText}>Batal</Text>
          </TouchableOpacity>
        ) : (
          <>
            {hasSelectable && (
              <TouchableOpacity
                style={st.headerSelectBtn}
                onPress={enterSelect}
                activeOpacity={0.85}
              >
                <MaterialIcons name="checklist" size={18} color={colors.primary} />
                <Text style={st.headerSelectBtnText}>Pilih</Text>
              </TouchableOpacity>
            )}
            {!hasSelectable && !(displayed.length === 0 && activeTab === 'aktif') && (
              <TouchableOpacity
                style={st.headerCta}
                onPress={() => router.push('/(tabs)/fields')}
                activeOpacity={0.85}
              >
                <MaterialIcons name="add" size={18} color={colors.onPrimary} />
                <Text style={st.headerCtaText}>Cari Lapangan</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* ── Tab Bar ── */}
      <View style={st.tabBarOuter}>
        <View style={[
          st.tabBarConstraint,
          !isMobile && { maxWidth: 1200, alignSelf: 'center', width: '100%' },
        ]}>
          <View style={st.tabBarInner}>
            {(['aktif', 'riwayat'] as TabKey[]).map(tab => {
              const isActive = activeTab === tab;
              const count = tab === 'aktif' ? upcoming.length : history.length;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[st.tabBtn, isActive && st.tabBtnActive]}
                  onPress={() => handleTabChange(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[st.tabLabel, isActive && st.tabLabelActive]}>
                    {tab === 'aktif' ? 'Aktif' : 'Riwayat'}
                  </Text>
                  {count > 0 && (
                    <View style={[st.tabBadge, isActive ? st.tabBadgeActive : st.tabBadgeInactive]}>
                      <Text style={[st.tabBadgeText, isActive ? { color: colors.primary } : { color: colors.textSecondary }]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── Bulk Action Bar (selection mode) ── */}
      <BulkActionBar
        count={selectedIds.size}
        allSelected={allSelected}
        onSelectAll={toggleSelectAll}
        onClear={exitSelect}
        loading={cancelling}
        actions={[{
          label: 'Batalkan',
          icon: 'close',
          color: colors.error,
          onPress: openBulkCancel,
        }]}
      />

      {/* ── Content ── */}
      {loading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[st.loadingText, { color: colors.textSecondary }]}>Memuat booking...</Text>
        </View>
      ) : error ? (
        <View style={st.center}>
          <View style={st.errorIconWrap}>
            <MaterialIcons name="wifi-off" size={40} color={colors.error} />
          </View>
          <Text style={st.errorTitle}>Gagal memuat data</Text>
          <Text style={[st.errorMsg, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={st.retryBtn} onPress={refresh} activeOpacity={0.85}>
            <MaterialIcons name="refresh" size={16} color={colors.onPrimary} />
            <Text style={st.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            st.scrollContent,
            !isMobile && { maxWidth: 1200, alignSelf: 'center', width: '100%' },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {selecting && hasCancelable && (
            <Text style={[st.selectHint, { color: colors.textSecondary }]}>
              Ketuk booking untuk memilih. Hanya booking berstatus Menunggu Konfirmasi yang dapat dipilih.
            </Text>
          )}

          {displayed.length === 0 ? (
            <EmptyState tab={activeTab} colors={colors} />
          ) : (
            <FadeInView>
              {displayed.map((b, i) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onPress={() => navigateToBooking(b)}
                  selectable={selecting}
                  selected={selectedIds.has(b.id)}
                  onToggleSelect={() => toggleSelect(b.id)}
                  onCancel={() => openSingleCancel(b)}
                />
              ))}
            </FadeInView>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* ── Floating CTA (mobile only) ── */}
      {isMobile && !loading && !error && !selecting && displayed.length > 0 && (
        <View style={st.floatingWrap} pointerEvents="box-none">
          <TouchableOpacity
            style={st.floatingBtn}
            onPress={() => router.push('/(tabs)/fields')}
            activeOpacity={0.9}
          >
            <MaterialIcons name="search" size={20} color={colors.onPrimary} />
            <Text style={st.floatingBtnText}>+ Cari Lapangan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Single cancel confirm ── */}
      <ConfirmDialog
        visible={!!confirmTarget}
        title="Batalkan Booking?"
        description={confirmTarget
          ? `${confirmTarget.field?.name ?? `Lapangan #${confirmTarget.field_id}`} — ${formatDateDisplay(confirmTarget.booking_date)}, ${confirmTarget.start_time} – ${confirmTarget.end_time}`
          : undefined}
        destructive
        confirmLabel="Ya, Batalkan"
        loading={cancelling}
        onConfirm={() => confirmTarget && performCancel([confirmTarget.id])}
        onCancel={() => { if (!cancelling) setConfirmTarget(null); }}
      />

      {/* ── Bulk cancel confirm ── */}
      <ConfirmDialog
        visible={bulkCancel}
        title={`Batalkan ${selectedIds.size} Booking?`}
        description="Booking terpilih akan dibatalkan sekaligus. Tindakan ini tidak dapat dibatalkan."
        destructive
        confirmLabel="Ya, Batalkan"
        loading={cancelling}
        onConfirm={() => performCancel([...selectedIds])}
        onCancel={() => { if (!cancelling) setBulkCancel(false); }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: any, resolved: any) => StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  headerLeft: { gap: 2 },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  headerCtaText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  headerSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  headerSelectBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // Tab bar
  tabBarOuter: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  tabBarConstraint: {},
  tabBarInner: {
    flexDirection: 'row',
    backgroundColor: resolved === 'dark' ? colors.outline : colors.surfaceContainer,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    ...SHADOWS.sm,
  },
  tabLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.onPrimary,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeInactive: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  tabBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  selectHint: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 14,
    paddingHorizontal: 4,
  },

  // States
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 32,
  },
  loadingText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  errorTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  errorMsg: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 4,
  },
  retryText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimary,
  },

  // Floating button
  floatingWrap: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 50,
    ...SHADOWS.lg,
  },
  floatingBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
