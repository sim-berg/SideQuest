import { create } from 'zustand';

export type ActiveTab = 'map' | 'chat' | 'create' | 'profile';

/** Steps for the quest creation wizard (0 = picking location on map) */
export type CreateWizardStep = 0 | 1 | 2 | 3 | 4 | 5;

interface UIState {
  bottomSheetOpen: boolean;
  infoPageOpen: boolean;
  createQuestOpen: boolean;
  darkMode: boolean;
  activeTab: ActiveTab;
  filterPanelOpen: boolean;
  menuOpen: boolean;
  showAuthPrompt: boolean;
  pendingAuthTab: ActiveTab | null;
  /** Whether the user is currently picking a location on the map */
  pickingLocation: boolean;
  /** Current step of the quest creation wizard */
  createWizardStep: CreateWizardStep;
  /** Picked location coordinates */
  pickedLocation: { lat: number; lng: number } | null;
  openBottomSheet: () => void;
  closeBottomSheet: () => void;
  openInfoPage: () => void;
  closeInfoPage: () => void;
  openCreateQuest: () => void;
  closeCreateQuest: () => void;
  startPickingLocation: () => void;
  confirmLocation: (lat: number, lng: number) => void;
  setCreateWizardStep: (step: CreateWizardStep) => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  setActiveTab: (tab: ActiveTab) => void;
  toggleFilterPanel: () => void;
  closeFilterPanel: () => void;
  toggleMenu: () => void;
  closeMenu: () => void;
  setShowAuthPrompt: (show: boolean, pendingTab?: ActiveTab) => void;
}

export const useUIStore = create<UIState>((set) => ({
  bottomSheetOpen: false,
  infoPageOpen: false,
  createQuestOpen: false,
  darkMode: localStorage.getItem('sidequest-dark') === 'true',
  activeTab: 'map',
  filterPanelOpen: false,
  menuOpen: false,
  showAuthPrompt: false,
  pendingAuthTab: null,
  pickingLocation: false,
  createWizardStep: 0,
  pickedLocation: null,
  openBottomSheet: () => set({ bottomSheetOpen: true }),
  closeBottomSheet: () => set({ bottomSheetOpen: false }),
  openInfoPage: () => set({ infoPageOpen: true, bottomSheetOpen: false }),
  closeInfoPage: () => set({ infoPageOpen: false }),
  openCreateQuest: () =>
    set({ createQuestOpen: true, bottomSheetOpen: false, activeTab: 'create' }),
  closeCreateQuest: () =>
    set({
      createQuestOpen: false,
      activeTab: 'map',
      pickingLocation: false,
      createWizardStep: 0,
      pickedLocation: null,
    }),
  startPickingLocation: () =>
    set({
      pickingLocation: true,
      pickedLocation: null,
      createWizardStep: 0,
      activeTab: 'map',
      bottomSheetOpen: false,
      createQuestOpen: true,
    }),
  confirmLocation: (lat, lng) =>
    set({
      pickedLocation: { lat, lng },
      pickingLocation: false,
      createWizardStep: 1,
    }),
  setCreateWizardStep: (createWizardStep) => set({ createWizardStep }),
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
  setActiveTab: (activeTab) => {
    if (activeTab === 'create') {
      // "Create" tab triggers location-picking mode on the map
      return set({
        activeTab: 'map',
        pickingLocation: true,
        pickedLocation: null,
        createWizardStep: 0,
        createQuestOpen: true,
        bottomSheetOpen: false,
      });
    }
    return set({ activeTab, createQuestOpen: false, pickingLocation: false, createWizardStep: 0, pickedLocation: null });
  },
  toggleFilterPanel: () =>
    set((s) => ({ filterPanelOpen: !s.filterPanelOpen, menuOpen: false })),
  closeFilterPanel: () => set({ filterPanelOpen: false }),
  toggleMenu: () =>
    set((s) => ({ menuOpen: !s.menuOpen, filterPanelOpen: false })),
  closeMenu: () => set({ menuOpen: false }),
  setShowAuthPrompt: (show, pendingTab) =>
    set({ showAuthPrompt: show, pendingAuthTab: pendingTab ?? null }),
}));
