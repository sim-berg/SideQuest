/**
 * Cosmetic character classes for profiles.
 * Mirrors `backend/src/user/character-classes.ts` — keep the ids in sync.
 */
export interface CharacterClass {
  id: string;
  name: string;
  emoji: string;
  color: string;
  blurb: string;
}

export const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: 'wanderer',
    name: 'Wanderer',
    emoji: '🧭',
    color: '#f59e0b',
    blurb: 'Immer unterwegs, immer eine Route weiter.',
  },
  {
    id: 'sammler',
    name: 'Sammler',
    emoji: '🎒',
    color: '#84cc16',
    blurb: 'Kein Emblem bleibt liegen.',
  },
  {
    id: 'streuner',
    name: 'Streuner',
    emoji: '🌙',
    color: '#8b5cf6',
    blurb: 'Nachts unterwegs, spontan dabei.',
  },
  {
    id: 'baumeister',
    name: 'Baumeister',
    emoji: '🛠️',
    color: '#0ea5e9',
    blurb: 'Stellt selbst Quests in die Welt.',
  },
  {
    id: 'gefaehrte',
    name: 'Gefährte',
    emoji: '🤝',
    color: '#3b82f6',
    blurb: 'Geht Quests am liebsten zu zweit an.',
  },
  {
    id: 'orakel',
    name: 'Orakel',
    emoji: '🔮',
    color: '#ec4899',
    blurb: 'Sucht das Rätsel hinter der Quest.',
  },
  {
    id: 'athlet',
    name: 'Athlet',
    emoji: '⚡',
    color: '#22c55e',
    blurb: 'Schweiß ist die bessere Währung.',
  },
  {
    id: 'chronist',
    name: 'Chronist',
    emoji: '📜',
    color: '#a16207',
    blurb: 'Schreibt mit, was andere nur erleben.',
  },
];

export function getCharacterClass(id?: string | null): CharacterClass | null {
  if (!id) return null;
  return CHARACTER_CLASSES.find((c) => c.id === id) ?? null;
}
