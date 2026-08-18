import { Category } from './enums/category.enum.js';
import { Difficulty } from './enums/difficulty.enum.js';

/**
 * Static template pool used to spawn ("spornen") ephemeral SideQuests around
 * the player. A spawn picks a random template, drops it at a random offset
 * within the spawn radius, and sets an expiry. Quest giver "names" here are
 * flavor NPCs — completion still funnels through the normal quest XP pipeline.
 */
export interface SideQuestTemplate {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  /** Optional coin reward shown on the card. */
  reward: number;
  /** Flavor NPC that "offers" the side quest. */
  questGiver: { name: string; avatar?: string };
  /** How long the spawn stays on the map before it despawns. */
  ttlMinutes: number;
}

export const SIDEQUEST_TEMPLATES: SideQuestTemplate[] = [
  {
    id: 'sq_litter_hunt',
    title: 'Müll-Jäger',
    description:
      'Sammle 3 Stück Müll in deiner Umgebung ein und entsorge sie richtig. Die Nachbarschaft dankt es dir!',
    category: Category.SOCIAL,
    difficulty: Difficulty.EASY,
    reward: 10,
    questGiver: { name: 'Ranger Mara' },
    ttlMinutes: 30,
  },
  {
    id: 'sq_sprint',
    title: 'Blitz-Sprint',
    description:
      'Lege die nächsten 200 Meter im Laufschritt zurück. Schnelligkeit zählt!',
    category: Category.SPORT,
    difficulty: Difficulty.EASY,
    reward: 8,
    questGiver: { name: 'Trainer Björn' },
    ttlMinutes: 20,
  },
  {
    id: 'sq_photo_landmark',
    title: 'Foto-Quest',
    description:
      'Finde ein interessantes Gebäude oder Denkmal in der Nähe und merke es dir. Ein echter Entdecker!',
    category: Category.ADVENTURE,
    difficulty: Difficulty.MEDIUM,
    reward: 15,
    questGiver: { name: 'Abenteurerin Mira' },
    ttlMinutes: 45,
  },
  {
    id: 'sq_kindness',
    title: 'Gute Tat',
    description:
      'Hilf einer fremden Person mit einer kleinen Geste — Tür aufhalten, Weg zeigen, Lächeln schenken.',
    category: Category.SOCIAL,
    difficulty: Difficulty.MEDIUM,
    reward: 20,
    questGiver: { name: 'Priester Benedikt' },
    ttlMinutes: 40,
  },
  {
    id: 'sq_riddle',
    title: 'Rätsel des Ortes',
    description:
      'Zähle, wie viele Bänke du auf dem Weg zu diesem Punkt findest. Aufmerksamkeit ist alles.',
    category: Category.MYSTERY,
    difficulty: Difficulty.MEDIUM,
    reward: 18,
    questGiver: { name: 'Seherin Lyra' },
    ttlMinutes: 35,
  },
  {
    id: 'sq_skill_words',
    title: 'Wort-Schatz',
    description:
      'Lerne 3 neue Wörter in einer Fremdsprache, während du zu diesem Ort gehst.',
    category: Category.SKILL,
    difficulty: Difficulty.EASY,
    reward: 12,
    questGiver: { name: 'Lehrerin Nadia' },
    ttlMinutes: 30,
  },
  {
    id: 'sq_explore_unknown',
    title: 'Unbekanntes Terrain',
    description:
      'Erreiche diesen Punkt über eine Straße, die du noch nie gegangen bist. Wage dich ins Unbekannte!',
    category: Category.ADVENTURE,
    difficulty: Difficulty.HARD,
    reward: 30,
    questGiver: { name: 'Wirt Gottfried' },
    ttlMinutes: 60,
  },
  {
    id: 'sq_stairs',
    title: 'Treppen-Meister',
    description:
      'Nimm die Treppe statt Aufzug oder Rolltreppe auf deinem Weg hierher.',
    category: Category.SPORT,
    difficulty: Difficulty.MEDIUM,
    reward: 14,
    questGiver: { name: 'Kampfmeisterin Zara' },
    ttlMinutes: 30,
  },
];

export function getSideQuestTemplate(
  id: string,
): SideQuestTemplate | undefined {
  return SIDEQUEST_TEMPLATES.find((t) => t.id === id);
}
