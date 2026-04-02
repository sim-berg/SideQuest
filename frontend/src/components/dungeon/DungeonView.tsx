import { useState, useEffect } from 'react';
import DungeonGame from './DungeonGame';
import { generateDungeon, type DungeonStyle, type DungeonMap } from './DungeonGenerator';
import { useUIStore } from '../../stores/useUIStore';

const STYLES: { id: DungeonStyle; label: string; sub: string; color: string; glow: string }[] = [
  {
    id: 'kerker',
    label: 'Kerker',
    sub: 'Steinzellen & Eisengitter',
    color: 'from-stone-900 to-neutral-900',
    glow: 'rgba(180,60,0,0.6)',
  },
  {
    id: 'hoehle',
    label: 'Höhle',
    sub: 'Kristalle & unterirdische Seen',
    color: 'from-emerald-950 to-stone-950',
    glow: 'rgba(0,200,160,0.5)',
  },
  {
    id: 'krypta',
    label: 'Krypta',
    sub: 'Knochen & arkane Runen',
    color: 'from-violet-950 to-stone-950',
    glow: 'rgba(140,0,255,0.5)',
  },
];

export default function DungeonView() {
  const [activeDungeon, setActiveDungeon] = useState<DungeonMap | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<DungeonStyle>('kerker');
  const setDungeonGameActive = useUIStore((s) => s.setDungeonGameActive);

  useEffect(() => {
    setDungeonGameActive(!!activeDungeon);
    return () => setDungeonGameActive(false);
  }, [activeDungeon, setDungeonGameActive]);

  if (activeDungeon) {
    return (
      <DungeonGame
        dungeon={activeDungeon}
        onExit={() => setActiveDungeon(null)}
        onComplete={() => {}}
      />
    );
  }

  const enter = (style: DungeonStyle) => {
    setActiveDungeon(generateDungeon(style));
  };

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
      <div className="relative flex flex-col items-center px-4 pt-10 pb-6">
        {/* Gothic arch border top */}
        <div
          className="absolute top-0 left-0 right-0 h-6 bg-repeat-x"
          style={{ backgroundImage: 'url(/menu/border_top.png)', backgroundSize: 'auto 24px' }}
        />
        <img src="/menu/icon_dungeon.png" alt="" className="h-14 w-14 object-contain mb-3 mt-2"
          style={{ filter: 'drop-shadow(0 0 12px rgba(200,140,0,0.7))' }} />
        <h1
          className="text-2xl font-bold text-amber-400 tracking-widest uppercase"
          style={{ fontFamily: 'Georgia, serif', textShadow: '0 0 16px rgba(200,140,0,0.5)' }}
        >
          Kerker
        </h1>
        <p className="text-xs text-amber-700/80 mt-1 tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
          Wähle deinen Dungeon
        </p>
        {/* Horizontal ornament */}
        <div className="mt-4 w-full max-w-xs flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-800/50" />
          <span className="text-amber-700 text-xs">✦</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-800/50" />
        </div>
      </div>

      {/* Style cards */}
      <div className="flex flex-col gap-4 px-4 pb-6">
        {STYLES.map((style) => {
          const isSelected = selectedStyle === style.id;
          return (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`relative flex items-center gap-4 rounded-sm p-4 text-left transition-all duration-200 ${
                isSelected ? 'ring-1 ring-amber-600/60' : 'opacity-70'
              }`}
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(30,24,10,0.95), rgba(20,16,6,0.95))'
                  : 'linear-gradient(135deg, rgba(18,14,6,0.9), rgba(12,10,4,0.9))',
                boxShadow: isSelected ? `0 0 20px ${style.glow}, inset 0 1px 0 rgba(200,170,60,0.1)` : 'none',
                border: '1px solid rgba(100,80,20,0.3)',
              }}
            >
              {/* Icon area */}
              <div
                className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-sm"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(100,80,20,0.3)',
                  boxShadow: isSelected ? `inset 0 0 12px ${style.glow}` : 'none',
                }}
              >
                <DungeonStyleIcon style={style.id} active={isSelected} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-base font-bold"
                  style={{
                    fontFamily: 'Georgia, serif',
                    color: isSelected ? '#d4a832' : '#6b5a2a',
                    textShadow: isSelected ? `0 0 8px ${style.glow}` : 'none',
                  }}
                >
                  {style.label}
                </p>
                <p className="text-[11px] text-amber-900/70 mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
                  {style.sub}
                </p>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="flex-shrink-0 h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(200,140,0,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Enter button */}
      <div className="px-4 pb-8">
        {/* Ornament */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-800/40" />
          <span className="text-amber-700 text-xs">⚔</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-800/40" />
        </div>

        <button
          onClick={() => enter(selectedStyle)}
          className="relative w-full py-4 text-center font-bold text-amber-900 text-base tracking-widest uppercase transition-transform active:scale-98"
          style={{
            fontFamily: 'Georgia, serif',
            background: 'linear-gradient(180deg, #d4a832 0%, #a07818 50%, #7a5c10 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 0 20px rgba(180,130,0,0.3), inset 0 1px 0 rgba(255,220,80,0.4)',
            border: '1px solid rgba(200,160,40,0.5)',
            letterSpacing: '0.1em',
          }}
        >
          {/* Corner ornaments */}
          <span className="absolute top-1 left-2 text-amber-700/60 text-xs">✦</span>
          <span className="absolute top-1 right-2 text-amber-700/60 text-xs">✦</span>
          Kerker betreten
        </button>

        <p className="text-center text-[10px] text-amber-900/50 mt-3" style={{ fontFamily: 'Georgia, serif' }}>
          Jeder Kerker wird zufällig generiert
        </p>
      </div>

      {/* Bottom arch ornament */}
      <div className="mt-auto">
        <div
          className="w-full h-6 bg-repeat-x"
          style={{ backgroundImage: 'url(/menu/border_bottom.png)', backgroundSize: 'auto 24px' }}
        />
      </div>
    </div>
  );
}

