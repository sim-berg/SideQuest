import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';
import { Quest, QuestDocument } from '../quest/schemas/quest.schema.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Quest.name) private questModel: Model<QuestDocument>,
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
        const dateStr = quest.completedAt
          .toISOString()
          .split('T')[0];
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
