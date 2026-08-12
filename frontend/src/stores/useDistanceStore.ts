import { create } from 'zustand';

const TODAY_KEY = () => `sidequest-km-${new Date().toISOString().slice(0, 10)}`;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadTodayKm(): number {
  try {
    return parseFloat(localStorage.getItem(TODAY_KEY()) ?? '0') || 0;
  } catch {
    return 0;
  }
}

function saveTodayKm(km: number) {
  try {
    localStorage.setItem(TODAY_KEY(), km.toFixed(3));
  } catch {}
}

interface DistanceState {
  kmToday: number;
  lastLat: number | null;
  lastLng: number | null;
  addPosition: (lat: number, lng: number) => void;
}

export const useDistanceStore = create<DistanceState>((set, get) => ({
  kmToday: loadTodayKm(),
  lastLat: null,
  lastLng: null,
  addPosition: (lat, lng) => {
    const { lastLat, lastLng, kmToday } = get();
    if (lastLat === null || lastLng === null) {
      set({ lastLat: lat, lastLng: lng });
      return;
    }
    const delta = haversineKm(lastLat, lastLng, lat, lng);
    // Ignore jumps > 0.5 km (GPS noise) and < 5 m (standing still)
    if (delta < 0.005 || delta > 0.5) {
      set({ lastLat: lat, lastLng: lng });
      return;
    }
    const next = kmToday + delta;
    saveTodayKm(next);
    set({ kmToday: next, lastLat: lat, lastLng: lng });
  },
}));
