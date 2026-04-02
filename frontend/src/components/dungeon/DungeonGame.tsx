import { useEffect, useRef, useState, useCallback } from 'react';
import {
  T_WALL, T_FLOOR, T_DOOR, T_TORCH, T_EXIT, T_WATER, T_DECOR,
  T_CHEST_GOLD, T_CHEST_WOOD, T_CHEST_STEEL,
  T_BARREL, T_BARREL_SWORD, T_SKULL, T_BRAZIER,
  T_WEAPONS_STAND, T_ARMOR_STAND, T_SACK, T_CRATE,
  T_BONES, T_CANDLE, T_POT, T_LOOT_FLOOR, T_VOID,
  T_TABLE, T_PILLAR,
  DUNGEON_SOLID, type DungeonMap, type DungeonEnemy,
} from './DungeonGenerator';
import TouchControls from '../rpg/TouchControls';

// ─── Loot system ─────────────────────────────────────────────────────────────

type LootItem = {
  name: string;
  desc: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  type: 'gold' | 'potion' | 'weapon' | 'armor' | 'scroll' | 'tool' | 'key' | 'material' | 'gem' | 'accessory' | 'food' | 'ammo';
  value: number;
};

const LOOT_COMMON: LootItem[] = [
  { name: 'Kupfermünzen',      desc: 'Eine Handvoll Kupferstücke',            rarity: 'common',   type: 'gold',    value: 80  },
  { name: 'Kleiner Heiltrank', desc: 'Stellt etwas Lebensenergie wieder her', rarity: 'common',   type: 'potion',  value: 35  },
  { name: 'Feuerstahl',        desc: 'Zuverlässig zum Feuermachen',           rarity: 'common',   type: 'tool',    value: 20  },
  { name: 'Trockenfleisch',    desc: 'Hält lange und gibt Kraft',             rarity: 'common',   type: 'food',    value: 15  },
  { name: 'Hanfseil',          desc: '10 Meter stabiles Seil',                rarity: 'common',   type: 'tool',    value: 12  },
  { name: 'Wachskerze',        desc: 'Brennt mehrere Stunden',                rarity: 'common',   type: 'tool',    value: 8   },
  { name: 'Eisenschlüssel',    desc: 'Passt zu einem unbekannten Schloss',    rarity: 'uncommon', type: 'key',     value: 45  },
  { name: 'Lederhandschuhe',   desc: 'Einfacher Schutz für die Hände',        rarity: 'common',   type: 'armor',   value: 30  },
  { name: 'Verbandsmull',      desc: 'Für einfache Wunden',                   rarity: 'common',   type: 'tool',    value: 18  },
  { name: 'Wegzehrung',        desc: 'Brot und Käse für die Reise',           rarity: 'common',   type: 'food',    value: 10  },
];
const LOOT_RARE: LootItem[] = [
  { name: 'Silbermünzen',       desc: 'Kaiserliches Silbergepräge',           rarity: 'uncommon', type: 'gold',      value: 280 },
  { name: 'Großer Heiltrank',   desc: 'Regeneriert Lebensenergie erheblich',  rarity: 'uncommon', type: 'potion',    value: 90  },
  { name: 'Eisenschwert',       desc: '+8 Angriff, solide Schmiedearbeit',    rarity: 'uncommon', type: 'weapon',    value: 140 },
  { name: 'Kettenhemd',         desc: '+12 Verteidigung, mittelschwer',       rarity: 'uncommon', type: 'armor',     value: 180 },
  { name: 'Arkane Schriftrolle',desc: 'Enthält einen vergessenen Zauber',     rarity: 'rare',     type: 'scroll',    value: 200 },
  { name: 'Silberner Ring',     desc: '+5 Magie, leicht verflucht',           rarity: 'rare',     type: 'accessory', value: 220 },
  { name: 'Stählerner Schild',  desc: '+15 Verteidigung, kampferprobt',       rarity: 'uncommon', type: 'armor',     value: 160 },
  { name: 'Giftpfeile (x10)',   desc: 'Vergiftet den Feind bei Treffer',      rarity: 'uncommon', type: 'ammo',      value: 75  },
  { name: 'Arkane Essenz',      desc: 'Magisch aufgeladenes Kristallpulver',  rarity: 'rare',     type: 'material',  value: 180 },
  { name: 'Diebeswerkzeug',     desc: 'Schlösser knacken leicht gemacht',     rarity: 'uncommon', type: 'tool',      value: 120 },
];
const LOOT_LEGENDARY: LootItem[] = [
  { name: 'Goldmünzen',              desc: 'Kaiserliches Gold, reinste Qualität',    rarity: 'rare',      type: 'gold',      value: 750  },
  { name: 'Drachenschuppenpanzer',   desc: '+35 Verteidigung, feuerfest',            rarity: 'legendary', type: 'armor',     value: 1200 },
  { name: 'Verzaubertes Schwert',    desc: '+25 Angriff, leuchtet im Dunkeln',       rarity: 'legendary', type: 'weapon',    value: 980  },
  { name: 'Uraltes Runenbuch',       desc: 'Enthält verbotene Magiearchive',         rarity: 'legendary', type: 'scroll',    value: 800  },
  { name: 'Phönixfeder',             desc: 'Gewährt einmalige Auferstehung',         rarity: 'legendary', type: 'material',  value: 1500 },
  { name: 'Leerekristall',           desc: 'Kann beliebige Magie speichern',         rarity: 'legendary', type: 'gem',       value: 1100 },
  { name: 'Amulett der Stärke',      desc: '+20 auf alle Attribute',                 rarity: 'legendary', type: 'accessory', value: 900  },
  { name: 'Ring der Unsichtbarkeit', desc: 'Macht den Träger unsichtbar',            rarity: 'legendary', type: 'accessory', value: 1800 },
  { name: 'Trank der Unsterblichkeit',desc:'Verleiht kurze Unverwundbarkeit',        rarity: 'legendary', type: 'potion',    value: 600  },
  { name: 'Kaiserlicher Helm',       desc: '+18 Verteidigung, Krone des Imperiums',  rarity: 'rare',      type: 'armor',     value: 700  },
];

