import { useEffect, useRef, useState, useCallback } from 'react';
import { SOLID_TILES, MAP_W, MAP_H } from '../../constants/rpg-zones';
import { useRpgStore } from '../../stores/useRpgStore';
import type { ZoneDef, NpcDef, GameState } from '../../types/rpg';
import TouchControls from './TouchControls';
import RPGQuestModal from './RPGQuestModal';

const MOVE_DELAY = 160; // ms between tile moves

// ─── Tile rendering ───────────────────────────────────────────────────────────

function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: number,
  px: number,
  py: number,
  ts: number,
  zone: ZoneDef,
  frame: number,
) {
  switch (tile) {
    case 0: // floor
      ctx.fillStyle = zone.floorColor;
      ctx.fillRect(px, py, ts, ts);
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
      break;
    case 1: // wall
      ctx.fillStyle = zone.wallColor;
      ctx.fillRect(px, py, ts, ts);
      // brick texture
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(px + 2, py + 2, ts - 4, ts / 2 - 3);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(px, py + ts / 2, ts, 1);
      break;
    case 2: // door
      ctx.fillStyle = zone.floorColor;
      ctx.fillRect(px, py, ts, ts);
      ctx.fillStyle = '#8B5E3C';
      ctx.fillRect(px + ts * 0.1, py + ts * 0.05, ts * 0.35, ts * 0.9);
      ctx.fillRect(px + ts * 0.55, py + ts * 0.05, ts * 0.35, ts * 0.9);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(px + ts * 0.25, py + ts * 0.4, ts * 0.08, ts * 0.08);
      ctx.fillRect(px + ts * 0.67, py + ts * 0.4, ts * 0.08, ts * 0.08);
      break;
    case 3: // table
      ctx.fillStyle = zone.floorColor;
      ctx.fillRect(px, py, ts, ts);
      ctx.fillStyle = '#7B4F2E';
      ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
      ctx.fillStyle = '#9B6F4E';
      ctx.fillRect(px + 3, py + 3, ts - 6, 2);
      break;
    case 4: // chair
      ctx.fillStyle = zone.floorColor;
      ctx.fillRect(px, py, ts, ts);
      ctx.fillStyle = '#9B7A5E';
      ctx.fillRect(px + ts * 0.2, py + ts * 0.2, ts * 0.6, ts * 0.5);
      ctx.fillStyle = '#7B5A3E';
      ctx.fillRect(px + ts * 0.2, py + ts * 0.25, ts * 0.6, ts * 0.15);
      break;
    case 5: // bar counter
      ctx.fillStyle = '#5C3310';
      ctx.fillRect(px, py, ts, ts);
      ctx.fillStyle = '#7B4A1A';
      ctx.fillRect(px + 1, py + 1, ts - 2, ts * 0.35);
      ctx.fillStyle = 'rgba(255,255,200,0.2)';
      ctx.fillRect(px + 2, py + 3, ts - 4, 2);
      break;
    case 6: { // fireplace (animated)
      ctx.fillStyle = zone.floorColor;
      ctx.fillRect(px, py, ts, ts);
      ctx.fillStyle = '#4A4A4A';
      ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
      const flicker = (frame % 6 < 3) ? 0.9 : 0.7;
      ctx.fillStyle = `rgba(255, ${Math.floor(140 * flicker)}, 0, ${flicker})`;
      ctx.fillRect(px + ts * 0.2, py + ts * 0.3, ts * 0.6, ts * 0.55);
      ctx.fillStyle = `rgba(255, 220, 50, ${flicker})`;
      ctx.fillRect(px + ts * 0.35, py + ts * 0.2, ts * 0.3, ts * 0.45);
      break;
    }
    case 7: { // bookshelf
      ctx.fillStyle = '#3E2723';
      ctx.fillRect(px, py, ts, ts);
      // colored book spines
      const bookColors = ['#B71C1C', '#1565C0', '#2E7D32', '#F57F17', '#6A1B9A'];
      const bookW = Math.max(2, ts / 6);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = bookColors[i % bookColors.length];
        ctx.fillRect(px + 2 + i * bookW + i * 0.5, py + 3, bookW, ts - 6);
      }
      break;
    }
    case 8: { // fountain
      ctx.fillStyle = zone.floorColor;
      ctx.fillRect(px, py, ts, ts);
      ctx.fillStyle = '#37474F';
      ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
      const waterAlpha = 0.7 + 0.3 * Math.sin(frame * 0.2);
      ctx.fillStyle = `rgba(41, 182, 246, ${waterAlpha})`;
      ctx.fillRect(px + 4, py + 4, ts - 8, ts - 8);
      break;
    }
    case 9: // pillar
      ctx.fillStyle = zone.floorColor;
      ctx.fillRect(px, py, ts, ts);
      ctx.fillStyle = '#78909C';
      ctx.beginPath();
      ctx.arc(px + ts / 2, py + ts / 2, ts * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#B0BEC5';
      ctx.beginPath();
      ctx.arc(px + ts / 2 - ts * 0.08, py + ts / 2 - ts * 0.08, ts * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 10: // stairs (walkable)
      ctx.fillStyle = zone.floorColor;
      ctx.fillRect(px, py, ts, ts);
      ctx.strokeStyle = '#78909C';
      ctx.lineWidth = 1;
      for (let s = 0; s < 4; s++) {
        ctx.strokeRect(px + s * ts * 0.12, py + s * ts * 0.1, ts - s * ts * 0.24, ts - s * ts * 0.2);
      }
      break;
    case 11: // rug (walkable, decorative)
      ctx.fillStyle = zone.floorColor;
      ctx.fillRect(px, py, ts, ts);
      ctx.fillStyle = 'rgba(180,120,60,0.35)';
      ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
      ctx.strokeStyle = 'rgba(220,160,80,0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 4, py + 4, ts - 8, ts - 8);
      break;
    case 12: // altar
      ctx.fillStyle = zone.floorColor;
      ctx.fillRect(px, py, ts, ts);
      ctx.fillStyle = '#4A148C';
      ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
      ctx.fillStyle = 'rgba(255,215,0,0.7)';
      ctx.fillRect(px + ts * 0.35, py + ts * 0.15, ts * 0.3, ts * 0.7);
      ctx.fillRect(px + ts * 0.15, py + ts * 0.35, ts * 0.7, ts * 0.3);
      break;
    default:
      ctx.fillStyle = '#888';
      ctx.fillRect(px, py, ts, ts);
  }
}

// ─── Character rendering ──────────────────────────────────────────────────────

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  ts: number,
  facing: GameState['playerFacing'],
  frame: number,
) {
  const cx = px + ts / 2;
  const cy = py + ts / 2;
  const r = ts * 0.18;
  const step = frame % 2 === 0 ? 0 : ts * 0.06;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, py + ts * 0.88, ts * 0.22, ts * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#3949AB';
  if (facing === 'left' || facing === 'right') {
    ctx.fillRect(cx - ts * 0.15, cy + ts * 0.1, ts * 0.12, ts * 0.25 + step);
    ctx.fillRect(cx + ts * 0.03, cy + ts * 0.1, ts * 0.12, ts * 0.25 - step);
  } else {
    ctx.fillRect(cx - ts * 0.15, cy + ts * 0.1, ts * 0.12, ts * 0.25 + step);
    ctx.fillRect(cx + ts * 0.03, cy + ts * 0.1, ts * 0.12, ts * 0.25 - step);
  }

  // Body
  ctx.fillStyle = '#1E88E5';
  ctx.fillRect(cx - ts * 0.22, cy - ts * 0.12, ts * 0.44, ts * 0.28);

  // Arms
  ctx.fillStyle = '#1565C0';
  ctx.fillRect(cx - ts * 0.35, cy - ts * 0.1, ts * 0.14, ts * 0.22);
  ctx.fillRect(cx + ts * 0.21, cy - ts * 0.1, ts * 0.14, ts * 0.22);

  // Head
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath();
  ctx.arc(cx, cy - ts * 0.2, r, 0, Math.PI * 2);
  ctx.fill();

  // Eyes depending on facing
  ctx.fillStyle = '#333';
  if (facing === 'down') {
    ctx.fillRect(cx - r * 0.45, cy - ts * 0.24, r * 0.25, r * 0.25);
    ctx.fillRect(cx + r * 0.2, cy - ts * 0.24, r * 0.25, r * 0.25);
  } else if (facing === 'up') {
    // just hair
  } else if (facing === 'left') {
    ctx.fillRect(cx - r * 0.55, cy - ts * 0.24, r * 0.3, r * 0.25);
  } else {
    ctx.fillRect(cx + r * 0.25, cy - ts * 0.24, r * 0.3, r * 0.25);
  }

  // Hat
  ctx.fillStyle = '#BF360C';
  ctx.fillRect(cx - r * 0.9, cy - ts * 0.32, r * 1.8, r * 0.35);
  ctx.fillRect(cx - r * 0.45, cy - ts * 0.5, r * 0.9, r * 0.65);
}

