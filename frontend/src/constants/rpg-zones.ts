import type { ZoneDef } from '../types/rpg';

/**
 * Collision map — values extracted directly from TMX Floor + Walls layers:
 *   0 = walkable floor
 *   1 = solid (wall / obstacle / void outside room)
 * All other tile visual detail comes from the pre-rendered background PNG.
 */
export const SOLID_TILES = new Set([1]);

// ─── Taverne (31×24) — Tavern_1.tmx ─────────────────────────────────────────
const TAVERNE_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1],
  [1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1],
  [1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── Arena (26×17) — Huntmaster_1.tmx ───────────────────────────────────────
const ARENA_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── Bibliothek (19×24) — Library_1.tmx ─────────────────────────────────────
const BIBLIOTHEK_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── Tempel (20×17) — Cartographer_1.tmx ────────────────────────────────────
const TEMPEL_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1,1],
  [1,1,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1,1],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
  [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
  [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
  [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── Zone definitions ─────────────────────────────────────────────────────────

export const ZONE_DEFS: ZoneDef[] = [
  {
    type: 'taverne',
    name: 'Die Goldene Gans',
    description: 'Ein gemütliches Wirtshaus. Wirt Gottfried und Barde Silvio kennen immer eine Aufgabe für dich.',
    unlockHint: 'Betritt ein Restaurant, Café oder eine Bar',
    osmAmenities: ['restaurant', 'cafe', 'pub', 'bar', 'fast_food', 'coffee_shop'],
    unlockRadius: 150,
    tileMap: TAVERNE_MAP,
    mapW: 31,
    mapH: 24,
    bgImage: 'taverne_bg.png',
    npcs: [
      {
        id: 'wirt',
        name: 'Wirt Gottfried',
        // Left room, near bar counter
        tileX: 5,
        tileY: 10,
        bodyColor: '#8B5E3C',
        accentColor: '#E8C57A',
        greeting: 'Willkommen, Abenteurer! Was darf ich für dich tun?',
      },
      {
        id: 'barde',
        name: 'Barde Silvio',
        // Center of main hall
        tileX: 14,
        tileY: 12,
        bodyColor: '#6B3FA0',
        accentColor: '#F0C040',
        greeting: 'Ah, ein neues Gesicht! Lass mich dir ein Lied erzählen...',
      },
      {
        id: 'questgeberin',
        name: 'Abenteurerin Mira',
        // Right back room
        tileX: 25,
        tileY: 14,
        bodyColor: '#2E7D32',
        accentColor: '#FF8F00',
        greeting: 'Ich habe gehört, du suchst Herausforderungen. Ich auch.',
      },
    ],
    playerSpawnX: 14,
    playerSpawnY: 13,
    floorColor: '#C4A882',
    wallColor: '#4A3728',
    accentColor: '#E8C57A',
    bgGradient: ['#2C1810', '#4A2820'],
  },
  {
    type: 'arena',
    name: 'Arena des Stahls',
    description: 'Hier werden Körper und Geist gestählt. Trainer Björn und Kampfmeisterin Zara fordern alles von dir.',
    unlockHint: 'Besuche ein Fitnessstudio, Sportzentrum oder einen Sportplatz',
    osmAmenities: ['gym', 'sports_centre', 'fitness_centre', 'stadium', 'sports_hall'],
    unlockRadius: 200,
    tileMap: ARENA_MAP,
    mapW: 26,
    mapH: 17,
    bgImage: 'arena_bg.png',
    npcs: [
      {
        id: 'trainer',
        name: 'Trainer Björn',
        tileX: 6,
        tileY: 10,
        bodyColor: '#1565C0',
        accentColor: '#FF6F00',
        greeting: 'Kein Schmerz, kein Gewinn! Was willst du heute trainieren?',
      },
      {
        id: 'kampfmeisterin',
        name: 'Kampfmeisterin Zara',
        tileX: 18,
        tileY: 10,
        bodyColor: '#B71C1C',
        accentColor: '#FFD700',
        greeting: 'Ich sehe Potenzial in dir. Aber Potenzial allein gewinnt keine Kämpfe.',
      },
    ],
    playerSpawnX: 12,
    playerSpawnY: 10,
    floorColor: '#8D6E63',
    wallColor: '#37474F',
    accentColor: '#FF6F00',
    bgGradient: ['#1A1A2E', '#16213E'],
  },
  {
    type: 'bibliothek',
    name: 'Bibliothek des Wissens',
    description: 'Stille Hallen voller Geheimnisse. Bibliothekar Elias und Lehrerin Nadia bewachen uraltes Wissen.',
    unlockHint: 'Besuche eine Bibliothek, Buchhandlung oder Schule',
    osmAmenities: ['library', 'college', 'university', 'school', 'bookshop'],
    unlockRadius: 150,
    tileMap: BIBLIOTHEK_MAP,
    mapW: 19,
    mapH: 24,
    bgImage: 'bibliothek_bg.png',
    npcs: [
      {
        id: 'bibliothekar',
        name: 'Bibliothekar Elias',
        // Top right alcove, near shelves
        tileX: 12,
        tileY: 9,
        bodyColor: '#4A148C',
        accentColor: '#E8EAF6',
        greeting: 'Pssst. In der Stille liegt die Weisheit. Was möchtest du wissen?',
      },
      {
        id: 'lehrerin',
        name: 'Lehrerin Nadia',
        // Lower main hall
        tileX: 7,
        tileY: 17,
        bodyColor: '#1B5E20',
        accentColor: '#FFF9C4',
        greeting: 'Der klügste Mensch lernt sein ganzes Leben. Bist du bereit?',
      },
    ],
    playerSpawnX: 7,
    playerSpawnY: 12,
    floorColor: '#795548',
    wallColor: '#3E2723',
    accentColor: '#7C4DFF',
    bgGradient: ['#0D1B2A', '#1B2A4A'],
  },
  {
    type: 'tempel',
    name: 'Tempel der Stille',
    description: 'Ein Ort der inneren Ruhe. Priester Benedikt und Seherin Lyra führen dich auf den Weg der Achtsamkeit.',
    unlockHint: 'Besuche einen Tempel, eine Kirche, Moschee oder einen Park',
    osmAmenities: ['place_of_worship', 'park', 'garden', 'monastery'],
    unlockRadius: 200,
    tileMap: TEMPEL_MAP,
    mapW: 20,
    mapH: 17,
    bgImage: 'tempel_bg.png',
    npcs: [
      {
        id: 'priester',
        name: 'Priester Benedikt',
        // Left alcove
        tileX: 4,
        tileY: 8,
        bodyColor: '#F5F5DC',
        accentColor: '#FFD700',
        greeting: 'Friede sei mit dir, Wanderer. Die Seele braucht Ruhe wie der Körper Nahrung.',
      },
      {
        id: 'seherin',
        name: 'Seherin Lyra',
        // Right alcove
        tileX: 15,
        tileY: 8,
        bodyColor: '#4A0072',
        accentColor: '#B388FF',
        greeting: 'Ich sehe deine Gedanken kreisen wie Blätter im Wind. Lass sie los.',
      },
    ],
    playerSpawnX: 9,
    playerSpawnY: 9,
    floorColor: '#A1887F',
    wallColor: '#4E342E',
    accentColor: '#FFD700',
    bgGradient: ['#1A0533', '#2E1065'],
  },
];

export function getZoneDef(type: string): ZoneDef | undefined {
  return ZONE_DEFS.find((z) => z.type === type);
}
