import { create } from 'zustand';
import api from '../lib/api';
import type { Note } from '../lib/types';

interface NoteState {
  notes: Note[];
  loading: boolean;
  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string, date: string) => Promise<void>;
  updateNote: (id: string, title?: string, content?: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  loading: false,

  fetchNotes: async () => {
    set({ loading: true });
    const { data } = await api.get<Note[]>('/notes');
    set({ notes: data, loading: false });
  },

  createNote: async (title, content, date) => {
    const { data } = await api.post<Note>('/notes', { title, content, date });
    set((s) => ({ notes: [data, ...s.notes] }));
  },

  updateNote: async (id, title, content) => {
    const { data } = await api.put<Note>(`/notes/${id}`, { title, content });
    set((s) => ({ notes: s.notes.map((n) => (n.id === id ? data : n)) }));
  },

  deleteNote: async (id) => {
    await api.delete(`/notes/${id}`);
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
  },
}));