function drawNpc(
  ctx: CanvasRenderingContext2D,
  npc: NpcDef,
  px: number,
  py: number,
  ts: number,
  nearby: boolean,
  frame: number,
) {
  const cx = px + ts / 2;
  const cy = py + ts / 2;
  const r = ts * 0.17;
  const bob = Math.sin(frame * 0.05) * ts * 0.03;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, py + ts * 0.9, ts * 0.2, ts * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = npc.bodyColor;
  ctx.fillRect(cx - ts * 0.2, cy - ts * 0.1 + bob, ts * 0.4, ts * 0.28);

  // Head
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath();
  ctx.arc(cx, cy - ts * 0.18 + bob, r, 0, Math.PI * 2);
  ctx.fill();

  // Accent decoration
  ctx.fillStyle = npc.accentColor;
  ctx.fillRect(cx - ts * 0.2, cy - ts * 0.06 + bob, ts * 0.4, ts * 0.06);

  // Eyes
  ctx.fillStyle = '#333';
  ctx.fillRect(cx - r * 0.45, cy - ts * 0.22 + bob, r * 0.25, r * 0.25);
  ctx.fillRect(cx + r * 0.2, cy - ts * 0.22 + bob, r * 0.25, r * 0.25);

  // Name tag
  ctx.font = `bold ${Math.max(8, ts * 0.22)}px sans-serif`;
  ctx.textAlign = 'center';
  const nameWidth = ctx.measureText(npc.name).width + 8;
  const nameY = py - ts * 0.08 + bob;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.beginPath();
  ctx.roundRect(cx - nameWidth / 2, nameY - ts * 0.18, nameWidth, ts * 0.2, 3);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText(npc.name, cx, nameY - ts * 0.03);

  // Interaction indicator
  if (nearby) {
    const pulse = 0.7 + 0.3 * Math.sin(frame * 0.15);
    ctx.fillStyle = `rgba(255, 200, 50, ${pulse})`;
    ctx.font = `${ts * 0.35}px sans-serif`;
    ctx.fillText('!', cx, py - ts * 0.02 + bob);
  }
}

