import { create } from 'zustand';
import api from '../lib/api';
import type { Group, GroupTask, GroupInvitation, InviteResult } from '../lib/types';
import { GroupRole } from '../lib/types';

interface GroupState {
  groups: Group[];
  groupTasks: GroupTask[];
  myGroupTasks: GroupTask[];
  pendingInvitations: GroupInvitation[];
  loading: boolean;
  fetchGroups: () => Promise<void>;
  createGroup: (name: string, description?: string) => Promise<void>;
  addMember: (groupId: string, userId: string, role?: GroupRole) => Promise<void>;
  removeMember: (groupId: string, memberId: string) => Promise<void>;
  fetchGroupTasks: (groupId: string) => Promise<void>;
  createGroupTask: (groupId: string, task: any) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  inviteByEmail: (groupId: string, email: string) => Promise<InviteResult>;
  updateMemberRole: (groupId: string, memberId: string, role: GroupRole) => Promise<void>;
  updateGroupTask: (groupId: string, taskId: string, updates: any) => Promise<GroupTask>;
  deleteGroupTask: (groupId: string, taskId: string) => Promise<void>;
  fetchMyGroupTasks: (start: Date, end: Date) => Promise<void>;
  fetchMyInvitations: () => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  rejectInvitation: (invitationId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  groupTasks: [],
  myGroupTasks: [],
  pendingInvitations: [],
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

  inviteByEmail: async (groupId, email) => {
    const { data } = await api.post<InviteResult>(`/groups/${groupId}/invite`, { email });
    return data;
  },

  updateMemberRole: async (groupId, memberId, role) => {
    await api.put(`/groups/${groupId}/members/${memberId}/role`, { role });
  },

  updateGroupTask: async (groupId, taskId, updates) => {
    const { data } = await api.put<GroupTask>(`/groups/${groupId}/tasks/${taskId}`, updates);
    set((s) => ({
      groupTasks: s.groupTasks.map((t) => (t.id === taskId ? data : t)),
      myGroupTasks: s.myGroupTasks.map((t) => (t.id === taskId ? data : t)),
    }));
    return data;
  },

  deleteGroupTask: async (groupId, taskId) => {
    await api.delete(`/groups/${groupId}/tasks/${taskId}`);
    set((s) => ({
      groupTasks: s.groupTasks.filter((t) => t.id !== taskId),
      myGroupTasks: s.myGroupTasks.filter((t) => t.id !== taskId),
    }));
  },

  fetchMyGroupTasks: async (start, end) => {
    const { data } = await api.get<GroupTask[]>('/groups/my-tasks', {
      params: { start: start.toISOString(), end: end.toISOString() },
    });
    set({ myGroupTasks: data });
  },

  fetchMyInvitations: async () => {
    const { data } = await api.get<GroupInvitation[]>('/groups/my-invitations');
    set({ pendingInvitations: data });
  },

  acceptInvitation: async (invitationId) => {
    await api.post(`/groups/invitations/${invitationId}/accept`);
    set((s) => ({
      pendingInvitations: s.pendingInvitations.filter((i) => i.id !== invitationId),
    }));
  },

  rejectInvitation: async (invitationId) => {
    await api.post(`/groups/invitations/${invitationId}/reject`);
    set((s) => ({
      pendingInvitations: s.pendingInvitations.filter((i) => i.id !== invitationId),
    }));
  },

  leaveGroup: async (groupId) => {
    await api.post(`/groups/${groupId}/leave`);
    set((s) => ({
      groups: s.groups.filter((g) => g.id !== groupId),
      myGroupTasks: s.myGroupTasks.filter((t) => t.groupId !== groupId),
    }));
  },
}));
