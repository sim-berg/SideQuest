import { create } from 'zustand';
import type { UserLocation, MapViewState } from '../types/map';
import { DEFAULT_VIEW_STATE } from '../constants/map';

interface MapState {
  userLocation: UserLocation | null;
  locationError: string | null;
  viewState: MapViewState;
  setUserLocation: (loc: UserLocation | null) => void;
  setLocationError: (error: string | null) => void;
  setViewState: (vs: MapViewState) => void;
}

export const useMapStore = create<MapState>((set) => ({
  userLocation: null,
  locationError: null,
  viewState: DEFAULT_VIEW_STATE,
  setUserLocation: (userLocation) => set({ userLocation }),
  setLocationError: (locationError) => set({ locationError }),
  setViewState: (viewState) => set({ viewState }),
}));