// ─── Main game component ───────────────────────────────────────────────────────

interface Props {
  zone: ZoneDef;
  onExit: () => void;
}

export default function RPGGame({ zone, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const gsRef = useRef<GameState>({
    playerX: zone.playerSpawnX,
    playerY: zone.playerSpawnY,
    playerFacing: 'down',
    frame: 0,
    lastMove: 0,
  });
  const keysRef = useRef<Set<string>>(new Set());
  const dpadRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const tileSizeRef = useRef(32);

  const [activeNpc, setActiveNpc] = useState<NpcDef | null>(null);
  const [showInteract, setShowInteract] = useState(false);
  const quests = useRpgStore((s) => s.quests);
  const fetchQuests = useRpgStore((s) => s.fetchQuests);

  // Compute tile size from container
  useEffect(() => {
    const compute = () => {
      const el = containerRef.current;
      if (!el) return;
      const availH = el.clientHeight - 140; // minus touch controls area
      const availW = el.clientWidth;
      tileSizeRef.current = Math.max(20, Math.min(48, Math.floor(Math.min(availW / MAP_W, availH / MAP_H))));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const tryInteract = useCallback(() => {
    const gs = gsRef.current;
    const adjacentTiles = [
      { x: gs.playerX, y: gs.playerY - 1 },
      { x: gs.playerX, y: gs.playerY + 1 },
      { x: gs.playerX - 1, y: gs.playerY },
      { x: gs.playerX + 1, y: gs.playerY },
    ];
    for (const npc of zone.npcs) {
      if (adjacentTiles.some((t) => t.x === npc.tileX && t.y === npc.tileY)) {
        setActiveNpc(npc);
        fetchQuests(zone.type);
        return;
      }
    }
  }, [zone, fetchQuests]);

  function canWalk(x: number, y: number): boolean {
    if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return false;
    const tile = zone.tileMap[y]?.[x] ?? 1;
    if (SOLID_TILES.has(tile)) return false;
    // Can't walk on NPC tiles
    if (zone.npcs.some((n) => n.tileX === x && n.tileY === y)) return false;
    return true;
  }

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = (timestamp: number) => {
      const gs = gsRef.current;
      const ts = tileSizeRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      gs.frame++;

      // ─── Input ───────────────────────────────────────────────────
      const keys = keysRef.current;
      const dpad = dpadRef.current;
      const now = timestamp;

      if (!activeNpc && now - gs.lastMove > MOVE_DELAY) {
        let dx = 0;
        let dy = 0;

        if (keys.has('ArrowLeft') || keys.has('a') || dpad.dx === -1) { dx = -1; }
        else if (keys.has('ArrowRight') || keys.has('d') || dpad.dx === 1) { dx = 1; }
        else if (keys.has('ArrowUp') || keys.has('w') || dpad.dy === -1) { dy = -1; }
        else if (keys.has('ArrowDown') || keys.has('s') || dpad.dy === 1) { dy = 1; }

        if (dx !== 0 || dy !== 0) {
          const facing = dx === -1 ? 'left' : dx === 1 ? 'right' : dy === -1 ? 'up' : 'down';
          gs.playerFacing = facing;

          const nx = gs.playerX + dx;
          const ny = gs.playerY + dy;
          if (canWalk(nx, ny)) {
            gs.playerX = nx;
            gs.playerY = ny;
          }
          gs.lastMove = now;
        }

        if (keys.has(' ') || keys.has('e')) {
          keys.delete(' ');
          keys.delete('e');
          tryInteract();
        }
      }

      // ─── Check nearby NPC for interact hint ─────────────────────
      const adjacentTiles = [
        { x: gs.playerX, y: gs.playerY - 1 },
        { x: gs.playerX, y: gs.playerY + 1 },
        { x: gs.playerX - 1, y: gs.playerY },
        { x: gs.playerX + 1, y: gs.playerY },
      ];
      const nearby = zone.npcs.some((n) =>
        adjacentTiles.some((t) => t.x === n.tileX && t.y === n.tileY),
      );
      setShowInteract(nearby);

      // ─── Render ─────────────────────────────────────────────────
      const mapW = MAP_W * ts;
      const mapH = MAP_H * ts;
      canvas.width = mapW;
      canvas.height = mapH;

      // Background
      ctx.fillStyle = zone.wallColor;
      ctx.fillRect(0, 0, mapW, mapH);

      // Tiles
      for (let row = 0; row < MAP_H; row++) {
        for (let col = 0; col < MAP_W; col++) {
          const tile = zone.tileMap[row]?.[col] ?? 1;
          drawTile(ctx, tile, col * ts, row * ts, ts, zone, gs.frame);
        }
      }

      // NPCs
      for (const npc of zone.npcs) {
        const isNearby = adjacentTiles.some(
          (t) => t.x === npc.tileX && t.y === npc.tileY,
        );
        drawNpc(ctx, npc, npc.tileX * ts, npc.tileY * ts, ts, isNearby, gs.frame);
      }

      // Player
      drawPlayer(ctx, gs.playerX * ts, gs.playerY * ts, ts, gs.playerFacing, gs.frame);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [zone, activeNpc, tryInteract]); // eslint-disable-line react-hooks/exhaustive-deps

  const ts = tileSizeRef.current;

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${zone.bgGradient[0]}, ${zone.bgGradient[1]})` }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2 pt-[env(safe-area-inset-top)]" style={{ zIndex: 10 }}>
        <button
          onClick={onExit}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur"
          aria-label="Verlassen"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: zone.accentColor }}>
            {zone.type.toUpperCase()}
          </p>
          <p className="text-sm font-bold text-white leading-none">{zone.name}</p>
        </div>
        <div className="ml-auto rounded-full bg-black/30 px-2 py-1 text-[10px] text-white/60 backdrop-blur">
          WASD / D-Pad · A zum Sprechen
        </div>
      </div>

      {/* Canvas area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={MAP_W * ts}
          height={MAP_H * ts}
          style={{
            imageRendering: 'pixelated',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />

        {/* Touch controls overlay */}
        {!activeNpc && (
          <TouchControls
            onDpad={(dx, dy) => { dpadRef.current = { dx, dy }; }}
            onDpadRelease={() => { dpadRef.current = { dx: 0, dy: 0 }; }}
            onAction={tryInteract}
            showInteract={showInteract}
          />
        )}
      </div>

      {/* Quest modal overlay */}
      {activeNpc && (
        <RPGQuestModal
          npc={activeNpc}
          quests={quests}
          onClose={() => setActiveNpc(null)}
        />
      )}
    </div>
  );
}
