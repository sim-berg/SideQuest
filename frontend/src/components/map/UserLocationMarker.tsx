import { Marker } from 'react-map-gl/maplibre';
import { useMapStore } from '../../stores/useMapStore';

export default function UserLocationMarker() {
  const userLocation = useMapStore((s) => s.userLocation);
  if (!userLocation) return null;

  return (
    <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
      <div className="relative flex items-center justify-center">
        <div className="absolute h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-30" />
        <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
      </div>
    </Marker>
  );
}
