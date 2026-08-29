import { useState, useCallback, type ReactNode } from 'react';
import { apiFetch, setToken, clearToken, getToken } from './api';
import { AuthContext } from './authContext';
import type { AuthContextValue } from './useAuth';

interface AuthResponse {
  token: string;
  email: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // We don't decode the JWT here for simplicity — we just remember the email
  // the user logged in with, for display purposes. The real "am I logged in"
  // check is: do we have a token?
  const [email, setEmail] = useState<string | null>(
    localStorage.getItem('al_maths_ai_email')
  );

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<AuthResponse>('/api/Auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(result.token);
    localStorage.setItem('al_maths_ai_email', result.email);
    setEmail(result.email);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<AuthResponse>('/api/Auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(result.token);
    localStorage.setItem('al_maths_ai_email', result.email);
    setEmail(result.email);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem('al_maths_ai_email');
    setEmail(null);
  }, []);

  const value: AuthContextValue = {
    email,
    isLoggedIn: Boolean(getToken()),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
