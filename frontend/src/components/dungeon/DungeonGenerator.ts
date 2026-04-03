export type DungeonStyle = 'kerker' | 'hoehle' | 'krypta';

// ─── Tile constants ───────────────────────────────────────────────────────────
export const T_FLOOR        =  0; // walkable stone floor
export const T_WALL         =  1; // solid wall
export const T_DOOR         =  2; // walkable doorway
export const T_TORCH        =  3; // wall torch (solid, animated)
export const T_EXIT         =  4; // exit staircase
export const T_WATER        =  5; // water / underground pool
export const T_DECOR        =  6; // altar / rune (walkable)
export const T_CHEST_GOLD   =  7; // loot: gold chest (solid)
export const T_CHEST_WOOD   =  8; // loot: wood chest (solid)
export const T_CHEST_STEEL  =  9; // loot: steel chest (solid)
export const T_BARREL       = 10; // prop: barrel (solid)
export const T_BARREL_SWORD = 11; // prop: sword barrel (solid)
export const T_SKULL        = 12; // prop: skull (walkable decor)
export const T_BRAZIER      = 13; // prop: brazier light (solid, glows)
export const T_WEAPONS_STAND= 14; // prop: weapons stand (solid)
export const T_ARMOR_STAND  = 15; // prop: armor stand (solid)
export const T_SACK         = 16; // prop: sack (solid)
export const T_CRATE        = 17; // prop: crate (solid)
export const T_BONES        = 18; // prop: bones on floor (walkable)
export const T_CANDLE       = 19; // prop: candle (walkable, glows)
export const T_POT          = 20; // prop: stone pot (solid)
export const T_LOOT_FLOOR   = 21; // special golden floor for loot rooms
export const T_VOID         = 22; // empty void — background shows through (impassable)
export const T_TABLE        = 23; // prop: wooden table / workbench (solid)
export const T_PILLAR       = 24; // prop: stone pillar (solid)
export const T_BED          = 25; // prop: bed / bunk (solid)
export const T_BOOKSHELF    = 26; // prop: bookshelf (solid)
export const T_THRONE       = 27; // prop: throne / high seat (solid)
export const T_CARPET       = 28; // deco: floor carpet / rug (walkable)
export const T_CHAIN        = 29; // deco: wall chains (solid — counts as wall fixture)
export const T_CAULDRON     = 30; // prop: bubbling cauldron (solid, glows)

export const DUNGEON_SOLID = new Set([
  T_WALL, T_VOID, T_TORCH, T_CHEST_GOLD, T_CHEST_WOOD, T_CHEST_STEEL,
  T_BARREL, T_BARREL_SWORD, T_BRAZIER, T_WEAPONS_STAND, T_ARMOR_STAND,
  T_SACK, T_CRATE, T_POT, T_TABLE, T_PILLAR,
  T_BED, T_BOOKSHELF, T_THRONE, T_CHAIN, T_CAULDRON,
]);

export const DNG_W = 50;
export const DNG_H = 36;

export interface LootRoom {
  x: number; y: number; w: number; h: number;
  tier: 'common' | 'rare' | 'legendary';
}

export interface DungeonEnemy {
  id: string;
  x: number;
  y: number;
  type: 'guard' | 'knight' | 'darkelf' | 'bat' | 'goblin' | 'golem' | 'skeleton' | 'zombie' | 'lich';
  name: string;
  maxHp: number;
  atk: number;
  def: number;
  xp: number;
  gold: number;
}

export interface DungeonMap {
  tiles: number[][];
  width: number;
  height: number;
  playerStart: { x: number; y: number };
  exit: { x: number; y: number };
  style: DungeonStyle;
  name: string;
  seed: number;
  lootRooms: LootRoom[];
  enemies: DungeonEnemy[];
}

// ─── Seeded LCG RNG ──────────────────────────────────────────────────────────

function makeRng(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

// ─── BSP tree ────────────────────────────────────────────────────────────────

interface BSPNode {
  x: number; y: number; w: number; h: number;
  left?: BSPNode; right?: BSPNode;
  room?: { x: number; y: number; w: number; h: number };
}

function bspSplit(node: BSPNode, rng: () => number, depth = 0): void {
  const MIN = 11;
  const canH = node.h >= MIN * 2 + 2;
  const canV = node.w >= MIN * 2 + 2;
  if ((!canH && !canV) || depth > 4) return;
  const horiz = canH && (!canV || rng() < 0.5);
  if (horiz) {
    const sp = Math.floor(node.y + MIN + rng() * (node.h - MIN * 2));
    node.left  = { x: node.x, y: node.y, w: node.w, h: sp - node.y };
    node.right = { x: node.x, y: sp,     w: node.w, h: node.y + node.h - sp };
  } else {
    const sp = Math.floor(node.x + MIN + rng() * (node.w - MIN * 2));
    node.left  = { x: node.x, y: node.y, w: sp - node.x,          h: node.h };
    node.right = { x: sp,     y: node.y, w: node.x + node.w - sp, h: node.h };
  }
  bspSplit(node.left, rng, depth + 1);
  bspSplit(node.right, rng, depth + 1);
}

function bspPlaceRooms(node: BSPNode, rng: () => number): void {
  if (node.left || node.right) {
    if (node.left)  bspPlaceRooms(node.left, rng);
    if (node.right) bspPlaceRooms(node.right, rng);
    return;
  }
  // Small margin so rooms fill most of the partition
  const mg = 1;
  const maxW = node.w - mg * 2, maxH = node.h - mg * 2;
  const minW = 7, minH = 5;
  if (maxW < minW || maxH < minH) return;
  // Bias rooms toward larger sizes — rooms fill 60-100 % of available space
  const rw = Math.min(maxW, minW + Math.floor(rng() * rng() * (maxW - minW + 1) + (maxW - minW) * 0.4));
  const rh = Math.min(maxH, minH + Math.floor(rng() * rng() * (maxH - minH + 1) + (maxH - minH) * 0.4));
  const rx = node.x + mg + Math.floor(rng() * Math.max(1, maxW - rw + 1));
  const ry = node.y + mg + Math.floor(rng() * Math.max(1, maxH - rh + 1));
  node.room = { x: rx, y: ry, w: rw, h: rh };
}

function bspLeaves(node: BSPNode): BSPNode[] {
  if (!node.left && !node.right) return [node];
  return [
    ...(node.left  ? bspLeaves(node.left)  : []),
    ...(node.right ? bspLeaves(node.right) : []),
  ];
}

function center(r: { x: number; y: number; w: number; h: number }) {
  return { x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) };
}

