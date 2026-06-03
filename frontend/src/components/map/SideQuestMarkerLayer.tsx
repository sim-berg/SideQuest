import { Marker } from 'react-map-gl/maplibre';
import { useSideQuestStore } from '../../stores/useSideQuestStore';
import { useAuthStore } from '../../stores/useAuthStore';
import SideQuestMarker from './SideQuestMarker';

/**
 * Renders auto-spawned side quests on the map. Kept separate from the regular
 * clustered quest layer so spawns always stand out individually with their
 * spawn-pop / pulse animations. Completed ones are hidden.
 */
export default function SideQuestMarkerLayer() {
  const sideQuests = useSideQuestStore((s) => s.sideQuests);
  const seenIds = useSideQuestStore((s) => s.seenIds);
  const userId = useAuthStore((s) => s.user?.id);

  return (
    <>
      {sideQuests
        .filter((q) => !q.completedBy)
        // Hide spawns accepted by someone else.
        .filter((q) => !q.acceptedBy || q.acceptedBy === userId)
        .map((q) => (
          <Marker key={`sidequest-${q.id}`} longitude={q.lng} latitude={q.lat}>
            <SideQuestMarker quest={q} isNew={!seenIds.has(q.id)} />
          </Marker>
        ))}
    </>
  );
}
