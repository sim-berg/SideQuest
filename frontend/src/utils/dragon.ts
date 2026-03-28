import type { DragonMood } from '../types/dragon';
import { EVOLUTION_THRESHOLDS } from '../constants/dragons';

export function getDragonMood(lastQuestCompletedAt: string | null): DragonMood {
  if (!lastQuestCompletedAt) return 'sad';

  const hoursSince =
    (Date.now() - new Date(lastQuestCompletedAt).getTime()) / (1000 * 60 * 60);

  if (hoursSince < 6) return 'happy';
  if (hoursSince < 24) return 'content';
  if (hoursSince < 72) return 'lonely';
  return 'sad';
}

export function getNextEvolutionThreshold(xp: number): { nextXp: number; currentXp: number } | null {
  for (let i = 1; i < EVOLUTION_THRESHOLDS.length; i++) {
    if (xp < EVOLUTION_THRESHOLDS[i].xp) {
      return {
        currentXp: EVOLUTION_THRESHOLDS[i - 1].xp,
        nextXp: EVOLUTION_THRESHOLDS[i].xp,
      };
    }
  }
  return null; // max stage
}
