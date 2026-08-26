import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';
import { Quest, QuestDocument } from '../quest/schemas/quest.schema.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { sanitizeProfileCss } from './profile-css.js';
import { AchievementService } from '../achievement/achievement.service.js';
import { CHARACTER_CLASSES } from './character-classes.js';

export interface DailyQuestStreak {
  streak: number;
  longestStreak: number;
  /** Whether today's board is already secured (streak counted for today). */
  securedToday: boolean;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayBefore(date: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Quest.name) private questModel: Model<QuestDocument>,
    private readonly achievementService: AchievementService,
  ) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(id)
      .select('-passwordHash')
      .exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<UserDocument> {
    const user = new this.userModel({
      ...data,
      displayName: data.username,
    });
    return user.save();
  }

  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<UserDocument> {
    if (dto.profileCss !== undefined) {
      dto.profileCss = sanitizeProfileCss(dto.profileCss);
    }
    // You can only pin an emblem you actually earned — otherwise a crafted
    // request would show off badges the user never got.
    if (dto.featuredEmblems !== undefined) {
      dto.featuredEmblems = await this.achievementService.filterEarnedKeys(
        id,
        dto.featuredEmblems,
      );
    }
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .select('-passwordHash')
      .exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async setOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const update: Record<string, any> = { isOnline };
    if (!isOnline) {
      update.lastSeenAt = new Date();
    }
    await this.userModel.findByIdAndUpdate(id, { $set: update }).exec();
  }

  async incrementQuestsCompleted(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { $inc: { questsCompleted: 1 } })
      .exec();
  }

  async setHasDragon(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { $set: { hasDragon: true } })
      .exec();
  }

  async dailyCheckin(id: string): Promise<{
    streak: number;
    isNewDay: boolean;
    totalXp: number;
    questsCompleted: number;
  }> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const lastStr = user.lastLoginDate
      ? user.lastLoginDate.toISOString().slice(0, 10)
      : null;

    if (lastStr === todayStr) {
      return {
        streak: user.loginStreak,
        isNewDay: false,
        totalXp: user.totalXp,
        questsCompleted: user.questsCompleted,
      };
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const newStreak = lastStr === yesterdayStr ? user.loginStreak + 1 : 1;

    await this.userModel
      .findByIdAndUpdate(id, {
        $set: { loginStreak: newStreak, lastLoginDate: now },
      })
      .exec();

    return {
      streak: newStreak,
      isNewDay: true,
      totalXp: user.totalXp,
      questsCompleted: user.questsCompleted,
    };
  }

  /**
   * A stored streak only still counts if the last cleared day was today or
   * yesterday — otherwise the chain is broken and the streak reads as 0.
   */
  private effectiveStreak(
    stored: number,
    lastDate: string | null,
    today: string,
  ): number {
    if (!lastDate) return 0;
    return lastDate === today || lastDate === dayBefore(today) ? stored : 0;
  }

  async getDailyQuestStreak(id: string): Promise<DailyQuestStreak> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const today = todayKey();
    return {
      streak: this.effectiveStreak(
        user.dailyQuestStreak,
        user.lastDailyQuestDate,
        today,
      ),
      longestStreak: user.longestDailyQuestStreak,
      securedToday: user.lastDailyQuestDate === today,
    };
  }

  /**
   * Record that a user cleared their whole daily board for `date`. Idempotent:
   * clearing the same day twice does not advance the streak twice.
   */
  async recordDailyBoardCleared(
    id: string,
    date: string,
  ): Promise<DailyQuestStreak> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException(`User ${id} not found`);

    if (user.lastDailyQuestDate === date) {
      return {
        streak: user.dailyQuestStreak,
        longestStreak: user.longestDailyQuestStreak,
        securedToday: true,
      };
    }

    const streak =
      user.lastDailyQuestDate === dayBefore(date)
        ? user.dailyQuestStreak + 1
        : 1;
    const longestStreak = Math.max(streak, user.longestDailyQuestStreak);

    await this.userModel
      .findByIdAndUpdate(id, {
        $set: {
          dailyQuestStreak: streak,
          longestDailyQuestStreak: longestStreak,
          lastDailyQuestDate: date,
        },
      })
      .exec();

    return { streak, longestStreak, securedToday: true };
  }

  /**
   * Profile view for other users. An explicit allowlist — everything not
   * listed here (email, pseudonym, shareLocation, ...) stays private.
   *
   * Emblems come along in two shapes: the handful the user pinned, and the
   * full shelf, so a visitor can browse everything without a second request.
   */
  async getPublicProfile(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const emblems = await this.achievementService.getUserAchievements(id);
    const byKey = new Map(emblems.map((e) => [e.key, e]));
    const featured = (user.featuredEmblems ?? [])
      .map((key) => byKey.get(key))
      .filter((e): e is NonNullable<typeof e> => !!e);

    const charClass =
      CHARACTER_CLASSES.find((c) => c.id === user.characterClass) ?? null;

    return {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      profileCss: user.profileCss,
      status: user.status ?? '',
      openForQuests: user.openForQuests ?? false,
      characterClass: charClass,
      homeRegion: user.homeRegion ?? '',
      accentColor: user.accentColor ?? '',
      links: (user.links ?? []).map((l) => ({
        label: l.label,
        url: l.url,
        icon: l.icon ?? '',
      })),
      level: user.level,
      questsCompleted: user.questsCompleted,
      isOnline: user.isOnline,
      lastSeenAt: user.lastSeenAt ? user.lastSeenAt.toISOString() : null,
      joinedAt: user.createdAt ? user.createdAt.toISOString() : null,
      loginStreak: user.loginStreak ?? 0,
      dailyQuestStreak: this.effectiveStreak(
        user.dailyQuestStreak ?? 0,
        user.lastDailyQuestDate ?? null,
        todayKey(),
      ),
      emblemCount: emblems.length,
      featuredEmblems: featured,
      emblems,
    };
  }

  /** Search the community by username or display name. */
  async search(query: string, excludeUserId: string, limit = 20) {
    const q = query.trim();
    if (!q) return [];
    // Escape the input — a user typing "a+b" must not become a regex operator.
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(safe, 'i');

    const users = await this.userModel
      .find({
        _id: { $ne: excludeUserId },
        $or: [{ username: rx }, { displayName: rx }],
      })
      .select(
        'username displayName avatarUrl status openForQuests level isOnline',
      )
      .limit(limit)
      .exec();

    return users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      status: u.status ?? '',
      openForQuests: u.openForQuests ?? false,
      level: u.level,
      isOnline: u.isOnline,
    }));
  }

  /** Compact card data for a list of user ids, in one query. */
  async getCards(ids: string[]) {
    if (!ids.length) return [];
    const users = await this.userModel
      .find({ _id: { $in: ids } })
      .select(
        'username displayName avatarUrl status openForQuests characterClass level isOnline questsCompleted',
      )
      .exec();

    return users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      status: u.status ?? '',
      openForQuests: u.openForQuests ?? false,
      characterClass:
        CHARACTER_CLASSES.find((c) => c.id === u.characterClass) ?? null,
      level: u.level,
      questsCompleted: u.questsCompleted,
      isOnline: u.isOnline,
    }));
  }

  async getActivity(
    userId: string,
  ): Promise<Array<{ date: string; count: number }>> {
    const quests = await this.questModel
      .find({ completedBy: userId })
      .select('completedAt')
      .exec();

    const activityMap: Record<string, number> = {};
    const today = new Date();
    const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Initialize all dates in the last 365 days
    for (let i = 0; i < 365; i++) {
      const date = new Date(oneYearAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      activityMap[dateStr] = 0;
    }

    // Count quests completed per day
    quests.forEach((quest) => {
      if (quest.completedAt) {
        const dateStr = quest.completedAt.toISOString().split('T')[0];
        if (activityMap[dateStr] !== undefined) {
          activityMap[dateStr]++;
        }
      }
    });

    // Convert to array and sort by date
    return Object.entries(activityMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
