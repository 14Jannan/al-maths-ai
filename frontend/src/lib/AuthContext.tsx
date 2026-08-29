import { useState, useCallback, type ReactNode } from 'react';
import { apiFetch, setToken, clearToken, getToken } from './api';
import { getRoleFromToken } from './jwt';
import { AuthContext, type AuthContextValue } from './auth-context';

interface AuthResponse {
  token: string;
  email: string;
}

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