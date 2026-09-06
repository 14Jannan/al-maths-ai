import { useState, useCallback, type ReactNode } from 'react';
import { apiFetch, setToken, clearToken, getToken } from './api';
import { getRoleFromToken } from './jwt';
import { AuthContext, type AuthContextValue } from './auth-context';

// This is the shape of what the backend actually returns from
// login/verify-otp — token, email, and the display username.
interface AuthResponse {
  token: string;
  email: string;
  username: string;
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
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem('al_maths_ai_username')
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(computeIsAdmin(getToken()));

  function applyAuthResult(result: AuthResponse) {
    setToken(result.token);
    localStorage.setItem('al_maths_ai_email', result.email);
    localStorage.setItem('al_maths_ai_username', result.username);
    setEmail(result.email);
    setUsername(result.username);
    setIsAdmin(computeIsAdmin(result.token));
  }

  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    const result = await apiFetch<AuthResponse>('/api/Auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
    applyAuthResult(result);
  }, []);

  const register = useCallback(async (email: string, username: string, password: string) => {
    // Registration no longer returns a token directly — the account exists
    // but is unverified until the OTP step completes.
    await apiFetch<{ email: string; message: string }>('/api/Auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    const result = await apiFetch<AuthResponse>('/api/Auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    applyAuthResult(result);
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    await apiFetch<{ message: string }>('/api/Auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await apiFetch<{ message: string }>('/api/Auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await apiFetch<{ message: string }>('/api/Auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem('al_maths_ai_email');
    localStorage.removeItem('al_maths_ai_username');
    setEmail(null);
    setUsername(null);
    setIsAdmin(false);

    // A plain `navigate('/')` from the caller raced ProtectedRoute: React
    // batches this logout's setState with the router's own state, so on the
    // page you were logged in on (e.g. /settings), ProtectedRoute could see
    // the new isLoggedIn=false BEFORE the route actually changed to '/' and
    // bounce to /login itself, winning the race against the intended
    // landing-page redirect — landing you on /login instead of '/'.
    // A hard reload sidesteps the whole race: it can't lose to anything
    // still running in the React tree, and it also guarantees every other
    // bit of in-memory state (React Query cache, component state) is gone,
    // not just the auth token.
    window.location.href = '/';
  }, []);

  const value: AuthContextValue = {
    email,
    username,
    isLoggedIn: Boolean(getToken()),
    isAdmin,
    login,
    register,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
