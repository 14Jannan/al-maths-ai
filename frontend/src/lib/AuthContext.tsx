import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { apiFetch, setToken, clearToken, getToken } from './api';
import { getRoleFromToken } from './jwt';

interface AuthResponse {
  token: string;
  email: string;
}

interface AuthContextValue {
  email: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function computeIsAdmin(token: string | null): boolean {
  if (!token) return false;
  const role = getRoleFromToken(token);
  if (Array.isArray(role)) return role.includes('Admin');
  return role === 'Admin';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(
    localStorage.getItem('al_maths_ai_email')
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(computeIsAdmin(getToken()));

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<AuthResponse>('/api/Auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(result.token);
    localStorage.setItem('al_maths_ai_email', result.email);
    setEmail(result.email);
    setIsAdmin(computeIsAdmin(result.token));
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<AuthResponse>('/api/Auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(result.token);
    localStorage.setItem('al_maths_ai_email', result.email);
    setEmail(result.email);
    setIsAdmin(computeIsAdmin(result.token));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem('al_maths_ai_email');
    setEmail(null);
    setIsAdmin(false);
  }, []);

  const value: AuthContextValue = {
    email,
    isLoggedIn: Boolean(getToken()),
    isAdmin,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}