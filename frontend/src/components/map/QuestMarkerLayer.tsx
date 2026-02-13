import { useMemo, useCallback } from 'react';
import { Marker, useMap } from 'react-map-gl/maplibre';
import useSupercluster from 'use-supercluster';
import type { BBox } from 'geojson';
import type { PointFeature } from 'supercluster';
import { useFilteredQuests } from '../../hooks/useFilteredQuests';
import { useMapStore } from '../../stores/useMapStore';
import type { Category } from '../../types/quest';
import QuestMarker from './QuestMarker';
import QuestClusterMarker from './QuestClusterMarker';

type QuestPointProperties = {
  cluster: false;
  questId: string;
  category: Category;
};

export default function QuestMarkerLayer() {
  const filteredQuests = useFilteredQuests();
  const viewState = useMapStore((s) => s.viewState);
  const { current: mapRef } = useMap();

  const points: PointFeature<QuestPointProperties>[] = useMemo(
    () =>
      filteredQuests.map((q) => ({
        type: 'Feature' as const,
        properties: {
          cluster: false as const,
          questId: q.id,
          category: q.category,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [q.lng, q.lat],
        },
      })),
    [filteredQuests],
  );

  const bounds: BBox | undefined = useMemo(() => {
    if (!mapRef) return undefined;
    const b = mapRef.getBounds();
    if (!b) return undefined;
    return [
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth(),
    ] as BBox;
  }, [mapRef, viewState]); // eslint-disable-line react-hooks/exhaustive-deps

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: bounds ?? [-180, -90, 180, 90],
    zoom: viewState.zoom,
    options: { radius: 75, maxZoom: 17 },
  });

  const handleClusterClick = useCallback(
    (clusterId: number, lat: number, lng: number) => {
      if (!supercluster || !mapRef) return;
      const zoom = supercluster.getClusterExpansionZoom(clusterId);
      mapRef.easeTo({ center: [lng, lat], zoom, duration: 500 });
    },
    [supercluster, mapRef],
  );

  return (
    <>
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const props = cluster.properties;

        if (props.cluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              longitude={lng}
              latitude={lat}
            >
              <QuestClusterMarker
                count={props.point_count}
                onClick={() =>
                  handleClusterClick(cluster.id as number, lat, lng)
                }
              />
            </Marker>
          );
        }

        return (
          <Marker
            key={`quest-${props.questId}`}
            longitude={lng}
            latitude={lat}
          >
            <QuestMarker
              questId={props.questId}
              category={props.category as Category}
            />
          </Marker>
        );
      })}
    </>
  );
}
