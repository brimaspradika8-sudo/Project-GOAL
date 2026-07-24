import { create } from 'zustand';
import * as SecureStore from '../lib/secureStorage';
import { TOKEN_KEY } from '../app/_layout';
import { API_BASE_URL } from '../lib/api';

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
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      useAdminBadgeStore.getState().setBadges({
        ownerRequestsCount: undefined,
        pendingFieldsCount: undefined,
      });
      return;
    }

    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    } as const;

    let ownerRequestsCount: number | undefined = undefined;
    const reqRes = await fetch(`${API_BASE_URL}/owner-requests/pending`, { headers });
    if (reqRes.ok) {
      const reqData = await reqRes.json().catch(() => ({}));
      const count = (reqData?.data ?? []).length;
      ownerRequestsCount = count > 0 ? count : undefined;
    }

    let pendingFieldsCount: number | undefined = undefined;
    if (isSuperAdmin) {
      const fieldsRes = await fetch(`${API_BASE_URL}/fields/pending/list`, { headers });
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
