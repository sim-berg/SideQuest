import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

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
  ) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-passwordHash').exec();
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

  async getPublicProfile(id: string): Promise<Partial<User>> {
    const user = await this.userModel
      .findById(id)
      .select('-passwordHash -email')
      .exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }
}
