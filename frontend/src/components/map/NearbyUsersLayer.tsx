import { useNearbyUsersStore } from '../../stores/useNearbyUsersStore';
import NearbyUserMarker from './NearbyUserMarker';

export default function NearbyUsersLayer() {
  const nearbyUsers = useNearbyUsersStore((s) => s.nearbyUsers);

  return (
    <>
      {nearbyUsers.map((u) => (
        <NearbyUserMarker key={u.userId} user={u} />
      ))}
    </>
  );
}
