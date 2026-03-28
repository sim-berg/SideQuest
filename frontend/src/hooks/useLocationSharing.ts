import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useMapStore } from '../stores/useMapStore';
import { useNearbyUsersStore, type NearbyUser } from '../stores/useNearbyUsersStore';
import { getSocket } from '../services/socket.service';

const EMIT_INTERVAL_MS = 10_000;

export function useLocationSharing() {
  const shareLocation = useAuthStore((s) => s.user?.shareLocation);
  const setNearbyUsers = useNearbyUsersStore((s) => s.setNearbyUsers);
  const clearNearbyUsers = useNearbyUsersStore((s) => s.clearNearbyUsers);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !shareLocation) {
      clearNearbyUsers();
      return;
    }

    const handleNearby = (users: NearbyUser[]) => {
      setNearbyUsers(users);
    };

    socket.on('location:nearby', handleNearby);

    // Emit current location immediately if available
    const loc = useMapStore.getState().userLocation;
    if (loc) {
      socket.emit('location:update', { lat: loc.lat, lng: loc.lng });
    }

    // Emit location updates on an interval
    const intervalId = setInterval(() => {
      const currentLoc = useMapStore.getState().userLocation;
      if (currentLoc) {
        socket.emit('location:update', { lat: currentLoc.lat, lng: currentLoc.lng });
      }
    }, EMIT_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      socket.off('location:nearby', handleNearby);
      socket.emit('location:stop');
      clearNearbyUsers();
    };
  }, [shareLocation, setNearbyUsers, clearNearbyUsers]);
}
