import { create } from 'zustand';
import api from '../lib/api';
import type { TodoTask, Tag } from '../lib/types';
import type { Priority, TodoStatus, RecurrenceType } from '../lib/types';

interface TaskState {
  tasks: TodoTask[];
  tags: Tag[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  fetchTasksByRange: (start: Date, end: Date) => Promise<void>;
  createTask: (task: {
    title: string; description?: string; priority: Priority;
    dueDate?: string; startDate?: string; endDate?: string;
    recurrenceType?: RecurrenceType; recurrenceInterval?: number; recurrenceEndDate?: string;
    tagIds?: string[];
  }) => Promise<TodoTask>;
  updateTask: (id: string, updates: {
    title?: string; description?: string; priority?: Priority; status?: TodoStatus;
    dueDate?: string; startDate?: string; endDate?: string; tagIds?: string[];
  }) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  rescheduleTask: (id: string, startDate?: string, endDate?: string, dueDate?: string) => Promise<void>;
  searchTasks: (query: string) => Promise<TodoTask[]>;
  fetchTags: () => Promise<void>;
  createTag: (name: string, color: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  tags: [],
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    const { data } = await api.get<TodoTask[]>('/tasks');
    set({ tasks: data, loading: false });
  },

  fetchTasksByRange: async (start, end) => {
    set({ loading: true });
    const { data } = await api.get<TodoTask[]>('/tasks/range', { params: { start: start.toISOString(), end: end.toISOString() } });
    set({ tasks: data, loading: false });
  },

  createTask: async (task) => {
    const { data } = await api.post<TodoTask>('/tasks', task);
    set((s) => ({ tasks: [data, ...s.tasks] }));
    return data;
  },

  updateTask: async (id, updates) => {
    const { data } = await api.put<TodoTask>(`/tasks/${id}`, updates);
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? data : t)) }));
  },

  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  rescheduleTask: async (id, startDate, endDate, dueDate) => {
    const { data } = await api.put<TodoTask>(`/tasks/${id}/reschedule`, { startDate, endDate, dueDate });
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? data : t)) }));
  },

  searchTasks: async (query) => {
    const { data } = await api.get<TodoTask[]>('/tasks/search', { params: { q: query } });
    return data;
  },

  fetchTags: async () => {
    const { data } = await api.get<Tag[]>('/tags');
    set({ tags: data });
  },

  createTag: async (name, color) => {
    const { data } = await api.post<Tag>('/tags', { name, color });
    set((s) => ({ tags: [...s.tags, data] }));
    return data;
  },

  deleteTag: async (id) => {
    await api.delete(`/tags/${id}`);
    set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }));
  },
}));
