import { Marker } from 'react-map-gl/maplibre';
import { useMapStore } from '../../stores/useMapStore';

export default function UserLocationMarker() {
  const userLocation = useMapStore((s) => s.userLocation);
  if (!userLocation) return null;

  return (
    <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
      <div className="relative flex items-center justify-center">
        <div className="absolute h-12 w-12 animate-ping rounded-full bg-gold opacity-20" />
        <div className="absolute h-10 w-10 animate-pulse rounded-full bg-gold/30" />
        <img
          src="/chars/1.png"
          alt="Dein Standort"
          width={44}
          height={44}
          className="relative drop-shadow-lg"
          draggable={false}
        />
      </div>
    </Marker>
  );
}
