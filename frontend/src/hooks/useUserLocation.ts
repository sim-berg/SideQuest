import { useEffect, useRef } from 'react';
import { useMapStore } from '../stores/useMapStore';
import { useDistanceStore } from '../stores/useDistanceStore';
import {
  watchUserLocation,
  clearWatch,
} from '../services/geolocation.service';

export function useUserLocation() {
  const setUserLocation = useMapStore((s) => s.setUserLocation);
  const setLocationError = useMapStore((s) => s.setLocationError);
  const setViewState = useMapStore((s) => s.setViewState);
  const viewState = useMapStore((s) => s.viewState);
  const addPosition = useDistanceStore((s) => s.addPosition);
  const hasCentered = useRef(false);

  useEffect(() => {
    watchUserLocation(
      (coords) => {
        setUserLocation(coords);
        setLocationError(null);
        addPosition(coords.lat, coords.lng);
        if (!hasCentered.current) {
          hasCentered.current = true;
          setViewState({
            ...viewState,
            latitude: coords.lat,
            longitude: coords.lng,
            zoom: 14,
          });
        }
      },
      (error) => {
        setLocationError(error.message);
      },
    );

    return () => clearWatch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
