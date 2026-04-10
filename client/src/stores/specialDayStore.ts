import { create } from 'zustand';
import api from '../lib/api';
import type { SpecialDay } from '../lib/types';

interface SpecialDayState {
  specialDays: SpecialDay[];
  loading: boolean;
  fetchAll: () => Promise<void>;
  fetchByRange: (start: Date, end: Date) => Promise<void>;
  create: (data: { title: string; date: string; isYearly?: boolean; color?: string }) => Promise<void>;
  update: (id: string, data: { title?: string; date?: string; isYearly?: boolean; color?: string }) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useSpecialDayStore = create<SpecialDayState>((set) => ({
  specialDays: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    const res = await api.get('/special-days');
    set({ specialDays: res.data, loading: false });
  },

  fetchByRange: async (start, end) => {
    set({ loading: true });
    const res = await api.get('/special-days/range', {
      params: { start: start.toISOString(), end: end.toISOString() },
    });
    set({ specialDays: res.data, loading: false });
  },

  create: async (data) => {
    await api.post('/special-days', data);
    const res = await api.get('/special-days');
    set({ specialDays: res.data });
  },

  update: async (id, data) => {
    await api.put(`/special-days/${id}`, data);
    const res = await api.get('/special-days');
    set({ specialDays: res.data });
  },

  remove: async (id) => {
    await api.delete(`/special-days/${id}`);
    set((s) => ({ specialDays: s.specialDays.filter((d) => d.id !== id) }));
  },
}));
