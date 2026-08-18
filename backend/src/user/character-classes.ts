/**
 * Character classes a user can pick for their profile. Purely cosmetic —
 * a role you present to the community, not a stat modifier.
 *
 * Mirrored in `frontend/src/constants/characterClasses.ts`; keep the ids in
 * sync when adding one.
 */
export interface CharacterClassDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
  blurb: string;
}

export const CHARACTER_CLASSES: CharacterClassDef[] = [
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

export const CHARACTER_CLASS_IDS = CHARACTER_CLASSES.map((c) => c.id);

export function isCharacterClass(id: string): boolean {
  return id === '' || CHARACTER_CLASS_IDS.includes(id);
}
