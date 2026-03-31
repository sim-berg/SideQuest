import { useEffect, useCallback } from 'react';
import { useMapStore } from '../stores/useMapStore';
import { useRpgStore } from '../stores/useRpgStore';
import { ZONE_DEFS } from '../constants/rpg-zones';
import type { ZoneDef, ZoneType } from '../types/rpg';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEBUG = import.meta.env.VITE_RPG_DEBUG === 'true';

async function queryOverpass(lat: number, lng: number, zone: ZoneDef): Promise<boolean> {
  if (DEBUG) return true;

  const conditions = zone.osmAmenities
    .map((a) => `node["amenity"="${a}"](around:${zone.unlockRadius},${lat},${lng});`)
    .join('');
  const query = `[out:json][timeout:8];(${conditions});out 1;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { elements: unknown[] };
    return data.elements.length > 0;
  } catch {
    return false;
  }
}

export function useZoneUnlocks() {
  const userLocation = useMapStore((s) => s.userLocation);
  const zoneUnlocks = useRpgStore((s) => s.zoneUnlocks);
  const setZoneUnlock = useRpgStore((s) => s.setZoneUnlock);

  const checkAll = useCallback(async () => {
    if (!userLocation) return;
    const now = Date.now();

    await Promise.all(
      ZONE_DEFS.map(async (zone) => {
        const existing = zoneUnlocks[zone.type as ZoneType];
        if (existing && now - existing.checkedAt < CACHE_TTL_MS) return;

        const unlocked = await queryOverpass(userLocation.lat, userLocation.lng, zone);
        setZoneUnlock(zone.type as ZoneType, unlocked);
      }),
    );
  }, [userLocation, zoneUnlocks, setZoneUnlock]);

  // Check on mount and when location changes
  useEffect(() => {
    checkAll();
  }, [userLocation?.lat, userLocation?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return { checkAll };
}

export function useZoneUnlockStatus(zoneType: ZoneType) {
  const zoneUnlocks = useRpgStore((s) => s.zoneUnlocks);
  const entry = zoneUnlocks[zoneType];
  if (DEBUG) return { checked: true, unlocked: true };
  if (!entry) return { checked: false, unlocked: false };
  return { checked: entry.checked, unlocked: entry.unlocked };
}