function carveH(map: number[][], y: number, x1: number, x2: number) {
  const H = map.length;
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
    for (let dy = -1; dy <= 1; dy++) {
      const fy = y + dy;
      if (fy <= 0 || fy >= H - 1) continue;
      if (map[fy][x] === T_WALL) map[fy][x] = T_FLOOR;
    }
}
function carveV(map: number[][], x: number, y1: number, y2: number) {
  const W = map[0].length;
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
    for (let dx = -1; dx <= 1; dx++) {
      const fx = x + dx;
      if (fx <= 0 || fx >= W - 1) continue;
      if (map[y][fx] === T_WALL) map[y][fx] = T_FLOOR;
    }
}

// Place door tiles where a corridor enters/exits a room wall
function placeDoors(map: number[][], rooms: { x: number; y: number; w: number; h: number }[]) {
  const H = map.length, W = map[0].length;
  for (const r of rooms) {
    // Scan room perimeter — if a perimeter wall has a floor corridor behind it, mark as door
    for (let x = r.x; x < r.x + r.w; x++) {
      for (const [wy, fy] of [[r.y - 1, r.y - 2], [r.y + r.h, r.y + r.h + 1]]) {
        if (wy <= 0 || wy >= H - 1 || fy <= 0 || fy >= H - 1) continue;
        if (map[wy][x] === T_FLOOR && map[fy][x] === T_FLOOR)
          map[wy][x] = T_DOOR;
      }
    }
    for (let y = r.y; y < r.y + r.h; y++) {
      for (const [wx, fx] of [[r.x - 1, r.x - 2], [r.x + r.w, r.x + r.w + 1]]) {
        if (wx <= 0 || wx >= W - 1 || fx <= 0 || fx >= W - 1) continue;
        if (map[y][wx] === T_FLOOR && map[y][fx] === T_FLOOR)
          map[y][wx] = T_DOOR;
      }
    }
  }
}

// ─── Partition-wall approach (building-like rooms) ───────────────────────────

// Draws a 1-tile wall along each BSP split boundary and punches a 3-tile opening.
export function buildPartitionWalls(node: BSPNode, map: number[][], rng: () => number): void {
  if (!node.left || !node.right) return;
  buildPartitionWalls(node.left, map, rng);
  buildPartitionWalls(node.right, map, rng);

  const isHoriz = node.left.y + node.left.h === node.right.y;

  if (isHoriz) {
    const wallY = node.right.y;
    for (let x = node.x; x < node.x + node.w; x++) map[wallY][x] = T_WALL;
    const avail = Math.max(1, node.w - 5);
    const openX = node.x + 2 + Math.floor(rng() * avail);
    for (let x = openX; x <= openX + 2 && x < node.x + node.w - 2; x++)
      map[wallY][x] = T_DOOR;
  } else {
    const wallX = node.right.x;
    for (let y = node.y; y < node.y + node.h; y++) map[y][wallX] = T_WALL;
    const avail = Math.max(1, node.h - 5);
    const openY = node.y + 2 + Math.floor(rng() * avail);
    for (let y = openY; y <= openY + 2 && y < node.y + node.h - 2; y++)
      map[y][wallX] = T_DOOR;
  }
}

function bspConnect(node: BSPNode, map: number[][], rng: () => number): void {
  if (!node.left || !node.right) return;
  bspConnect(node.left, map, rng);
  bspConnect(node.right, map, rng);
  const ll = bspLeaves(node.left).filter(l => l.room);
  const rl = bspLeaves(node.right).filter(l => l.room);
  if (!ll.length || !rl.length) return;
  let best = Infinity, la = ll[0], ra = rl[0];
  for (const l of ll) for (const r of rl) {
    if (!l.room || !r.room) continue;
    const lc = center(l.room), rc = center(r.room);
    const d = Math.abs(lc.x - rc.x) + Math.abs(lc.y - rc.y);
    if (d < best) { best = d; la = l; ra = r; }
  }
  if (!la.room || !ra.room) return;
  const lc = center(la.room), rc = center(ra.room);
  if (rng() < 0.5) { carveH(map, lc.y, lc.x, rc.x); carveV(map, rc.x, lc.y, rc.y); }
  else             { carveV(map, lc.x, lc.y, rc.y); carveH(map, rc.y, lc.x, rc.x); }
}

// ─── Scene system ─────────────────────────────────────────────────────────────
// [dx, dy, tile] relative to an anchor. dy=0 = wall-adjacent row (back of scene).

type SceneTile = [number, number, number];
type Wall = 'top' | 'bottom' | 'left' | 'right';

function tryPlaceScene(
  map: number[][], scene: SceneTile[],
  ax: number, ay: number,
  rx: number, ry: number, rw: number, rh: number,
): boolean {
  const fits = scene.every(([dx, dy]) => {
    const tx = ax + dx, ty = ay + dy;
    return tx >= rx + 1 && tx < rx + rw - 1 &&
           ty >= ry + 1 && ty < ry + rh - 1 &&
           map[ty][tx] === T_FLOOR;
  });
  if (fits) scene.forEach(([dx, dy, t]) => { map[ay + dy][ax + dx] = t; });
  return fits;
}

