import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Achievement,
  AchievementDocument,
} from './schemas/achievement.schema.js';
import {
  UserAchievement,
  UserAchievementDocument,
} from './schemas/user-achievement.schema.js';
import {
  ACHIEVEMENT_CATALOG,
  STREAK_MILESTONES,
  getAchievementDef,
  getAchievementForTemplate,
  type AchievementDef,
} from './achievement-catalog.js';
import { ReplicateService } from './replicate.service.js';

export interface AwardedAchievement {
  key: string;
  title: string;
  description: string;
  imageUrl: string | null;
  earnedAt: string;
}

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    @InjectModel(Achievement.name)
    private readonly achievementModel: Model<AchievementDocument>,
    @InjectModel(UserAchievement.name)
    private readonly userAchievementModel: Model<UserAchievementDocument>,
    private readonly replicate: ReplicateService,
  ) {}

  /**
   * Get-or-create the catalog entry for a key. Writes an instant SVG fallback
   * image immediately, then kicks off AI generation in the background (so the
   * award response is never blocked on Replicate).
   */
  private async ensureDefinition(
    def: AchievementDef,
  ): Promise<AchievementDocument> {
    let doc = await this.achievementModel.findOne({ key: def.key }).exec();
    if (!doc) {
      const imageUrl = await this.replicate.generateFallback(def);
      doc = await this.achievementModel.create({
        key: def.key,
        title: def.title,
        description: def.description,
        imageUrl,
        aiGenerated: false,
        sideQuestTemplateId: def.sideQuestTemplateId,
        color: def.color,
        emoji: def.emoji,
      });
    }

    // Upgrade fallback → AI image once, in the background.
    if (!doc.aiGenerated && this.replicate.hasToken) {
      void this.upgradeImage(def);
    }
    return doc;
  }

  private async upgradeImage(def: AchievementDef): Promise<void> {
    try {
      const aiUrl = await this.replicate.generateAi(def);
      if (aiUrl) {
        await this.achievementModel
          .updateOne({ key: def.key }, { imageUrl: aiUrl, aiGenerated: true })
          .exec();
        this.logger.log(`Upgraded badge image for ${def.key}`);
      }
    } catch (err) {
      this.logger.error(`upgradeImage failed for ${def.key}: ${String(err)}`);
    }
  }

  /** Award a specific achievement key to a user (idempotent). */
  async award(
    userId: string,
    key: string,
    sourceSideQuestId: string | null = null,
  ): Promise<AwardedAchievement | null> {
    const def = getAchievementDef(key);
    if (!def) return null;

    const doc = await this.ensureDefinition(def);

    const existing = await this.userAchievementModel
      .findOne({ userId, achievementKey: key })
      .exec();
    if (existing) return null; // already earned — don't re-celebrate

    try {
      await this.userAchievementModel.create({
        userId,
        achievementKey: key,
        sourceSideQuestId,
      });
    } catch {
      return null; // unique-index race: treat as already earned
    }

    return {
      key: doc.key,
      title: doc.title,
      description: doc.description,
      imageUrl: doc.imageUrl,
      earnedAt: new Date().toISOString(),
    };
  }

  /**
   * Award the achievement tied to a side quest template, plus the
   * "first side quest" milestone. Returns every newly-earned achievement.
   */
  async awardForTemplate(
    userId: string,
    templateId: string,
    sourceSideQuestId: string | null,
    opts: { daily?: boolean } = {},
  ): Promise<AwardedAchievement[]> {
    const awarded: AwardedAchievement[] = [];

    const def = getAchievementForTemplate(templateId);
    if (def) {
      const a = await this.award(userId, def.key, sourceSideQuestId);
      if (a) awarded.push(a);
    }

    const isFirst =
      (await this.userAchievementModel.countDocuments({ userId }).exec()) <= 1;
    if (isFirst) {
      const a = await this.award(
        userId,
        'ach_first_sidequest',
        sourceSideQuestId,
      );
      if (a) awarded.push(a);
    }

    if (opts.daily) {
      const a = await this.award(userId, 'ach_daily_streak', sourceSideQuestId);
      if (a) awarded.push(a);
    }

    return awarded;
  }

  /**
   * Award the "cleared the whole board" badge plus any streak milestone the
   * user just reached. Called when a daily board is fully cleared.
   */
  async awardDailyStreakMilestones(
    userId: string,
    streak: number,
  ): Promise<AwardedAchievement[]> {
    const awarded: AwardedAchievement[] = [];

    const cleared = await this.award(userId, 'ach_board_cleared');
    if (cleared) awarded.push(cleared);

    for (const milestone of STREAK_MILESTONES) {
      if (streak < milestone.days) continue;
      const a = await this.award(userId, milestone.key);
      if (a) awarded.push(a);
    }

    return awarded;
  }

  /** All achievements a user has earned, newest first, with catalog data. */
  async getUserAchievements(userId: string): Promise<AwardedAchievement[]> {
    const earned = await this.userAchievementModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
    if (!earned.length) return [];

    const keys = earned.map((e) => e.achievementKey);
    const defs = await this.achievementModel
      .find({ key: { $in: keys } })
      .exec();
    const byKey = new Map(defs.map((d) => [d.key, d]));

    return earned.map((e) => {
      const d = byKey.get(e.achievementKey);
      return {
        key: e.achievementKey,
        title: d?.title ?? e.achievementKey,
        description: d?.description ?? '',
        imageUrl: d?.imageUrl ?? null,
        earnedAt: e.createdAt.toISOString(),
      };
    });
  }

  /** Full catalog with earned flag — for a "locked/unlocked" gallery. */
  async getCatalogForUser(userId: string) {
    const earned = await this.userAchievementModel
      .find({ userId })
      .select('achievementKey')
      .exec();
    const earnedKeys = new Set(earned.map((e) => e.achievementKey));

    const defs = await this.achievementModel.find().exec();
    const byKey = new Map(defs.map((d) => [d.key, d]));

    return ACHIEVEMENT_CATALOG.map((def) => {
      const doc = byKey.get(def.key);
      return {
        key: def.key,
        title: def.title,
        description: def.description,
        imageUrl: doc?.imageUrl ?? null,
        earned: earnedKeys.has(def.key),
      };
    });
  }
}
