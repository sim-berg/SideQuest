import { Marker } from 'react-map-gl/maplibre';
import { useFilteredQuests } from '../../hooks/useFilteredQuests';
import { useAuthStore } from '../../stores/useAuthStore';
import QuestMarker from './QuestMarker';

/**
 * Renders every quest as an individual, tappable marker. Clustering was
 * removed because it grouped quests into count bubbles that only zoomed on
 * tap — users expect a tap to open the quest detail modal directly.
 */
export default function QuestMarkerLayer() {
  const filteredQuests = useFilteredQuests();
  const userId = useAuthStore((s) => s.user?.id);

  return (
    <>
      {filteredQuests.map((quest) => (
        <Marker
          key={`quest-${quest.id}`}
          longitude={quest.lng}
          latitude={quest.lat}
        >
          <QuestMarker
            questId={quest.id}
            category={quest.category}
            acceptedByMe={!!userId && quest.acceptedBy === userId}
          />
        </Marker>
      ))}
    </>
  );
}