// Place a scene anchored against a specific room wall.
// Scenes are defined in "top-wall" orientation (dy=0 is wall-touching row, dy+ extends inward).
// For other walls the dx/dy are transposed/negated automatically.
function placeAtWall(
  map: number[][], scene: SceneTile[],
  room: { x: number; y: number; w: number; h: number },
  wall: Wall, rng: () => number,
): boolean {
  const { x, y, w, h } = room;
  // Transform scene for the target wall
  const s: SceneTile[] = scene.map(([dx, dy, t]) => {
    if (wall === 'top')    return [dx, dy, t];
    if (wall === 'bottom') return [dx, -dy, t];
    if (wall === 'left')   return [dy, dx, t];
    /* right */            return [-dy, dx, t];
  });
  const dxs = s.map(c => c[0]), dys = s.map(c => c[1]);
  const minDx = Math.min(...dxs), maxDx = Math.max(...dxs);
  const minDy = Math.min(...dys), maxDy = Math.max(...dys);
  const sw = maxDx - minDx + 1, sh = maxDy - minDy + 1;

  for (let i = 0; i < 12; i++) {
    let ax: number, ay: number;
    if (wall === 'top') {
      const avail = w - 2 - sw + 1; if (avail <= 0) return false;
      ax = x + 1 - minDx + Math.floor(rng() * avail); ay = y + 1 - minDy;
    } else if (wall === 'bottom') {
      const avail = w - 2 - sw + 1; if (avail <= 0) return false;
      ax = x + 1 - minDx + Math.floor(rng() * avail); ay = y + h - 2 - maxDy;
    } else if (wall === 'left') {
      const avail = h - 2 - sh + 1; if (avail <= 0) return false;
      ax = x + 1 - minDx; ay = y + 1 - minDy + Math.floor(rng() * avail);
    } else {
      const avail = h - 2 - sh + 1; if (avail <= 0) return false;
      ax = x + w - 2 - maxDx; ay = y + 1 - minDy + Math.floor(rng() * avail);
    }
    if (tryPlaceScene(map, s, ax, ay, x, y, w, h)) return true;
  }
  return false;
}

// Place symmetrical pillars in large rooms
function placePillars(
  map: number[][], room: { x: number; y: number; w: number; h: number },
) {
  const { x, y, w, h } = room;
  const cols = [Math.round(x + w * 0.25), Math.round(x + w * 0.75)];
  const rows = [Math.round(y + h * 0.3),  Math.round(y + h * 0.7)];
  for (const py of rows) for (const px of cols)
    if (map[py]?.[px] === T_FLOOR) map[py][px] = T_PILLAR;
}

// ─── Scene library ────────────────────────────────────────────────────────────
// All scenes in "top-wall" orientation: dy=0 is the row touching the wall,
// dy increases inward. Keep the back row solid, front row can be walkable.

// ── KERKER ────────────────────────────────────────────────────────────────────

// Waffenkammer: armor stand + weapons rack + sword barrel in a row
const S_ARMORY: SceneTile[] = [
  [0,0,T_ARMOR_STAND],[1,0,T_WEAPONS_STAND],[2,0,T_BARREL_SWORD],
];
// Werkbank: three tables with candles at either end
const S_WORKBENCH: SceneTile[] = [
  [0,0,T_TABLE],[1,0,T_TABLE],[2,0,T_TABLE],
  [0,1,T_CANDLE],                           [2,1,T_CANDLE],
];
// Lager: crates + barrel row, sacks in front
const S_STORAGE: SceneTile[] = [
  [0,0,T_CRATE],[1,0,T_CRATE],[2,0,T_BARREL],
  [0,1,T_SACK],              [2,1,T_POT],
];
// Wachposten: armor stand + table (duty log)
const S_GUARD_POST: SceneTile[] = [
  [0,0,T_ARMOR_STAND],[1,0,T_TABLE],
  [1,1,T_CANDLE],
];
// Vorrat: barrel row with sword and sacks
const S_BARREL_ROW: SceneTile[] = [
  [0,0,T_BARREL],[1,0,T_BARREL_SWORD],[2,0,T_BARREL],[3,0,T_SACK],
];
// Folterkeller: bones + skull with a candle, against wall
const S_TORTURE: SceneTile[] = [
  [0,0,T_SKULL],[1,0,T_BONES],[2,0,T_BONES],
  [0,1,T_CANDLE],[2,1,T_BONES],
];
// Schreibtisch: single table with candle and pot
const S_DESK: SceneTile[] = [
  [0,0,T_TABLE],[1,0,T_TABLE],
  [0,1,T_CANDLE],[1,1,T_POT],
];
// Nachschub: supply row
const S_SUPPLY: SceneTile[] = [
  [0,0,T_CRATE],[1,0,T_SACK],[2,0,T_BARREL],[3,0,T_POT],
];
// Kaserne: bunk beds against wall, armor stand to the side
const S_BARRACKS: SceneTile[] = [
  [0,0,T_BED],[1,0,T_BED],[2,0,T_ARMOR_STAND],
  [0,1,T_SACK],[2,1,T_CANDLE],
];
// Einzelbett: solo bed with personal effects
const S_BUNK: SceneTile[] = [
  [0,0,T_BED],[1,0,T_TABLE],
  [1,1,T_CANDLE],
];
// Bibliothek: bookshelves with candle light
const S_LIBRARY_WALL: SceneTile[] = [
  [0,0,T_BOOKSHELF],[1,0,T_BOOKSHELF],[2,0,T_BOOKSHELF],
  [0,1,T_CANDLE],                     [2,1,T_POT],
];
// Lesepult: desk beneath bookshelves
const S_READING_NOOK: SceneTile[] = [
  [0,0,T_BOOKSHELF],[1,0,T_BOOKSHELF],
  [0,1,T_TABLE],[1,1,T_CANDLE],
];
// Küche: barrel + pot + crate cooking area
const S_KITCHEN: SceneTile[] = [
  [0,0,T_BARREL],[1,0,T_POT],[2,0,T_CRATE],
  [0,1,T_SACK],[2,1,T_BARREL],
];
// Folterkammer-Ketten: chains + skull arrangement
const S_TORTURE_CHAINS: SceneTile[] = [
  [0,0,T_CHAIN],[1,0,T_SKULL],[2,0,T_CHAIN],
  [0,1,T_BONES],[1,1,T_CANDLE],[2,1,T_BONES],
];
// Thronsaal-Wand: brazier flanking approach
const S_THRONE_FLANKS: SceneTile[] = [
  [0,0,T_BRAZIER],[1,0,T_CARPET],[2,0,T_BRAZIER],
];

// ── KRYPTA ────────────────────────────────────────────────────────────────────