function generateLoot(tier: 'common' | 'rare' | 'legendary'): LootItem[] {
  const pool = tier === 'legendary' ? LOOT_LEGENDARY : tier === 'rare' ? LOOT_RARE : LOOT_COMMON;
  const count = tier === 'legendary' ? 3 + Math.floor(Math.random() * 3)
    : tier === 'rare' ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

const RARITY_COLOR: Record<string, string> = {
  common: '#a09070', uncommon: '#60c040', rare: '#4080e0', legendary: '#e0a000',
};
const TYPE_ICON: Record<string, string> = {
  gold: '🪙', potion: '⚗️', weapon: '⚔️', armor: '🛡️',
  scroll: '📜', tool: '🔧', key: '🗝️', material: '💎',
  gem: '✨', accessory: '💍', food: '🍖', ammo: '🏹',
};

function ChestInventoryModal({
  items, tier, onClose,
}: { items: LootItem[]; tier: 'common' | 'rare' | 'legendary'; onClose: () => void }) {
  const totalValue = items.reduce((s, i) => s + i.value, 0);
  const tierColor = tier === 'legendary' ? '#ffd700' : tier === 'rare' ? '#80b0f0' : '#c8a030';
  const tierLabel = tier === 'legendary' ? 'Legendäre Schatzkiste' : tier === 'rare' ? 'Seltene Kiste' : 'Holzkiste';
  // Ignore close events fired within 400ms of mount (synthetic click from the A-button touch)
  const openedAt = useRef(Date.now());
  const guardedClose = () => { if (Date.now() - openedAt.current > 400) onClose(); };

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }}
      onClick={guardedClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '92%', maxWidth: 380,
          marginBottom: 24,
          background: 'linear-gradient(180deg, #1c1508 0%, #0e0c06 100%)',
          border: `1px solid ${tierColor}55`,
          borderRadius: 4,
          boxShadow: `0 -4px 40px rgba(0,0,0,0.85), 0 0 24px ${tierColor}22`,
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Header */}
        <div style={{
          borderBottom: `1px solid ${tierColor}33`,
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            fontSize: 28, lineHeight: 1,
            filter: `drop-shadow(0 0 8px ${tierColor})`,
          }}>
            {tier === 'legendary' ? '🏆' : tier === 'rare' ? '📦' : '🪵'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: tierColor, fontSize: 14, fontWeight: 'bold', margin: 0 }}>{tierLabel}</p>
            <p style={{ color: 'rgba(180,140,40,0.55)', fontSize: 11, margin: 0 }}>{items.length} Gegenstände gefunden</p>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'rgba(180,140,40,0.5)', fontSize: 18, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
          >✕</button>
        </div>

        {/* Items */}
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
          {items.map((item, i) => {
            const rc = RARITY_COLOR[item.rarity];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 10px',
                background: 'rgba(0,0,0,0.35)',
                border: `1px solid ${rc}28`,
                borderRadius: 3,
              }}>
                <div style={{
                  width: 40, height: 40, flexShrink: 0,
                  background: 'rgba(0,0,0,0.45)',
                  border: `1px solid ${rc}44`,
                  borderRadius: 3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                  boxShadow: `inset 0 0 8px ${rc}18`,
                }}>
                  {TYPE_ICON[item.type] ?? '❓'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: rc, fontSize: 13, fontWeight: 'bold', margin: 0 }}>{item.name}</p>
                  <p style={{ color: 'rgba(180,155,100,0.55)', fontSize: 11, margin: 0 }}>{item.desc}</p>
                </div>
                <p style={{ color: '#d4a832', fontSize: 12, margin: 0, flexShrink: 0 }}>{item.value}g</p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: `1px solid ${tierColor}28`,
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{ color: 'rgba(180,140,40,0.5)', fontSize: 11, margin: 0 }}>Gesamt: {totalValue}g</p>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(180deg, #d4a832 0%, #8b6914 100%)',
              color: '#2a1800', fontSize: 13, fontWeight: 'bold',
              padding: '7px 20px', borderRadius: 3,
              border: '1px solid rgba(200,160,40,0.5)',
              cursor: 'pointer', fontFamily: 'Georgia, serif',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            Alles nehmen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEWPORT_W = 20;
const VIEWPORT_H = 15;
const MOVE_DELAY = 150;
const LIGHT_RADIUS = 7; // tiles visible around player

// ─── Player / Enemy stats ─────────────────────────────────────────────────────

const PLAYER_MAX_HP = 80;
const PLAYER_DEF    = 4;
const DETECT_RANGE  = 7;    // tiles until enemy detects player
const ENEMY_MOVE_MS = 320;  // ms between enemy steps
const ENEMY_ATK_MS  = 1100; // ms between enemy attacks
const LERP          = 0.22; // enemy smooth-position lerp speed

type WeaponClass = 'sword' | 'dagger' | 'spear' | 'staff';
const WEAPON_DEF: Record<WeaponClass, {
  name: string; icon: string; color: string;
  dmg: number; range: number; arc: number; cooldown: number; animFrames: number;
}> = {
  sword:  { name: 'Schwert',    icon: '⚔',  color: '#c8d4f0', dmg: 14, range: 1.55, arc: 130, cooldown: 35, animFrames: 22 },
  dagger: { name: 'Dolch',      icon: '🗡', color: '#ffe880', dmg: 8,  range: 1.05, arc: 65,  cooldown: 16, animFrames: 12 },
  spear:  { name: 'Speer',      icon: '🔱', color: '#e0a850', dmg: 22, range: 2.4,  arc: 38,  cooldown: 55, animFrames: 24 },
  staff:  { name: 'Zauberstab', icon: '✨', color: '#a060f0', dmg: 18, range: 4.8,  arc: 20,  cooldown: 48, animFrames: 0  },
};

interface LiveEnemy extends DungeonEnemy {
  hp: number;
  fx: number; fy: number;
  state: 'idle' | 'chase' | 'attack' | 'dead';
  moveCooldown: number;
  attackCooldown: number;
  hurtFlash: number;
  facing: string;
}

interface Projectile {
  id: string; fx: number; fy: number;
  dx: number; dy: number;
  speed: number; dmg: number;
  maxDist: number; dist: number;
  color: string;
}

interface PlayerCombat {
  hp: number;
  weapon: WeaponClass;
  attackCooldown: number;
  attackAnim: { frame: number; maxFrames: number; facing: string; weapon: WeaponClass; hitApplied: boolean } | null;
  hurtFlash: number;
  invincible: number;
}

const ENEMY_GLOW: Record<string, string> = {
  guard: 'rgba(128,144,160,',  knight: 'rgba(112,128,192,',
  darkelf: 'rgba(144,64,176,', bat: 'rgba(96,96,144,',
  goblin: 'rgba(64,160,64,',   golem: 'rgba(112,112,128,',
  skeleton: 'rgba(192,184,160,', zombie: 'rgba(96,128,96,',
  lich: 'rgba(160,64,192,',
};
const ENEMY_FILL: Record<string, string> = {
  guard: '#8090a0', knight: '#7080c0', darkelf: '#9040b0',
  bat: '#606090', goblin: '#40a040', golem: '#707080',
  skeleton: '#c0b8a0', zombie: '#608060', lich: '#a040c0',
};

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
    case T_TABLE: {
      ctx.fillStyle = p.floor;
      ctx.fillRect(bx, by, ts, ts);
      const tw = Math.round(ts * 0.72), th = Math.round(ts * 0.5);
      const tx2 = bx + Math.round((ts - tw) / 2), ty2 = by + Math.round(ts * 0.22);
      // Table top
      ctx.fillStyle = '#6a4a1a';
      ctx.fillRect(tx2, ty2, tw, th);
      // Top highlight edge
      ctx.fillStyle = '#8a6428';
      ctx.fillRect(tx2, ty2, tw, Math.round(ts * 0.07));
      // Side shadow
      ctx.fillStyle = '#4a3010';
      ctx.fillRect(tx2, ty2 + th - Math.round(ts * 0.06), tw, Math.round(ts * 0.06));
      // Legs
      ctx.fillStyle = '#5a3c14';
      const legW = Math.round(ts * 0.07), legH = Math.round(ts * 0.16);
      ctx.fillRect(tx2 + 1, ty2 + th, legW, legH);
      ctx.fillRect(tx2 + tw - 1 - legW, ty2 + th, legW, legH);
      break;
    }
    case T_PILLAR: {
      // Floor base
      ctx.fillStyle = p.floor;
      ctx.fillRect(bx, by, ts, ts);
      const pw2 = Math.round(ts * 0.54), ph = Math.round(ts * 0.8);
      const px2 = bx + Math.round((ts - pw2) / 2), py2 = by + Math.round(ts * 0.08);
      // Capital (top)
      ctx.fillStyle = p.wallTop;
      ctx.fillRect(px2 - Math.round(ts * 0.04), py2, pw2 + Math.round(ts * 0.08), Math.round(ts * 0.1));
      // Shaft
      ctx.fillStyle = p.wallFront;
      ctx.fillRect(px2, py2 + Math.round(ts * 0.1), pw2, ph - Math.round(ts * 0.1));
      // Lit face (left band)
      ctx.fillStyle = p.wallTop;
      ctx.fillRect(px2, py2 + Math.round(ts * 0.1), Math.round(pw2 * 0.3), ph - Math.round(ts * 0.1));
      // Vertical groove
      ctx.fillStyle = p.wallBrick;
      ctx.fillRect(px2 + Math.round(pw2 * 0.5), py2 + Math.round(ts * 0.1), 1, ph - Math.round(ts * 0.1));
      // Base
      ctx.fillStyle = p.wallTop;
      ctx.fillRect(px2 - Math.round(ts * 0.04), py2 + ph - Math.round(ts * 0.08), pw2 + Math.round(ts * 0.08), Math.round(ts * 0.08));
      break;
    }
  }
}

