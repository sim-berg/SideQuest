import type { DragonType, EvolutionStage } from '../types/dragon';

interface DragonMeta {
  name: string;
  element: string;
  color: string;
  description: string;
  emoji: Record<EvolutionStage, string>;
}

export const DRAGON_META: Record<DragonType, DragonMeta> = {
  ember: {
    name: 'Glutwyrm',
    element: 'Feuer',
    color: '#ef4444',
    description: 'Ein feuriger Drache, der in Vulkanen lebt und Flammen spuckt.',
    emoji: { egg: '🥚', hatchling: '🔥', whelp: '🐉', drake: '🐲', elder_dragon: '🌋' },
  },
  tide: {
    name: 'Wellenreiter',
    element: 'Wasser',
    color: '#3b82f6',
    description: 'Ein eleganter Drache der Ozeane, der Wellen lenken kann.',
    emoji: { egg: '🥚', hatchling: '💧', whelp: '🐉', drake: '🐲', elder_dragon: '🌊' },
  },
  thorn: {
    name: 'Dornenschuppe',
    element: 'Erde',
    color: '#22c55e',
    description: 'Ein maechtiger Erddrache mit Dornen und Ranken.',
    emoji: { egg: '🥚', hatchling: '🌱', whelp: '🐉', drake: '🐲', elder_dragon: '🌿' },
  },
  gloom: {
    name: 'Schattenklaue',
    element: 'Schatten',
    color: '#8b5cf6',
    description: 'Ein mysterioeser Drache aus den tiefsten Schatten.',
    emoji: { egg: '🥚', hatchling: '🌑', whelp: '🐉', drake: '🐲', elder_dragon: '👁️' },
  },
  spark: {
    name: 'Blitzschuppe',
    element: 'Blitz',
    color: '#eab308',
    description: 'Ein blitzschneller Drache, geladen mit elektrischer Energie.',
    emoji: { egg: '🥚', hatchling: '⚡', whelp: '🐉', drake: '🐲', elder_dragon: '🌩️' },
  },
};

export const EVOLUTION_THRESHOLDS: { stage: EvolutionStage; xp: number }[] = [
  { stage: 'egg', xp: 0 },
  { stage: 'hatchling', xp: 100 },
  { stage: 'whelp', xp: 500 },
  { stage: 'drake', xp: 2000 },
  { stage: 'elder_dragon', xp: 10000 },
];

export const EVOLUTION_LABELS: Record<EvolutionStage, string> = {
  egg: 'Ei',
  hatchling: 'Junges',
  whelp: 'Welpe',
  drake: 'Drache',
  elder_dragon: 'Aelterendrache',
};

export const MOOD_META: Record<string, { label: string; emoji: string }> = {
  happy: { label: 'Gluecklich', emoji: '😊' },
  content: { label: 'Zufrieden', emoji: '😌' },
  lonely: { label: 'Einsam', emoji: '😔' },
  sad: { label: 'Traurig', emoji: '😢' },
};
