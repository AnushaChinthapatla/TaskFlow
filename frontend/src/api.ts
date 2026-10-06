import type { AuthResponse, Category, Task, TaskInput, TaskState, TaskStats, TaskFilters } from './types';

const TOKEN_KEY = 'taskflow_token';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Expired / invalid token while logged in -> force logout
  if (res.status === 401 && token) {
    onUnauthorized();
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }

  if (!res.ok) {
    let message = 'Something went wrong. Please try again.';
    try {
      const body = await res.json();
      if (body.errors) message = Object.values<string[]>(body.errors).flat().join(' ');
      else message = body.detail ?? body.title ?? message;
    } catch { /* non-JSON error body */ }
    throw new ApiError(message, res.status);
  }

  return res.status === 204 ? (undefined as T) : res.json();
}

const json = (body: unknown) => JSON.stringify(body);

export const api = {
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: json({ name, email, password }) }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: json({ email, password }) }),

  getTasks: (f: TaskFilters) => {
    const q = new URLSearchParams();
    if (f.search) q.set('search', f.search);
    if (f.categoryId) q.set('categoryId', f.categoryId);
    if (f.priority) q.set('priority', f.priority);
    q.set('sort', f.sort);
    return request<Task[]>(`/tasks?${q}`);
  },
  getStats: () => request<TaskStats>('/tasks/stats'),
  createTask: (t: TaskInput) => request<Task>('/tasks', { method: 'POST', body: json(t) }),
  updateTask: (id: number, t: TaskInput) => request<Task>(`/tasks/${id}`, { method: 'PUT', body: json(t) }),
  setStatus: (id: number, status: TaskState) =>
    request<Task>(`/tasks/${id}/status`, { method: 'PATCH', body: json({ status }) }),
  deleteTask: (id: number) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  getCategories: () => request<Category[]>('/categories'),
  createCategory: (name: string, color: string) =>
    request<Category>('/categories', { method: 'POST', body: json({ name, color }) }),
  deleteCategory: (id: number) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
};

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};
