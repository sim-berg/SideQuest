import { create } from 'zustand';
import type { User } from '../types/user';
import { setAuthHandlers } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Wire up API auth handlers so the fetch wrapper can read/update tokens
  setAuthHandlers({
    getToken: () => get().accessToken,
    onRefresh: (token) => set({ accessToken: token }),
    onFail: () => {
      set({ user: null, accessToken: null, isAuthenticated: false });
      disconnectSocket();
    },
  });

  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,

    setAuth: (user, accessToken) => {
      set({ user, accessToken, isAuthenticated: true });
      connectSocket(accessToken);
    },

    clearAuth: () => {
      set({ user: null, accessToken: null, isAuthenticated: false });
      disconnectSocket();
    },

    updateUser: (partial) =>
      set((s) => ({
        user: s.user ? { ...s.user, ...partial } : null,
      })),
  };
});
