const API_BASE =
  (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api';

let getAccessToken: () => string | null = () => null;
let onTokenRefreshed: (token: string) => void = () => {};
let onAuthFailed: () => void = () => {};

export function setAuthHandlers(handlers: {
  getToken: () => string | null;
  onRefresh: (token: string) => void;
  onFail: () => void;
}) {
  getAccessToken = handlers.getToken;
  onTokenRefreshed = handlers.onRefresh;
  onAuthFailed = handlers.onFail;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (res.status === 401) {
    // Attempt token refresh
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshRes.ok) {
      const data = (await refreshRes.json()) as { accessToken: string };
      onTokenRefreshed(data.accessToken);
      headers['Authorization'] = `Bearer ${data.accessToken}`;
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });
    } else {
      onAuthFailed();
      throw new Error('Authentication failed');
    }
  }

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: res.statusText })) as { message?: string };
    throw new Error(error.message || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
