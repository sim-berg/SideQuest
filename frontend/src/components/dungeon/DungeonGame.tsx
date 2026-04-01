import { useEffect, useRef, useState, useCallback } from 'react';
import {
  T_WALL, T_FLOOR, T_DOOR, T_TORCH, T_EXIT, T_WATER, T_DECOR,
  T_CHEST_GOLD, T_CHEST_WOOD, T_CHEST_STEEL,
  T_BARREL, T_BARREL_SWORD, T_SKULL, T_BRAZIER,
  T_WEAPONS_STAND, T_ARMOR_STAND, T_SACK, T_CRATE,
  T_BONES, T_CANDLE, T_POT, T_LOOT_FLOOR, T_VOID,
  DUNGEON_SOLID, type DungeonMap,
} from './DungeonGenerator';
import TouchControls from '../rpg/TouchControls';

const VIEWPORT_W = 20;
const VIEWPORT_H = 15;
const MOVE_DELAY = 150;
const LIGHT_RADIUS = 7; // tiles visible around player

// ─── Palettes ────────────────────────────────────────────────────────────────

type Pal = {
  floor: string; floor2: string; grout: string;
  wallFront: string; wallTop: string; wallBrick: string;
  torch: string; torchGlow: string;
  water: string; exit: string; decor: string;
};

const PALETTES: Record<string, Pal> = {
  kerker: {
    floor: '#2e2a26', floor2: '#262220', grout: '#1a1614',
    wallFront: '#1a1614', wallTop: '#252018', wallBrick: '#221c18',
    torch: '#ff8c00', torchGlow: 'rgba(255,120,0,',
    water: '#1a2a3a', exit: '#c8b400', decor: '#5a4a2a',
  },
  hoehle: {
    floor: '#2e2618', floor2: '#282010', grout: '#1a1408',
    wallFront: '#1a1208', wallTop: '#221808', wallBrick: '#1c1408',
    torch: '#40e0d0', torchGlow: 'rgba(64,200,180,',
    water: '#0a1e3a', exit: '#80ff80', decor: '#1a3a1a',
  },
  krypta: {
    floor: '#1e1a28', floor2: '#1a1622', grout: '#100c18',
    wallFront: '#0e0a18', wallTop: '#1a1428', wallBrick: '#161020',
    torch: '#c080ff', torchGlow: 'rgba(160,80,255,',
    water: '#120a2a', exit: '#8040ff', decor: '#3a1a5a',
  },
};

// ─── Tile drawing ─────────────────────────────────────────────────────────────

