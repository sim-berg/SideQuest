import type { AuthResponse } from '../types/user';

const API_BASE =
  (import.meta.env.VITE_API_URL as string) || '/api';

export async function register(
  email: string,
  username: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = (await res
      .json()
      .catch(() => ({ message: 'Registration failed' }))) as {
      message?: string;
    };
    throw new Error(err.message || 'Registration failed');
  }
  return res.json() as Promise<AuthResponse>;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = (await res
      .json()
      .catch(() => ({ message: 'Login failed' }))) as { message?: string };
    throw new Error(err.message || 'Login failed');
  }
  return res.json() as Promise<AuthResponse>;
}

export async function refreshToken(): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Token refresh failed');
  return res.json() as Promise<AuthResponse>;
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
