import { api } from './api';
import { useAuthStore } from '../stores/useAuthStore';
import type { Comment } from '../types/comment';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

export async function fetchComments(questId: string): Promise<Comment[]> {
  return api.get<Comment[]>(`/sidequests/${questId}/comments`);
}

/**
 * Post a logbook comment with optional image. Uses multipart/form-data, so it
 * bypasses the JSON `api` wrapper but keeps the same 401 → refresh → retry flow.
 */
export async function postComment(
  questId: string,
  body: string,
  image?: File | null,
): Promise<Comment> {
  const form = new FormData();
  if (body) form.append('body', body);
  if (image) form.append('image', image);

  const send = (token: string | null) =>
    fetch(`${API_BASE}/sidequests/${questId}/comments`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
      credentials: 'include',
    });

  let res = await send(useAuthStore.getState().accessToken);

  if (res.status === 401) {
    const refresh = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refresh.ok) {
      const data = (await refresh.json()) as {
        accessToken: string;
        user: any;
      };
      useAuthStore.getState().setAuth(data.user, data.accessToken);
      res = await send(data.accessToken);
    }
  }

  if (!res.ok) {
    const err = (await res
      .json()
      .catch(() => ({ message: res.statusText }))) as { message?: string };
    throw new Error(err.message || res.statusText);
  }
  return res.json() as Promise<Comment>;
}
