import { useEffect, useRef } from 'react';
import { useMapStore } from '../stores/useMapStore';
import {
  watchUserLocation,
  clearWatch,
} from '../services/geolocation.service';

export function useUserLocation() {
  const setUserLocation = useMapStore((s) => s.setUserLocation);
  const setLocationError = useMapStore((s) => s.setLocationError);
  const setViewState = useMapStore((s) => s.setViewState);
  const viewState = useMapStore((s) => s.viewState);
  const hasCentered = useRef(false);

  useEffect(() => {
    watchUserLocation(
      (coords) => {
        setUserLocation(coords);
        setLocationError(null);
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
