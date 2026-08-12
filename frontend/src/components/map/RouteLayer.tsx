import { useMemo } from 'react';
import { Source, Layer, Marker } from 'react-map-gl/maplibre';
import type { FeatureCollection } from 'geojson';
import { useRouteStore } from '../../stores/useRouteStore';
import { CATEGORY_META } from '../../constants/categories';

/**
 * Draws the active walking route on the map, Google-Maps style: a wide casing
 * line with a brighter line on top, plus a flag at the destination.
 * Rendered inside <Map>.
 */
export default function RouteLayer() {
  const destination = useRouteStore((s) => s.destination);
  const route = useRouteStore((s) => s.route);

  const geojson = useMemo<FeatureCollection | null>(() => {
    if (!route) return null;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: route.coordinates },
        },
      ],
    };
  }, [route]);

  if (!destination || !geojson) return null;

  const color = CATEGORY_META[destination.category]?.color ?? '#6366f1';

  return (
    <>
      <Source id="quest-route" type="geojson" data={geojson}>
        {/* casing — reads as a border under the main line */}
        <Layer
          id="quest-route-casing"
          type="line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': '#ffffff',
            'line-width': 10,
            'line-opacity': 0.9,
          }}
        />
        <Layer
          id="quest-route-line"
          type="line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': color,
            'line-width': 6,
          }}
        />
      </Source>

      {/* destination flag */}
      <Marker latitude={destination.lat} longitude={destination.lng} anchor="bottom">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white text-lg shadow-lg"
          style={{ backgroundColor: color, transform: 'translateY(-4px)' }}
        >
          🚩
        </div>
      </Marker>
    </>
  );
}
