import { useRef, useState } from 'react';

interface TouchControlsProps {
  onDpad: (dx: number, dy: number) => void;
  onDpadRelease: () => void;
  onAction: () => void;
  onFight?: () => void;
  showInteract: boolean;
  showFight?: boolean;
  interactLabel?: string;
}

const KNOB_R     = 22;
const MAX_TRAVEL = 44;
const DEAD       = 0.22;

export default function TouchControls({
  onDpad, onDpadRelease, onAction, onFight, showInteract, showFight = false, interactLabel = 'Öffnen',
}: TouchControlsProps) {
  const activeId  = useRef<number | null>(null);
  const baseRef   = useRef<{ x: number; y: number } | null>(null);

  // Only knob offset + base position need to trigger re-render for visual
  const [visual, setVisual] = useState<{ base: { x: number; y: number }; kx: number; ky: number } | null>(null);

  const compute = (touchX: number, touchY: number) => {
    const b = baseRef.current;
    if (!b) return;
    const dx = touchX - b.x;
    const dy = touchY - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, MAX_TRAVEL);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clamped;
    const ky = Math.sin(angle) * clamped;

    setVisual({ base: { ...b }, kx, ky });

    const nx = kx / MAX_TRAVEL;
    const ny = ky / MAX_TRAVEL;
    if (Math.sqrt(nx * nx + ny * ny) < DEAD) {
      onDpad(0, 0);
    } else if (Math.abs(nx) >= Math.abs(ny)) {
      onDpad(nx > 0 ? 1 : -1, 0);
    } else {
      onDpad(0, ny > 0 ? 1 : -1);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (activeId.current !== null) return;
    const t = e.changedTouches[0];
    activeId.current = t.identifier;
    baseRef.current = { x: t.clientX, y: t.clientY };
    setVisual({ base: { x: t.clientX, y: t.clientY }, kx: 0, ky: 0 });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === activeId.current);
    if (!touch) return;
    compute(touch.clientX, touch.clientY);
  };

  const release = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === activeId.current);
    if (!touch) return;
    activeId.current = null;
    baseRef.current = null;
    setVisual(null);
    onDpadRelease();
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex">

      {/* Left half — joystick zone */}
      <div
        className="pointer-events-auto relative"
        style={{ flex: 1 }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={release}
        onTouchCancel={release}
      >
        {visual && (
          <div style={{
            position: 'fixed',
            left: visual.base.x,
            top: visual.base.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 100,
          }}>
            {/* Outer ring */}
            <div style={{
              position: 'absolute',
              width:  (MAX_TRAVEL + KNOB_R) * 2,
              height: (MAX_TRAVEL + KNOB_R) * 2,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.25)',
              top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
            }} />
            {/* Knob */}
            <div style={{
              position: 'absolute',
              width:  KNOB_R * 2,
              height: KNOB_R * 2,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.75), rgba(200,200,200,0.3))',
              border: '1.5px solid rgba(255,255,255,0.55)',
              boxShadow: '0 3px 12px rgba(0,0,0,0.6)',
              top: '50%', left: '50%',
              transform: `translate(calc(-50% + ${visual.kx}px), calc(-50% + ${visual.ky}px))`,
            }} />
          </div>
        )}
      </div>

      {/* Right half — action buttons */}
      <div
        className="pointer-events-none flex items-end justify-end gap-3"
        style={{ flex: 1, paddingBottom: 32, paddingRight: 20 }}
      >
        {/* B — fight button (only when onFight provided) */}
        {onFight && (
          <div className="pointer-events-auto flex flex-col items-center gap-1 mb-1">
            {showFight && (
              <span style={{
                background: 'rgba(180,40,20,0.9)',
                color: '#ffe0d0',
                fontFamily: 'Georgia, serif',
                fontSize: 10,
                fontWeight: 'bold',
                borderRadius: 999,
                padding: '2px 10px',
                letterSpacing: '0.04em',
              }}>
                Kämpfen
              </span>
            )}
            <button
              onTouchStart={(e) => { e.preventDefault(); onFight(); }}
              onMouseDown={(e) => { e.preventDefault(); onFight(); }}
              className="select-none touch-none flex items-center justify-center font-bold"
              style={{
                width: 52, height: 52,
                borderRadius: '50%',
                background: showFight
                  ? 'radial-gradient(circle at 38% 32%, #e04020, #801808)'
                  : 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.25), rgba(255,255,255,0.08))',
                border: `2px solid ${showFight ? 'rgba(220,80,40,0.9)' : 'rgba(255,255,255,0.2)'}`,
                boxShadow: showFight
                  ? '0 0 20px rgba(200,60,20,0.7), 0 3px 10px rgba(0,0,0,0.5)'
                  : '0 3px 10px rgba(0,0,0,0.4)',
                color: showFight ? '#ffe0d0' : 'rgba(255,255,255,0.5)',
                fontSize: 18,
              }}
              aria-label="Kämpfen"
            >
              ⚔
            </button>
          </div>
        )}

        {/* A — interact button */}
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          {showInteract && (
            <span style={{
              background: 'rgba(212,168,50,0.9)',
              color: '#3a2800',
              fontFamily: 'Georgia, serif',
              fontSize: 11,
              fontWeight: 'bold',
              letterSpacing: '0.04em',
              borderRadius: 999,
              padding: '2px 12px',
            }}>
              {interactLabel}
            </span>
          )}
          <button
            onTouchStart={(e) => { e.preventDefault(); onAction(); }}
            onMouseDown={(e) => { e.preventDefault(); onAction(); }}
            className="select-none touch-none flex items-center justify-center font-bold"
            style={{
              width: 64, height: 64,
              borderRadius: '50%',
              background: showInteract
                ? 'radial-gradient(circle at 38% 32%, #f0c040, #b07810)'
                : 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.35), rgba(255,255,255,0.12))',
              border: `2px solid ${showInteract ? 'rgba(220,170,40,0.8)' : 'rgba(255,255,255,0.3)'}`,
              boxShadow: showInteract
                ? '0 0 20px rgba(200,140,0,0.6), 0 3px 10px rgba(0,0,0,0.5)'
                : '0 3px 10px rgba(0,0,0,0.5)',
              color: showInteract ? '#3a2800' : 'rgba(255,255,255,0.8)',
              fontSize: 20,
            }}
            aria-label="Interagieren"
          >
            A
          </button>
        </div>
      </div>

    </div>
  );
}