// Hauptaltar: decor flanked by candles, bones in front
const S_MAIN_ALTAR: SceneTile[] = [
  [0,0,T_CANDLE],[1,0,T_DECOR],[2,0,T_CANDLE],
  [0,1,T_BONES], [1,1,T_SKULL],[2,1,T_BONES],
];
// Opfertisch: burial table with skulls and candles
const S_BURIAL_TABLE: SceneTile[] = [
  [0,0,T_CANDLE],[1,0,T_TABLE],[2,0,T_CANDLE],
  [0,1,T_SKULL], [1,1,T_BONES],[2,1,T_SKULL],
];
// Brasero-Flanken: brazier with skull sentinels
const S_BRAZIER_SHRINE: SceneTile[] = [
  [0,0,T_SKULL],[1,0,T_BRAZIER],[2,0,T_SKULL],
  [0,1,T_CANDLE],              [2,1,T_CANDLE],
];
// Grabwächter: two armor stands guarding bones
const S_TOMB_GUARD: SceneTile[] = [
  [0,0,T_ARMOR_STAND],[1,0,T_BONES],[2,0,T_ARMOR_STAND],
];
// Knochenwand: bone + skull row with candles
const S_BONE_WALL: SceneTile[] = [
  [0,0,T_BONES],[1,0,T_SKULL],[2,0,T_BONES],[3,0,T_SKULL],
  [1,1,T_CANDLE],             [3,1,T_CANDLE],
];
// Nekromantentisch: ritual table with candles and skull
const S_RITUAL_TABLE: SceneTile[] = [
  [0,0,T_TABLE],[1,0,T_TABLE],
  [0,1,T_SKULL],[1,1,T_CANDLE],
];
// Kerzenaltar: simple candle row with central skull
const S_CANDLE_ALTAR: SceneTile[] = [
  [0,0,T_CANDLE],[1,0,T_SKULL],[2,0,T_CANDLE],
];
// Hexenkessel: bubbling cauldron with ritual components
const S_CAULDRON_SHRINE: SceneTile[] = [
  [0,0,T_SKULL],[1,0,T_CAULDRON],[2,0,T_SKULL],
  [0,1,T_CANDLE],[1,1,T_BONES],[2,1,T_CANDLE],
];
// Lichthron-Wand: throne backing scene for undead ruler
const S_LICH_THRONE_WALL: SceneTile[] = [
  [0,0,T_CANDLE],[1,0,T_SKULL],[2,0,T_CANDLE],
  [0,1,T_BONES],              [2,1,T_BONES],
];
// Gruftregale: dark shelves with sinister contents
const S_CRYPT_SHELVES: SceneTile[] = [
  [0,0,T_BOOKSHELF],[1,0,T_BOOKSHELF],
  [0,1,T_SKULL],[1,1,T_CANDLE],
];

// ── HÖHLE ─────────────────────────────────────────────────────────────────────

// Kristallformation: pillar flanked by decor crystals
const S_CRYSTALS: SceneTile[] = [
  [0,0,T_DECOR],[1,0,T_PILLAR],[2,0,T_DECOR],
];
// Lagerfeuer: brazier + supply cache
const S_CAVE_CAMP: SceneTile[] = [
  [0,0,T_BRAZIER],[1,0,T_BARREL],[2,0,T_SACK],
  [0,1,T_POT],                  [2,1,T_CRATE],
];
// Knochenhaufen: creature bones + skull
const S_CREATURE_BONES: SceneTile[] = [
  [0,0,T_BONES],[1,0,T_SKULL],[2,0,T_BONES],
  [0,1,T_BONES],              [2,1,T_SKULL],
];
// Höhlensäulen: pillar row (stalagmite cluster)
const S_STALAGMITES: SceneTile[] = [
  [0,0,T_PILLAR],[2,0,T_PILLAR],
  [1,1,T_DECOR],
];
// Wasserstelle: water pool bordered by decor
const S_SPRING: SceneTile[] = [
  [0,0,T_WATER],[1,0,T_WATER],
  [0,1,T_DECOR],[1,1,T_WATER],
];
// Fundstück: scavenged loot pile
const S_CAVE_LOOT: SceneTile[] = [
  [0,0,T_CRATE],[1,0,T_BARREL],[2,0,T_POT],
  [1,1,T_SACK],
];
// Ritualherd: brazier flanked by bone offerings
const S_FIRE_SHRINE: SceneTile[] = [
  [0,0,T_BONES],[1,0,T_BRAZIER],[2,0,T_BONES],
  [1,1,T_SKULL],
];
// Goblinlager: makeshift bed + stolen goods
const S_GOBLIN_CAMP: SceneTile[] = [
  [0,0,T_BED],[1,0,T_CRATE],[2,0,T_BARREL],
  [0,1,T_SACK],[2,1,T_POT],
];
// Hexenkessel-Höhle: cauldron with cave offerings
const S_CAVE_CAULDRON: SceneTile[] = [
  [0,0,T_BONES],[1,0,T_CAULDRON],[2,0,T_SKULL],
  [1,1,T_CANDLE],
];

const KERKER_SCENES: SceneTile[][] = [
  S_ARMORY, S_WORKBENCH, S_STORAGE, S_GUARD_POST,
  S_BARREL_ROW, S_TORTURE, S_DESK, S_SUPPLY,
  S_BARRACKS, S_BUNK, S_LIBRARY_WALL, S_KITCHEN, S_TORTURE_CHAINS,
];
const KRYPTA_SCENES: SceneTile[][] = [
  S_MAIN_ALTAR, S_BURIAL_TABLE, S_BRAZIER_SHRINE,
  S_TOMB_GUARD, S_BONE_WALL, S_RITUAL_TABLE, S_CANDLE_ALTAR,
  S_CAULDRON_SHRINE, S_CRYPT_SHELVES,
];
const HOEHLE_SCENES: SceneTile[][] = [
  S_CRYSTALS, S_CAVE_CAMP, S_CREATURE_BONES,
  S_STALAGMITES, S_SPRING, S_CAVE_LOOT, S_FIRE_SHRINE,
  S_GOBLIN_CAMP, S_CAVE_CAULDRON,
];

// ─── Room-type system ─────────────────────────────────────────────────────────

type RoomType =
  | 'barracks' | 'armory' | 'storage' | 'guard' | 'torture'
  | 'throne' | 'library' | 'kitchen' | 'chapel' | 'necro' | 'generic'
  | 'cave_camp' | 'cave_shrine' | 'cave_crystal';

