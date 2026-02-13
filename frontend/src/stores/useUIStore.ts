import { create } from 'zustand';

interface UIState {
  bottomSheetOpen: boolean;
  infoPageOpen: boolean;
  darkMode: boolean;
  openBottomSheet: () => void;
  closeBottomSheet: () => void;
  openInfoPage: () => void;
  closeInfoPage: () => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  bottomSheetOpen: false,
  infoPageOpen: false,
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  openBottomSheet: () => set({ bottomSheetOpen: true }),
  closeBottomSheet: () => set({ bottomSheetOpen: false }),
  openInfoPage: () => set({ infoPageOpen: true, bottomSheetOpen: false }),
  closeInfoPage: () => set({ infoPageOpen: false }),
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('sidequest-dark', String(next));
      return { darkMode: next };
    }),
  setDarkMode: (darkMode) => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('sidequest-dark', String(darkMode));
    return set({ darkMode });
  },
}));