function DungeonStyleIcon({ style, active }: { style: DungeonStyle; active: boolean }) {
  const size = 'h-8 w-8';
  if (style === 'kerker') {
    return (
      <svg viewBox="0 0 32 32" className={size} fill="none">
        {/* Iron bars */}
        {[8, 14, 20, 26].map((x) => (
          <rect key={x} x={x} y={4} width={2} height={24} fill={active ? '#a07818' : '#4a3a10'} rx={1} />
        ))}
        <rect x={4} y={6} width={24} height={2} fill={active ? '#c8a030' : '#5a4a18'} rx={1} />
        <rect x={4} y={18} width={24} height={2} fill={active ? '#c8a030' : '#5a4a18'} rx={1} />
        {active && <rect x={4} y={4} width={24} height={24} fill="rgba(200,120,0,0.08)" rx={2} />}
      </svg>
    );
  }
  if (style === 'hoehle') {
    return (
      <svg viewBox="0 0 32 32" className={size} fill="none">
        {/* Stalactites top */}
        <polygon points="6,4 10,14 2,14" fill={active ? '#40a090' : '#1a4a40'} />
        <polygon points="16,4 21,16 11,16" fill={active ? '#40c0b0' : '#1a5a50'} />
        <polygon points="26,4 30,12 22,12" fill={active ? '#40a090' : '#1a4a40'} />
        {/* Stalagmites bottom */}
        <polygon points="8,28 12,18 4,18" fill={active ? '#30c8a8' : '#1a5040'} />
        <polygon points="22,28 26,20 18,20" fill={active ? '#30c8a8' : '#1a5040'} />
        {/* Glow */}
        {active && <circle cx={16} cy={16} r={5} fill="rgba(64,200,180,0.2)" />}
      </svg>
    );
  }
  // Krypta
  return (
    <svg viewBox="0 0 32 32" className={size} fill="none">
      {/* Skull simplified */}
      <circle cx={16} cy={13} r={8} fill={active ? '#9060d0' : '#3a1a5a'} />
      <rect x={11} y={19} width={10} height={6} fill={active ? '#9060d0' : '#3a1a5a'} rx={1} />
      {/* Eye sockets */}
      <circle cx={13} cy={12} r={2} fill={active ? '#d0a0ff' : '#6a30a0'} />
      <circle cx={19} cy={12} r={2} fill={active ? '#d0a0ff' : '#6a30a0'} />
      {/* Teeth */}
      {[12, 16, 20].map((x) => (
        <rect key={x} x={x} y={22} width={2} height={3} fill={active ? '#e0c0ff' : '#5a2a8a'} rx={0.5} />
      ))}
      {active && <circle cx={16} cy={14} r={10} fill="rgba(140,60,255,0.1)" />}
    </svg>
  );
}