function assignRoomType(
  room: { w: number; h: number },
  style: DungeonStyle,
  dist: number,
  maxDist: number,
  rng: () => number,
): RoomType {
  const area = room.w * room.h;
  const relDist = maxDist > 0 ? dist / maxDist : 0;

  if (style === 'hoehle') {
    const roll = rng();
    if (area >= 60) return roll < 0.4 ? 'cave_shrine' : 'cave_camp';
    return roll < 0.35 ? 'cave_crystal' : roll < 0.65 ? 'cave_camp' : 'cave_shrine';
  }

  if (style === 'krypta') {
    if (area >= 70 && relDist > 0.6) return 'necro';
    if (area >= 50) return rng() < 0.5 ? 'chapel' : 'necro';
    return 'generic';
  }

  // kerker
  if (area >= 90 && relDist > 0.5) return 'throne';
  const roll = rng();
  if (area >= 70) return roll < 0.3 ? 'armory' : roll < 0.55 ? 'barracks' : 'storage';
  if (area <= 30) return roll < 0.4 ? 'guard' : roll < 0.7 ? 'torture' : 'kitchen';
  if (relDist < 0.2) return roll < 0.5 ? 'guard' : 'barracks';
  if (roll < 0.18) return 'library';
  if (roll < 0.36) return 'armory';
  if (roll < 0.54) return 'storage';
  if (roll < 0.68) return 'barracks';
  if (roll < 0.78) return 'torture';
  if (roll < 0.86) return 'kitchen';
  return 'generic';
}

// Place a carpet strip from top-wall inward (approach path) in large rooms
function placeCarpetApproach(
  map: number[][], room: { x: number; y: number; w: number; h: number },
  targetY: number,
) {
  const cx = Math.floor(room.x + room.w / 2);
  for (let y = room.y + 1; y <= targetY; y++) {
    if (map[y]?.[cx] === T_FLOOR) map[y][cx] = T_CARPET;
    if (map[y]?.[cx - 1] === T_FLOOR) map[y][cx - 1] = T_CARPET;
    if (map[y]?.[cx + 1] === T_FLOOR) map[y][cx + 1] = T_CARPET;
  }
}

// Place a central feature tile (throne / cauldron / altar) in room center
function placeCentral(
  map: number[][], room: { x: number; y: number; w: number; h: number },
  tile: number, offsetY = 0,
) {
  const cx = Math.floor(room.x + room.w / 2);
  const cy = Math.floor(room.y + room.h / 2) + offsetY;
  if (map[cy]?.[cx] === T_FLOOR) map[cy][cx] = tile;
  return { cx, cy };
}

// ─── Loot room furnishing ────────────────────────────────────────────────────

function furnishLootRoom(
  map: number[][], room: { x: number; y: number; w: number; h: number },
  tier: 'common' | 'rare' | 'legendary', _rng: () => number,
) {
  const { x, y, w, h } = room;
  const cx = Math.floor(x + w / 2), cy = Math.floor(y + h / 2);

  // Golden floor
  for (let ry = y; ry < y + h; ry++)
    for (let rx = x; rx < x + w; rx++)
      if (map[ry][rx] === T_FLOOR) map[ry][rx] = T_LOOT_FLOOR;

  const p = (px: number, py: number, t: number) => {
    if (px >= x && px < x+w && py >= y && py < y+h &&
        (map[py][px] === T_LOOT_FLOOR)) map[py][px] = t;
  };

  // Chest at center
  map[cy][cx] = tier === 'legendary' ? T_CHEST_GOLD
    : tier === 'rare' ? T_CHEST_STEEL : T_CHEST_WOOD;

  if (tier === 'legendary') {
    // Grandiose Schatzkammer: braziers + armor stands + weapons stands + candles
    p(cx-2, cy, T_BRAZIER);    p(cx+2, cy, T_BRAZIER);
    p(cx-1, cy-1, T_ARMOR_STAND);   p(cx+1, cy-1, T_ARMOR_STAND);
    p(cx-1, cy+1, T_WEAPONS_STAND); p(cx+1, cy+1, T_WEAPONS_STAND);
    p(cx,   cy-2, T_CANDLE);        p(cx,   cy+2, T_CANDLE);
    p(cx-2, cy-1, T_SKULL);         p(cx+2, cy-1, T_SKULL);
    // Tables flanking chest
    p(cx-3, cy, T_TABLE); p(cx+3, cy, T_TABLE);
  } else if (tier === 'rare') {
    p(cx-2, cy, T_BRAZIER); p(cx+2, cy, T_BRAZIER);
    p(cx-1, cy, T_SACK);    p(cx+1, cy, T_SACK);
    p(cx, cy-1, T_WEAPONS_STAND);
    p(cx-1, cy+1, T_CANDLE); p(cx+1, cy+1, T_CANDLE);
    p(cx, cy+2, T_CRATE);
  } else {
    p(cx-1, cy, T_BARREL); p(cx+1, cy, T_BARREL);
    p(cx, cy-1, T_SACK);
    p(cx-1, cy+1, T_CRATE); p(cx+1, cy+1, T_POT);
  }
}

// ─── Regular room furnishing ─────────────────────────────────────────────────

// Scene pools per room type for kerker
const SCENES_BY_TYPE: Partial<Record<RoomType, SceneTile[][]>> = {
  barracks:   [S_BARRACKS, S_BUNK, S_BARRACKS, S_GUARD_POST, S_DESK],
  armory:     [S_ARMORY, S_ARMORY, S_BARREL_ROW, S_WORKBENCH, S_SUPPLY],
  storage:    [S_STORAGE, S_SUPPLY, S_BARREL_ROW, S_KITCHEN],
  guard:      [S_GUARD_POST, S_DESK, S_BARREL_ROW],
  torture:    [S_TORTURE, S_TORTURE_CHAINS, S_TORTURE, S_BONE_WALL],
  throne:     [S_THRONE_FLANKS, S_ARMORY, S_GUARD_POST],
  library:    [S_LIBRARY_WALL, S_READING_NOOK, S_DESK, S_LIBRARY_WALL],
  kitchen:    [S_KITCHEN, S_STORAGE, S_BARREL_ROW, S_SUPPLY],
  chapel:     [S_MAIN_ALTAR, S_BRAZIER_SHRINE, S_CANDLE_ALTAR, S_BURIAL_TABLE],
  necro:      [S_CAULDRON_SHRINE, S_RITUAL_TABLE, S_LICH_THRONE_WALL, S_BONE_WALL, S_CRYPT_SHELVES],
  cave_camp:  [S_CAVE_CAMP, S_GOBLIN_CAMP, S_CAVE_LOOT, S_CREATURE_BONES],
  cave_shrine:[S_FIRE_SHRINE, S_CAVE_CAULDRON, S_CREATURE_BONES, S_SPRING],
  cave_crystal:[S_CRYSTALS, S_STALAGMITES, S_SPRING, S_CRYSTALS],
};