// ─── Player drawing ───────────────────────────────────────────────────────────

const FRAME_W = 32, FRAME_H = 32, COLS = 4;
const DIR_ROW: Record<string, number> = { down: 0, left: 2, right: 1, up: 3 };

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

// ─── Enemy drawing ───────────────────────────────────────────────────────────

function drawLiveEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: LiveEnemy,
  bx: number, by: number, ts: number, frame: number,
) {
  const fill = ENEMY_FILL[enemy.type] ?? '#808090';
  const glow = ENEMY_GLOW[enemy.type] ?? 'rgba(128,128,128,';
  const pulse = 0.6 + 0.4 * Math.sin(frame * 0.12 + enemy.x * 0.7 + enemy.y * 0.5);
  const r = Math.max(3, Math.round(ts * 0.32));
  const cx = bx + ts / 2, cy = by + ts * 0.5;

  ctx.save();
  if (enemy.hurtFlash > 0 && Math.floor(frame / 2) % 2 === 0) ctx.globalAlpha = 0.4;

  // Glow halo
  const gGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2);
  gGrad.addColorStop(0, glow + (enemy.state === 'attack' ? 0.7 : 0.38 * pulse) + ')');
  gGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gGrad;
  ctx.fillRect(bx, by, ts, ts);
  ctx.globalAlpha = enemy.hurtFlash > 0 && Math.floor(frame / 2) % 2 === 0 ? 0.4 : 1;

  // Body
  ctx.fillStyle = enemy.hurtFlash > 0 ? '#ff5040' : fill;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.arc(cx - r * 0.25, cy - r * 0.3, r * 0.45, 0, Math.PI * 2); ctx.fill();

  // Eyes — offset based on facing
  const ex0 = enemy.facing === 'right' ? 0.18 : enemy.facing === 'left' ? -0.18 : 0;
  const ey0 = enemy.facing === 'down'  ? 0.12 : enemy.facing === 'up'   ? -0.12 : 0;
  ctx.fillStyle = '#fff8e8';
  ctx.beginPath(); ctx.arc(cx + (ex0 - 0.28) * r, cy + ey0 * r - r * 0.08, Math.max(1, r * 0.22), 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + (ex0 + 0.28) * r, cy + ey0 * r - r * 0.08, Math.max(1, r * 0.22), 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a0a0a';
  ctx.beginPath(); ctx.arc(cx + (ex0 - 0.28) * r, cy + ey0 * r - r * 0.08, Math.max(1, r * 0.12), 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + (ex0 + 0.28) * r, cy + ey0 * r - r * 0.08, Math.max(1, r * 0.12), 0, Math.PI * 2); ctx.fill();

  // HP bar above
  ctx.globalAlpha = 1;
  const barW = ts * 0.72;
  const barX = cx - barW / 2, barY = by + Math.round(ts * 0.06);
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(Math.round(barX), Math.round(barY), Math.round(barW), 4);
  const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = hpRatio > 0.5 ? '#e04040' : hpRatio > 0.25 ? '#e08020' : '#ff2020';
  ctx.fillRect(Math.round(barX), Math.round(barY), Math.round(barW * hpRatio), 4);

  ctx.restore();
}

