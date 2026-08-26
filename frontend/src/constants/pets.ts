import type { Element, PetStage, Rarity } from '../types/pet';

/** Mirrors the backend pet catalog (backend/src/pet/pet-catalog.ts). */
interface ElementMeta {
  name: string;
  emoji: string;
  color: string;
}

export const ELEMENT_META: Record<Element, ElementMeta> = {
  feuer: { name: 'Feuer', emoji: '🔥', color: '#ef4444' },
  wasser: { name: 'Wasser', emoji: '💧', color: '#3b82f6' },
  wind: { name: 'Wind', emoji: '🌪️', color: '#38bdf8' },
  erde: { name: 'Erde', emoji: '⛰️', color: '#a16207' },
  blitz: { name: 'Blitz', emoji: '⚡', color: '#eab308' },
  metall: { name: 'Metall', emoji: '⚙️', color: '#71717a' },
  licht: { name: 'Licht', emoji: '✨', color: '#facc15' },
  schatten: { name: 'Schatten', emoji: '🌑', color: '#6d28d9' },
  chaos: { name: 'Chaos', emoji: '🌀', color: '#db2777' },
  kristall: { name: 'Kristall', emoji: '💎', color: '#22d3ee' },
  natur: { name: 'Natur', emoji: '🌿', color: '#22c55e' },
  geist: { name: 'Geist', emoji: '👻', color: '#94a3b8' },
  fee: { name: 'Fee', emoji: '🧚', color: '#f472b6' },
  eis: { name: 'Eis', emoji: '❄️', color: '#7dd3fc' },
  gift: { name: 'Gift', emoji: '☠️', color: '#84cc16' },
  kosmos: { name: 'Kosmos', emoji: '🌌', color: '#8b5cf6' },
};

/** species id → emoji, for rendering without a backend round trip. */
export const SPECIES_EMOJI: Record<string, string> = {
  hund: '🐕',
  katze: '🐈',
  maus: '🐭',
  kaninchen: '🐰',
  eichhoernchen: '🐿️',
  igel: '🦔',
  frosch: '🐸',
  ente: '🦆',
  taube: '🕊️',
  huhn: '🐔',
  fuchs: '🦊',
  wolf: '🐺',
  eule: '🦉',
  waschbaer: '🦝',
  reh: '🦌',
  biber: '🦫',
  rabe: '🐦‍⬛',
  pinguin: '🐧',
  koala: '🐨',
  fledermaus: '🦇',
  giraffe: '🦒',
  elefant: '🐘',
  loewe: '🦁',
  tiger: '🐅',
  panda: '🐼',
  kakadu: '🦜',
  kiwi: '🐦',
  schildkroete: '🐢',
  oktopus: '🐙',
  pfau: '🦚',
  chamaeleon: '🦎',
  flamingo: '🦩',
  narwal: '🐋',
  schneeleopard: '🐆',
  mantarochen: '🐟',
  axolotl: '🦎',
  komodowaran: '🐉',
  drache: '🐲',
  phoenix: '🐦‍🔥',
  einhorn: '🦄',
  kraken: '🦑',
  kitsune: '🦊',
  greif: '🦅',
};

export const STAGE_LABELS: Record<PetStage, string> = {
  egg: 'Ei',
  hatchling: 'Schlüpfling',
  juvenile: 'Jungtier',
  adult: 'Gefährte',
  ancient: 'Urwesen',
};

/** XP needed to reach each post-hatch stage (hatching itself is event-based). */
export const STAGE_THRESHOLDS: { stage: PetStage; xp: number }[] = [
  { stage: 'hatchling', xp: 0 },
  { stage: 'juvenile', xp: 500 },
  { stage: 'adult', xp: 2000 },
  { stage: 'ancient', xp: 10000 },
];

export const RARITY_META: Record<Rarity, { label: string; color: string }> = {
  common: { label: 'Gewöhnlich', color: '#94a3b8' },
  uncommon: { label: 'Ungewöhnlich', color: '#22c55e' },
  rare: { label: 'Selten', color: '#3b82f6' },
  epic: { label: 'Episch', color: '#a855f7' },
  legendary: { label: 'Legendär', color: '#f59e0b' },
};

export const MOOD_META: Record<string, { label: string; emoji: string }> = {
  happy: { label: 'Glücklich', emoji: '😊' },
  content: { label: 'Zufrieden', emoji: '😌' },
  lonely: { label: 'Einsam', emoji: '😔' },
  sad: { label: 'Traurig', emoji: '😢' },
};

/**
 * Price for repainting a pet portrait. Mirrors PORTRAIT_REGEN_COST in
 * backend/src/coin/coin.constants.ts — keep the two in sync.
 */
export const PORTRAIT_REGEN_COST = 20;