function furnishRoom(
  map: number[][], room: { x: number; y: number; w: number; h: number },
  style: DungeonStyle, rng: () => number,
  roomType: RoomType = 'generic',
) {
  const { x, y, w, h } = room;
  const cx = Math.floor(x + w / 2);
  const cy = Math.floor(y + h / 2);
  const area = w * h;
  const walls: Wall[] = ['top', 'bottom', 'left', 'right'];
  const shuffled = [...walls].sort(() => rng() - 0.5);

  // ── Symmetric pillars in large rooms ─────────────────────────────────────
  if (w >= 12 && h >= 9) placePillars(map, room);

  // ── Central feature for special room types ────────────────────────────────
  if (roomType === 'throne' && area >= 60) {
    // Throne on north wall center + carpet approach
    const throneY = y + 2;
    if (map[throneY]?.[cx] === T_FLOOR) map[throneY][cx] = T_THRONE;
    // Flanking braziers
    if (map[throneY]?.[cx - 1] === T_FLOOR) map[throneY][cx - 1] = T_BRAZIER;
    if (map[throneY]?.[cx + 1] === T_FLOOR) map[throneY][cx + 1] = T_BRAZIER;
    // Carpet runner from throne to lower half
    placeCarpetApproach(map, room, cy + 1);
  } else if (roomType === 'necro' && area >= 50) {
    // Cauldron centerpiece + carpet ring
    const { cy: fcy } = placeCentral(map, room, T_CAULDRON, -1);
    // Candles around cauldron
    for (const [dx, dy] of [[-2,0],[2,0],[0,-1],[0,1]]) {
      const nx = cx + dx, ny = fcy + dy;
      if (map[ny]?.[nx] === T_FLOOR) map[ny][nx] = T_CANDLE;
    }
  } else if (roomType === 'chapel' && area >= 50) {
    // Altar centerpiece at north
    const altarY = y + 2;
    if (map[altarY]?.[cx] === T_FLOOR) map[altarY][cx] = T_DECOR;
    if (map[altarY]?.[cx - 1] === T_FLOOR) map[altarY][cx - 1] = T_CANDLE;
    if (map[altarY]?.[cx + 1] === T_FLOOR) map[altarY][cx + 1] = T_CANDLE;
    if (map[altarY + 1]?.[cx - 1] === T_FLOOR) map[altarY + 1][cx - 1] = T_BONES;
    if (map[altarY + 1]?.[cx + 1] === T_FLOOR) map[altarY + 1][cx + 1] = T_BONES;
    placeCarpetApproach(map, room, cy + 1);
  } else if (roomType === 'library' && area >= 40) {
    // Reading table in center
    if (map[cy]?.[cx] === T_FLOOR) map[cy][cx] = T_TABLE;
    if (map[cy]?.[cx + 1] === T_FLOOR) map[cy][cx + 1] = T_TABLE;
    if (map[cy]?.[cx - 1] === T_FLOOR) map[cy][cx - 1] = T_CANDLE;
  } else if (roomType === 'barracks' && area >= 45) {
    // Center table for mess
    if (map[cy]?.[cx] === T_FLOOR) map[cy][cx] = T_TABLE;
    if (map[cy]?.[cx - 1] === T_FLOOR) map[cy][cx - 1] = T_TABLE;
    if (map[cy]?.[cx + 1] === T_FLOOR) map[cy][cx + 1] = T_TABLE;
  } else if (roomType === 'cave_shrine' && area >= 40) {
    // Central fire / cauldron
    placeCentral(map, room, T_BRAZIER);
    if (map[cy + 1]?.[cx] === T_FLOOR) map[cy + 1][cx] = T_SKULL;
  }

  // ── Wall scenes ───────────────────────────────────────────────────────────
  const scenePool =
    SCENES_BY_TYPE[roomType] ??
    (style === 'krypta' ? KRYPTA_SCENES : style === 'hoehle' ? HOEHLE_SCENES : KERKER_SCENES);
  const sceneCount = area >= 70 ? 3 : area >= 40 ? 2 : 1;

  let placed = 0;
  for (const wall of shuffled) {
    if (placed >= sceneCount) break;
    const scene = scenePool[Math.floor(rng() * scenePool.length)];
    if (placeAtWall(map, scene, room, wall, rng)) placed++;
  }
  let attempts = 0;
  while (placed < sceneCount && ++attempts < 50) {
    const wall = shuffled[Math.floor(rng() * 4)];
    const scene = scenePool[Math.floor(rng() * scenePool.length)];
    if (placeAtWall(map, scene, room, wall, rng)) placed++;
  }
}

// ─── Torches on walls ────────────────────────────────────────────────────────

function addTorches(map: number[][], rng: () => number) {
  const H = map.length, W = map[0].length;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (map[y][x] !== T_WALL) continue;
      const adjFloor =
        map[y - 1][x] === T_FLOOR || map[y + 1][x] === T_FLOOR ||
        map[y][x - 1] === T_FLOOR || map[y][x + 1] === T_FLOOR;
      if (adjFloor && rng() < 0.055) map[y][x] = T_TORCH;
    }
  }
}

// ─── Cave generation ─────────────────────────────────────────────────────────