function drawDungeonTile(
  ctx: CanvasRenderingContext2D,
  tile: number, bx: number, by: number, ts: number,
  p: Pal, col: number, row: number, frame: number,
  tiles?: number[][],
) {
  switch (tile) {
    case T_FLOOR:
    case T_DECOR: {
      const checker = (col + row) % 2 === 0;
      ctx.fillStyle = checker ? p.floor : p.floor2;
      ctx.fillRect(bx, by, ts, ts);
      ctx.fillStyle = p.grout;
      ctx.fillRect(bx, by, ts, 1);
      ctx.fillRect(bx, by, 1, ts);
      if (tile === T_DECOR) {
        // Draw a small rune/skull symbol in center
        ctx.fillStyle = p.decor;
        const cx = bx + ts / 2, cy = by + ts / 2, r = ts * 0.28;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = p.floor;
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case T_DOOR: {
      // Floor base
      const checker = (col + row) % 2 === 0;
      ctx.fillStyle = checker ? p.floor : p.floor2;
      ctx.fillRect(bx, by, ts, ts);
      // Archway pillars on left/right edges
      const pw = Math.round(ts * 0.14);
      ctx.fillStyle = p.wallFront;
      ctx.fillRect(bx, by, pw, ts);
      ctx.fillRect(bx + ts - pw, by, pw, ts);
      // Pillar highlight
      ctx.fillStyle = p.wallTop;
      ctx.fillRect(bx, by, pw, Math.round(ts * 0.35));
      ctx.fillRect(bx + ts - pw, by, pw, Math.round(ts * 0.35));
      // Top arch lintel
      ctx.fillStyle = p.wallFront;
      ctx.fillRect(bx, by, ts, Math.round(ts * 0.18));
      ctx.fillStyle = p.wallTop;
      ctx.fillRect(bx, by, ts, Math.round(ts * 0.08));
      // Metal hinge dots
      ctx.fillStyle = '#5a4a1a';
      ctx.fillRect(bx + pw - 2, Math.round(by + ts * 0.25), 3, 3);
      ctx.fillRect(bx + ts - pw, Math.round(by + ts * 0.25), 3, 3);
      break;
    }
    case T_WALL: {
      // Detect if left or right neighbor is open (side wall) vs top/bottom wall
      const leftOpen  = tiles ? !DUNGEON_SOLID.has(tiles[row]?.[col - 1] ?? T_WALL) : false;
      const rightOpen = tiles ? !DUNGEON_SOLID.has(tiles[row]?.[col + 1] ?? T_WALL) : false;
      const isSide = leftOpen || rightOpen;

      if (isSide) {
        // Side wall — lit band on the OPPOSITE side of the open space (180° fix)
        const bandW = Math.round(ts * 0.3);
        if (rightOpen) {
          // Floor is on the right → lit face on the LEFT
          ctx.fillStyle = p.wallFront;
          ctx.fillRect(bx + bandW, by, ts - bandW, ts);
          ctx.fillStyle = p.wallTop;
          ctx.fillRect(bx, by, bandW, ts);
        } else {
          // Floor is on the left → lit face on the RIGHT
          ctx.fillStyle = p.wallFront;
          ctx.fillRect(bx, by, ts - bandW, ts);
          ctx.fillStyle = p.wallTop;
          ctx.fillRect(bx + ts - bandW, by, bandW, ts);
        }
        // Vertical brick lines
        const bw = Math.round(ts * 0.32);
        for (let i = 0; i < 3; i++) {
          const lx = bx + i * bw;
          ctx.fillStyle = p.wallBrick;
          ctx.fillRect(lx, by, 1, ts);
          const off = ((col ^ row) + i) % 2 === 0 ? 0 : Math.round(ts * 0.45);
          ctx.fillRect(lx, by + off, bw, 1);
        }
        // Highlight on the lit edge
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(rightOpen ? bx : bx + ts - bandW, by, 2, ts);
      } else {
        // Top / bottom wall — horizontal bricks (original rendering)
        ctx.fillStyle = p.wallTop;
        ctx.fillRect(bx, by, ts, Math.round(ts * 0.35));
        ctx.fillStyle = p.wallFront;
        ctx.fillRect(bx, by + Math.round(ts * 0.35), ts, ts - Math.round(ts * 0.35));
        const bh = Math.round(ts * 0.32);
        for (let i = 0; i < 3; i++) {
          const ly = by + Math.round(ts * 0.35) + i * bh;
          ctx.fillStyle = p.wallBrick;
          ctx.fillRect(bx, ly, ts, 1);
          const off = ((col ^ row) + i) % 2 === 0 ? 0 : Math.round(ts * 0.45);
          ctx.fillRect(bx + off, ly, 1, bh);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(bx, by, ts, 2);
      }
      break;
    }
    case T_TORCH: {
      // Wall base
      ctx.fillStyle = p.wallFront;
      ctx.fillRect(bx, by, ts, ts);
      ctx.fillStyle = p.wallTop;
      ctx.fillRect(bx, by, ts, Math.round(ts * 0.3));
      // Torch bracket
      const cx = bx + ts / 2;
      ctx.fillStyle = '#5a4a2a';
      ctx.fillRect(Math.round(cx - ts * 0.08), Math.round(by + ts * 0.3), Math.round(ts * 0.16), Math.round(ts * 0.4));
      // Flame animation
      const flick = 0.8 + 0.2 * Math.sin(frame * 0.2 + col);
      const flick2 = 0.8 + 0.2 * Math.sin(frame * 0.15 + row * 1.3);
      // Outer glow
      const grad = ctx.createRadialGradient(cx, by + ts * 0.25, 0, cx, by + ts * 0.25, ts * 0.5);
      grad.addColorStop(0, p.torchGlow + (0.3 * flick) + ')');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by, ts, ts);
      // Flame core
      ctx.fillStyle = p.torch;
      const fw = Math.round(ts * 0.16 * flick);
      const fh = Math.round(ts * 0.22 * flick2);
      ctx.fillRect(Math.round(cx - fw / 2), Math.round(by + ts * 0.05), fw, fh);
      ctx.fillStyle = '#fff8e0';
      ctx.fillRect(Math.round(cx - fw * 0.3), Math.round(by + ts * 0.07), Math.round(fw * 0.6), Math.round(fh * 0.4));
      break;
    }
    case T_EXIT: {
      const checker = (col + row) % 2 === 0;
      ctx.fillStyle = checker ? p.floor : p.floor2;
      ctx.fillRect(bx, by, ts, ts);
      // Glowing portal ring
      const cx = bx + ts / 2, cy = by + ts / 2;
      const pulse = 0.7 + 0.3 * Math.sin(frame * 0.1);
      // Glow
      ctx.strokeStyle = p.exit;
      ctx.lineWidth = 2;
      ctx.globalAlpha = pulse * 0.9;
      ctx.beginPath();
      ctx.arc(cx, cy, ts * 0.36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, ts * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Arrow down symbol
      ctx.fillStyle = p.exit;
      ctx.globalAlpha = pulse * 0.8;
      ctx.font = `bold ${Math.round(ts * 0.4)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▼', cx, cy);
      ctx.globalAlpha = 1;
      ctx.textBaseline = 'alphabetic';
      break;
    }
    case T_WATER: {
      const wave = 0.7 + 0.3 * Math.sin(frame * 0.05 + col * 0.8 + row * 0.6);
      ctx.fillStyle = p.water;
      ctx.fillRect(bx, by, ts, ts);
      ctx.fillStyle = `rgba(80,160,255,${0.15 * wave})`;
      ctx.fillRect(bx, by + Math.round(ts * 0.3 * wave), ts, Math.round(ts * 0.15));
      ctx.fillStyle = `rgba(180,220,255,${0.1 * wave})`;
      ctx.fillRect(bx + 2, by + Math.round(ts * 0.15), Math.round(ts * 0.4), 1);
      break;
    }
    case T_LOOT_FLOOR: {
      // Shimmering golden floor
      ctx.fillStyle = '#2a2410';
      ctx.fillRect(bx, by, ts, ts);
      ctx.fillStyle = '#3a3018';
      ctx.fillRect(bx, by, ts, 1);
      ctx.fillRect(bx, by, 1, ts);
      // Gold sparkle
      const sparkle = 0.5 + 0.5 * Math.sin(frame * 0.08 + col * 0.7 + row * 1.1);
      ctx.fillStyle = `rgba(220,180,40,${0.12 * sparkle})`;
      ctx.fillRect(bx, by, ts, ts);
      break;
    }
    case T_CHEST_GOLD:
    case T_CHEST_WOOD:
    case T_CHEST_STEEL: {
      // Floor base
      ctx.fillStyle = p.floor;
      ctx.fillRect(bx, by, ts, ts);
      const cx = bx + ts / 2;
      const cy = by + ts * 0.55;
      const cw2 = Math.round(ts * 0.55);
      const ch2 = Math.round(ts * 0.38);
      const lid = Math.round(ts * 0.13);
      const bodyColor = tile === T_CHEST_GOLD ? '#8b6914' : tile === T_CHEST_STEEL ? '#4a5060' : '#6b4a20';
      const bandColor = tile === T_CHEST_GOLD ? '#c8a030' : tile === T_CHEST_STEEL ? '#7a8090' : '#4a3010';
      const lidColor  = tile === T_CHEST_GOLD ? '#a07818' : tile === T_CHEST_STEEL ? '#5a6070' : '#7a5628';
      // Glow for gold/legendary
      if (tile === T_CHEST_GOLD) {
        const pulse = 0.6 + 0.4 * Math.sin(frame * 0.1 + col);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, ts * 0.5);
        g.addColorStop(0, `rgba(220,170,20,${0.35 * pulse})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(bx, by, ts, ts);
      }
      // Chest body
      ctx.fillStyle = bodyColor;
      ctx.fillRect(Math.round(cx - cw2 / 2), Math.round(cy - ch2 / 2 + lid / 2), cw2, ch2);
      // Chest lid
      ctx.fillStyle = lidColor;
      ctx.fillRect(Math.round(cx - cw2 / 2), Math.round(cy - ch2 / 2 - lid / 2), cw2, lid);
      // Metal bands
      ctx.fillStyle = bandColor;
      ctx.fillRect(Math.round(cx - cw2 / 2), Math.round(cy - ch2 / 2 + lid / 2), cw2, 1);
      ctx.fillRect(Math.round(cx - 1), Math.round(cy - ch2 / 2 - lid / 2), 2, ch2 + lid);
      // Lock
      ctx.fillStyle = tile === T_CHEST_GOLD ? '#ffe060' : tile === T_CHEST_STEEL ? '#c0c8d0' : '#c8a030';
      ctx.fillRect(Math.round(cx - 2), Math.round(cy - 2), 4, 4);
      break;
    }
    case T_BARREL:
    case T_BARREL_SWORD: {
      ctx.fillStyle = p.floor;
      ctx.fillRect(bx, by, ts, ts);
      const cx = bx + ts / 2;
      const cy = by + ts * 0.52;
      const bw = Math.round(ts * 0.46);
      const bh = Math.round(ts * 0.58);
      // Stave
      ctx.fillStyle = '#5a3e18';
      ctx.beginPath();
      ctx.ellipse(Math.round(cx), Math.round(cy), Math.round(bw / 2), Math.round(bh / 2), 0, 0, Math.PI * 2);
      ctx.fill();
      // Hoops
      ctx.strokeStyle = '#8a6830';
      ctx.lineWidth = 1;
      for (const oy of [-0.15, 0.08]) {
        ctx.beginPath();
        ctx.ellipse(Math.round(cx), Math.round(cy + oy * bh), Math.round(bw / 2), Math.round(bh * 0.15), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Sword sticking out for T_BARREL_SWORD
      if (tile === T_BARREL_SWORD) {
        ctx.strokeStyle = '#a0b0c0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.round(cx + ts * 0.05), Math.round(by + ts * 0.04));
        ctx.lineTo(Math.round(cx + ts * 0.05), Math.round(by + ts * 0.28));
        ctx.stroke();
        // Crossguard
        ctx.strokeStyle = '#c8a030';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.round(cx - ts * 0.08), Math.round(by + ts * 0.24));
        ctx.lineTo(Math.round(cx + ts * 0.18), Math.round(by + ts * 0.24));
        ctx.stroke();
      }
      break;
    }
    case T_SKULL: {
      // Walkable — floor first
      const checker = (col + row) % 2 === 0;
      ctx.fillStyle = checker ? p.floor : p.floor2;
      ctx.fillRect(bx, by, ts, ts);
      const cx = bx + ts / 2, cy = by + ts * 0.52;
      const r = Math.max(2, Math.round(ts * 0.22));
      // Skull dome
      ctx.fillStyle = '#c8c0b0';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      // Jaw
      ctx.fillStyle = '#b0a898';
      ctx.fillRect(Math.round(cx - r * 0.7), Math.round(cy + r * 0.4), Math.round(r * 1.4), Math.round(r * 0.6));
      // Eyes
      ctx.fillStyle = '#1a1614';
      ctx.beginPath(); ctx.arc(Math.round(cx - r * 0.38), Math.round(cy - r * 0.12), Math.max(1, Math.round(r * 0.3)), 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(Math.round(cx + r * 0.38), Math.round(cy - r * 0.12), Math.max(1, Math.round(r * 0.3)), 0, Math.PI * 2); ctx.fill();
      break;
    }
    case T_BRAZIER: {
      ctx.fillStyle = p.floor;
      ctx.fillRect(bx, by, ts, ts);
      const cx = bx + ts / 2;
      const base = by + ts * 0.72;
      // Stand
      ctx.fillStyle = '#5a4a2a';
      ctx.fillRect(Math.round(cx - ts * 0.06), Math.round(base - ts * 0.32), Math.round(ts * 0.12), Math.round(ts * 0.32));
      // Bowl
      ctx.fillStyle = '#4a3a1a';
      ctx.beginPath();
      ctx.moveTo(Math.round(cx - ts * 0.2), Math.round(base - ts * 0.32));
      ctx.lineTo(Math.round(cx + ts * 0.2), Math.round(base - ts * 0.32));
      ctx.lineTo(Math.round(cx + ts * 0.14), Math.round(base - ts * 0.18));
      ctx.lineTo(Math.round(cx - ts * 0.14), Math.round(base - ts * 0.18));
      ctx.closePath();
      ctx.fill();
      // Flame
      const flick = 0.8 + 0.2 * Math.sin(frame * 0.18 + col * 1.1);
      const fh2 = Math.round(ts * 0.24 * flick);
      // Glow
      const bg2 = ctx.createRadialGradient(cx, Math.round(base - ts * 0.4), 0, cx, Math.round(base - ts * 0.4), ts * 0.55);
      bg2.addColorStop(0, p.torchGlow + (0.4 * flick) + ')');
      bg2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg2;
      ctx.fillRect(bx, by, ts, ts);
      ctx.fillStyle = p.torch;
      ctx.fillRect(Math.round(cx - ts * 0.1), Math.round(base - ts * 0.32 - fh2), Math.round(ts * 0.2), fh2);
      ctx.fillStyle = '#fff8e0';
      ctx.fillRect(Math.round(cx - ts * 0.05), Math.round(base - ts * 0.32 - fh2 + 2), Math.round(ts * 0.1), Math.round(fh2 * 0.4));
      break;
    }
    case T_WEAPONS_STAND: {
      ctx.fillStyle = p.floor;
      ctx.fillRect(bx, by, ts, ts);
      const cx = bx + ts / 2;
      // Vertical pole
      ctx.fillStyle = '#6a5028';
      ctx.fillRect(Math.round(cx - 1), Math.round(by + ts * 0.18), 2, Math.round(ts * 0.65));
      // Crossbar
      ctx.fillStyle = '#8a6830';
      ctx.fillRect(Math.round(cx - ts * 0.28), Math.round(by + ts * 0.28), Math.round(ts * 0.56), 2);
      // Swords
      ctx.strokeStyle = '#b0c0d0';
      ctx.lineWidth = 1.5;
      for (const ox of [-0.18, 0.18]) {
        ctx.beginPath();
        ctx.moveTo(Math.round(cx + ox * ts), Math.round(by + ts * 0.2));
        ctx.lineTo(Math.round(cx + ox * ts), Math.round(by + ts * 0.7));
        ctx.stroke();
      }
      // Crossguards
      ctx.strokeStyle = '#c8a030';
      ctx.lineWidth = 1;
      for (const ox of [-0.18, 0.18]) {
        ctx.beginPath();
        ctx.moveTo(Math.round(cx + (ox - 0.1) * ts), Math.round(by + ts * 0.42));
        ctx.lineTo(Math.round(cx + (ox + 0.1) * ts), Math.round(by + ts * 0.42));
        ctx.stroke();
      }
      break;
    }
    case T_ARMOR_STAND: {
      ctx.fillStyle = p.floor;
      ctx.fillRect(bx, by, ts, ts);
      const cx = bx + ts / 2;
      // Body silhouette
      ctx.fillStyle = '#4a4a50';
      // Torso
      ctx.fillRect(Math.round(cx - ts * 0.2), Math.round(by + ts * 0.26), Math.round(ts * 0.4), Math.round(ts * 0.38));
      // Head/helmet
      ctx.beginPath(); ctx.arc(Math.round(cx), Math.round(by + ts * 0.2), Math.round(ts * 0.14), 0, Math.PI * 2); ctx.fill();
      // Shoulders
      ctx.fillRect(Math.round(cx - ts * 0.3), Math.round(by + ts * 0.28), Math.round(ts * 0.14), Math.round(ts * 0.14));
      ctx.fillRect(Math.round(cx + ts * 0.16), Math.round(by + ts * 0.28), Math.round(ts * 0.14), Math.round(ts * 0.14));
      // Metal glint
      ctx.fillStyle = '#7a7a80';
      ctx.fillRect(Math.round(cx - ts * 0.06), Math.round(by + ts * 0.3), Math.round(ts * 0.12), Math.round(ts * 0.06));
      break;
    }
    case T_SACK: {
      ctx.fillStyle = p.floor;
      ctx.fillRect(bx, by, ts, ts);
      const cx = bx + ts / 2, cy = by + ts * 0.56;
      ctx.fillStyle = '#7a6030';
      ctx.beginPath();
      ctx.ellipse(Math.round(cx), Math.round(cy), Math.round(ts * 0.24), Math.round(ts * 0.28), 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Tie
      ctx.fillStyle = '#5a4820';
      ctx.fillRect(Math.round(cx - ts * 0.07), Math.round(by + ts * 0.24), Math.round(ts * 0.14), Math.round(ts * 0.06));
      break;
    }
    case T_CRATE: {
      ctx.fillStyle = p.floor;
      ctx.fillRect(bx, by, ts, ts);
      const cw3 = Math.round(ts * 0.52), ch3 = Math.round(ts * 0.44);
      const bx2 = bx + Math.round((ts - cw3) / 2), by2 = by + Math.round((ts - ch3) / 2 + ts * 0.04);
      ctx.fillStyle = '#5a4018';
      ctx.fillRect(bx2, by2, cw3, ch3);
      // Planks
      ctx.fillStyle = '#4a3010';
      ctx.fillRect(bx2, by2, cw3, 1);
      ctx.fillRect(bx2, by2 + ch3 - 1, cw3, 1);
      ctx.fillRect(bx2 + Math.round(cw3 * 0.5), by2, 1, ch3);
      ctx.fillRect(bx2, by2 + Math.round(ch3 * 0.5), cw3, 1);
      // Corner nails
      ctx.fillStyle = '#c0a840';
      for (const [nx2, ny2] of [[bx2+1,by2+1],[bx2+cw3-2,by2+1],[bx2+1,by2+ch3-2],[bx2+cw3-2,by2+ch3-2]])
        ctx.fillRect(nx2, ny2, 1, 1);
      break;
    }
    case T_BONES: {
      // Walkable scattered bones
      const checker = (col + row) % 2 === 0;
      ctx.fillStyle = checker ? p.floor : p.floor2;
      ctx.fillRect(bx, by, ts, ts);
      ctx.fillStyle = 'rgba(200,190,170,0.55)';
      const boff = (col * 3 + row * 7) % 5;
      // Two bone segments
      ctx.fillRect(bx + 3 + boff, by + Math.round(ts * 0.45), Math.round(ts * 0.35), 1);
      ctx.fillRect(bx + Math.round(ts * 0.4), by + Math.round(ts * 0.55) + boff % 3, 1, Math.round(ts * 0.28));
      break;
    }
    case T_CANDLE: {
      // Walkable candle on floor
      const checker = (col + row) % 2 === 0;
      ctx.fillStyle = checker ? p.floor : p.floor2;
      ctx.fillRect(bx, by, ts, ts);
      const cx = bx + ts / 2;
      // Candle glow
      const flick3 = 0.7 + 0.3 * Math.sin(frame * 0.22 + col * 2.1);
      const cg = ctx.createRadialGradient(cx, by + ts * 0.42, 0, cx, by + ts * 0.42, ts * 0.55);
      cg.addColorStop(0, p.torchGlow + (0.28 * flick3) + ')');
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg;
      ctx.fillRect(bx, by, ts, ts);
      // Stem
      ctx.fillStyle = '#e8ddc0';
      ctx.fillRect(Math.round(cx - ts * 0.06), Math.round(by + ts * 0.44), Math.round(ts * 0.12), Math.round(ts * 0.24));
      // Flame
      ctx.fillStyle = p.torch;
      ctx.fillRect(Math.round(cx - ts * 0.04), Math.round(by + ts * 0.34), Math.round(ts * 0.08), Math.round(ts * 0.12 * flick3));
      break;
    }
    case T_POT: {
      ctx.fillStyle = p.floor;
      ctx.fillRect(bx, by, ts, ts);
      const cx = bx + ts / 2, cy = by + ts * 0.55;
      // Body
      ctx.fillStyle = '#5a4430';
      ctx.beginPath();
      ctx.ellipse(Math.round(cx), Math.round(cy), Math.round(ts * 0.2), Math.round(ts * 0.24), 0, 0, Math.PI * 2);
      ctx.fill();
      // Rim
      ctx.fillStyle = '#6a5438';
      ctx.fillRect(Math.round(cx - ts * 0.22), Math.round(cy - ts * 0.24), Math.round(ts * 0.44), Math.round(ts * 0.06));
      break;
    }
  }
}

// ─── Player drawing ───────────────────────────────────────────────────────────

const FRAME_W = 32, FRAME_H = 32, COLS = 4;
const DIR_ROW: Record<string, number> = { down: 0, left: 1, right: 2, up: 3 };

function drawPlayer(
  ctx: CanvasRenderingContext2D, bx: number, by: number, ts: number,
  facing: string, frame: number,
  img: HTMLImageElement | null, loaded: boolean, moving: boolean,
) {
  if (loaded && img) {
    const dir = DIR_ROW[facing] ?? 0;
    const col = moving ? Math.floor(frame / 6) % COLS : 0;
    ctx.drawImage(img, col * FRAME_W, dir * FRAME_H, FRAME_W, FRAME_H,
      Math.round(bx + (ts - ts) / 2), by, ts, ts);
    return;
  }
  // Fallback
  const cx = Math.round(bx + ts / 2);
  ctx.fillStyle = '#1565C0';
  ctx.fillRect(Math.round(cx - ts * 0.2), Math.round(by + ts * 0.35), Math.round(ts * 0.4), Math.round(ts * 0.38));
  ctx.fillStyle = '#F5CBA7';
  ctx.beginPath(); ctx.arc(cx, Math.round(by + ts * 0.26), Math.max(2, Math.round(ts * 0.15)), 0, Math.PI * 2); ctx.fill();
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  dungeon: DungeonMap;
  onExit: () => void;
  onComplete: () => void;
}

export default function DungeonGame({ dungeon, onExit, onComplete }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);
  const gsRef = useRef({
    x: dungeon.playerStart.x,
    y: dungeon.playerStart.y,
    facing: 'down' as string,
    frame: 0,
    lastMove: 0,
    moving: false,
  });
  const keysRef    = useRef<Set<string>>(new Set());
  const dpadRef    = useRef({ dx: 0, dy: 0 });
  const tileSizeRef = useRef(32);
  const imgRef = useRef<{ char: HTMLImageElement | null; loaded: boolean }>({ char: null, loaded: false });
  // Fog of war: -1=unseen, 0=explored (dim), 1=visible
  const fogRef = useRef<number[][]>(
    Array.from({ length: dungeon.height }, () => new Array(dungeon.width).fill(-1))
  );

  const [completed, setCompleted] = useState(false);

  // Reset state when dungeon changes
  useEffect(() => {
    gsRef.current = { x: dungeon.playerStart.x, y: dungeon.playerStart.y, facing: 'down', frame: 0, lastMove: 0, moving: false };
    fogRef.current = Array.from({ length: dungeon.height }, () => new Array(dungeon.width).fill(-1));
    setCompleted(false);
  }, [dungeon]);

  useEffect(() => {
    const compute = () => {
      const el = containerRef.current;
      if (!el) return;
      tileSizeRef.current = Math.max(20, Math.min(48, Math.floor(Math.min(el.clientWidth / VIEWPORT_W, (el.clientHeight - 120) / VIEWPORT_H))));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current.loaded = true; };
    img.src = '/rpg/character_walk.png';
    imgRef.current.char = img;
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key); if ([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault(); };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const canWalk = useCallback((x: number, y: number) => {
    if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) return false;
    return !DUNGEON_SOLID.has(dungeon.tiles[y]?.[x] ?? T_WALL);
  }, [dungeon]);

  useEffect(() => {
    if (completed) { cancelAnimationFrame(rafRef.current); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = PALETTES[dungeon.style] ?? PALETTES.kerker;

    const loop = (ts_ms: number) => {
      const gs = gsRef.current;
      const ts = tileSizeRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      gs.frame++;

      // ── Input ──
      const keys = keysRef.current;
      const dpad = dpadRef.current;
      gs.moving = false;
      if (ts_ms - gs.lastMove > MOVE_DELAY) {
        let dx = 0, dy = 0;
        if      (keys.has('ArrowLeft')  || keys.has('a') || dpad.dx === -1) dx = -1;
        else if (keys.has('ArrowRight') || keys.has('d') || dpad.dx ===  1) dx =  1;
        else if (keys.has('ArrowUp')    || keys.has('w') || dpad.dy === -1) dy = -1;
        else if (keys.has('ArrowDown')  || keys.has('s') || dpad.dy ===  1) dy =  1;
        if (dx || dy) {
          gs.facing = dx === -1 ? 'left' : dx === 1 ? 'right' : dy === -1 ? 'up' : 'down';
          const nx = gs.x + dx, ny = gs.y + dy;
          if (canWalk(nx, ny)) { gs.x = nx; gs.y = ny; gs.moving = true; }
          gs.lastMove = ts_ms;
          // Check exit
          if (dungeon.tiles[gs.y]?.[gs.x] === T_EXIT) {
            setCompleted(true);
            onComplete();
            return;
          }
        }
      }

      // ── Update fog of war ──
      const fog = fogRef.current;
      // Demote all currently-lit tiles to explored-but-dim (0) first
      for (let fy = 0; fy < dungeon.height; fy++)
        for (let fx = 0; fx < dungeon.width; fx++)
          if (fog[fy][fx] === 1) fog[fy][fx] = 0;
      // Then mark light radius as visible (1)
      for (let dy = -LIGHT_RADIUS; dy <= LIGHT_RADIUS; dy++) {
        for (let dx = -LIGHT_RADIUS; dx <= LIGHT_RADIUS; dx++) {
          if (dx * dx + dy * dy > LIGHT_RADIUS * LIGHT_RADIUS) continue;
          const fx = gs.x + dx, fy = gs.y + dy;
          if (fx >= 0 && fy >= 0 && fx < dungeon.width && fy < dungeon.height)
            fog[fy][fx] = 1;
        }
      }

      // ── Camera ──
      const maxCamX = Math.max(0, dungeon.width  - VIEWPORT_W);
      const maxCamY = Math.max(0, dungeon.height - VIEWPORT_H);
      const camX = Math.max(0, Math.min(maxCamX, gs.x - Math.floor(VIEWPORT_W / 2)));
      const camY = Math.max(0, Math.min(maxCamY, gs.y - Math.floor(VIEWPORT_H / 2)));

      const cw = VIEWPORT_W * ts, ch = VIEWPORT_H * ts;
      canvas.width = cw; canvas.height = ch;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, cw, ch);

      // ── Render tiles ──
      for (let row = camY; row < camY + VIEWPORT_H; row++) {
        for (let col = camX; col < camX + VIEWPORT_W; col++) {
          const fogVal = fog[row]?.[col] ?? -1;
          if (fogVal < 0) continue; // unexplored = black
          const tile = dungeon.tiles[row]?.[col] ?? T_WALL;
          const bx = (col - camX) * ts, by = (row - camY) * ts;
          if (fogVal === 0) {
            // Explored but not currently lit — draw dimly
            ctx.save();
            ctx.globalAlpha = 0.6;
            drawDungeonTile(ctx, tile, bx, by, ts, p, col, row, 0, dungeon.tiles);
            ctx.restore();
          } else {
            drawDungeonTile(ctx, tile, bx, by, ts, p, col, row, gs.frame, dungeon.tiles);
          }
        }
      }

      // ── Player ──
      const px2 = (gs.x - camX) * ts, py2 = (gs.y - camY) * ts;
      const { char, loaded } = imgRef.current;
      drawPlayer(ctx, px2, py2, ts, gs.facing, gs.frame, char, loaded, gs.moving);

      // ── Lantern light overlay ──
      // Draw darkness that fades out around the player using a radial gradient
      const playerCx = (gs.x - camX) * ts + ts / 2;
      const playerCy = (gs.y - camY) * ts + ts / 2;
      const lightPx = LIGHT_RADIUS * ts * 1.2;
      const darkGrad = ctx.createRadialGradient(playerCx, playerCy, ts * 0.3, playerCx, playerCy, lightPx);
      darkGrad.addColorStop(0,    'rgba(0,0,0,0)');
      darkGrad.addColorStop(0.45, 'rgba(0,0,0,0)');
      darkGrad.addColorStop(0.75, 'rgba(0,0,0,0.55)');
      darkGrad.addColorStop(1,    'rgba(0,0,0,0.92)');
      ctx.fillStyle = darkGrad;
      ctx.fillRect(0, 0, cw, ch);
      // Dark border for unexplored areas beyond viewport
      ctx.fillStyle = 'rgba(0,0,0,0.92)';
      // Already handled by fog skip above

      // ── Torch / Brazier / Candle halos ──
      ctx.save();
      for (let row = camY; row < camY + VIEWPORT_H; row++) {
        for (let col = camX; col < camX + VIEWPORT_W; col++) {
          const t = dungeon.tiles[row]?.[col];
          if (t !== T_TORCH && t !== T_BRAZIER && t !== T_CANDLE) continue;
          if ((fogRef.current[row]?.[col] ?? -1) < 1) continue;
          const tx = (col - camX) * ts + ts / 2;
          const ty = (row - camY) * ts + (t === T_TORCH ? ts * 0.2 : t === T_BRAZIER ? ts * 0.35 : ts * 0.42);
          const radius = t === T_CANDLE ? ts * 1.4 : ts * 2.5;
          const flick = 0.6 + 0.4 * Math.sin(gs.frame * 0.17 + col * 1.3);
          const alpha = t === T_CANDLE ? 0.14 * flick : 0.22 * flick;
          const tg = ctx.createRadialGradient(tx, ty, 0, tx, ty, radius);
          tg.addColorStop(0, p.torchGlow + alpha + ')');
          tg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = tg;
          ctx.fillRect(tx - radius, ty - radius, radius * 2, radius * 2);
        }
      }
      ctx.restore();


      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dungeon, completed, canWalk, onComplete]);

  const ts = tileSizeRef.current;

  const bg = dungeon.style === 'kerker' ? 'from-stone-950 to-neutral-950'
    : dungeon.style === 'hoehle' ? 'from-[#0a0a00] to-[#0a1a00]'
    : 'from-[#0a0014] to-[#0a000a]';

  return (
    <div ref={containerRef} className={`relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b ${bg}`}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 pt-[env(safe-area-inset-top)]" style={{ zIndex: 10 }}>
        <button onClick={onExit} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600/80"
             style={{ fontFamily: 'Georgia, serif' }}>
            {dungeon.style === 'kerker' ? 'Kerker' : dungeon.style === 'hoehle' ? 'Höhle' : 'Krypta'}
          </p>
          <p className="text-sm font-bold text-white/90 leading-none" style={{ fontFamily: 'Georgia, serif' }}>
            {dungeon.name}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 backdrop-blur">
          <img src="/menu/icon_dungeon.png" alt="" className="h-4 w-4 object-contain opacity-70" />
          <span className="text-[10px] text-amber-500/70" style={{ fontFamily: 'Georgia, serif' }}>
            Finde den Ausgang
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={VIEWPORT_W * ts}
          height={VIEWPORT_H * ts}
          style={{ imageRendering: 'pixelated', maxWidth: '100%', maxHeight: '100%' }}
        />
        <TouchControls
          onDpad={(dx, dy) => { dpadRef.current = { dx, dy }; }}
          onDpadRelease={() => { dpadRef.current = { dx: 0, dy: 0 }; }}
          onAction={() => {}}
          showInteract={false}
        />
      </div>

      {/* Completed overlay */}
      {completed && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <img src="/menu/icon_dungeon.png" alt="" className="h-16 w-16 object-contain mb-4 animate-bounce" />
          <p className="text-2xl font-bold text-amber-400 mb-2" style={{ fontFamily: 'Georgia, serif', textShadow: '0 0 20px rgba(200,140,0,0.8)' }}>
            Kerker besiegt!
          </p>
          <p className="text-sm text-amber-200/70 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            Du hast den Ausgang gefunden
          </p>
          <button
            onClick={onExit}
            className="rounded px-6 py-2 text-sm font-semibold text-amber-900"
            style={{ background: 'linear-gradient(180deg, #d4a832, #8b6914)', fontFamily: 'Georgia, serif', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
          >
            Zurück zur Auswahl
          </button>
        </div>
      )}
    </div>
  );
}
