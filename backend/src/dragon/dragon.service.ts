import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dragon, DragonDocument } from './schemas/dragon.schema.js';
import { DragonType } from './enums/dragon-type.enum.js';
import { EvolutionStage } from './enums/evolution-stage.enum.js';
import { UserService } from '../user/user.service.js';

function toPlain(doc: DragonDocument) {
  const obj = doc.toObject();
  return {
    id: obj._id.toString(),
    userId: obj.userId,
    type: obj.type,
    name: obj.name ?? null,
    xp: obj.xp,
    evolutionStage: obj.evolutionStage,
    currentStreak: obj.currentStreak,
    lastStreakDate: obj.lastStreakDate,
    lastQuestCompletedAt: obj.lastQuestCompletedAt?.toISOString?.() ?? null,
    questsCompletedToday: obj.questsCompletedToday,
    lastQuestDate: obj.lastQuestDate,
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt,
  };
}

@Injectable()
export class DragonService {
  constructor(
    @InjectModel(Dragon.name) private dragonModel: Model<DragonDocument>,
    private readonly userService: UserService,
  ) {}

  async findByUserId(userId: string) {
    const doc = await this.dragonModel.findOne({ userId }).exec();
    return doc ? toPlain(doc) : null;
  }

  async chooseDragon(userId: string, type: DragonType) {
    const existing = await this.dragonModel.findOne({ userId }).exec();
    if (existing) {
      throw new ConflictException('User already has a dragon');
    }
    const doc = await this.dragonModel.create({ userId, type });
    await this.userService.setHasDragon(userId);
    return toPlain(doc);
  }

  async recordQuestCompletion(userId: string, baseXp: number) {
    const doc = await this.dragonModel.findOne({ userId }).exec();
    if (!doc) return null;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // First quest of the day bonus
    const isFirstOfDay = doc.lastQuestDate !== today;
    const firstOfDayBonus = isFirstOfDay ? 15 : 0;

    // Streak calculation
    let newStreak = doc.currentStreak;
    if (isFirstOfDay) {
      if (doc.lastStreakDate === yesterday) {
        newStreak = Math.min(doc.currentStreak + 1, 5);
      } else if (doc.lastStreakDate === today) {
        // already counted today, keep
      } else {
        newStreak = 1;
      }
    }

    const streakMultiplier = 1 + newStreak * 0.1;
    const totalXp = Math.round((baseXp + firstOfDayBonus) * streakMultiplier);
    const newXp = doc.xp + totalXp;
    const newStage = this.calculateEvolutionStage(newXp);

    doc.xp = newXp;
    doc.evolutionStage = newStage;
    doc.currentStreak = newStreak;
    doc.lastStreakDate = today;
    doc.lastQuestCompletedAt = new Date();
    doc.questsCompletedToday = isFirstOfDay ? 1 : doc.questsCompletedToday + 1;
    doc.lastQuestDate = today;
    await doc.save();

    return {
      xpAwarded: totalXp,
      bonusBreakdown: {
        baseXp,
        firstOfDayBonus,
        streakMultiplier,
        streak: newStreak,
      },
      dragon: toPlain(doc),
    };
  }

  calculateEvolutionStage(xp: number): EvolutionStage {
    if (xp >= 10000) return EvolutionStage.ELDER_DRAGON;
    if (xp >= 2000) return EvolutionStage.DRAKE;
    if (xp >= 500) return EvolutionStage.WHELP;
    if (xp >= 100) return EvolutionStage.HATCHLING;
    return EvolutionStage.EGG;
  }
}
