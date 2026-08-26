import { useCallback, useState } from 'react';
import Map, { Marker, type ViewStateChangeEvent, type MapLayerMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../../stores/useMapStore';
import { useUIStore } from '../../stores/useUIStore';
import { MAP_STYLE_LIGHT, MAP_STYLE_DARK } from '../../constants/map';
import UserLocationMarker from './UserLocationMarker';
import QuestMarkerLayer from './QuestMarkerLayer';
import SideQuestMarkerLayer from './SideQuestMarkerLayer';
import RouteLayer from './RouteLayer';
import TreasureMarkerLayer from './TreasureMarkerLayer';
import ChainMarkerLayer from './ChainMarkerLayer';
import SideQuestPeekCard from '../sidequest/SideQuestPeekCard';
import QuestPeekCard from '../quest/QuestPeekCard';
import TreasurePeekCard from '../treasure/TreasurePeekCard';
import NearbyUsersLayer from './NearbyUsersLayer';
import { useLocationSharing } from '../../hooks/useLocationSharing';

export default function QuestMap() {
  useLocationSharing();
  const viewState = useMapStore((s) => s.viewState);
  const setViewState = useMapStore((s) => s.setViewState);
  const darkMode = useUIStore((s) => s.darkMode);
  const pickingLocation = useUIStore((s) => s.pickingLocation);
  const confirmLocation = useUIStore((s) => s.confirmLocation);
  const closeCreateQuest = useUIStore((s) => s.closeCreateQuest);

  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number } | null>(null);

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

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!pickingLocation) return;
      setDroppedPin({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    },
    [pickingLocation],
  );

  const handleConfirmPin = () => {
    if (!droppedPin) return;
    confirmLocation(droppedPin.lat, droppedPin.lng);
    setDroppedPin(null);
  };

  const handleCancelPicking = () => {
    setDroppedPin(null);
    closeCreateQuest();
  };

  return (
    <>
      <Map
        {...viewState}
        onMove={handleMove}
        onClick={handleMapClick}
        mapStyle={darkMode ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {/* route sits under the markers so pins stay tappable */}
        <RouteLayer />

        <UserLocationMarker />
        <QuestMarkerLayer />
        <SideQuestMarkerLayer />
        <TreasureMarkerLayer />
        <ChainMarkerLayer />
        <NearbyUsersLayer />

        {/* Floating cards above the selected marker (Google-Maps style) */}
        <SideQuestPeekCard />
        <QuestPeekCard />
        <TreasurePeekCard />

        {/* Dropped pin during location picking */}
        {pickingLocation && droppedPin && (
          <Marker latitude={droppedPin.lat} longitude={droppedPin.lng}>
            <div className="text-4xl drop-shadow-lg" style={{ transform: 'translateY(-50%)' }}>
              📍
            </div>
          </Marker>
        )}
      </Map>

      {/* Location picking UI overlay */}
      {pickingLocation && (
        <>
          {/* Bottom instruction banner and action buttons - centered max-width */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-[1200px] px-4">
            {!droppedPin ? (
              <div className="flex items-center justify-center rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:bg-slate-800/95">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-lg dark:bg-indigo-900/50">
                    📍
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Tippe auf die Karte
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleCancelPicking}
                  className="flex-1 rounded-2xl bg-slate-100 py-3.5 text-sm font-semibold text-slate-700 shadow-lg transition-all active:scale-[0.98] dark:bg-slate-800 dark:text-slate-200"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => setDroppedPin(null)}
                  className="flex-1 rounded-2xl bg-white py-3.5 text-sm font-semibold text-slate-700 shadow-lg transition-all active:scale-[0.98] dark:bg-slate-800 dark:text-slate-200"
                >
                  ✨ AI Generate
                </button>
                <button
                  onClick={handleConfirmPin}
                  className="flex-[2] rounded-2xl bg-indigo-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98]"
                >
                  📍 Standort verwenden
                </button>
              </div>
            )}
          </div>

          {/* Crosshair in center when no pin dropped yet */}
          {!droppedPin && (
            <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20">
                <div className="h-3 w-3 rounded-full border-2 border-indigo-500 bg-white dark:bg-slate-900" />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
