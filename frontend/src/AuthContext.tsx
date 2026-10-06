import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from './api';
import type { AuthResponse, User } from './types';

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const USER_KEY = 'taskflow_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw && tokenStore.get() ? (JSON.parse(raw) as User) : null;
  });

  const logout = useCallback(() => {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  const persist = (res: AuthResponse) => {
    tokenStore.set(res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
  };

  const value = useMemo<AuthState>(() => ({
    user,
    logout,
    login: async (email, password) => persist(await api.login(email, password)),
    register: async (name, email, password) => persist(await api.register(name, email, password)),
  }), [user, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
