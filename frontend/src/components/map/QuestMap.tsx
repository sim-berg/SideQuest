import { useCallback } from 'react';
import Map, { type ViewStateChangeEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../../stores/useMapStore';
import { useUIStore } from '../../stores/useUIStore';
import { MAP_STYLE_LIGHT, MAP_STYLE_DARK } from '../../constants/map';
import UserLocationMarker from './UserLocationMarker';
import QuestMarkerLayer from './QuestMarkerLayer';

export default function QuestMap() {
  const viewState = useMapStore((s) => s.viewState);
  const setViewState = useMapStore((s) => s.setViewState);
  const darkMode = useUIStore((s) => s.darkMode);

  const handleMove = useCallback(
    (e: ViewStateChangeEvent) => {
      setViewState({
        latitude: e.viewState.latitude,
        longitude: e.viewState.longitude,
        zoom: e.viewState.zoom,
      });
    },
    [setViewState],
  );

  return (
    <Map
      {...viewState}
      onMove={handleMove}
      mapStyle={darkMode ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
    >
      <UserLocationMarker />
      <QuestMarkerLayer />
    </Map>
  );
}
