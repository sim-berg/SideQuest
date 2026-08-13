import { create } from 'zustand';

export type ActiveTab = 'map' | 'chat' | 'create' | 'profile';

/** Steps for the quest creation wizard (0 = picking location on map) */
export type CreateWizardStep = 0 | 1 | 2 | 3 | 4 | 5;

interface UIState {
  createQuestOpen: boolean;
  darkMode: boolean;
  activeTab: ActiveTab;
  filterPanelOpen: boolean;
  /** Hub menu (Logbuch, Ausrüstung, Pets, Chat, Profil, Gilden) */
  hubMenuOpen: boolean;
  /** Menagerie overlay */
  petsOpen: boolean;
  /** Gilden placeholder overlay */
  guildsOpen: boolean;
  showAuthPrompt: boolean;
  pendingAuthTab: ActiveTab | null;
  /** Whether the user is currently picking a location on the map */
  pickingLocation: boolean;
  /** Current step of the quest creation wizard */
  createWizardStep: CreateWizardStep;
  /** Picked location coordinates */
  pickedLocation: { lat: number; lng: number } | null;
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
  toggleHubMenu: () => void;
  closeHubMenu: () => void;
  openPets: () => void;
  closePets: () => void;
  openGuilds: () => void;
  closeGuilds: () => void;
  setShowAuthPrompt: (show: boolean, pendingTab?: ActiveTab) => void;
}

export const useUIStore = create<UIState>((set) => ({
  createQuestOpen: false,
  darkMode: localStorage.getItem('sidequest-dark') === 'true',
  activeTab: 'map',
  filterPanelOpen: false,
  hubMenuOpen: false,
  petsOpen: false,
  guildsOpen: false,
  showAuthPrompt: false,
  pendingAuthTab: null,
  pickingLocation: false,
  createWizardStep: 0,
  pickedLocation: null,
  openCreateQuest: () => set({ createQuestOpen: true, activeTab: 'create' }),
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
        hubMenuOpen: false,
      });
    }
    return set({ activeTab, createQuestOpen: false, pickingLocation: false, createWizardStep: 0, pickedLocation: null, hubMenuOpen: false });
  },
  toggleFilterPanel: () =>
    set((s) => ({ filterPanelOpen: !s.filterPanelOpen, hubMenuOpen: false })),
  closeFilterPanel: () => set({ filterPanelOpen: false }),
  toggleHubMenu: () =>
    set((s) => ({ hubMenuOpen: !s.hubMenuOpen, filterPanelOpen: false })),
  closeHubMenu: () => set({ hubMenuOpen: false }),
  openPets: () => set({ petsOpen: true, hubMenuOpen: false }),
  closePets: () => set({ petsOpen: false }),
  openGuilds: () => set({ guildsOpen: true, hubMenuOpen: false }),
  closeGuilds: () => set({ guildsOpen: false }),
  setShowAuthPrompt: (show, pendingTab) =>
    set({ showAuthPrompt: show, pendingAuthTab: pendingTab ?? null }),
}));