// ─── Weapon swing / Projectile drawing ───────────────────────────────────────

function drawWeaponSwing(
  ctx: CanvasRenderingContext2D,
  bx: number, by: number, ts: number,
  anim: PlayerCombat['attackAnim'],
) {
  if (!anim || anim.weapon === 'staff') return;
  const { frame, maxFrames, facing, weapon } = anim;
  const t = frame / maxFrames;
  const wDef = WEAPON_DEF[weapon];
  const cx = bx + ts / 2, cy = by + ts / 2;
  const baseAngle = facing === 'right' ? 0 : facing === 'left' ? Math.PI : facing === 'up' ? -Math.PI / 2 : Math.PI / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(baseAngle);

  if (weapon === 'spear') {
    const thr = Math.sin(t * Math.PI);
    const reach = ts * wDef.range * thr;
    if (reach > 2) {
      // Shaft trail
      ctx.globalAlpha = 0.18 * thr;
      ctx.strokeStyle = wDef.color;
      ctx.lineWidth = ts * 0.16;
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.moveTo(ts * 0.1, 0); ctx.lineTo(reach, 0); ctx.stroke();
      // Shaft
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = Math.max(2, ts * 0.055);
      ctx.shadowColor = wDef.color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(ts * 0.1, 0); ctx.lineTo(reach, 0); ctx.stroke();
      // Diamond tip
      ctx.fillStyle = '#f0f4ff';
      ctx.shadowBlur = 14;
      const tip = reach + ts * 0.13;
      ctx.beginPath();
      ctx.moveTo(tip, 0);
      ctx.lineTo(reach - ts * 0.02, -ts * 0.07);
      ctx.lineTo(reach - ts * 0.08, 0);
      ctx.lineTo(reach - ts * 0.02, ts * 0.07);
      ctx.closePath(); ctx.fill();
      // Hit flash
      if (thr > 0.7) {
        ctx.globalAlpha = (thr - 0.7) / 0.3 * 0.7;
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(tip, 0, ts * 0.08, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (weapon === 'dagger') {
    // Fast in-out thrust
    const thr = t < 0.5 ? t * 2 : (1 - t) * 2;
    const reach = ts * wDef.range * thr;
    if (reach > 2) {
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = wDef.color; ctx.shadowBlur = 10;
      ctx.strokeStyle = wDef.color;
      ctx.lineWidth = Math.max(1.5, ts * 0.05);
      ctx.beginPath(); ctx.moveTo(ts * 0.12, 0); ctx.lineTo(reach, 0); ctx.stroke();
      // Guard
      ctx.shadowBlur = 0; ctx.strokeStyle = '#c8a030'; ctx.lineWidth = Math.max(1, ts * 0.04);
      ctx.beginPath();
      ctx.moveTo(ts * 0.16, -ts * 0.09); ctx.lineTo(ts * 0.16, ts * 0.09); ctx.stroke();
      // Bright edge
      ctx.globalAlpha = 0.5 * thr;
      ctx.fillStyle = '#ffffff'; ctx.shadowColor = wDef.color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(reach, 0, Math.max(1.5, ts * 0.04), 0, Math.PI * 2); ctx.fill();
    }
  } else {
    // SWORD — sweeping arc
    const halfArc = (wDef.arc * Math.PI / 180) / 2;
    const curAngle = -halfArc + t * halfArc * 2;
    const reach = ts * wDef.range;

    // Arc fill
    ctx.globalAlpha = 0.2 * (1 - t * 0.6);
    ctx.fillStyle = wDef.color;
    ctx.shadowColor = wDef.color; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.arc(0, 0, reach, -halfArc, curAngle); ctx.closePath(); ctx.fill();

    // Blade
    ctx.globalAlpha = 0.95;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = wDef.color;
    ctx.lineWidth = Math.max(2, ts * 0.065);
    const tipX = Math.cos(curAngle) * reach, tipY = Math.sin(curAngle) * reach;
    const hiltX = Math.cos(curAngle) * ts * 0.2, hiltY = Math.sin(curAngle) * ts * 0.2;
    ctx.beginPath(); ctx.moveTo(hiltX, hiltY); ctx.lineTo(tipX, tipY); ctx.stroke();

    // Bright blade edge highlight
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.moveTo(hiltX, hiltY); ctx.lineTo(tipX, tipY); ctx.stroke();

    // Guard crosspiece
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#d4a832'; ctx.lineWidth = Math.max(1.5, ts * 0.045);
    ctx.shadowColor = '#d4a832'; ctx.shadowBlur = 4;
    const gAngle = curAngle + Math.PI / 2;
    const gL = ts * 0.15;
    ctx.beginPath();
    ctx.moveTo(hiltX + Math.cos(gAngle) * gL, hiltY + Math.sin(gAngle) * gL);
    ctx.lineTo(hiltX - Math.cos(gAngle) * gL, hiltY - Math.sin(gAngle) * gL);
    ctx.stroke();

    // Tip glow
    ctx.globalAlpha = 0.85 * (1 - t * 0.4);
    ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(tipX, tipY, Math.max(2, ts * 0.055), 0, Math.PI * 2); ctx.fill();

    // Impact flash at swing peak
    if (t > 0.36 && t < 0.68) {
      const flash = Math.sin((t - 0.36) / 0.32 * Math.PI);
      ctx.globalAlpha = flash * 0.75;
      ctx.fillStyle = '#ffffaa'; ctx.shadowColor = '#ffff60'; ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.arc(tipX * 0.88, tipY * 0.88, ts * 0.11, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.restore();
}

function drawProjectile(
  ctx: CanvasRenderingContext2D,
  proj: Projectile, camX: number, camY: number, ts: number, frame: number,
) {
  const bx = (proj.fx - camX) * ts + ts / 2;
  const by = (proj.fy - camY) * ts + ts / 2;
  const pulse = 0.7 + 0.3 * Math.sin(frame * 0.35);
  ctx.save();
  // Trail
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = proj.color;
  ctx.beginPath();
  ctx.arc(bx - proj.dx * ts * 0.4, by - proj.dy * ts * 0.4, ts * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bx - proj.dx * ts * 0.7, by - proj.dy * ts * 0.7, ts * 0.07, 0, Math.PI * 2);
  ctx.fill();
  // Core
  ctx.globalAlpha = 0.92;
  ctx.shadowColor = proj.color; ctx.shadowBlur = 18 * pulse;
  ctx.fillStyle = proj.color;
  ctx.beginPath(); ctx.arc(bx, by, Math.max(3, ts * 0.13), 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.75;
  ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(bx, by, Math.max(1.5, ts * 0.065), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
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

  const openedChestsRef = useRef<Set<string>>(new Set());
  const nearChestRef    = useRef(false);
  const nearLockedRef   = useRef(false);
  const nearEnemyRef    = useRef(false);
  const playerKeysRef   = useRef(0);
  const lastTimeRef     = useRef(0);
  const defeatedRef     = useRef(false);

  // Real-time combat state
  const enemiesRef = useRef<LiveEnemy[]>(
    dungeon.enemies.map(e => ({ ...e, hp: e.maxHp, fx: e.x, fy: e.y, state: 'idle' as const,
      moveCooldown: Math.random() * ENEMY_MOVE_MS, attackCooldown: ENEMY_ATK_MS, hurtFlash: 0, facing: 'down' }))
  );
  const pcRef = useRef<PlayerCombat>({
    hp: PLAYER_MAX_HP, weapon: 'sword',
    attackCooldown: 0, attackAnim: null, hurtFlash: 0, invincible: 0,
  });
  const projectilesRef = useRef<Projectile[]>([]);

  const [completed,       setCompleted]      = useState(false);
  const [defeated,        setDefeated]       = useState(false);
  const [nearChest,       setNearChest]      = useState(false);
  const [nearEnemy,       setNearEnemy]      = useState(false);
  const [nearLocked,      setNearLocked]     = useState(false);
  const [playerKeys,      setPlayerKeys]     = useState(0);
  const [keyNotif,        setKeyNotif]       = useState(false);
  const [playerHp,        setPlayerHp]       = useState(PLAYER_MAX_HP);
  const [selectedWeapon,  setSelectedWeapon] = useState<WeaponClass>('sword');
  const [chestModal,      setChestModal]     = useState<{ items: LootItem[]; tier: 'common' | 'rare' | 'legendary' } | null>(null);
  const [isFullscreen,    setIsFullscreen]   = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Reset state when dungeon changes
  useEffect(() => {
    gsRef.current = { x: dungeon.playerStart.x, y: dungeon.playerStart.y, facing: 'down', frame: 0, lastMove: 0, moving: false };
    fogRef.current = Array.from({ length: dungeon.height }, () => new Array(dungeon.width).fill(-1));
    openedChestsRef.current = new Set();
    nearChestRef.current = false;
    nearLockedRef.current = false;
    nearEnemyRef.current = false;
    enemiesRef.current = dungeon.enemies.map(e => ({
      ...e, hp: e.maxHp, fx: e.x, fy: e.y, state: 'idle' as const,
      moveCooldown: Math.random() * ENEMY_MOVE_MS, attackCooldown: ENEMY_ATK_MS, hurtFlash: 0, facing: 'down',
    }));
    pcRef.current = { hp: PLAYER_MAX_HP, weapon: pcRef.current.weapon, attackCooldown: 0, attackAnim: null, hurtFlash: 0, invincible: 0 };
    projectilesRef.current = [];
    playerKeysRef.current = 0;
    lastTimeRef.current = 0;
    defeatedRef.current = false;
    setCompleted(false);
    setDefeated(false);
    setNearChest(false);
    setNearEnemy(false);
    setNearLocked(false);
    setPlayerKeys(0);
    setKeyNotif(false);
    setPlayerHp(PLAYER_MAX_HP);
    setChestModal(null);
  }, [dungeon]);

  useEffect(() => {
    const compute = () => {
      const el = containerRef.current;
      if (!el) return;
      tileSizeRef.current = Math.max(16, Math.ceil(Math.max(el.clientWidth / VIEWPORT_W, (el.clientHeight - 80) / VIEWPORT_H)));
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

  const canWalk = useCallback((x: number, y: number) => {
    if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) return false;
    return !DUNGEON_SOLID.has(dungeon.tiles[y]?.[x] ?? T_WALL);
  }, [dungeon]);

  // Use a ref so the keyboard effect never needs to re-register
  const handleActionRef = useRef<() => void>(() => {});
  handleActionRef.current = () => {
    const gs = gsRef.current;
    const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
    for (const { dx, dy } of dirs) {
      const cx = gs.x + dx, cy = gs.y + dy;
      const t = dungeon.tiles[cy]?.[cx];
      if (
        (t === T_CHEST_GOLD || t === T_CHEST_WOOD || t === T_CHEST_STEEL) &&
        !openedChestsRef.current.has(`${cx},${cy}`)
      ) {
        const isLocked = t === T_CHEST_GOLD || t === T_CHEST_STEEL;
        if (isLocked && playerKeysRef.current <= 0) return; // no key — do nothing
        if (isLocked) {
          playerKeysRef.current--;
          setPlayerKeys(playerKeysRef.current);
        }
        openedChestsRef.current.add(`${cx},${cy}`);
        nearChestRef.current = false;
        nearLockedRef.current = false;
        setNearChest(false);
        setNearLocked(false);
        const tier = t === T_CHEST_GOLD ? 'legendary' : t === T_CHEST_STEEL ? 'rare' : 'common';
        setChestModal({ items: generateLoot(tier), tier });
        return;
      }
    }
  };
  const handleAction = useCallback(() => handleActionRef.current(), []);

  const handleFightRef = useRef<() => void>(() => {});
  handleFightRef.current = () => {
    const pc = pcRef.current;
    if (pc.attackCooldown > 0) return;
    const wDef = WEAPON_DEF[pc.weapon];
    pc.attackCooldown = wDef.cooldown;
    if (wDef.animFrames > 0) {
      pc.attackAnim = { frame: 0, maxFrames: wDef.animFrames, facing: gsRef.current.facing, weapon: pc.weapon, hitApplied: false };
    }
    if (pc.weapon === 'staff') {
      const dirMap: Record<string, { dx: number; dy: number }> = {
        right: { dx: 1, dy: 0 }, left: { dx: -1, dy: 0 }, up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 },
      };
      const d = dirMap[gsRef.current.facing] ?? { dx: 1, dy: 0 };
      projectilesRef.current.push({
        id: `p${Date.now()}`, fx: gsRef.current.x, fy: gsRef.current.y,
        dx: d.dx, dy: d.dy, speed: 0.18, dmg: wDef.dmg,
        maxDist: wDef.range, dist: 0, color: wDef.color,
      });
    }
  };
  const handleFightWithDirRef = useRef<(dx: number, dy: number) => void>(() => {});
  handleFightWithDirRef.current = (dx: number, dy: number) => {
    if (dx !== 0 || dy !== 0) {
      gsRef.current.facing = dx === 1 ? 'right' : dx === -1 ? 'left' : dy === -1 ? 'up' : 'down';
    }
    handleFightRef.current();
  };
  const handleFightWithDir = useCallback((dx: number, dy: number) => handleFightWithDirRef.current(dx, dy), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if ([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
      if (e.key === ' ') handleFightRef.current();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    if (completed || defeated) { cancelAnimationFrame(rafRef.current); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = PALETTES[dungeon.style] ?? PALETTES.kerker;

    // Helper: award key drop for a killed enemy
    const awardKey = (enemy: LiveEnemy) => {
      const strong: DungeonEnemy['type'][] = ['knight', 'golem', 'lich', 'darkelf'];
      if (Math.random() < (strong.includes(enemy.type) ? 0.75 : 0.4)) {
        playerKeysRef.current++;
        setPlayerKeys(playerKeysRef.current);
        setKeyNotif(true);
        setTimeout(() => setKeyNotif(false), 2500);
      }
    };

    const loop = (ts_ms: number) => {
      if (defeatedRef.current) { cancelAnimationFrame(rafRef.current); return; }
      const gs = gsRef.current;
      const ts = tileSizeRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      gs.frame++;

      const dt = lastTimeRef.current ? ts_ms - lastTimeRef.current : 16;
      lastTimeRef.current = ts_ms;

      // ── Player combat tick ──
      const pc = pcRef.current;
      if (pc.attackCooldown > 0) pc.attackCooldown--;
      if (pc.hurtFlash > 0) pc.hurtFlash--;
      if (pc.invincible > 0) pc.invincible--;
      if (pc.attackAnim) {
        pc.attackAnim.frame++;
        const swingT = pc.attackAnim.frame / pc.attackAnim.maxFrames;
        if (!pc.attackAnim.hitApplied && swingT >= 0.42) {
          pc.attackAnim.hitApplied = true;
          const wDef2 = WEAPON_DEF[pc.attackAnim.weapon];
          const baseA = pc.attackAnim.facing === 'right' ? 0 : pc.attackAnim.facing === 'left' ? Math.PI : pc.attackAnim.facing === 'up' ? -Math.PI / 2 : Math.PI / 2;
          const halfA = (wDef2.arc * Math.PI / 180) / 2;
          for (const en of enemiesRef.current) {
            if (en.state === 'dead') continue;
            const edx = en.fx - gs.x, edy = en.fy - gs.y;
            if (edx * edx + edy * edy > (wDef2.range + 0.5) * (wDef2.range + 0.5)) continue;
            let ang = Math.atan2(edy, edx) - baseA;
            while (ang > Math.PI) ang -= 2 * Math.PI;
            while (ang < -Math.PI) ang += 2 * Math.PI;
            if (Math.abs(ang) <= halfA) {
              en.hp -= Math.max(1, wDef2.dmg + Math.floor(Math.random() * 6) - 2);
              en.hurtFlash = 14;
              if (en.hp <= 0) { en.state = 'dead'; awardKey(en); }
            }
          }
        }
        if (pc.attackAnim.frame >= pc.attackAnim.maxFrames) pc.attackAnim = null;
      }

      // ── Projectiles ──
      for (let pi = projectilesRef.current.length - 1; pi >= 0; pi--) {
        const proj = projectilesRef.current[pi];
        proj.fx += proj.dx * proj.speed;
        proj.fy += proj.dy * proj.speed;
        proj.dist += proj.speed;
        let remove = proj.dist >= proj.maxDist ||
          DUNGEON_SOLID.has(dungeon.tiles[Math.round(proj.fy)]?.[Math.round(proj.fx)] ?? T_WALL);
        if (!remove) {
          for (const en of enemiesRef.current) {
            if (en.state === 'dead') continue;
            if (Math.hypot(proj.fx - en.fx, proj.fy - en.fy) < 0.55) {
              en.hp -= proj.dmg; en.hurtFlash = 14;
              if (en.hp <= 0) { en.state = 'dead'; awardKey(en); }
              remove = true; break;
            }
          }
        }
        if (remove) projectilesRef.current.splice(pi, 1);
      }

      // ── Enemy AI ──
      for (const en of enemiesRef.current) {
        if (en.state === 'dead') continue;
        en.fx += (en.x - en.fx) * LERP;
        en.fy += (en.y - en.fy) * LERP;
        if (en.hurtFlash > 0) en.hurtFlash--;
        const distSq = (gs.x - en.x) ** 2 + (gs.y - en.y) ** 2;
        if (distSq <= DETECT_RANGE * DETECT_RANGE) en.state = 'chase';
        en.moveCooldown -= dt;
        en.attackCooldown -= dt;
        if (en.state === 'chase') {
          if (distSq <= 2.1 && en.attackCooldown <= 0 && pc.invincible <= 0) {
            const dmg = Math.max(1, en.atk - PLAYER_DEF + Math.floor(Math.random() * 4) - 1);
            pc.hp = Math.max(0, pc.hp - dmg);
            pc.hurtFlash = 16; pc.invincible = 50;
            setPlayerHp(pc.hp);
            if (pc.hp <= 0) { defeatedRef.current = true; setDefeated(true); return; }
            en.attackCooldown = ENEMY_ATK_MS;
          }
          if (en.moveCooldown <= 0 && distSq > 1.5) {
            const ddx = gs.x - en.x, ddy = gs.y - en.y;
            const tries = Math.abs(ddx) >= Math.abs(ddy)
              ? [{ mx: Math.sign(ddx), my: 0 }, { mx: 0, my: Math.sign(ddy) }]
              : [{ mx: 0, my: Math.sign(ddy) }, { mx: Math.sign(ddx), my: 0 }];
            for (const { mx, my } of tries) {
              const nx = en.x + mx, ny = en.y + my;
              if (nx === gs.x && ny === gs.y) continue;
              const blocked = enemiesRef.current.some(e2 => e2 !== en && e2.state !== 'dead' && e2.x === nx && e2.y === ny);
              if (!blocked && canWalk(nx, ny)) {
                en.x = nx; en.y = ny;
                en.facing = mx === 1 ? 'right' : mx === -1 ? 'left' : my === 1 ? 'down' : 'up';
                break;
              }
            }
            en.moveCooldown = ENEMY_MOVE_MS;
          }
        }
      }

      // ── Player input ──
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
          const enemyAt = enemiesRef.current.some(e => e.state !== 'dead' && e.x === nx && e.y === ny);
          if (!enemyAt && canWalk(nx, ny)) { gs.x = nx; gs.y = ny; gs.moving = true; }
          gs.lastMove = ts_ms;
          // Check exit
          if (dungeon.tiles[gs.y]?.[gs.x] === T_EXIT) {
            setCompleted(true);
            onComplete();
            return;
          }
        }
      }

      // ── Near-chest / near-enemy detection ──
      const adjDirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
      const hasAdjacentChest = adjDirs.some(({ dx, dy }) => {
        const t = dungeon.tiles[gs.y + dy]?.[gs.x + dx];
        return (t === T_CHEST_GOLD || t === T_CHEST_WOOD || t === T_CHEST_STEEL) && !openedChestsRef.current.has(`${gs.x + dx},${gs.y + dy}`);
      });
      if (hasAdjacentChest !== nearChestRef.current) { nearChestRef.current = hasAdjacentChest; setNearChest(hasAdjacentChest); }
      const hasAdjacentLocked = adjDirs.some(({ dx, dy }) => {
        const t = dungeon.tiles[gs.y + dy]?.[gs.x + dx];
        return (t === T_CHEST_GOLD || t === T_CHEST_STEEL) && !openedChestsRef.current.has(`${gs.x + dx},${gs.y + dy}`);
      });
      if (hasAdjacentLocked !== nearLockedRef.current) { nearLockedRef.current = hasAdjacentLocked; setNearLocked(hasAdjacentLocked); }
      const hasAdjacentEnemy = enemiesRef.current.some(e => e.state !== 'dead' && adjDirs.some(({ dx, dy }) => e.x === gs.x + dx && e.y === gs.y + dy));
      if (hasAdjacentEnemy !== nearEnemyRef.current) { nearEnemyRef.current = hasAdjacentEnemy; setNearEnemy(hasAdjacentEnemy); }

      // ── Fog of war ──
      const fog = fogRef.current;
      for (let fy = 0; fy < dungeon.height; fy++)
        for (let fx = 0; fx < dungeon.width; fx++)
          if (fog[fy][fx] === 1) fog[fy][fx] = 0;
      for (let ldy = -LIGHT_RADIUS; ldy <= LIGHT_RADIUS; ldy++) {
        for (let ldx = -LIGHT_RADIUS; ldx <= LIGHT_RADIUS; ldx++) {
          if (ldx * ldx + ldy * ldy > LIGHT_RADIUS * LIGHT_RADIUS) continue;
          const lfx = gs.x + ldx, lfy = gs.y + ldy;
          if (lfx >= 0 && lfy >= 0 && lfx < dungeon.width && lfy < dungeon.height)
            fog[lfy][lfx] = 1;
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
          let tile = dungeon.tiles[row]?.[col] ?? T_WALL;
          // Opened chests render as golden floor
          if ((tile === T_CHEST_GOLD || tile === T_CHEST_WOOD || tile === T_CHEST_STEEL) &&
              openedChestsRef.current.has(`${col},${row}`)) {
            tile = T_LOOT_FLOOR;
          }
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

      // ── Lock overlays on locked chests ──
      ctx.save();
      for (let row = camY; row < camY + VIEWPORT_H; row++) {
        for (let col = camX; col < camX + VIEWPORT_W; col++) {
          const fogVal = fog[row]?.[col] ?? -1;
          if (fogVal < 1) continue;
          const tile = dungeon.tiles[row]?.[col];
          if ((tile !== T_CHEST_GOLD && tile !== T_CHEST_STEEL) ||
              openedChestsRef.current.has(`${col},${row}`)) continue;
          const bx = (col - camX) * ts, by = (row - camY) * ts;
          // Shackle arc
          const lw = Math.round(ts * 0.28), lh = Math.round(ts * 0.22);
          const lx = Math.round(bx + (ts - lw) / 2), ly = Math.round(by + ts * 0.06);
          ctx.strokeStyle = 'rgba(255,220,50,0.95)';
          ctx.lineWidth = Math.max(1.5, ts * 0.07);
          ctx.beginPath();
          ctx.arc(lx + lw / 2, ly + lh * 0.38, lw * 0.3, Math.PI, 0);
          ctx.stroke();
          // Body
          ctx.fillStyle = 'rgba(230,185,30,0.92)';
          ctx.fillRect(lx, ly + Math.round(lh * 0.32), lw, Math.round(lh * 0.68));
          // Keyhole
          ctx.fillStyle = 'rgba(60,30,0,0.9)';
          ctx.beginPath();
          ctx.arc(lx + lw / 2, ly + Math.round(lh * 0.6), Math.max(1, Math.round(lw * 0.18)), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // ── Enemies ──
      for (const en of enemiesRef.current) {
        if (en.state === 'dead') continue;
        if ((fog[Math.round(en.fy)]?.[Math.round(en.fx)] ?? -1) < 1) continue;
        drawLiveEnemy(ctx, en, (en.fx - camX) * ts, (en.fy - camY) * ts, ts, gs.frame);
      }

      // ── Projectiles ──
      for (const proj of projectilesRef.current) drawProjectile(ctx, proj, camX, camY, ts, gs.frame);

      // ── Player (with hurt flash) ──
      const px2 = (gs.x - camX) * ts, py2 = (gs.y - camY) * ts;
      const { char, loaded } = imgRef.current;
      if (pc.hurtFlash > 0 && Math.floor(gs.frame / 2) % 2 === 0) {
        ctx.save(); ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#ff2020'; ctx.fillRect(px2, py2, ts, ts);
        ctx.restore();
      }
      drawPlayer(ctx, px2, py2, ts, gs.facing, gs.frame, char, loaded, gs.moving);

      // ── Weapon swing ──
      if (pc.attackAnim) drawWeaponSwing(ctx, px2, py2, ts, pc.attackAnim);

      // ── Lantern overlay ──
      const playerCx = px2 + ts / 2, playerCy = py2 + ts / 2;
      const lightPx = LIGHT_RADIUS * ts * 1.2;
      const darkGrad = ctx.createRadialGradient(playerCx, playerCy, ts * 0.3, playerCx, playerCy, lightPx);
      darkGrad.addColorStop(0,    'rgba(0,0,0,0)');
      darkGrad.addColorStop(0.45, 'rgba(0,0,0,0)');
      darkGrad.addColorStop(0.75, 'rgba(0,0,0,0.55)');
      darkGrad.addColorStop(1,    'rgba(0,0,0,0.92)');
      ctx.fillStyle = darkGrad;
      ctx.fillRect(0, 0, cw, ch);

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
  }, [dungeon, completed, defeated, canWalk, onComplete]);

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
        <div className="ml-auto flex items-center gap-2">
          {/* HP bar */}
          <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur">
            <span style={{ fontSize: 11, color: '#e04060' }}>❤</span>
            <div style={{ width: 52, height: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 3, border: '1px solid rgba(60,200,80,0.25)' }}>
              <div style={{
                width: `${Math.max(0, (playerHp / PLAYER_MAX_HP) * 100)}%`, height: '100%', borderRadius: 3,
                background: playerHp / PLAYER_MAX_HP > 0.5 ? '#40c060' : playerHp / PLAYER_MAX_HP > 0.25 ? '#e0c020' : '#e04010',
                transition: 'width 0.2s',
              }} />
            </div>
            <span className="text-[9px] font-bold" style={{ color: 'rgba(140,200,140,0.8)', fontFamily: 'Georgia, serif' }}>
              {playerHp}
            </span>
          </div>
          {playerKeys > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur">
              <span style={{ fontSize: 12 }}>🗝</span>
              <span className="text-[10px] font-bold text-amber-400" style={{ fontFamily: 'Georgia, serif' }}>
                ×{playerKeys}
              </span>
            </div>
          )}
          <button
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur"
            aria-label="Vollbild"
          >
            {isFullscreen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0h5m-5 0v5M15 9l5-5m0 0h-5m5 0v5M9 15l-5 5m0 0h5m-5 0v-5M15 15l5 5m0 0h-5m5 0v-5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5M20 8V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5M20 16v4m0 0h-4m4 0l-5-5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Canvas — cover mode: fills screen, slight crop on edges, no stretch */}
      <div className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={VIEWPORT_W * ts}
          height={VIEWPORT_H * ts}
          style={{
            imageRendering: 'pixelated',
            display: 'block',
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        <TouchControls
          onDpad={(dx, dy) => { dpadRef.current = { dx, dy }; }}
          onDpadRelease={() => { dpadRef.current = { dx: 0, dy: 0 }; }}
          onAction={handleAction}
          onFightDir={handleFightWithDir}
          showInteract={nearChest}
          showFight={nearEnemy}
          interactLabel={nearLocked ? (playerKeys > 0 ? '🗝 Öffnen' : '🔒 Gesperrt') : 'Öffnen'}
        />

        {/* Weapon selector — bottom left */}
        <div
          className="pointer-events-auto absolute bottom-8 left-4 flex gap-2"
          style={{ zIndex: 20 }}
        >
          {(Object.entries(WEAPON_DEF) as [WeaponClass, typeof WEAPON_DEF[WeaponClass]][]).map(([key, def]) => {
            const active = selectedWeapon === key;
            return (
              <button
                key={key}
                onTouchStart={(e) => { e.preventDefault(); setSelectedWeapon(key); pcRef.current.weapon = key; }}
                onMouseDown={(e) => { e.preventDefault(); setSelectedWeapon(key); pcRef.current.weapon = key; }}
                className="select-none touch-none flex flex-col items-center"
                style={{
                  width: 44, height: 44, borderRadius: 6,
                  background: active
                    ? `radial-gradient(circle at 40% 30%, ${def.color}55, rgba(0,0,0,0.7))`
                    : 'rgba(0,0,0,0.45)',
                  border: `1.5px solid ${active ? def.color : 'rgba(255,255,255,0.15)'}`,
                  boxShadow: active ? `0 0 12px ${def.color}88` : '0 2px 6px rgba(0,0,0,0.5)',
                  color: active ? def.color : 'rgba(255,255,255,0.45)',
                  fontSize: 18,
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                }}
                aria-label={def.name}
                title={def.name}
              >
                {def.icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chest inventory modal */}
      {chestModal && (
        <ChestInventoryModal
          items={chestModal.items}
          tier={chestModal.tier}
          onClose={() => setChestModal(null)}
        />
      )}

      {/* Defeated overlay */}
      {defeated && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm">
          <div style={{ fontSize: 52, marginBottom: 12, filter: 'drop-shadow(0 0 20px rgba(220,40,20,0.8))' }}>💀</div>
          <p className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif', color: '#e05030', textShadow: '0 0 20px rgba(200,40,20,0.8)' }}>
            Gefallen
          </p>
          <p className="text-sm mb-6" style={{ color: 'rgba(200,130,100,0.7)', fontFamily: 'Georgia, serif' }}>
            Die Dunkelheit hat dich überwältigt
          </p>
          <button
            onClick={onExit}
            className="rounded px-6 py-2 text-sm font-semibold"
            style={{ background: 'linear-gradient(180deg, #802020, #401010)', color: '#ffb0a0', fontFamily: 'Georgia, serif', boxShadow: '0 2px 8px rgba(0,0,0,0.6)', border: '1px solid rgba(200,60,40,0.4)' }}
          >
            Dungeon verlassen
          </button>
        </div>
      )}

      {/* Key drop notification */}
      {keyNotif && (
        <div
          className="pointer-events-none absolute left-1/2 z-40"
          style={{
            top: 80, transform: 'translateX(-50%)',
            background: 'rgba(20,14,4,0.92)',
            border: '1px solid rgba(200,160,40,0.6)',
            borderRadius: 4,
            padding: '6px 16px',
            boxShadow: '0 0 16px rgba(180,130,0,0.5)',
            fontFamily: 'Georgia, serif',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>🗝</span>
          <span style={{ color: '#d4a832', fontSize: 12, fontWeight: 'bold' }}>Schlüssel erhalten!</span>
        </div>
      )}

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
