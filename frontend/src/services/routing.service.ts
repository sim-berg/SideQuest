import { walkingDurationMin } from '../utils/geo';

/**
 * Walking-route lookup against OSRM.
 *
 * Defaults to the public demo server (no API key, same spirit as the keyless
 * OpenFreeMap tiles). Note that the demo server only runs the *car* profile —
 * it accepts `/foot/` in the path but silently routes as a car, so we take its
 * geometry and distance and derive the ETA ourselves at walking pace.
 *
 * Point VITE_OSRM_URL at a self-hosted foot-profile server for real pedestrian
 * routing; the demo server's ToS discourages production traffic.
 */
const OSRM_BASE =
  (import.meta.env.VITE_OSRM_URL as string) || 'https://router.project-osrm.org';

export interface RouteResult {
  /** [lng, lat] pairs, ready to hand to a MapLibre GeoJSON source. */
  coordinates: [number, number][];
  /** Route length along streets, in metres. */
  distanceMeters: number;
  /** Estimated walking time in minutes. */
  durationMin: number;
}

interface OsrmResponse {
  code: string;
  message?: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: { type: 'LineString'; coordinates: [number, number][] };
  }[];
}

export async function fetchWalkingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<RouteResult> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url =
    `${OSRM_BASE}/route/v1/foot/${coords}` +
    `?overview=full&geometries=geojson&alternatives=false&steps=false`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Routing-Dienst nicht erreichbar (${res.status})`);
  }

  const data = (await res.json()) as OsrmResponse;
  const route = data.routes?.[0];
  if (data.code !== 'Ok' || !route) {
    throw new Error(data.message || 'Keine Route gefunden');
  }

  return {
    coordinates: route.geometry.coordinates,
    distanceMeters: route.distance,
    durationMin: walkingDurationMin(route.distance),
  };
}
