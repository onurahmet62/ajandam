import { create } from 'zustand';
import api from '../lib/api';
import type { Group, GroupTask } from '../lib/types';
import { GroupRole } from '../lib/types';

interface GroupState {
  groups: Group[];
  groupTasks: GroupTask[];
  loading: boolean;
  fetchGroups: () => Promise<void>;
  createGroup: (name: string, description?: string) => Promise<void>;
  addMember: (groupId: string, userId: string, role?: GroupRole) => Promise<void>;
  removeMember: (groupId: string, memberId: string) => Promise<void>;
  fetchGroupTasks: (groupId: string) => Promise<void>;
  createGroupTask: (groupId: string, task: any) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  groupTasks: [],
  loading: false,

  fetchGroups: async () => {
    set({ loading: true });
    const { data } = await api.get<Group[]>('/groups');
    set({ groups: data, loading: false });
  },

  createGroup: async (name, description) => {
    const { data } = await api.post<Group>('/groups', { name, description });
    set((s) => ({ groups: [...s.groups, data] }));
  },

  addMember: async (groupId, userId, role = GroupRole.Member) => {
    await api.post(`/groups/${groupId}/members`, { userId, role });
  },

  removeMember: async (groupId, memberId) => {
    await api.delete(`/groups/${groupId}/members/${memberId}`);
  },

  fetchGroupTasks: async (groupId) => {
    const { data } = await api.get<GroupTask[]>(`/groups/${groupId}/tasks`);
    set({ groupTasks: data });
  },

  createGroupTask: async (groupId, task) => {
    const { data } = await api.post<GroupTask>(`/groups/${groupId}/tasks`, task);
    set((s) => ({ groupTasks: [data, ...s.groupTasks] }));
  },

  deleteGroup: async (groupId) => {
    await api.delete(`/groups/${groupId}`);
    set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) }));
  },
}));