function generateCave(W: number, H: number, rng: () => number): number[][] {
  const map: number[][] = Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) =>
      x === 0 || y === 0 || x === W - 1 || y === H - 1 ? T_WALL
      : rng() < 0.44 ? T_FLOOR : T_WALL
    )
  );
  for (let iter = 0; iter < 5; iter++) {
    const next = map.map(r => [...r]);
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        let walls = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if (map[y + dy][x + dx] === T_WALL) walls++;
        next[y][x] = walls >= 5 ? T_WALL : T_FLOOR;
      }
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) map[y][x] = next[y][x];
  }
  // Flood fill — keep largest region
  const visited = Array.from({ length: H }, () => new Array(W).fill(-1));
  const regions: { x: number; y: number }[][] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (map[y][x] !== T_FLOOR || visited[y][x] >= 0) continue;
      const id = regions.length;
      const region: { x: number; y: number }[] = [];
      const q = [{ x, y }];
      visited[y][x] = id;
      while (q.length) {
        const { x: cx, y: cy } = q.shift()!;
        region.push({ x: cx, y: cy });
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          if (map[ny][nx] !== T_FLOOR || visited[ny][nx] >= 0) continue;
          visited[ny][nx] = id;
          q.push({ x: nx, y: ny });
        }
      }
      regions.push(region);
    }
  }
  const largest = regions.sort((a, b) => b.length - a.length)[0] ?? [];
  const keep = new Set(largest.map(t => `${t.x},${t.y}`));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (map[y][x] === T_FLOOR && !keep.has(`${x},${y}`)) map[y][x] = T_WALL;

  // Underground pools
  for (let i = 0; i < 5; i++) {
    const tile = largest[Math.floor(rng() * largest.length)];
    if (!tile) continue;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = tile.x + dx, ny = tile.y + dy;
        if (ny >= 0 && ny < H && nx >= 0 && nx < W && map[ny][nx] === T_FLOOR && rng() < 0.7)
          map[ny][nx] = T_WATER;
      }
  }
  // Scatter bones & candles
  for (const t of largest) {
    if (rng() < 0.04) map[t.y][t.x] = T_BONES;
    else if (rng() < 0.015) map[t.y][t.x] = T_CANDLE;
  }
  return map;
}

// ─── BFS distance ────────────────────────────────────────────────────────────

function bfsDist(map: number[][], sx: number, sy: number): number[][] {
  const H = map.length, W = map[0].length;
  const dist = Array.from({ length: H }, () => new Array(W).fill(-1));
  dist[sy][sx] = 0;
  const q = [{ x: sx, y: sy }];
  while (q.length) {
    const { x, y } = q.shift()!;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      if (dist[ny][nx] >= 0) continue;
      if (DUNGEON_SOLID.has(map[ny][nx])) continue;
      dist[ny][nx] = dist[y][x] + 1;
      q.push({ x: nx, y: ny });
    }
  }
  return dist;
}

// ─── Names ───────────────────────────────────────────────────────────────────

const KERKER_NAMES = ['Verlies des Vergessens','Eisenkäfig der Verdammnis','Dunkel unter der Burg',
  'Katakomben des Zwielichts','Tiefer Kerker','Gruft der Namenlosen'];
const HOEHLE_NAMES = ['Kristallhöhle','Abgrund der Finsternis','Tropfsteinhöhle',
  'Unterirdischer See','Echohöhle','Tiefe der Erde'];
const KRYPTA_NAMES = ['Krypta der Gefallenen','Gruft des Alten Königs','Katakomben der Seelen',
  'Halle der Erinnerungen','Totenkammer','Krypta der Ewigen Nacht'];

// ─── Main ─────────────────────────────────────────────────────────────────────

