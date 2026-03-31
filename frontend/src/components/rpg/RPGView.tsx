import { useState } from 'react';
import { ZONE_DEFS } from '../../constants/rpg-zones';
import { useRpgStore } from '../../stores/useRpgStore';
import { useZoneUnlocks, useZoneUnlockStatus } from '../../hooks/useZoneUnlock';
import type { ZoneDef, ZoneType } from '../../types/rpg';
import RPGGame from './RPGGame';
import { cn } from '../../utils/cn';

const ZONE_ICONS: Record<ZoneType, string> = {
  taverne: '🍺',
  arena: '⚔️',
  bibliothek: '📚',
  tempel: '🕯️',
};

function ZoneCard({ zone, onEnter }: { zone: ZoneDef; onEnter: (z: ZoneDef) => void }) {
  const { checked, unlocked } = useZoneUnlockStatus(zone.type as ZoneType);

  return (
    <button
      onClick={() => unlocked && onEnter(zone)}
      disabled={!unlocked}
      className={cn(
        'relative w-full rounded-2xl border p-4 text-left transition-all active:scale-95',
        unlocked
          ? 'border-white/30 bg-white/10 backdrop-blur active:bg-white/15'
          : 'border-white/10 bg-white/5 opacity-60',
      )}
      style={{
        background: unlocked
          ? `linear-gradient(135deg, ${zone.bgGradient[0]}CC, ${zone.bgGradient[1]}CC)`
          : undefined,
      }}
    >
      {/* Lock badge */}
      {!checked && (
        <div className="absolute top-3 right-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/50">
          GPS wird geprüft...
        </div>
      )}
      {checked && !unlocked && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5">
          <svg className="h-3 w-3 text-white/60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1C8.676 1 6 3.676 6 7v2H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
          </svg>
          <span className="text-[10px] text-white/60">Gesperrt</span>
        </div>
      )}
      {checked && unlocked && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-500/30 px-2 py-0.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-300">Verfügbar</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <span className="text-3xl">{ZONE_ICONS[zone.type as ZoneType]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: zone.accentColor }}>
            {zone.type}
          </p>
          <p className="text-base font-bold text-white">{zone.name}</p>
          <p className="mt-0.5 text-xs text-white/60 leading-relaxed line-clamp-2">
            {zone.description}
          </p>
          {!unlocked && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-amber-400/80">
              <span>📍</span>
              <span>{zone.unlockHint}</span>
            </p>
          )}
        </div>
      </div>

      {/* XP teaser */}
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
          Täglich bis zu 200 XP
        </span>
        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[11px] font-semibold text-purple-300">
          Wöchentlich bis zu 1000 XP
        </span>
      </div>
    </button>
  );
}

export default function RPGView() {
  const [activeZone, setActiveZone] = useState<ZoneDef | null>(null);
  const setStoreZone = useRpgStore((s) => s.setActiveZone);

  useZoneUnlocks();

  const handleEnter = (zone: ZoneDef) => {
    setActiveZone(zone);
    setStoreZone(zone.type as ZoneType);
  };

  const handleExit = () => {
    setActiveZone(null);
    setStoreZone(null);
  };

  if (activeZone) {
    return (
      <div className="fixed inset-0 z-50">
        <RPGGame zone={activeZone} onExit={handleExit} />
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0F0C29 0%, #302B63 50%, #24243E 100%)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">RPG Modus</p>
        <h2 className="text-2xl font-bold text-white">Abenteuer</h2>
        <p className="mt-1 text-sm text-white/50">
          Besuche echte Orte, um magische Bereiche zu betreten und epische Quests zu erhalten.
        </p>
      </div>

      {/* GPS hint */}
      <div className="mx-4 mb-4 flex items-start gap-2 rounded-xl bg-indigo-500/15 border border-indigo-400/20 px-3 py-2">
        <span className="text-base">📡</span>
        <p className="text-xs text-indigo-300/80 leading-relaxed">
          Dein GPS-Standort bestimmt, welche Bereiche für dich freigeschaltet sind.
          Quests sind selbst-berichtet – sei ehrlich zu dir selbst!
        </p>
      </div>

      {/* Zone cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="flex flex-col gap-3">
          {ZONE_DEFS.map((zone) => (
            <ZoneCard key={zone.type} zone={zone} onEnter={handleEnter} />
          ))}
        </div>
      </div>
    </div>
  );
}
