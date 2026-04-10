import { create } from 'zustand';
import api from '../lib/api';
import type { Countdown } from '../lib/types';

interface CountdownState {
  countdowns: Countdown[];
  loading: boolean;
  fetchCountdowns: () => Promise<void>;
  fetchActive: () => Promise<void>;
  createCountdown: (title: string, targetDate: string) => Promise<void>;
  toggleCountdown: (id: string) => Promise<void>;
  deleteCountdown: (id: string) => Promise<void>;
}

export const useCountdownStore = create<CountdownState>((set) => ({
  countdowns: [],
  loading: false,

  fetchCountdowns: async () => {
    set({ loading: true });
    const { data } = await api.get<Countdown[]>('/countdowns');
    set({ countdowns: data, loading: false });
  },

  fetchActive: async () => {
    const { data } = await api.get<Countdown[]>('/countdowns/active');
    set({ countdowns: data });
  },

  createCountdown: async (title, targetDate) => {
    const { data } = await api.post<Countdown>('/countdowns', { title, targetDate });
    set((s) => ({ countdowns: [...s.countdowns, data] }));
  },

  toggleCountdown: async (id) => {
    await api.put(`/countdowns/${id}/toggle`);
    set((s) => ({ countdowns: s.countdowns.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)) }));
  },

  deleteCountdown: async (id) => {
    await api.delete(`/countdowns/${id}`);
    set((s) => ({ countdowns: s.countdowns.filter((c) => c.id !== id) }));
  },
}));
