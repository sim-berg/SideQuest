import type { MapViewState } from '../types/map';

export const DEFAULT_VIEW_STATE: MapViewState = {
  latitude: 52.52,
  longitude: 13.405,
  zoom: 12,
};

export const MAP_STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/liberty';
export const MAP_STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';

export const DISTANCE_OPTIONS = [1, 5, 10] as const;
