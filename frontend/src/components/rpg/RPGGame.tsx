import { useEffect, useRef, useState, useCallback } from 'react';
import { SOLID_TILES } from '../../constants/rpg-zones';
import { useRpgStore } from '../../stores/useRpgStore';
import type { ZoneDef, NpcDef, GameState } from '../../types/rpg';
import TouchControls from './TouchControls';
import RPGQuestModal from './RPGQuestModal';

const MOVE_DELAY = 160;
// Visible tiles in the viewport (camera window)
const VIEWPORT_W = 20;
const VIEWPORT_H = 15;

// ─── Palette (used as fallback when background image not loaded) ──────────────

interface Palette {
  floor1: string; floor2: string; floorGrout: string;
  wallFront: string; wallTop: string; wallShadow: string;
  accent: string; accentGlow: string;
}

const PALETTES: Record<string, Palette> = {
  taverne: {
    floor1: '#C8A06A', floor2: '#B8905A', floorGrout: '#8B6A3E',
    wallFront: '#5C3A1E', wallTop: '#7A5230', wallShadow: '#3A2210',
    accent: '#E8C040', accentGlow: '#FFD060',
  },
  arena: {
    floor1: '#9E8870', floor2: '#8E7860', floorGrout: '#5E4E40',
    wallFront: '#2E3A42', wallTop: '#3E4E58', wallShadow: '#1A2228',
    accent: '#FF6A00', accentGlow: '#FFA040',
  },
  bibliothek: {
    floor1: '#6B4F3A', floor2: '#5B3F2A', floorGrout: '#3B2518',
    wallFront: '#2A1F3A', wallTop: '#3A2F4A', wallShadow: '#180F24',
    accent: '#9B6FFF', accentGlow: '#C090FF',
  },
  tempel: {
    floor1: '#B09070', floor2: '#A08060', floorGrout: '#706040',
    wallFront: '#3E2E1E', wallTop: '#5A4230', wallShadow: '#221A0E',
    accent: '#FFD700', accentGlow: '#FFE840',
  },
};

function getPalette(zone: ZoneDef): Palette {
  return PALETTES[zone.type] ?? PALETTES['taverne'];
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + Math.round(amt * 80)));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + Math.round(amt * 80)));
  const b = Math.min(255, Math.max(0, (n & 0xff) + Math.round(amt * 80)));
  return `rgb(${r},${g},${b})`;
}

// ─── Fallback tile drawing ────────────────────────────────────────────────────

function drawFallbackTile(
  ctx: CanvasRenderingContext2D,
  tile: number, bx: number, by: number, ts: number,
  p: Palette, col: number, row: number,
) {
  switch (tile) {
    case 0: { // floor
      const checker = (col + row) % 2 === 0;
      ctx.fillStyle = checker ? p.floor1 : p.floor2;
      ctx.fillRect(bx, by, ts, ts);
      ctx.fillStyle = p.floorGrout;
      ctx.fillRect(bx, by, ts, 1);
      ctx.fillRect(bx, by, 1, ts);
      break;
    }
    case 1: { // wall
      ctx.fillStyle = p.wallTop;
      ctx.fillRect(bx, by, ts, Math.round(ts * 0.3));
      ctx.fillStyle = p.wallFront;
      ctx.fillRect(bx, by + Math.round(ts * 0.3), ts, ts - Math.round(ts * 0.3));
      // brick lines
      const brickH = Math.round(ts * 0.35);
      for (let line = 0; line < 3; line++) {
        const ly = by + Math.round(ts * 0.3) + line * brickH;
        ctx.fillStyle = p.wallShadow;
        ctx.fillRect(bx, ly, ts, 1);
        const offset = (row + col + line) % 2 === 0 ? 0 : Math.round(ts * 0.5);
        ctx.fillRect(bx + offset, ly + 1, 1, brickH - 1);
      }
      break;
    }
    case 2: { // door
      ctx.fillStyle = p.floor1;
      ctx.fillRect(bx, by, ts, ts);
      ctx.fillStyle = '#8B6040';
      ctx.fillRect(bx + 2, by, ts - 4, ts - 2);
      ctx.fillStyle = '#FFD060';
      ctx.fillRect(bx + ts / 2 - 2, by + ts / 2 - 2, 4, 4);
      break;
    }
    case 11: { // rug
      const checker = (col + row) % 2 === 0;
      ctx.fillStyle = checker ? p.floor1 : p.floor2;
      ctx.fillRect(bx, by, ts, ts);
      ctx.fillStyle = p.accent + '60';
      ctx.fillRect(bx + 2, by + 2, ts - 4, ts - 4);
      break;
    }
    default: { // solid furniture
      ctx.fillStyle = p.floor1;
      ctx.fillRect(bx, by, ts, ts);
      ctx.fillStyle = shade(p.accent, -0.2);
      ctx.fillRect(bx + 2, by + 2, ts - 4, ts - 4);
      break;
    }
  }
}