export function generateDungeon(style: DungeonStyle, seed?: number): DungeonMap {
  const s = seed ?? Math.floor(Math.random() * 0xffffff);
  const rng = makeRng(s);
  const W = DNG_W, H = DNG_H;

  let map: number[][];
  let playerStart: { x: number; y: number };
  let exit: { x: number; y: number };
  const lootRooms: LootRoom[] = [];
  const enemies: DungeonEnemy[] = [];

  if (style === 'hoehle') {
    map = generateCave(W, H, rng);
    const floorTiles: { x: number; y: number }[] = [];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (map[y][x] === T_FLOOR) floorTiles.push({ x, y });
    playerStart = floorTiles[Math.floor(rng() * floorTiles.length)] ?? { x: 2, y: 2 };
    const dist = bfsDist(map, playerStart.x, playerStart.y);
    let maxD = 0;
    exit = playerStart;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (dist[y][x] > maxD) { maxD = dist[y][x]; exit = { x, y }; }
    map[exit.y][exit.x] = T_EXIT;

    // Place a small loot alcove by picking a secluded floor tile mid-distance
    const midTiles = floorTiles.filter(t => {
      const d = dist[t.y]?.[t.x] ?? 0;
      return d > maxD * 0.35 && d < maxD * 0.65;
    });
    if (midTiles.length > 0) {
      const lt = midTiles[Math.floor(rng() * midTiles.length)];
      const tier = rng() < 0.2 ? 'legendary' : rng() < 0.5 ? 'rare' : 'common';
      map[lt.y][lt.x] = tier === 'legendary' ? T_CHEST_GOLD : tier === 'rare' ? T_CHEST_STEEL : T_CHEST_WOOD;
      lootRooms.push({ x: lt.x, y: lt.y, w: 1, h: 1, tier });
      // Candles around it
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nx = lt.x + dx, ny = lt.y + dy;
        if (ny >= 0 && ny < H && nx >= 0 && nx < W && map[ny][nx] === T_FLOOR)
          map[ny][nx] = T_CANDLE;
      }
    }
  } else {
    map = Array.from({ length: H }, () => new Array(W).fill(T_WALL));
    const root: BSPNode = { x: 1, y: 1, w: W - 2, h: H - 2 };
    bspSplit(root, rng);
    bspPlaceRooms(root, rng);
    const leaves = bspLeaves(root).filter(l => l.room);

    // Carve rooms
    for (const leaf of leaves) {
      const r = leaf.room!;
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++)
          map[y][x] = T_FLOOR;
    }
    bspConnect(root, map, rng);
    placeDoors(map, leaves.map(l => l.room!));

    // Krypta cross extensions
    if (style === 'krypta') {
      for (const leaf of leaves) {
        const r = leaf.room!;
        if (r.w < 6 || r.h < 6) continue;
        const cx = Math.floor(r.x + r.w / 2), cy = Math.floor(r.y + r.h / 2);
        for (let x = Math.max(1, r.x - 2); x < Math.min(W - 1, r.x + r.w + 2); x++)
          if (map[cy][x] === T_WALL) map[cy][x] = T_FLOOR;
        for (let y = Math.max(1, r.y - 2); y < Math.min(H - 1, r.y + r.h + 2); y++)
          if (map[y][cx] === T_WALL) map[y][cx] = T_FLOOR;
      }
    }

    // Pick spawn and exit
    playerStart = leaves.length ? center(leaves[0].room!) : { x: 2, y: 2 };
    const dist = bfsDist(map, playerStart.x, playerStart.y);
    let maxD = 0;
    exit = playerStart;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (dist[y][x] > maxD) { maxD = dist[y][x]; exit = { x, y }; }
    map[exit.y][exit.x] = T_EXIT;

    // Designate 1–2 loot rooms
    const roomsSorted = leaves
      .map(l => { const c = center(l.room!); return { room: l.room!, dist: dist[c.y]?.[c.x] ?? 0 }; })
      .filter(r => r.dist > 5)
      .sort(() => rng() - 0.5)
      .slice(0, 2);

    for (let i = 0; i < roomsSorted.length; i++) {
      const { room } = roomsSorted[i];
      const tier: LootRoom['tier'] = i === 0 && rng() < 0.3 ? 'legendary' : rng() < 0.5 ? 'rare' : 'common';
      furnishLootRoom(map, room, tier, rng);
      lootRooms.push({ ...room, tier });
    }

    // Furnish remaining rooms with purpose-driven types (reuse dist from exit BFS)
    const maxBfsDist = Math.max(maxD, 1);
    for (const leaf of leaves) {
      const isLoot = lootRooms.some(lr => lr.x === leaf.room!.x && lr.y === leaf.room!.y);
      if (isLoot || leaf === leaves[0]) continue;
      const c = center(leaf.room!);
      const d = dist[c.y]?.[c.x] ?? 0;
      const roomType = assignRoomType(leaf.room!, style, d, maxBfsDist, rng);
      furnishRoom(map, leaf.room!, style, rng, roomType);
    }

    // ─── Spawn enemies ──────────────────────────────────────────────────────
    const ENEMY_TEMPLATES: Record<DungeonStyle, DungeonEnemy['type'][]> = {
      kerker: ['guard', 'guard', 'knight', 'darkelf'],
      hoehle: ['bat', 'bat', 'goblin', 'golem'],
      krypta: ['skeleton', 'skeleton', 'zombie', 'lich'],
    };
    const ENEMY_DATA: Record<DungeonEnemy['type'], Omit<DungeonEnemy, 'id' | 'x' | 'y'>> = {
      guard:    { type: 'guard',    name: 'Wache',        maxHp: 28, atk: 8,  def: 3, xp: 20, gold: 15 },
      knight:   { type: 'knight',   name: 'Ritter',       maxHp: 55, atk: 14, def: 6, xp: 45, gold: 35 },
      darkelf:  { type: 'darkelf',  name: 'Dunkelelf',    maxHp: 35, atk: 16, def: 2, xp: 35, gold: 25 },
      bat:      { type: 'bat',      name: 'Fledermaus',   maxHp: 18, atk: 6,  def: 1, xp: 12, gold: 5  },
      goblin:   { type: 'goblin',   name: 'Goblin',       maxHp: 25, atk: 10, def: 2, xp: 18, gold: 12 },
      golem:    { type: 'golem',    name: 'Steingolem',   maxHp: 70, atk: 18, def: 8, xp: 60, gold: 40 },
      skeleton: { type: 'skeleton', name: 'Skelett',      maxHp: 22, atk: 9,  def: 1, xp: 16, gold: 8  },
      zombie:   { type: 'zombie',   name: 'Zombie',       maxHp: 40, atk: 11, def: 2, xp: 28, gold: 10 },
      lich:     { type: 'lich',     name: 'Lich',         maxHp: 80, atk: 22, def: 4, xp: 90, gold: 70 },
    };
    const templates = ENEMY_TEMPLATES[style];
    let eid = 0;

    for (const leaf of leaves) {
      const r = leaf.room!;
      const isLootRoom = lootRooms.some(lr => lr.x === r.x && lr.y === r.y);
      const isStart = leaf === leaves[0];
      if (isLootRoom || isStart) continue;
      const count = r.w * r.h >= 80 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        let ex = -1, ey = -1;
        for (let attempt = 0; attempt < 30; attempt++) {
          const tx = r.x + 1 + Math.floor(rng() * (r.w - 2));
          const ty = r.y + 1 + Math.floor(rng() * (r.h - 2));
          if (map[ty][tx] === T_FLOOR && !enemies.some(e => e.x === tx && e.y === ty)) {
            ex = tx; ey = ty; break;
          }
        }
        if (ex < 0) continue;
        const type = templates[Math.floor(rng() * templates.length)];
        enemies.push({ id: `e${eid++}`, x: ex, y: ey, ...ENEMY_DATA[type] });
      }
    }
  }

  addTorches(map, rng);

  // Replace filler walls with void — only keep walls that directly border a walkable tile
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (map[y][x] !== T_WALL) continue;
      let keep = false;
      outer: for (let dy2 = -1; dy2 <= 1; dy2++) {
        for (let dx2 = -1; dx2 <= 1; dx2++) {
          if (dy2 === 0 && dx2 === 0) continue;
          const nx = x + dx2, ny = y + dy2;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const t = map[ny][nx];
          if (t !== T_WALL && t !== T_VOID) { keep = true; break outer; }
        }
      }
      if (!keep) map[y][x] = T_VOID;
    }
  }

  const names = style === 'kerker' ? KERKER_NAMES : style === 'hoehle' ? HOEHLE_NAMES : KRYPTA_NAMES;
  const name = names[Math.floor(rng() * names.length)];

  return { tiles: map, width: W, height: H, playerStart, exit, style, name, seed: s, lootRooms, enemies };
}
