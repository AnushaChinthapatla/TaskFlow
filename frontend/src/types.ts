export type TaskState = 'Todo' | 'InProgress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface User { id: number; name: string; email: string }
export interface AuthResponse { token: string; expiresAt: string; user: User }

export interface Category { id: number; name: string; color: string; taskCount: number }

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskState;
  priority: TaskPriority;
  dueDate: string | null; // yyyy-MM-dd
  isOverdue: boolean;
  createdAt: string;
  completedAt: string | null;
  categoryId: number | null;
}

export interface TaskInput {
  title: string;
  description: string | null;
  status: TaskState;
  priority: TaskPriority;
  dueDate: string | null;
  categoryId: number | null;
}

export interface TaskStats { total: number; todo: number; inProgress: number; done: number; overdue: number }

export interface TaskFilters { search: string; categoryId: string; priority: string; sort: string }
