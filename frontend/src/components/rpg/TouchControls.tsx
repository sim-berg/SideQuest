import { useRef } from 'react';
import { cn } from '../../utils/cn';

interface TouchControlsProps {
  onDpad: (dx: number, dy: number) => void;
  onDpadRelease: () => void;
  onAction: () => void;
  showInteract: boolean;
}

function DpadButton({
  label,
  dx,
  dy,
  className,
  onDpad,
  onDpadRelease,
}: {
  label: string;
  dx: number;
  dy: number;
  className: string;
  onDpad: (dx: number, dy: number) => void;
  onDpadRelease: () => void;
}) {
  const pressedRef = useRef(false);

  const start = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    pressedRef.current = true;
    onDpad(dx, dy);
  };

  const end = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    pressedRef.current = false;
    onDpadRelease();
  };

  return (
    <button
      className={cn(
        'flex items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur active:bg-white/40',
        'select-none touch-none border border-white/20',
        className,
      )}
      onTouchStart={start}
      onTouchEnd={end}
      onMouseDown={start}
      onMouseUp={end}
      onMouseLeave={end}
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        {dy === -1 && <path d="M12 4l8 8H4z" />}
        {dy === 1 && <path d="M12 20l-8-8h16z" />}
        {dx === -1 && <path d="M4 12l8-8v16z" />}
        {dx === 1 && <path d="M20 12l-8 8V4z" />}
      </svg>
    </button>
  );
}

export default function TouchControls({
  onDpad,
  onDpadRelease,
  onAction,
  showInteract,
}: TouchControlsProps) {
  return (
    <div className="pointer-events-none absolute right-0 bottom-0 left-0 flex items-end justify-between px-6 pb-4">
      {/* D-pad */}
      <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-1" style={{ width: 132, height: 132 }}>
        <div />
        <DpadButton label="Oben" dx={0} dy={-1} className="h-10 w-10" onDpad={onDpad} onDpadRelease={onDpadRelease} />
        <div />
        <DpadButton label="Links" dx={-1} dy={0} className="h-10 w-10" onDpad={onDpad} onDpadRelease={onDpadRelease} />
        <div className="h-10 w-10 rounded-full bg-white/10" />
        <DpadButton label="Rechts" dx={1} dy={0} className="h-10 w-10" onDpad={onDpad} onDpadRelease={onDpadRelease} />
        <div />
        <DpadButton label="Unten" dx={0} dy={1} className="h-10 w-10" onDpad={onDpad} onDpadRelease={onDpadRelease} />
        <div />
      </div>

      {/* Action button */}
      <div className="pointer-events-auto flex flex-col items-center gap-1">
        {showInteract && (
          <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold text-amber-900 shadow">
            Sprechen
          </span>
        )}
        <button
          onTouchStart={(e) => { e.preventDefault(); onAction(); }}
          onMouseDown={(e) => { e.preventDefault(); onAction(); }}
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/30 font-bold text-xl text-white shadow-lg select-none touch-none',
            showInteract
              ? 'bg-amber-500/90 active:bg-amber-400'
              : 'bg-white/20 backdrop-blur active:bg-white/40',
          )}
          aria-label="Interagieren"
        >
          A
        </button>
      </div>
    </div>
  );
}
