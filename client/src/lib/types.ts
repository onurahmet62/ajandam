export enum Priority {
  Dusuk = 0,
  Orta = 1,
  Yuksek = 2,
  Acil = 3,
}

export enum TodoStatus {
  Planlandi = 0,
  Yapildi = 1,
  Ertelendi = 2,
  IptalEdildi = 3,
}

export enum RecurrenceType {
  None = 0,
  Daily = 1,
  Weekly = 2,
  Monthly = 3,
  Yearly = 4,
  Custom = 5,
}

export enum GroupRole {
  Admin = 0,
  Member = 1,
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  themeColor: string;
}

export interface AuthResponse {
  userId: string;
  fullName: string;
  email: string;
  token: string;
  themeColor: string;
}

export interface TodoTask {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TodoStatus;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  recurrenceType: RecurrenceType;
  recurrenceInterval: number;
  recurrenceEndDate?: string;
  parentTaskId?: string;
  tags: Tag[];
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  date: string;
  mood?: string;
  createdAt: string;
}

export interface Countdown {
  id: string;
  title: string;
  targetDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: GroupMember[];
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  fullName: string;
  email: string;
  role: GroupRole;
}

export interface GroupTask {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TodoStatus;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  assignedToUserId?: string;
  assignedToUserName?: string;
  createdByUserId: string;
  createdAt: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  title: string;
  description?: string;
  priority: Priority;
  defaultTags?: string;
  createdAt: string;
}

export const PriorityLabels: Record<Priority, string> = {
  [Priority.Dusuk]: 'Düşük',
  [Priority.Orta]: 'Orta',
  [Priority.Yuksek]: 'Yüksek',
  [Priority.Acil]: 'Acil',
};

export const PriorityColors: Record<Priority, string> = {
  [Priority.Dusuk]: '#B5EAD7',
  [Priority.Orta]: '#A7C7E7',
  [Priority.Yuksek]: '#FFDAB9',
  [Priority.Acil]: '#FFB5A7',
};

export const StatusLabels: Record<TodoStatus, string> = {
  [TodoStatus.Planlandi]: 'Planlandı',
  [TodoStatus.Yapildi]: 'Yapıldı',
  [TodoStatus.Ertelendi]: 'Ertelendi',
  [TodoStatus.IptalEdildi]: 'İptal Edildi',
};
