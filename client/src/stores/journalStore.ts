import { create } from 'zustand';
import api from '../lib/api';
import type { JournalEntry } from '../lib/types';

interface JournalState {
  entries: JournalEntry[];
  loading: boolean;
  fetchEntries: () => Promise<void>;
  fetchByMonth: (year: number, month: number) => Promise<void>;
  createEntry: (content: string, date: string, mood?: string) => Promise<void>;
  updateEntry: (id: string, content?: string, mood?: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useJournalStore = create<JournalState>((set) => ({
  entries: [],
  loading: false,

  fetchEntries: async () => {
    set({ loading: true });
    const { data } = await api.get<JournalEntry[]>('/journal');
    set({ entries: data, loading: false });
  },

  fetchByMonth: async (year, month) => {
    set({ loading: true });
    const { data } = await api.get<JournalEntry[]>(`/journal/month/${year}/${month}`);
    set({ entries: data, loading: false });
  },

  createEntry: async (content, date, mood) => {
    const { data } = await api.post<JournalEntry>('/journal', { content, date, mood });
    set((s) => ({ entries: [data, ...s.entries] }));
  },

  updateEntry: async (id, content, mood) => {
    const { data } = await api.put<JournalEntry>(`/journal/${id}`, { content, mood });
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? data : e)) }));
  },

  deleteEntry: async (id) => {
    await api.delete(`/journal/${id}`);
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
  },
}));
