import { Element } from './enums/element.enum.js';
import { Rarity } from './enums/rarity.enum.js';
import { Category } from '../quest/enums/category.enum.js';

/**
 * Catalog of everything a mystery egg can hatch into: an element crossed with
 * an animal species. The backend is the single source of truth for rolls and
 * naming; the frontend mirrors emoji/colors for rendering.
 */
export interface SpeciesDef {
  id: string;
  /** German display name. */
  name: string;
  emoji: string;
  rarity: Rarity;
}

export interface ElementDef {
  id: Element;
  /** German display name. */
  name: string;
  emoji: string;
  /** Accent color, mirrored in the frontend for auras/labels. */
  color: string;
}

export const ELEMENTS: Record<Element, ElementDef> = {
  [Element.FEUER]: {
    id: Element.FEUER,
    name: 'Feuer',
    emoji: '🔥',
    color: '#ef4444',
  },
  [Element.WASSER]: {
    id: Element.WASSER,
    name: 'Wasser',
    emoji: '💧',
    color: '#3b82f6',
  },
  [Element.WIND]: {
    id: Element.WIND,
    name: 'Wind',
    emoji: '🌪️',
    color: '#38bdf8',
  },
  [Element.ERDE]: {
    id: Element.ERDE,
    name: 'Erde',
    emoji: '⛰️',
    color: '#a16207',
  },
  [Element.BLITZ]: {
    id: Element.BLITZ,
    name: 'Blitz',
    emoji: '⚡',
    color: '#eab308',
  },
  [Element.METALL]: {
    id: Element.METALL,
    name: 'Metall',
    emoji: '⚙️',
    color: '#71717a',
  },
  [Element.LICHT]: {
    id: Element.LICHT,
    name: 'Licht',
    emoji: '✨',
    color: '#facc15',
  },
  [Element.SCHATTEN]: {
    id: Element.SCHATTEN,
    name: 'Schatten',
    emoji: '🌑',
    color: '#6d28d9',
  },
  [Element.CHAOS]: {
    id: Element.CHAOS,
    name: 'Chaos',
    emoji: '🌀',
    color: '#db2777',
  },
  [Element.KRISTALL]: {
    id: Element.KRISTALL,
    name: 'Kristall',
    emoji: '💎',
    color: '#22d3ee',
  },
  [Element.NATUR]: {
    id: Element.NATUR,
    name: 'Natur',
    emoji: '🌿',
    color: '#22c55e',
  },
  [Element.GEIST]: {
    id: Element.GEIST,
    name: 'Geist',
    emoji: '👻',
    color: '#94a3b8',
  },
  [Element.FEE]: {
    id: Element.FEE,
    name: 'Fee',
    emoji: '🧚',
    color: '#f472b6',
  },
  [Element.EIS]: {
    id: Element.EIS,
    name: 'Eis',
    emoji: '❄️',
    color: '#7dd3fc',
  },
  [Element.GIFT]: {
    id: Element.GIFT,
    name: 'Gift',
    emoji: '☠️',
    color: '#84cc16',
  },
  [Element.KOSMOS]: {
    id: Element.KOSMOS,
    name: 'Kosmos',
    emoji: '🌌',
    color: '#8b5cf6',
  },
};

