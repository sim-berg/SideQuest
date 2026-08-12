import { create } from 'zustand';

export type ToastType = 'success' | 'info' | 'quest' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  /** Convenience one-liner used across quest/pet flows. */
  showToast: (message: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id: `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  showToast: (message) =>
    get().addToast({ type: 'success', title: message, duration: 3500 }),
}));
