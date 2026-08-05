import { useMemo } from 'react';
import { X, Map as MapIcon, Navigation2, Compass as CompassIcon } from 'lucide-react';
import { useRouteStore } from '../../stores/useRouteStore';
import { useMapStore } from '../../stores/useMapStore';
import { useQuestStore } from '../../stores/useQuestStore';
import { useSideQuestStore } from '../../stores/useSideQuestStore';
import { useDeviceHeading } from '../../hooks/useDeviceHeading';
import { useBackDismiss } from '../../hooks/useBackDismiss';
import { haversineDistance } from '../../services/distance.service';
import { bearingTo, compassPoint, formatDuration, walkingDurationMin } from '../../utils/geo';
import { CATEGORY_META } from '../../constants/categories';
import { formatDistance } from '../../utils/format';
import type { Quest } from '../../types/quest';

/** Ring geometry, in px. */
const RING = 280;
/** Blips sit between these radii — near quests inward, far quests at the rim. */
const BLIP_RADIUS_MIN = 58;
const BLIP_RADIUS_MAX = RING / 2 - 26;

/** Quests further away than this aren't worth showing as blips. */
const NEARBY_RADIUS_KM = 2;
const MAX_BLIPS = 6;

const CARDINALS = [
  { label: 'N', deg: 0 },
  { label: 'O', deg: 90 },
  { label: 'S', deg: 180 },
  { label: 'W', deg: 270 },
];

interface Blip {
  quest: Quest;
  bearing: number;
  distanceKm: number;
  /** Distance from the hub, in px — encodes how far away the quest is. */
  radius: number;
}

/**
 * Full-screen "Adventure mode": a compass whose needle points at the active
 * quest, with nearby quests scattered around the ring as blips. Falls back to a
 * north-up map-style compass when the device has no orientation sensor.
 */