// ─── NPC drawing (pixel art, procedural) ─────────────────────────────────────

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawNpc(
  ctx: CanvasRenderingContext2D,
  npc: NpcDef,
  bx: number, by: number, ts: number,
  nearby: boolean, frame: number,
) {
  const cx = Math.round(bx + ts / 2);
  const bob = nearby ? Math.round(2 * Math.sin(frame * 0.15)) : 0;

  // Shadow (flat oval via squished arc)
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.save();
  ctx.translate(cx, Math.round(by + ts * 0.92));
  ctx.scale(1, 0.28);
  fillCircle(ctx, 0, 0, Math.round(ts * 0.28));
  ctx.restore();

  // Robe / body
  ctx.fillStyle = npc.bodyColor;
  ctx.fillRect(
    Math.round(cx - ts * 0.22), Math.round(by + ts * 0.36) + bob,
    Math.round(ts * 0.44), Math.round(ts * 0.5),
  );
  // Robe flair at bottom
  ctx.fillRect(
    Math.round(cx - ts * 0.28), Math.round(by + ts * 0.72) + bob,
    Math.round(ts * 0.56), Math.round(ts * 0.2),
  );
  // Accent sash
  ctx.fillStyle = npc.accentColor;
  ctx.fillRect(
    Math.round(cx - ts * 0.22), Math.round(by + ts * 0.52) + bob,
    Math.round(ts * 0.44), Math.max(2, Math.round(ts * 0.06)),
  );

  // Head
  ctx.fillStyle = '#F5CBA7';
  fillCircle(ctx, cx, Math.round(by + ts * 0.28) + bob, Math.max(2, Math.round(ts * 0.14)));

  // Hat (pointed triangle)
  ctx.fillStyle = npc.bodyColor;
  ctx.beginPath();
  ctx.moveTo(cx, Math.round(by + ts * 0.02) + bob);
  ctx.lineTo(Math.round(cx - ts * 0.14), Math.round(by + ts * 0.16) + bob);
  ctx.lineTo(Math.round(cx + ts * 0.14), Math.round(by + ts * 0.16) + bob);
  ctx.closePath();
  ctx.fill();
  // Hat band
  ctx.fillStyle = npc.accentColor;
  ctx.fillRect(
    Math.round(cx - ts * 0.15), Math.round(by + ts * 0.14) + bob,
    Math.round(ts * 0.3), Math.max(1, Math.round(ts * 0.03)),
  );

  // Name badge (simple rect, no roundRect needed)
  const fontSize = Math.max(8, Math.round(ts * 0.2));
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const nw = Math.round(ctx.measureText(npc.name).width) + 10;
  const badgeX = Math.round(cx - nw / 2);
  const badgeY = Math.round(by - ts * 0.12) + bob;
  const badgeH = fontSize + 4;
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(badgeX, badgeY, nw, badgeH);
  ctx.fillStyle = npc.accentColor;
  ctx.fillText(npc.name, cx, badgeY + badgeH / 2);
  ctx.textBaseline = 'alphabetic';

  // Exclamation indicator when nearby
  if (nearby) {
    const pulse = 0.75 + 0.25 * Math.sin(frame * 0.18);
    const eSize = Math.max(6, Math.round(ts * 0.26));
    const ex = cx;
    const ey = Math.round(by - ts * 0.32) + bob;
    ctx.fillStyle = `rgba(255,220,40,${pulse * 0.25})`;
    fillCircle(ctx, ex, ey, eSize);
    ctx.fillStyle = `rgba(220,160,0,${pulse})`;
    fillCircle(ctx, ex, ey, Math.round(eSize * 0.72));
    ctx.fillStyle = '#1A1000';
    ctx.font = `bold ${eSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', ex, ey);
    ctx.textBaseline = 'alphabetic';
  }
}

// ─── Player drawing ───────────────────────────────────────────────────────────

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  bx: number, by: number, ts: number,
  facing: string, frame: number,
  spriteImg: HTMLImageElement | null,
  spriteLoaded: boolean,
  moving: boolean,
) {
  const cx = Math.round(bx + ts / 2);

  // Character_Walk.png: 128×128, 4 cols × 4 rows, each cell 32×32px.
  // Sprite content is centred within each 32×32 cell (~20px wide, ~27px tall).
  // Directions (rows): 0=down, 1=left, 2=right, 3=up
  if (spriteLoaded && spriteImg) {
    const FRAME_W = 32, FRAME_H = 32, COLS = 4;
    const dirRow: Record<string, number> = { down: 0, left: 1, right: 2, up: 3 };
    const dir = dirRow[facing] ?? 0;
    const animCol = moving ? Math.floor(frame / 6) % COLS : 0;
    // Draw 1 tile wide, 1 tile tall — anchored at the tile origin
    ctx.drawImage(
      spriteImg,
      animCol * FRAME_W, dir * FRAME_H, FRAME_W, FRAME_H,
      Math.round(cx - ts / 2), by, ts, ts,
    );
    return;
  }

  // Fallback: procedural pixel-art character
  const bob = moving ? Math.round(1.5 * Math.sin(frame * 0.22)) : 0;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.save();
  ctx.translate(cx, Math.round(by + ts * 0.88));
  ctx.scale(1, 0.3);
  fillCircle(ctx, 0, 0, Math.round(ts * 0.2));
  ctx.restore();

  // Boots
  ctx.fillStyle = '#3E2010';
  const bOff = facing === 'left' ? -Math.round(ts * 0.06) : facing === 'right' ? Math.round(ts * 0.06) : 0;
  ctx.fillRect(Math.round(cx - ts * 0.18) + bOff, Math.round(by + ts * 0.72) + bob, Math.round(ts * 0.14), Math.round(ts * 0.2));
  ctx.fillRect(Math.round(cx + ts * 0.04) - bOff, Math.round(by + ts * 0.72) + bob, Math.round(ts * 0.14), Math.round(ts * 0.2));

  // Tunic
  ctx.fillStyle = '#1565C0';
  ctx.fillRect(Math.round(cx - ts * 0.2), Math.round(by + ts * 0.35) + bob, Math.round(ts * 0.4), Math.round(ts * 0.38));

  // Belt
  ctx.fillStyle = '#7B5E3A';
  ctx.fillRect(Math.round(cx - ts * 0.2), Math.round(by + ts * 0.55) + bob, Math.round(ts * 0.4), Math.max(1, Math.round(ts * 0.05)));

  // Head
  ctx.fillStyle = '#F5CBA7';
  fillCircle(ctx, cx, Math.round(by + ts * 0.25) + bob, Math.max(2, Math.round(ts * 0.15)));

  // Hat
  ctx.fillStyle = '#6B3FA0';
  ctx.beginPath();
  ctx.moveTo(cx, Math.round(by + ts * 0.02) + bob);
  ctx.lineTo(Math.round(cx - ts * 0.14), Math.round(by + ts * 0.16) + bob);
  ctx.lineTo(Math.round(cx + ts * 0.14), Math.round(by + ts * 0.16) + bob);
  ctx.closePath();
  ctx.fill();
}

// ─── Main game component ──────────────────────────────────────────────────────

interface Props {
  zone: ZoneDef;
  onExit: () => void;
}


export default function RPGGame({ zone, onExit }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);
  const gsRef        = useRef<GameState>({
    playerX: zone.playerSpawnX,
    playerY: zone.playerSpawnY,
    playerFacing: 'down',
    frame: 0,
    lastMove: 0,
  });
  const keysRef    = useRef<Set<string>>(new Set());
  const dpadRef    = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const tileSizeRef = useRef(32);
  const imagesRef  = useRef<{
    bg: HTMLImageElement | null;
    charWalk: HTMLImageElement | null;
    bgLoaded: boolean;
    charLoaded: boolean;
  }>({ bg: null, charWalk: null, bgLoaded: false, charLoaded: false });

  const [activeNpc,    setActiveNpc]    = useState<NpcDef | null>(null);
  const [showInteract, setShowInteract] = useState(false);
  const quests      = useRpgStore((s) => s.quests);
  const fetchQuests = useRpgStore((s) => s.fetchQuests);

  // Compute tile size from container dimensions
  useEffect(() => {
    const compute = () => {
      const el = containerRef.current;
      if (!el) return;
      const availH = el.clientHeight - 160;
      const availW = el.clientWidth;
      tileSizeRef.current = Math.max(20, Math.min(48, Math.floor(Math.min(availW / VIEWPORT_W, availH / VIEWPORT_H))));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // Load background and character sprite images
  useEffect(() => {
    const imgs = imagesRef.current;
    imgs.bgLoaded = false;
    imgs.charLoaded = false;

    const bg = new Image();
    bg.onload = () => { imgs.bgLoaded = true; };
    bg.src = `/rpg/${zone.bgImage}`;
    imgs.bg = bg;

    const cw = new Image();
    cw.onload = () => { imgs.charLoaded = true; };
    cw.src = '/rpg/character_walk.png';
    imgs.charWalk = cw;

    return () => {
      imgs.bgLoaded = false;
      imgs.charLoaded = false;
    };
  }, [zone.bgImage]);

  // Keyboard input
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const tryInteract = useCallback(() => {
    const gs = gsRef.current;
    const adj = [
      { x: gs.playerX, y: gs.playerY - 1 },
      { x: gs.playerX, y: gs.playerY + 1 },
      { x: gs.playerX - 1, y: gs.playerY },
      { x: gs.playerX + 1, y: gs.playerY },
    ];
    for (const npc of zone.npcs) {
      if (adj.some((t) => t.x === npc.tileX && t.y === npc.tileY)) {
        setActiveNpc(npc);
        fetchQuests(zone.type);
        return;
      }
    }
  }, [zone, fetchQuests]);

  function canWalk(x: number, y: number): boolean {
    if (x < 0 || x >= zone.mapW || y < 0 || y >= zone.mapH) return false;
    if (SOLID_TILES.has(zone.tileMap[y]?.[x] ?? 1)) return false;
    if (zone.npcs.some((n) => n.tileX === x && n.tileY === y)) return false;
    return true;
  }

  // Main render + game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = (timestamp: number) => {
      const gs   = gsRef.current;
      const ts   = tileSizeRef.current;
      const ctx  = canvas.getContext('2d');
      if (!ctx) return;
      gs.frame++;

      // ── Input ──
      const keys = keysRef.current;
      const dpad = dpadRef.current;
      let moving = false;
      if (!activeNpc && timestamp - gs.lastMove > MOVE_DELAY) {
        let dx = 0, dy = 0;
        if      (keys.has('ArrowLeft')  || keys.has('a') || dpad.dx === -1) dx = -1;
        else if (keys.has('ArrowRight') || keys.has('d') || dpad.dx ===  1) dx =  1;
        else if (keys.has('ArrowUp')    || keys.has('w') || dpad.dy === -1) dy = -1;
        else if (keys.has('ArrowDown')  || keys.has('s') || dpad.dy ===  1) dy =  1;
        if (dx !== 0 || dy !== 0) {
          moving = true;
          gs.playerFacing = dx === -1 ? 'left' : dx === 1 ? 'right' : dy === -1 ? 'up' : 'down';
          const nx = gs.playerX + dx, ny = gs.playerY + dy;
          if (canWalk(nx, ny)) { gs.playerX = nx; gs.playerY = ny; }
          gs.lastMove = timestamp;
        }
        if (keys.has(' ') || keys.has('e')) {
          keys.delete(' '); keys.delete('e');
          tryInteract();
        }
      }

      // ── Nearby NPC check ──
      const adj = [
        { x: gs.playerX, y: gs.playerY - 1 }, { x: gs.playerX, y: gs.playerY + 1 },
        { x: gs.playerX - 1, y: gs.playerY }, { x: gs.playerX + 1, y: gs.playerY },
      ];
      const anyNearby = zone.npcs.some((n) => adj.some((t) => t.x === n.tileX && t.y === n.tileY));
      setShowInteract(anyNearby);

      // ── Camera (clamp to map bounds) ──
      const mapW = zone.mapW;
      const mapH = zone.mapH;
      const maxCamX = Math.max(0, mapW - VIEWPORT_W);
      const maxCamY = Math.max(0, mapH - VIEWPORT_H);
      const camX = Math.max(0, Math.min(maxCamX, gs.playerX - Math.floor(VIEWPORT_W / 2)));
      const camY = Math.max(0, Math.min(maxCamY, gs.playerY - Math.floor(VIEWPORT_H / 2)));

      const canvasW = VIEWPORT_W * ts;
      const canvasH = VIEWPORT_H * ts;
      canvas.width  = canvasW;
      canvas.height = canvasH;
      ctx.imageSmoothingEnabled = false;

      // ── Background: render pre-built room PNG (tile-accurate crop) ──
      const imgs = imagesRef.current;
      if (imgs.bgLoaded && imgs.bg) {
        // Source image: pre-rendered at 16px/tile
        const SRC_TILE = 16;
        ctx.drawImage(
          imgs.bg,
          camX * SRC_TILE, camY * SRC_TILE,
          VIEWPORT_W * SRC_TILE, VIEWPORT_H * SRC_TILE,
          0, 0, canvasW, canvasH,
        );
      } else {
        // Fallback: procedural tile drawing
        const p = getPalette(zone);
        ctx.fillStyle = p.wallFront;
        ctx.fillRect(0, 0, canvasW, canvasH);
        for (let row = camY; row < camY + VIEWPORT_H; row++) {
          for (let col = camX; col < camX + VIEWPORT_W; col++) {
            const tile = zone.tileMap[row]?.[col] ?? 1;
            drawFallbackTile(ctx, tile, (col - camX) * ts, (row - camY) * ts, ts, p, col, row);
          }
        }
      }

      // ── NPCs ──
      for (const npc of zone.npcs) {
        if (npc.tileX < camX || npc.tileX >= camX + VIEWPORT_W) continue;
        if (npc.tileY < camY || npc.tileY >= camY + VIEWPORT_H) continue;
        const isNearby = adj.some((t) => t.x === npc.tileX && t.y === npc.tileY);
        drawNpc(
          ctx, npc,
          (npc.tileX - camX) * ts,
          (npc.tileY - camY) * ts,
          ts, isNearby, gs.frame,
        );
      }

      // ── Player ──
      const px = (gs.playerX - camX) * ts;
      const py = (gs.playerY - camY) * ts;
      drawPlayer(ctx, px, py, ts, gs.playerFacing, gs.frame, imgs.charWalk, imgs.charLoaded, moving);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [zone, activeNpc, tryInteract]); // eslint-disable-line react-hooks/exhaustive-deps

  const ts = tileSizeRef.current;
  const p  = getPalette(zone);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${zone.bgGradient[0]}, ${zone.bgGradient[1]})` }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-2 px-4 py-2 pt-[env(safe-area-inset-top)]"
        style={{ zIndex: 10 }}
      >
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
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: p.accentGlow }}>
            {zone.type.toUpperCase()}
          </p>
          <p className="text-sm font-bold text-white leading-none">{zone.name}</p>
        </div>
        <div className="ml-auto rounded-full bg-black/30 px-2 py-1 text-[10px] text-white/50 backdrop-blur">
          WASD / D-Pad · A sprechen
        </div>
      </div>

      {/* Canvas viewport */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={VIEWPORT_W * ts}
          height={VIEWPORT_H * ts}
          style={{ imageRendering: 'pixelated', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
        {!activeNpc && (
          <TouchControls
            onDpad={(dx, dy) => { dpadRef.current = { dx, dy }; }}
            onDpadRelease={() => { dpadRef.current = { dx: 0, dy: 0 }; }}
            onAction={tryInteract}
            showInteract={showInteract}
          />
        )}
      </div>

      {activeNpc && (
        <RPGQuestModal npc={activeNpc} quests={quests} onClose={() => setActiveNpc(null)} />
      )}
    </div>
  );
}
