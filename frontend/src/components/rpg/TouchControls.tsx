import { useRef, useState } from 'react';

interface TouchControlsProps {
  onDpad: (dx: number, dy: number) => void;
  onDpadRelease: () => void;
  onAction: () => void;
  onFightDir?: (dx: number, dy: number) => void;
  showInteract: boolean;
  showFight?: boolean;
  interactLabel?: string;
}

const KNOB_R     = 22;
const MAX_TRAVEL = 44;
const DEAD       = 0.22;

type JoyVisual = { base: { x: number; y: number }; kx: number; ky: number } | null;

export default function TouchControls({
  onDpad, onDpadRelease, onAction, onFightDir, showInteract, showFight = false, interactLabel = 'Öffnen',
}: TouchControlsProps) {

  // ── Left joystick (movement) ──────────────────────────────────────────────
  const moveId   = useRef<number | null>(null);
  const moveBase = useRef<{ x: number; y: number } | null>(null);
  const [moveVis, setMoveVis] = useState<JoyVisual>(null);

  const computeMove = (cx: number, cy: number) => {
    const b = moveBase.current; if (!b) return;
    const dx = cx - b.x, dy = cy - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const cl = Math.min(dist, MAX_TRAVEL);
    const a = Math.atan2(dy, dx);
    const kx = Math.cos(a) * cl, ky = Math.sin(a) * cl;
    setMoveVis({ base: { ...b }, kx, ky });
    const nx = kx / MAX_TRAVEL, ny = ky / MAX_TRAVEL;
    if (Math.sqrt(nx * nx + ny * ny) < DEAD) { onDpad(0, 0); }
    else if (Math.abs(nx) >= Math.abs(ny))    { onDpad(nx > 0 ? 1 : -1, 0); }
    else                                       { onDpad(0, ny > 0 ? 1 : -1); }
  };

  const onMoveStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (moveId.current !== null) return;
    const t = e.changedTouches[0];
    moveId.current = t.identifier;
    moveBase.current = { x: t.clientX, y: t.clientY };
    setMoveVis({ base: { x: t.clientX, y: t.clientY }, kx: 0, ky: 0 });
  };
  const onMoveMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = Array.from(e.changedTouches).find(t => t.identifier === moveId.current);
    if (t) computeMove(t.clientX, t.clientY);
  };
  const onMoveEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = Array.from(e.changedTouches).find(t => t.identifier === moveId.current);
    if (!t) return;
    moveId.current = null; moveBase.current = null;
    setMoveVis(null); onDpadRelease();
  };

  // ── Right joystick (attack) ───────────────────────────────────────────────
  const atkId    = useRef<number | null>(null);
  const atkBase  = useRef<{ x: number; y: number } | null>(null);
  const atkDir   = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [atkVis, setAtkVis] = useState<JoyVisual>(null);

  const computeAtk = (cx: number, cy: number) => {
    const b = atkBase.current; if (!b) return;
    const dx = cx - b.x, dy = cy - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const cl = Math.min(dist, MAX_TRAVEL);
    const a = Math.atan2(dy, dx);
    const kx = Math.cos(a) * cl, ky = Math.sin(a) * cl;
    setAtkVis({ base: { ...b }, kx, ky });
    const nx = kx / MAX_TRAVEL, ny = ky / MAX_TRAVEL;
    if (Math.sqrt(nx * nx + ny * ny) < DEAD) {
      atkDir.current = { dx: 0, dy: 0 };
    } else if (Math.abs(nx) >= Math.abs(ny)) {
      atkDir.current = { dx: nx > 0 ? 1 : -1, dy: 0 };
    } else {
      atkDir.current = { dx: 0, dy: ny > 0 ? 1 : -1 };
    }
  };

  const onAtkStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (atkId.current !== null) return;
    const t = e.changedTouches[0];
    atkId.current = t.identifier;
    atkBase.current = { x: t.clientX, y: t.clientY };
    atkDir.current = { dx: 0, dy: 0 };
    setAtkVis({ base: { x: t.clientX, y: t.clientY }, kx: 0, ky: 0 });
  };
  const onAtkMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = Array.from(e.changedTouches).find(t => t.identifier === atkId.current);
    if (t) computeAtk(t.clientX, t.clientY);
  };
  const onAtkEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = Array.from(e.changedTouches).find(t => t.identifier === atkId.current);
    if (!t) return;
    atkId.current = null; atkBase.current = null;
    setAtkVis(null);
    if (onFightDir) onFightDir(atkDir.current.dx, atkDir.current.dy);
  };

  // ── Shared joystick renderer ──────────────────────────────────────────────
  const renderJoy = (vis: JoyVisual, ringColor = 'rgba(255,255,255,0.2)', ringBg = 'rgba(0,0,0,0.25)') => {
    if (!vis) return null;
    return (
      <div style={{
        position: 'fixed',
        left: vis.base.x, top: vis.base.y,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none', zIndex: 100,
      }}>
        <div style={{
          position: 'absolute',
          width:  (MAX_TRAVEL + KNOB_R) * 2,
          height: (MAX_TRAVEL + KNOB_R) * 2,
          borderRadius: '50%',
          border: `2px solid ${ringColor}`,
          background: ringBg,
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
        }} />
        <div style={{
          position: 'absolute',
          width:  KNOB_R * 2,
          height: KNOB_R * 2,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.75), rgba(200,200,200,0.3))',
          border: '1.5px solid rgba(255,255,255,0.55)',
          boxShadow: '0 3px 12px rgba(0,0,0,0.6)',
          top: '50%', left: '50%',
          transform: `translate(calc(-50% + ${vis.kx}px), calc(-50% + ${vis.ky}px))`,
        }} />
      </div>
    );
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex">

      {/* Left half — movement joystick */}
      <div
        className="pointer-events-auto relative"
        style={{ flex: 1 }}
        onTouchStart={onMoveStart}
        onTouchMove={onMoveMove}
        onTouchEnd={onMoveEnd}
        onTouchCancel={onMoveEnd}
      >
        {renderJoy(moveVis)}
      </div>

      {/* Right half — attack joystick + interact button */}
      <div
        className="pointer-events-auto relative"
        style={{ flex: 1 }}
        onTouchStart={onAtkStart}
        onTouchMove={onAtkMove}
        onTouchEnd={onAtkEnd}
        onTouchCancel={onAtkEnd}
      >
        {renderJoy(
          atkVis,
          showFight ? 'rgba(220,80,40,0.65)' : 'rgba(255,255,255,0.2)',
          showFight ? 'rgba(80,10,0,0.35)'   : 'rgba(0,0,0,0.25)',
        )}

        {/* Hint label above ring when no touch active */}
        {!atkVis && showFight && (
          <div style={{
            position: 'absolute', bottom: 100, right: 0, left: 0,
            display: 'flex', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{
              background: 'rgba(180,40,20,0.85)',
              color: '#ffe0d0',
              fontFamily: 'Georgia, serif',
              fontSize: 10, fontWeight: 'bold',
              borderRadius: 999,
              padding: '2px 12px',
              letterSpacing: '0.04em',
            }}>
              Angriff halten &amp; ziehen
            </span>
          </div>
        )}

        {/* A — interact button (stops propagation so it doesn't trigger attack joystick) */}
        <div
          className="absolute flex flex-col items-center gap-2"
          style={{ bottom: 32, right: 20, pointerEvents: 'auto' }}
        >
          {showInteract && (
            <span style={{
              background: 'rgba(212,168,50,0.9)',
              color: '#3a2800',
              fontFamily: 'Georgia, serif',
              fontSize: 11, fontWeight: 'bold',
              letterSpacing: '0.04em',
              borderRadius: 999,
              padding: '2px 12px',
            }}>
              {interactLabel}
            </span>
          )}
          <button
            onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); onAction(); }}
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
