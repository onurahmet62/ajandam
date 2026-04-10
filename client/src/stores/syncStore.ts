import { create } from 'zustand';
import api from '../lib/api';

interface SyncState {
  syncEnabled: boolean;
  isOnline: boolean;
  lastSyncedAt: string | null;
  fetchStatus: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => ({
  syncEnabled: false,
  isOnline: false,
  lastSyncedAt: null,

  fetchStatus: async () => {
    try {
      const { data } = await api.get('/sync-status');
      set({
        syncEnabled: data.syncEnabled,
        isOnline: data.isOnline,
        lastSyncedAt: data.lastSyncedAt,
      });
    } catch {
      set({ isOnline: false });
    }
  },
}));
