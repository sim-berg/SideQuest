import { useState } from 'react';
import { ZONE_DEFS } from '../../constants/rpg-zones';
import { useRpgStore } from '../../stores/useRpgStore';
import { useZoneUnlocks, useZoneUnlockStatus } from '../../hooks/useZoneUnlock';
import type { ZoneDef, ZoneType } from '../../types/rpg';
import RPGGame from './RPGGame';

// Zone-specific icon SVGs in the DungeonView style
function ZoneIcon({ type, active }: { type: ZoneType; active: boolean }) {
  const size = 'h-8 w-8';
  if (type === 'taverne') {
    return (
      <svg viewBox="0 0 32 32" className={size} fill="none">
        <rect x={6} y={18} width={20} height={10} rx={1} fill={active ? '#a07818' : '#4a3a10'} />
        <rect x={4} y={16} width={24} height={3} rx={1} fill={active ? '#c8a030' : '#5a4a18'} />
        <path d="M10 16 L10 6 Q10 4 12 4 L20 4 Q22 4 22 6 L22 16" fill={active ? '#8b6420' : '#3a2a08'} />
        <rect x={14} y={4} width={4} height={4} rx={2} fill={active ? '#e8b840' : '#6b5020'} />
        {active && <rect x={4} y={16} width={24} height={12} fill="rgba(200,140,0,0.07)" rx={1} />}
      </svg>
    );
  }
  if (type === 'arena') {
    return (
      <svg viewBox="0 0 32 32" className={size} fill="none">
        <path d="M16 4 L20 12 L28 13 L22 19 L24 28 L16 24 L8 28 L10 19 L4 13 L12 12 Z"
          fill={active ? '#c04020' : '#4a1808'} stroke={active ? '#e06030' : '#3a1208'} strokeWidth={1} />
        {active && <path d="M16 8 L19 14 L26 15 L21 20 L22 26 L16 23 L10 26 L11 20 L6 15 L13 14 Z"
          fill="rgba(220,80,30,0.2)" />}
      </svg>
    );
  }
  if (type === 'bibliothek') {
    return (
      <svg viewBox="0 0 32 32" className={size} fill="none">
        {[4, 10, 16, 22].map((x) => (
          <rect key={x} x={x} y={6} width={5} height={20} rx={1}
            fill={active ? ['#6080c0','#8060a0','#60a080','#a08040'][Math.floor(x/6)] : '#2a2a3a'} />
        ))}
        <rect x={3} y={24} width={26} height={3} rx={1} fill={active ? '#c8b080' : '#4a3a20'} />
        {active && <rect x={3} y={6} width={26} height={21} fill="rgba(160,140,255,0.06)" rx={1} />}
      </svg>
    );
  }
  // tempel
  return (
    <svg viewBox="0 0 32 32" className={size} fill="none">
      <polygon points="16,4 28,12 28,28 4,28 4,12" fill={active ? '#806040' : '#302010'} />
      <rect x={12} y={18} width={8} height={10} fill={active ? '#5a3820' : '#201008'} />
      <rect x={4} y={12} width={24} height={2} fill={active ? '#c8a030' : '#5a4018'} />
      <circle cx={16} cy={10} r={3} fill={active ? '#e8c040' : '#6a5020'} />
      {[7, 13, 19, 25].map((x) => (
        <rect key={x} x={x} y={14} width={2} height={14} rx={0.5}
          fill={active ? '#a08030' : '#3a2a10'} />
      ))}
      {active && <circle cx={16} cy={10} r={5} fill="rgba(220,170,30,0.15)" />}
    </svg>
  );
}

function ZoneCard({ zone, selected, onSelect }: { zone: ZoneDef; selected: boolean; onSelect: (z: ZoneDef) => void }) {
  const { checked, unlocked } = useZoneUnlockStatus(zone.type as ZoneType);
  const isActive = unlocked;

  // Map zone accent colours to glow values
  const glowMap: Record<ZoneType, string> = {
    taverne:    'rgba(200,140,0,0.5)',
    arena:      'rgba(200,60,20,0.5)',
    bibliothek: 'rgba(100,100,220,0.5)',
    tempel:     'rgba(180,140,40,0.5)',
  };
  const glow = glowMap[zone.type as ZoneType];

  return (
    <button
      onClick={() => isActive && onSelect(zone)}
      disabled={!isActive}
      className={`relative flex items-center gap-4 rounded-sm p-4 text-left transition-all duration-200 active:scale-95 ${
        selected ? 'ring-1 ring-amber-600/60' : isActive ? 'ring-1 ring-amber-900/20' : 'opacity-60'
      }`}
      style={{
        background: selected
          ? 'linear-gradient(135deg, rgba(30,24,10,0.97), rgba(20,16,6,0.97))'
          : isActive
          ? 'linear-gradient(135deg, rgba(22,17,7,0.95), rgba(14,11,4,0.95))'
          : 'linear-gradient(135deg, rgba(14,11,4,0.9), rgba(10,8,3,0.9))',
        boxShadow: selected ? `0 0 20px ${glow}, inset 0 1px 0 rgba(200,170,60,0.1)` : 'none',
        border: '1px solid rgba(100,80,20,0.3)',
      }}
    >
      {/* Status badge */}
      <div className="absolute top-2 right-2">
        {!checked ? (
          <span className="text-[9px] text-amber-900/60" style={{ fontFamily: 'Georgia, serif' }}>GPS...</span>
        ) : isActive ? (
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-600/80" style={{ fontFamily: 'Georgia, serif' }}>Verfügbar</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="rgba(180,130,20,0.4)">
              <path d="M12 1C8.676 1 6 3.676 6 7v2H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
            </svg>
            <span className="text-[9px] text-amber-900/50" style={{ fontFamily: 'Georgia, serif' }}>Gesperrt</span>
          </div>
        )}
      </div>

      {/* Icon */}
      <div
        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-sm"
        style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(100,80,20,0.3)',
          boxShadow: isActive ? `inset 0 0 12px ${glow}` : 'none',
        }}
      >
        <ZoneIcon type={zone.type as ZoneType} active={isActive} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pr-6">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'Georgia, serif', color: isActive ? '#d4a832' : '#5a4a1a' }}
        >
          {zone.type}
        </p>
        <p
          className="text-sm font-bold leading-tight mt-0.5"
          style={{
            fontFamily: 'Georgia, serif',
            color: isActive ? '#e8d0a0' : '#4a3a18',
            textShadow: isActive ? `0 0 8px ${glow}` : 'none',
          }}
        >
          {zone.name}
        </p>
        <p className="text-[11px] mt-1 leading-snug line-clamp-2" style={{ color: 'rgba(180,140,60,0.5)', fontFamily: 'Georgia, serif' }}>
          {isActive ? zone.description : zone.unlockHint}
        </p>

        {/* XP badges */}
        {isActive && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className="rounded-sm px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(180,130,0,0.2)', color: '#c8a030', border: '1px solid rgba(180,130,0,0.2)', fontFamily: 'Georgia, serif' }}
            >
              Täglich bis 200 XP
            </span>
            <span
              className="rounded-sm px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(100,60,160,0.2)', color: '#a080d0', border: '1px solid rgba(100,60,160,0.2)', fontFamily: 'Georgia, serif' }}
            >
              Wöchentlich bis 1000 XP
            </span>
          </div>
        )}
      </div>

      {/* Arrow indicator when active */}
      {isActive && (
        <div
          className="absolute right-3 bottom-3 h-1.5 w-1.5 rounded-full bg-amber-500"
          style={{ boxShadow: '0 0 6px rgba(200,140,0,0.8)' }}
        />
      )}
    </button>
  );
}

