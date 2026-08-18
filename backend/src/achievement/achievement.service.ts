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
  STARTER_ACHIEVEMENT_KEY,
  STREAK_MILESTONES,
  getAchievementDef,
  getAchievementForTemplate,
  type AchievementDef,
} from './achievement-catalog.js';
import { ImageService } from '../media/image.service.js';
import type { EmblemSource } from './schemas/user-achievement.schema.js';

/** Bucket under uploads/ that holds every generated emblem PNG. */
const EMBLEM_BUCKET = 'achievements';

/**
 * Where and when an emblem was earned. Everything is optional — a milestone
 * emblem has no place, and location is only known if the user shared it.
 */
export interface EmblemContext {
  sourceKind?: EmblemSource;
  questTitle?: string;
  questCategory?: string;
  lat?: number | null;
  lng?: number | null;
  placeLabel?: string;
}

export interface AwardedAchievement {
  key: string;
  title: string;
  description: string;
  imageUrl: string | null;
  earnedAt: string;
}

/** An earned emblem with the full log of how it was earned. */
export interface EarnedEmblem extends AwardedAchievement {
  emoji: string;
  color: string;
  sourceKind: EmblemSource;
  sourceSideQuestId: string | null;
  questTitle: string;
  questCategory: string;
  lat: number | null;
  lng: number | null;
  placeLabel: string;
}

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    @InjectModel(Achievement.name)
    private readonly achievementModel: Model<AchievementDocument>,
    @InjectModel(UserAchievement.name)
    private readonly userAchievementModel: Model<UserAchievementDocument>,
    private readonly images: ImageService,
  ) {}

  /**
   * Get-or-create the catalog entry for a key. Writes an instant SVG fallback
   * image immediately, then kicks off PNG generation in the background (so the
   * award response is never blocked on Replicate).
   */
  private async ensureDefinition(
    def: AchievementDef,
  ): Promise<AchievementDocument> {
    let doc = await this.achievementModel.findOne({ key: def.key }).exec();
    if (!doc) {
      const { url } = await this.images.generateFallbackOnly(
        this.imageRequest(def),
      );
      doc = await this.achievementModel.create({
        key: def.key,
        title: def.title,
        description: def.description,
        imageUrl: url,
        aiGenerated: false,
        sideQuestTemplateId: def.sideQuestTemplateId,
        color: def.color,
        emoji: def.emoji,
      });
    }

    // Upgrade fallback → AI image once, in the background.
    if (!doc.aiGenerated && this.images.hasToken) {
      void this.upgradeImage(def);
    }
    return doc;
  }

  private imageRequest(def: AchievementDef) {
    return {
      bucket: EMBLEM_BUCKET,
      key: def.key,
      prompt: def.prompt,
      fallback: { emoji: def.emoji, colors: [def.color] as [string] },
    };
  }

  private async upgradeImage(def: AchievementDef): Promise<void> {
    try {
      // force: the cached file is the SVG placeholder we just wrote.
      const { url, source } = await this.images.generate({
        ...this.imageRequest(def),
        force: true,
      });
      if (source !== 'ai') return; // still the fallback — try again next time
      await this.achievementModel
        .updateOne({ key: def.key }, { imageUrl: url, aiGenerated: true })
        .exec();
      this.logger.log(`Upgraded emblem image for ${def.key}`);
    } catch (err) {
      this.logger.error(`upgradeImage failed for ${def.key}: ${String(err)}`);
    }
  }

  /** Award a specific achievement key to a user (idempotent). */
  async award(
    userId: string,
    key: string,
    sourceSideQuestId: string | null = null,
    ctx: EmblemContext = {},
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
        sourceKind:
          ctx.sourceKind ?? (sourceSideQuestId ? 'quest' : 'milestone'),
        questTitle: ctx.questTitle ?? '',
        questCategory: ctx.questCategory ?? '',
        lat: ctx.lat ?? null,
        lng: ctx.lng ?? null,
        placeLabel: ctx.placeLabel ?? '',
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
    opts: { daily?: boolean } & EmblemContext = {},
  ): Promise<AwardedAchievement[]> {
    const awarded: AwardedAchievement[] = [];
    const ctx: EmblemContext = {
      ...opts,
      sourceKind: opts.sourceKind ?? (opts.daily ? 'daily' : 'sidequest'),
    };

    const def = getAchievementForTemplate(templateId);
    if (def) {
      const a = await this.award(userId, def.key, sourceSideQuestId, ctx);
      if (a) awarded.push(a);
    }

    // The starter emblem is granted at registration, so it doesn't count
    // towards "this is my first side quest".
    const earnedSoFar = await this.userAchievementModel
      .countDocuments({
        userId,
        achievementKey: { $ne: STARTER_ACHIEVEMENT_KEY },
      })
      .exec();
    if (earnedSoFar <= 1) {
      const a = await this.award(
        userId,
        'ach_first_sidequest',
        sourceSideQuestId,
        ctx,
      );
      if (a) awarded.push(a);
    }

    if (opts.daily) {
      const a = await this.award(
        userId,
        'ach_daily_streak',
        sourceSideQuestId,
        ctx,
      );
      if (a) awarded.push(a);
    }

    return awarded;
  }

  /** The welcome emblem every new account starts with. */
  async awardStarter(userId: string): Promise<AwardedAchievement | null> {
    return this.award(userId, STARTER_ACHIEVEMENT_KEY, null, {
      sourceKind: 'signup',
    });
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

  /**
   * Every emblem a user has earned, newest first, with the full log of when,
   * where and from which side quest. This is what both the own profile and a
   * visitor's view of the emblem shelf render from.
   */
  async getUserAchievements(userId: string): Promise<EarnedEmblem[]> {
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
      const fallback = getAchievementDef(e.achievementKey);
      return {
        key: e.achievementKey,
        title: d?.title ?? fallback?.title ?? e.achievementKey,
        description: d?.description ?? fallback?.description ?? '',
        imageUrl: d?.imageUrl ?? null,
        emoji: d?.emoji ?? fallback?.emoji ?? '🏅',
        color: d?.color ?? fallback?.color ?? '#f59e0b',
        earnedAt: e.createdAt.toISOString(),
        sourceKind: e.sourceKind ?? 'milestone',
        sourceSideQuestId: e.sourceSideQuestId ?? null,
        questTitle: e.questTitle ?? '',
        questCategory: e.questCategory ?? '',
        lat: e.lat ?? null,
        lng: e.lng ?? null,
        placeLabel: e.placeLabel ?? '',
      };
    });
  }

  /** A single earned emblem with its log, or null if the user hasn't got it. */
  async getUserEmblem(
    userId: string,
    key: string,
  ): Promise<EarnedEmblem | null> {
    const all = await this.getUserAchievements(userId);
    return all.find((e) => e.key === key) ?? null;
  }

  /** Which of `keys` the user actually owns — used to validate pinned picks. */
  async filterEarnedKeys(userId: string, keys: string[]): Promise<string[]> {
    if (!keys.length) return [];
    const earned = await this.userAchievementModel
      .find({ userId, achievementKey: { $in: keys } })
      .select('achievementKey')
      .exec();
    const owned = new Set(earned.map((e) => e.achievementKey));
    // Keep the user's ordering — the pin order is a deliberate choice.
    return keys.filter((k) => owned.has(k));
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
