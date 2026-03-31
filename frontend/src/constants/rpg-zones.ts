import type { ZoneDef } from '../types/rpg';

/**
 * Tile legend
 *  0 = floor        (walkable)
 *  1 = wall         (solid)
 *  2 = door         (walkable)
 *  3 = table        (solid)
 *  4 = chair        (solid)
 *  5 = bar counter  (solid)
 *  6 = fireplace    (solid, animated)
 *  7 = bookshelf    (solid)
 *  8 = fountain     (solid)
 *  9 = pillar       (solid)
 * 10 = stairs       (walkable)
 * 11 = rug/carpet   (walkable, decorative)
 * 12 = altar        (solid)
 */

// Solid tile set (cannot walk on)
export const SOLID_TILES = new Set([1, 3, 4, 5, 6, 7, 8, 9, 12]);

export const MAP_W = 20;
export const MAP_H = 15;

// ─── TAVERNE ───────────────────────────────────────────────────────
const TAVERNE_MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 1],
  [1, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 1],
  [1, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 1],
  [1, 0, 0, 4, 4, 0, 0, 0, 3, 3, 0, 3, 3, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 4, 4, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 1],
  [1, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// ─── ARENA ────────────────────────────────────────────────────────
const ARENA_MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 1],
  [1, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// ─── BIBLIOTHEK ───────────────────────────────────────────────────
const BIBLIOTHEK_MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 7, 7, 7, 7, 7, 7, 7, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 1],
  [1, 7, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 7, 1],
  [1, 7, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 7, 1],
  [1, 7, 0, 0, 0, 0, 7, 7, 7, 0, 0, 7, 7, 7, 0, 0, 0, 0, 7, 1],
  [1, 7, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 7, 1],
  [1, 7, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 7, 1],
  [1, 7, 0, 3, 3, 0, 7, 7, 7, 0, 0, 7, 7, 7, 0, 0, 3, 3, 7, 1],
  [1, 7, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 7, 1],
  [1, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 1],
  [1, 7, 7, 7, 7, 7, 7, 7, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// ─── TEMPEL ───────────────────────────────────────────────────────
const TEMPEL_MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 9, 0, 0, 0, 0, 0, 11, 11, 0, 0, 0, 0, 0, 9, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 12, 12, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 12, 12, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 8, 8, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 9, 0, 0, 0, 0, 8, 8, 0, 8, 8, 0, 0, 0, 9, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const ZONE_DEFS: ZoneDef[] = [
  {
    type: 'taverne',
    name: 'Die Goldene Gans',
    description: 'Ein gemütliches Wirtshaus. Wirt Gottfried und Barde Silvio kennen immer eine Aufgabe für dich.',
    unlockHint: 'Betritt ein Restaurant, Café oder eine Bar',
    osmAmenities: ['restaurant', 'cafe', 'pub', 'bar', 'fast_food', 'coffee_shop'],
    unlockRadius: 150,
    tileMap: TAVERNE_MAP,
    npcs: [
      {
        id: 'wirt',
        name: 'Wirt Gottfried',
        tileX: 3,
        tileY: 4,
        bodyColor: '#8B5E3C',
        accentColor: '#E8C57A',
        greeting: 'Willkommen, Abenteurer! Was darf ich für dich tun?',
      },
      {
        id: 'barde',
        name: 'Barde Silvio',
        tileX: 14,
        tileY: 7,
        bodyColor: '#6B3FA0',
        accentColor: '#F0C040',
        greeting: 'Ah, ein neues Gesicht! Lass mich dir ein Lied erzählen...',
      },
      {
        id: 'questgeberin',
        name: 'Abenteurerin Mira',
        tileX: 10,
        tileY: 10,
        bodyColor: '#2E7D32',
        accentColor: '#FF8F00',
        greeting: 'Ich habe gehört, du suchst Herausforderungen. Ich auch.',
      },
    ],
    playerSpawnX: 9,
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
    npcs: [
      {
        id: 'trainer',
        name: 'Trainer Björn',
        tileX: 4,
        tileY: 4,
        bodyColor: '#1565C0',
        accentColor: '#FF6F00',
        greeting: 'Kein Schmerz, kein Gewinn! Was willst du heute trainieren?',
      },
      {
        id: 'kampfmeisterin',
        name: 'Kampfmeisterin Zara',
        tileX: 15,
        tileY: 4,
        bodyColor: '#B71C1C',
        accentColor: '#FFD700',
        greeting: 'Ich sehe Potenzial in dir. Aber Potenzial allein gewinnt keine Kämpfe.',
      },
    ],
    playerSpawnX: 9,
    playerSpawnY: 13,
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
    npcs: [
      {
        id: 'bibliothekar',
        name: 'Bibliothekar Elias',
        tileX: 2,
        tileY: 7,
        bodyColor: '#4A148C',
        accentColor: '#E8EAF6',
        greeting: 'Pssst. In der Stille liegt die Weisheit. Was möchtest du wissen?',
      },
      {
        id: 'lehrerin',
        name: 'Lehrerin Nadia',
        tileX: 14,
        tileY: 8,
        bodyColor: '#1B5E20',
        accentColor: '#FFF9C4',
        greeting: 'Der klügste Mensch lernt sein ganzes Leben. Bist du bereit?',
      },
    ],
    playerSpawnX: 9,
    playerSpawnY: 13,
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
    npcs: [
      {
        id: 'priester',
        name: 'Priester Benedikt',
        tileX: 2,
        tileY: 7,
        bodyColor: '#F5F5DC',
        accentColor: '#FFD700',
        greeting: 'Friede sei mit dir, Wanderer. Die Seele braucht Ruhe wie der Körper Nahrung.',
      },
      {
        id: 'seherin',
        name: 'Seherin Lyra',
        tileX: 17,
        tileY: 10,
        bodyColor: '#4A0072',
        accentColor: '#B388FF',
        greeting: 'Ich sehe deine Gedanken kreisen wie Blätter im Wind. Lass sie los.',
      },
    ],
    playerSpawnX: 9,
    playerSpawnY: 13,
    floorColor: '#A1887F',
    wallColor: '#4E342E',
    accentColor: '#FFD700',
    bgGradient: ['#1A0533', '#2E1065'],
  },
];

export function getZoneDef(type: string): ZoneDef | undefined {
  return ZONE_DEFS.find((z) => z.type === type);
}
