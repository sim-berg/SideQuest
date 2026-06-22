import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

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
