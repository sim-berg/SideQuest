import { create } from 'zustand';

export interface NearbyUser {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  level: number;
  lat: number;
  lng: number;
}

interface NearbyUsersState {
  nearbyUsers: NearbyUser[];
  setNearbyUsers: (users: NearbyUser[]) => void;
  clearNearbyUsers: () => void;
}

export const useNearbyUsersStore = create<NearbyUsersState>((set) => ({
  nearbyUsers: [],
  setNearbyUsers: (users) => set({ nearbyUsers: users }),
  clearNearbyUsers: () => set({ nearbyUsers: [] }),
}));
