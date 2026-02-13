import { useMemo } from 'react';
import { useMapStore } from '../stores/useMapStore';
import { haversineDistance } from '../services/distance.service';

export function useQuestDistance(lat: number, lng: number): number | null {
  const userLocation = useMapStore((s) => s.userLocation);

  return useMemo(() => {
    if (!userLocation) return null;
    return haversineDistance(userLocation.lat, userLocation.lng, lat, lng);
  }, [userLocation, lat, lng]);
}
