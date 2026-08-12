import { create } from 'zustand';
import type { Pet } from '../types/pet';
import { fetchMyPets } from '../services/pet.service';

interface PetState {
  pets: Pet[];
  isLoading: boolean;
  fetchPets: () => Promise<void>;
  /** Insert or replace one pet (e.g. after an XP award or hatch). */
  upsertPet: (pet: Pet) => void;
  setPets: (pets: Pet[]) => void;
  clearPets: () => void;
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  isLoading: false,
  fetchPets: async () => {
    set({ isLoading: true });
    try {
      const pets = await fetchMyPets();
      set({ pets, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
  upsertPet: (pet) => {
    const pets = get().pets;
    const exists = pets.some((p) => p.id === pet.id);
    const next = exists
      ? pets.map((p) => (p.id === pet.id ? pet : p))
      : [...pets, pet];
    // An activation elsewhere deactivates the rest.
    set({
      pets: pet.isActive
        ? next.map((p) => (p.id === pet.id ? p : { ...p, isActive: false }))
        : next,
    });
  },
  setPets: (pets) => set({ pets }),
  clearPets: () => set({ pets: [] }),
}));

/** The one companion currently guiding the user. */
export function selectActivePet(state: { pets: Pet[] }): Pet | null {
  return state.pets.find((p) => p.isActive) ?? null;
}
