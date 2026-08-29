// Central place for talking to the backend.
// Change this one value when you deploy — nothing else in the app needs to know the URL.
const API_BASE_URL = 'http://localhost:5000';

const TOKEN_KEY = 'al_maths_ai_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

interface ApiErrorBody {
  error?: string;
  title?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// A thin wrapper around fetch:
// - always sends/receives JSON
// - automatically attaches the JWT token if we have one
// - throws ApiError on non-2xx responses so callers can use try/catch
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body: ApiErrorBody = await response.json();
      message = body.error ?? body.title ?? message;
    } catch {
      // response wasn't JSON — keep the default message
    }
    throw new ApiError(message, response.status);
  }

  // 204 No Content has no body to parse
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
