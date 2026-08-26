import { Injectable, Logger } from '@nestjs/common';
import { AchievementService } from '../achievement/achievement.service.js';
import { CoinService } from '../coin/coin.service.js';
import { PetService } from '../pet/pet.service.js';
import type { EmitResult } from './progress.service.js';

export interface SettledRewards {
  /** XP actually credited to the active pet (after its own multipliers). */
  xpAwarded: number;
  coinsAwarded: number;
  /** Emblems newly earned by finishing tracks. */
  emblems: { key: string; title: string; imageUrl: string | null }[];
}

/**
 * Turns "progress happened" into actual rewards.
 *
 * Kept apart from ProgressService on purpose: the engine decides *what was
 * achieved*, this decides *what that is worth*. Track progress therefore stays
 * correct even if the pet, coin or achievement systems are unavailable — a
 * failure here is logged and swallowed rather than rolling back a streak the
 * user genuinely earned.
 */
@Injectable()
export class TrackRewardService {
  private readonly logger = new Logger(TrackRewardService.name);

  constructor(
    private readonly petService: PetService,
    private readonly coinService: CoinService,
    private readonly achievementService: AchievementService,
  ) {}

  async settle(userId: string, result: EmitResult): Promise<SettledRewards> {
    const rewards: SettledRewards = {
      xpAwarded: 0,
      coinsAwarded: 0,
      emblems: [],
    };
    if (!result.recorded) return rewards;

    // --- XP: one pet award for the whole event, not one per objective ---
    if (result.totalXp > 0) {
      try {
        const xpResult = await this.petService.recordQuestCompletion(
          userId,
          result.totalXp,
        );
        rewards.xpAwarded = xpResult?.xpAwarded ?? result.totalXp;
      } catch (err) {
        this.logger.error(
          `XP-Gutschrift fehlgeschlagen für ${userId}: ${String(err)}`,
        );
        rewards.xpAwarded = result.totalXp;
      }
    }

    // --- Coins and emblems for finished tracks ---
    for (const track of result.completedTracks) {
      if (track.coins > 0) {
        try {
          await this.coinService.mint(
            userId,
            track.coins,
            `Challenge abgeschlossen: ${track.title}`,
          );
          rewards.coinsAwarded += track.coins;
        } catch (err) {
          this.logger.error(
            `Coin-Gutschrift fehlgeschlagen für ${userId}: ${String(err)}`,
          );
        }
      }

      if (track.emblemKey) {
        try {
          const earned = await this.achievementService.award(
            userId,
            track.emblemKey,
          );
          if (earned) {
            rewards.emblems.push({
              key: earned.key,
              title: earned.title,
              imageUrl: earned.imageUrl,
            });
          }
        } catch (err) {
          this.logger.error(
            `Emblem-Vergabe fehlgeschlagen für ${userId}: ${String(err)}`,
          );
        }
      }
    }

    return rewards;
  }
}
