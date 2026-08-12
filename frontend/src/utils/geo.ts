/**
 * Geo helpers for routing + the Adventure-mode compass.
 * Distance itself lives in services/distance.service.ts (haversine).
 */

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;

/**
 * Initial great-circle bearing from point A to point B, in degrees clockwise
 * from true north (0 = N, 90 = E). This is the direction the compass needle
 * points at the quest.
 */
export function bearingTo(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Normalise any angle into [-180, 180) — used to rotate the needle the short way round. */
export function normaliseAngle(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

const COMPASS_POINTS = [
  'N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
] as const;

/** Cardinal label for a bearing, German-style (O = Ost, not East). */
export function compassPoint(bearing: number): string {
  const i = Math.round((((bearing % 360) + 360) % 360) / 22.5) % 16;
  return COMPASS_POINTS[i];
}

/** Average walking pace in km/h, used to turn a route distance into an ETA. */
export const WALKING_SPEED_KMH = 5;

/**
 * Walking ETA for a distance in metres.
 *
 * We deliberately do NOT use the duration OSRM reports: the public demo server
 * only runs the car profile and ignores the `foot` profile in the URL, so its
 * durations come out at ~30 km/h. Distance and geometry are fine, so we derive
 * the time from distance at walking pace instead.
 */
export function walkingDurationMin(distanceMeters: number): number {
  return Math.max(1, Math.round((distanceMeters / 1000 / WALKING_SPEED_KMH) * 60));
}

/** "15 min" / "1 h 05 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')} min`;
}