export default function CompassView() {
  const destination = useRouteStore((s) => s.destination);
  const compassOpen = useRouteStore((s) => s.compassOpen);
  const closeCompass = useRouteStore((s) => s.closeCompass);
  const route = useRouteStore((s) => s.route);
  const userLocation = useMapStore((s) => s.userLocation);
  const quests = useQuestStore((s) => s.quests);
  const sideQuests = useSideQuestStore((s) => s.sideQuests);

  const { heading, permission, requestAccess } = useDeviceHeading(compassOpen);

  const targetBearing = useMemo(() => {
    if (!userLocation || !destination) return null;
    return bearingTo(userLocation.lat, userLocation.lng, destination.lat, destination.lng);
  }, [userLocation, destination]);

  const targetDistanceKm = useMemo(() => {
    if (!userLocation || !destination) return null;
    return haversineDistance(userLocation.lat, userLocation.lng, destination.lat, destination.lng);
  }, [userLocation, destination]);

  const blips = useMemo<Blip[]>(() => {
    if (!userLocation || !destination) return [];
    const seen = new Set<string>([destination.id]);
    return [...quests, ...sideQuests]
      .filter((q) => {
        if (seen.has(q.id) || q.completedBy) return false;
        seen.add(q.id);
        return true;
      })
      .map((quest) => ({
        quest,
        bearing: bearingTo(userLocation.lat, userLocation.lng, quest.lat, quest.lng),
        distanceKm: haversineDistance(userLocation.lat, userLocation.lng, quest.lat, quest.lng),
      }))
      .filter((b) => b.distanceKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, MAX_BLIPS)
      .map((b) => ({
        ...b,
        // Radar-style: distance drives how far out the blip sits. Quests at a
        // similar bearing would otherwise stack on top of each other.
        radius:
          BLIP_RADIUS_MIN +
          (b.distanceKm / NEARBY_RADIUS_KM) * (BLIP_RADIUS_MAX - BLIP_RADIUS_MIN),
      }));
  }, [userLocation, destination, quests, sideQuests]);

  useBackDismiss(compassOpen && !!destination, closeCompass);

  if (!compassOpen || !destination) return null;

  const color = CATEGORY_META[destination.category]?.color ?? '#6366f1';
  /** With no sensor we render north-up and point the needle at the raw bearing. */
  const ringRotation = heading ?? 0;
  const needleRotation = targetBearing === null ? 0 : targetBearing - ringRotation;
  const arrived = targetDistanceKm !== null && targetDistanceKm < 0.03;

  const etaMin =
    route?.durationMin ??
    (targetDistanceKm !== null ? walkingDurationMin(targetDistanceKm * 1000) : null);

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-slate-950 text-white">
      {/* ambient glow in the quest's category colour */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: `radial-gradient(circle at 50% 38%, ${color}40, transparent 62%)` }}
      />

      {/* top bar */}
      <div className="relative flex shrink-0 items-center gap-3 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button
          onClick={closeCompass}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10"
          aria-label="Kompass schliessen"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-400">
          <CompassIcon className="h-4 w-4" /> Abenteuer-Modus
        </span>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6">
        {/* ---- compass ---- */}
        <div className="relative" style={{ width: RING, height: RING }}>
          {/* rotating ring: counter-rotates so N tracks true north.
              Sits above the needle so blips aren't swallowed by it. */}
          <div
            className="absolute inset-0 z-20 rounded-full border border-white/10 bg-white/[0.03] transition-transform duration-200 ease-out"
            style={{ transform: `rotate(${-ringRotation}deg)` }}
          >
            {/* degree ticks */}
            {Array.from({ length: 72 }, (_, i) => {
              const major = i % 6 === 0;
              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-0 origin-bottom"
                  style={{ height: RING / 2, transform: `rotate(${i * 5}deg)` }}
                >
                  <div
                    className={major ? 'w-[2px] bg-white/40' : 'w-px bg-white/15'}
                    style={{ height: major ? 12 : 6 }}
                  />
                </div>
              );
            })}

            {/* cardinal letters, un-rotated so they stay upright */}
            {CARDINALS.map(({ label, deg }) => (
              <div
                key={label}
                className="absolute left-1/2 top-0 origin-bottom"
                style={{ height: RING / 2, transform: `rotate(${deg}deg)` }}
              >
                <span
                  className={`block -translate-x-1/2 pt-4 text-sm font-bold ${
                    label === 'N' ? 'text-red-400' : 'text-slate-400'
                  }`}
                  style={{ transform: `rotate(${-deg + ringRotation}deg)` }}
                >
                  {label}
                </span>
              </div>
            ))}

            {/* nearby quest blips, placed at their true bearing */}
            {blips.map(({ quest, bearing, radius }) => {
              const blipColor = CATEGORY_META[quest.category]?.color ?? '#94a3b8';
              return (
                <div
                  key={quest.id}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `rotate(${bearing}deg) translateY(-${radius}px)`,
                  }}
                  title={quest.title}
                >
                  <div
                    className="-ml-[9px] -mt-[9px] flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white/40 text-[9px] shadow"
                    style={{
                      backgroundColor: `${blipColor}cc`,
                      transform: `rotate(${-bearing + ringRotation}deg)`,
                    }}
                  >
                    {CATEGORY_META[quest.category]?.icon ?? '•'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* needle — points at the destination */}
          <div
            className="absolute inset-0 z-10 flex items-center justify-center transition-transform duration-200 ease-out"
            style={{ transform: `rotate(${needleRotation}deg)` }}
          >
            {/* pushed out from the hub so the tip reads clearly against the ring */}
            <Navigation2
              className="h-20 w-20 drop-shadow-lg"
              style={{ color, transform: 'translateY(-52px)' }}
              strokeWidth={1.6}
              fill={color}
            />
          </div>

          {/* hub */}
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border border-white/15 bg-slate-900/90 shadow-inner">
              <span className="text-base font-bold leading-none">
                {targetDistanceKm !== null ? formatDistance(targetDistanceKm) : '--'}
              </span>
              {targetBearing !== null && (
                <span className="mt-0.5 text-[10px] font-medium text-slate-400">
                  {compassPoint(targetBearing)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ---- destination ---- */}
        <div className="mt-8 text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
            style={{ backgroundColor: `${color}26`, color }}
          >
            {CATEGORY_META[destination.category]?.icon} {CATEGORY_META[destination.category]?.label}
          </span>
          <h2 className="mt-2 text-xl font-bold">{destination.title}</h2>

          {arrived ? (
            <p className="mt-1 text-sm font-semibold text-emerald-400">
              Du bist da - Quest kann abgeschlossen werden
            </p>
          ) : (
            etaMin !== null && (
              <p className="mt-1 text-sm text-slate-400">
                noch etwa {formatDuration(etaMin)} zu Fuß
              </p>
            )
          )}
        </div>

        {/* ---- sensor state ---- */}
        {permission === 'prompt' && (
          <button
            onClick={requestAccess}
            className="mt-6 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/15"
          >
            Kompass aktivieren
          </button>
        )}
        {permission === 'denied' && (
          <p className="mt-6 max-w-xs text-center text-xs text-amber-400">
            Kompass-Zugriff verweigert - die Nadel zeigt die Richtung ab Norden.
          </p>
        )}
        {(permission === 'unsupported' || (permission === 'granted' && heading === null)) && (
          <p className="mt-6 max-w-xs text-center text-xs text-slate-500">
            Kein Kompass-Sensor - Norden ist oben, die Nadel zeigt die Richtung zum Ziel.
          </p>
        )}
        {!userLocation && (
          <p className="mt-4 max-w-xs text-center text-xs text-amber-400">
            Standort nicht verfügbar - Richtung kann nicht bestimmt werden.
          </p>
        )}

        {blips.length > 0 && (
          <p className="mt-4 text-[11px] text-slate-500">
            {blips.length} weitere Quest{blips.length === 1 ? '' : 's'} in der Nähe
          </p>
        )}
      </div>

      {/* bottom action */}
      <div
        className="relative shrink-0 px-6 pb-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <button
          onClick={closeCompass}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 py-3.5 text-sm font-bold transition-all active:scale-[0.98] hover:bg-white/15"
        >
          <MapIcon className="h-4 w-4" /> Zurück zur Karte
        </button>
      </div>
    </div>
  );
}