export const SPECIES: SpeciesDef[] = [
  // ── Common ────────────────────────────────────────────────────────────────
  { id: 'hund', name: 'Hund', emoji: '🐕', rarity: Rarity.COMMON },
  { id: 'katze', name: 'Katze', emoji: '🐈', rarity: Rarity.COMMON },
  { id: 'maus', name: 'Maus', emoji: '🐭', rarity: Rarity.COMMON },
  { id: 'kaninchen', name: 'Kaninchen', emoji: '🐰', rarity: Rarity.COMMON },
  {
    id: 'eichhoernchen',
    name: 'Eichhörnchen',
    emoji: '🐿️',
    rarity: Rarity.COMMON,
  },
  { id: 'igel', name: 'Igel', emoji: '🦔', rarity: Rarity.COMMON },
  { id: 'frosch', name: 'Frosch', emoji: '🐸', rarity: Rarity.COMMON },
  { id: 'ente', name: 'Ente', emoji: '🦆', rarity: Rarity.COMMON },
  { id: 'taube', name: 'Taube', emoji: '🕊️', rarity: Rarity.COMMON },
  { id: 'huhn', name: 'Huhn', emoji: '🐔', rarity: Rarity.COMMON },
  // ── Uncommon ──────────────────────────────────────────────────────────────
  { id: 'fuchs', name: 'Fuchs', emoji: '🦊', rarity: Rarity.UNCOMMON },
  { id: 'wolf', name: 'Wolf', emoji: '🐺', rarity: Rarity.UNCOMMON },
  { id: 'eule', name: 'Eule', emoji: '🦉', rarity: Rarity.UNCOMMON },
  { id: 'waschbaer', name: 'Waschbär', emoji: '🦝', rarity: Rarity.UNCOMMON },
  { id: 'reh', name: 'Reh', emoji: '🦌', rarity: Rarity.UNCOMMON },
  { id: 'biber', name: 'Biber', emoji: '🦫', rarity: Rarity.UNCOMMON },
  { id: 'rabe', name: 'Rabe', emoji: '🐦‍⬛', rarity: Rarity.UNCOMMON },
  { id: 'pinguin', name: 'Pinguin', emoji: '🐧', rarity: Rarity.UNCOMMON },
  { id: 'koala', name: 'Koala', emoji: '🐨', rarity: Rarity.UNCOMMON },
  {
    id: 'fledermaus',
    name: 'Fledermaus',
    emoji: '🦇',
    rarity: Rarity.UNCOMMON,
  },
  // ── Rare ──────────────────────────────────────────────────────────────────
  { id: 'giraffe', name: 'Giraffe', emoji: '🦒', rarity: Rarity.RARE },
  { id: 'elefant', name: 'Elefant', emoji: '🐘', rarity: Rarity.RARE },
  { id: 'loewe', name: 'Löwe', emoji: '🦁', rarity: Rarity.RARE },
  { id: 'tiger', name: 'Tiger', emoji: '🐅', rarity: Rarity.RARE },
  { id: 'panda', name: 'Panda', emoji: '🐼', rarity: Rarity.RARE },
  { id: 'kakadu', name: 'Kakadu', emoji: '🦜', rarity: Rarity.RARE },
  { id: 'kiwi', name: 'Kiwi', emoji: '🐦', rarity: Rarity.RARE },
  { id: 'schildkroete', name: 'Schildkröte', emoji: '🐢', rarity: Rarity.RARE },
  { id: 'oktopus', name: 'Oktopus', emoji: '🐙', rarity: Rarity.RARE },
  { id: 'pfau', name: 'Pfau', emoji: '🦚', rarity: Rarity.RARE },
  { id: 'chamaeleon', name: 'Chamäleon', emoji: '🦎', rarity: Rarity.RARE },
  { id: 'flamingo', name: 'Flamingo', emoji: '🦩', rarity: Rarity.RARE },
  // ── Epic ──────────────────────────────────────────────────────────────────
  { id: 'narwal', name: 'Narwal', emoji: '🐋', rarity: Rarity.EPIC },
  {
    id: 'schneeleopard',
    name: 'Schneeleopard',
    emoji: '🐆',
    rarity: Rarity.EPIC,
  },
  { id: 'mantarochen', name: 'Mantarochen', emoji: '🐟', rarity: Rarity.EPIC },
  { id: 'axolotl', name: 'Axolotl', emoji: '🦎', rarity: Rarity.EPIC },
  { id: 'komodowaran', name: 'Komodowaran', emoji: '🐉', rarity: Rarity.EPIC },
  // ── Legendary (Fabelwesen) ────────────────────────────────────────────────
  { id: 'drache', name: 'Drache', emoji: '🐲', rarity: Rarity.LEGENDARY },
  { id: 'phoenix', name: 'Phönix', emoji: '🐦‍🔥', rarity: Rarity.LEGENDARY },
  { id: 'einhorn', name: 'Einhorn', emoji: '🦄', rarity: Rarity.LEGENDARY },
  { id: 'kraken', name: 'Kraken', emoji: '🦑', rarity: Rarity.LEGENDARY },
  { id: 'kitsune', name: 'Kitsune', emoji: '🦊', rarity: Rarity.LEGENDARY },
  { id: 'greif', name: 'Greif', emoji: '🦅', rarity: Rarity.LEGENDARY },
];

export function getSpeciesDef(id: string): SpeciesDef | undefined {
  return SPECIES.find((s) => s.id === id);
}

/** Hatch roll odds per rarity tier. */
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  [Rarity.COMMON]: 55,
  [Rarity.UNCOMMON]: 25,
  [Rarity.RARE]: 13,
  [Rarity.EPIC]: 5,
  [Rarity.LEGENDARY]: 2,
};

/**
 * Which elements a quest category "feeds". Used to personalize the element
 * roll: users who mostly clear Sport quests skew towards Feuer/Blitz etc.
 */
export const CATEGORY_ELEMENT_AFFINITY: Record<Category, Element[]> = {
  [Category.SPORT]: [
    Element.FEUER,
    Element.BLITZ,
    Element.WIND,
    Element.METALL,
  ],
  [Category.SOCIAL]: [
    Element.LICHT,
    Element.FEE,
    Element.WASSER,
    Element.NATUR,
  ],
  [Category.ADVENTURE]: [
    Element.WIND,
    Element.ERDE,
    Element.KOSMOS,
    Element.EIS,
  ],
  [Category.SKILL]: [
    Element.KRISTALL,
    Element.METALL,
    Element.BLITZ,
    Element.WASSER,
  ],
  [Category.MYSTERY]: [
    Element.SCHATTEN,
    Element.GEIST,
    Element.CHAOS,
    Element.GIFT,
  ],
};
