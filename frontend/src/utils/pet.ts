import type { PetMood } from '../types/pet';
import { STAGE_THRESHOLDS } from '../constants/pets';

export function getPetMood(lastQuestCompletedAt: string | null): PetMood {
  if (!lastQuestCompletedAt) return 'sad';

  const hoursSince =
    (Date.now() - new Date(lastQuestCompletedAt).getTime()) / (1000 * 60 * 60);

  if (hoursSince < 6) return 'happy';
  if (hoursSince < 24) return 'content';
  if (hoursSince < 72) return 'lonely';
  return 'sad';
}

export function getNextStageThreshold(
  xp: number,
): { nextXp: number; currentXp: number } | null {
  for (let i = 1; i < STAGE_THRESHOLDS.length; i++) {
    if (xp < STAGE_THRESHOLDS[i].xp) {
      return {
        currentXp: STAGE_THRESHOLDS[i - 1].xp,
        nextXp: STAGE_THRESHOLDS[i].xp,
      };
    }
  }
  return null; // max stage
}
