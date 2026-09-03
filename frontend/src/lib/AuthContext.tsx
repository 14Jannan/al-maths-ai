import { useState, useCallback, type ReactNode } from 'react';
import { apiFetch, setToken, clearToken, getToken } from './api';
import { getRoleFromToken } from './jwt';
import { AuthContext, type AuthContextValue } from './auth-context';

// This is the shape of what the backend actually returns from
// login/verify-otp — just the token and email. Nothing else belongs here;
// register/verifyOtp/etc are Context functions, not API response fields.
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

  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    const result = await apiFetch<AuthResponse>('/api/Auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
    setToken(result.token);
    localStorage.setItem('al_maths_ai_email', result.email);
    setEmail(result.email);
    setIsAdmin(computeIsAdmin(result.token));
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    // Registration no longer returns a token directly — the account exists
    // but is unverified until the OTP step completes.
    await apiFetch<{ email: string; message: string }>('/api/Auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    const result = await apiFetch<AuthResponse>('/api/Auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    setToken(result.token);
    localStorage.setItem('al_maths_ai_email', result.email);
    setEmail(result.email);
    setIsAdmin(computeIsAdmin(result.token));
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    await apiFetch<{ message: string }>('/api/Auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
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
    verifyOtp,
    resendOtp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}