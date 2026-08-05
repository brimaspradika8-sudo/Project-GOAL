import { create } from 'zustand';
import { apiFetch } from '../lib/apiClient';

type AdminBadgeState = {
  ownerRequestsCount: number | undefined;
  pendingFieldsCount: number | undefined;
  setOwnerRequestsCount: (count: number | undefined) => void;
  setPendingFieldsCount: (count: number | undefined) => void;
  setBadges: (payload: { ownerRequestsCount?: number | undefined; pendingFieldsCount?: number | undefined }) => void;
};

export const useAdminBadgeStore = create<AdminBadgeState>((set) => ({
  ownerRequestsCount: undefined,
  pendingFieldsCount: undefined,
  setOwnerRequestsCount: (count) => set({ ownerRequestsCount: count }),
  setPendingFieldsCount: (count) => set({ pendingFieldsCount: count }),
  setBadges: (payload) => set((state) => ({
    ownerRequestsCount: payload.ownerRequestsCount ?? state.ownerRequestsCount,
    pendingFieldsCount: payload.pendingFieldsCount ?? state.pendingFieldsCount,
  })),
}));

export async function refreshAdminBadges({ isSuperAdmin = false }: { isSuperAdmin?: boolean } = {}) {
  try {
    let ownerRequestsCount: number | undefined = undefined;
    const reqRes = await apiFetch('/owner-requests/pending');
    if (reqRes.ok) {
      const reqData = await reqRes.json().catch(() => ({}));
      const count = (reqData?.data ?? []).length;
      ownerRequestsCount = count > 0 ? count : undefined;
    }

    let pendingFieldsCount: number | undefined = undefined;
    if (isSuperAdmin) {
      const fieldsRes = await apiFetch('/fields/pending/list');
      if (fieldsRes.ok) {
        const fieldsData = await fieldsRes.json().catch(() => ({}));
        const count = (fieldsData?.data ?? []).length;
        pendingFieldsCount = count > 0 ? count : undefined;
      }
    }

    useAdminBadgeStore.getState().setBadges({ ownerRequestsCount, pendingFieldsCount });
  } catch {
    useAdminBadgeStore.getState().setBadges({
      ownerRequestsCount: undefined,
      pendingFieldsCount: undefined,
    });
  }
}