export default function RPGView() {
  const [activeZone, setActiveZone] = useState<ZoneDef | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneDef | null>(null);
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
      className="flex h-full w-full flex-col overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #0a0804 0%, #120e06 50%, #0a0804 100%)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Header */}
      <div className="relative flex flex-col items-center px-4 pt-8 pb-5">
        <div
          className="absolute top-0 left-0 right-0 h-6 bg-repeat-x"
          style={{ backgroundImage: 'url(/menu/border_top.png)', backgroundSize: 'auto 24px' }}
        />
        <img
          src="/menu/icon_rpg.png" alt=""
          className="h-12 w-12 object-contain mb-2 mt-2"
          style={{ filter: 'drop-shadow(0 0 12px rgba(200,140,0,0.7))' }}
        />
        <h1
          className="text-2xl font-bold text-amber-400 tracking-widest uppercase"
          style={{ fontFamily: 'Georgia, serif', textShadow: '0 0 16px rgba(200,140,0,0.5)' }}
        >
          Abenteuer
        </h1>
        <p className="text-xs text-amber-700/80 mt-1 tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
          Besuche echte Orte, betrete magische Bereiche
        </p>
        <div className="mt-3 w-full max-w-xs flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-800/50" />
          <span className="text-amber-700 text-xs">✦</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-800/50" />
        </div>
      </div>

      {/* GPS hint */}
      <div
        className="mx-4 mb-4 flex items-start gap-2 px-3 py-2 rounded-sm"
        style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(180,130,20,0.2)',
          boxShadow: 'inset 0 0 12px rgba(180,130,0,0.05)',
        }}
      >
        <span className="text-amber-700/70 text-sm mt-0.5">📡</span>
        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(180,140,60,0.65)', fontFamily: 'Georgia, serif' }}>
          Dein GPS-Standort bestimmt welche Bereiche freigeschaltet sind. Quests sind selbst-berichtet – sei ehrlich!
        </p>
      </div>

      {/* Zone cards */}
      <div className="flex flex-col gap-3 px-4 pb-6">
        {ZONE_DEFS.map((zone) => (
          <ZoneCard
            key={zone.type}
            zone={zone}
            selected={selectedZone?.type === zone.type}
            onSelect={setSelectedZone}
          />
        ))}
      </div>

      {/* Enter button — only when a zone is selected */}
      {selectedZone && (
        <div className="px-4 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-800/40" />
            <span className="text-amber-700 text-xs">⚔</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-800/40" />
          </div>
          <button
            onClick={() => handleEnter(selectedZone)}
            className="relative w-full py-4 text-center font-bold text-amber-900 text-base tracking-widest uppercase transition-transform active:scale-95"
            style={{
              fontFamily: 'Georgia, serif',
              background: 'linear-gradient(180deg, #d4a832 0%, #a07818 50%, #7a5c10 100%)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 0 20px rgba(180,130,0,0.3), inset 0 1px 0 rgba(255,220,80,0.4)',
              border: '1px solid rgba(200,160,40,0.5)',
              letterSpacing: '0.1em',
            }}
          >
            <span className="absolute top-1 left-2 text-amber-700/60 text-xs">✦</span>
            <span className="absolute top-1 right-2 text-amber-700/60 text-xs">✦</span>
            {selectedZone.name} betreten
          </button>
        </div>
      )}

      {/* Bottom ornament */}
      <div className="mt-auto">
        <div
          className="w-full h-6 bg-repeat-x"
          style={{ backgroundImage: 'url(/menu/border_bottom.png)', backgroundSize: 'auto 24px' }}
        />
      </div>
    </div>
  );
}
