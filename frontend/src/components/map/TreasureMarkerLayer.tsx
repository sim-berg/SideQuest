import { Marker } from 'react-map-gl/maplibre';
import { useTreasureStore } from '../../stores/useTreasureStore';
import TreasureMarker from './TreasureMarker';

/**
 * Renders the worker-spawned treasure chests. Separate from the quest layers
 * so chests always stand out individually with their rarity glow.
 */
export default function TreasureMarkerLayer() {
  const spawns = useTreasureStore((s) => s.spawns);
  const seenIds = useTreasureStore((s) => s.seenIds);

  return (
    <>
      {spawns.map((spawn) => (
        <Marker
          key={`treasure-${spawn.id}`}
          longitude={spawn.lng}
          latitude={spawn.lat}
        >
          <TreasureMarker spawn={spawn} isNew={!seenIds.has(spawn.id)} />
        </Marker>
      ))}
    </>
  );
}
