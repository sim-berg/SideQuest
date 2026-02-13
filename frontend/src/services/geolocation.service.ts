type LocationCallback = (coords: { lat: number; lng: number }) => void;
type ErrorCallback = (error: GeolocationPositionError) => void;

let watchId: number | null = null;

export function watchUserLocation(
  onUpdate: LocationCallback,
  onError?: ErrorCallback,
): void {
  if (!navigator.geolocation) {
    onError?.({
      code: 0,
      message: 'Geolocation wird nicht unterstuetzt',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError);
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) =>
      onUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    onError,
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
  );
}

export function clearWatch(): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}
