import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRpgQuest, UserRpgQuestDocument } from './schemas/user-rpg-quest.schema.js';
import { QUEST_TEMPLATES, QuestTemplate } from './rpg-quest-templates.js';
import { ZoneType } from './enums/zone-type.enum.js';
import { DragonService } from '../dragon/dragon.service.js';

function getExpiresAt(template: QuestTemplate): Date {
  const d = new Date();
  d.setDate(d.getDate() + template.cooldownDays);
  return d;
}

@Injectable()
export class RpgService {
  constructor(
    @InjectModel(UserRpgQuest.name)
    private readonly questModel: Model<UserRpgQuestDocument>,
    private readonly dragonService: DragonService,
  ) {}

  async getAvailableQuests(userId: string, zoneType: ZoneType) {
    const now = new Date();
    const templates = QUEST_TEMPLATES.filter((t) => t.zoneType === zoneType);

    const existing = await this.questModel
      .find({ userId, zoneType, expiresAt: { $gt: now } })
      .exec();

    const existingMap = new Map(existing.map((q) => [q.templateId, q]));

    return templates.map((t) => {
      const assignment = existingMap.get(t.id);
      return {
        ...t,
        assignmentId: assignment?._id?.toString() ?? null,
        completedAt: assignment?.completedAt?.toISOString() ?? null,
        expiresAt: assignment?.expiresAt?.toISOString() ?? null,
        isCompleted: !!assignment?.completedAt,
        canComplete: !assignment?.completedAt,
      };
    });
  }

  async completeQuest(userId: string, templateId: string) {
    const template = QUEST_TEMPLATES.find((t) => t.id === templateId);
    if (!template) throw new NotFoundException('Quest template not found');

    const now = new Date();

    const alreadyDone = await this.questModel
      .findOne({ userId, templateId, completedAt: { $ne: null }, expiresAt: { $gt: now } })
      .exec();

    if (alreadyDone) {
      throw new BadRequestException('Quest already completed within cooldown period');
    }

    const expiresAt = getExpiresAt(template);

    await this.questModel
      .findOneAndUpdate(
        { userId, templateId, expiresAt: { $gt: now } },
        {
          $set: {
            userId,
            templateId,
            zoneType: template.zoneType,
            questType: template.questType,
            xpReward: template.xpReward,
            completedAt: now,
            expiresAt,
          },
        },
        { upsert: true, new: true },
      )
      .exec();

    const dragonResult = await this.dragonService.recordQuestCompletion(
      userId,
      template.xpReward,
    );

    return {
      xpAwarded: dragonResult?.xpAwarded ?? template.xpReward,
      bonusBreakdown: dragonResult?.bonusBreakdown ?? null,
      dragon: dragonResult?.dragon ?? null,
      quest: {
        id: template.id,
        title: template.title,
        xpReward: template.xpReward,
        zoneType: template.zoneType,
        questType: template.questType,
      },
    };
  }

  async getUserActiveQuests(userId: string) {
    const now = new Date();
    const active = await this.questModel
      .find({ userId, expiresAt: { $gt: now } })
      .sort({ createdAt: -1 })
      .exec();

    return active.map((q) => ({
      id: q._id.toString(),
      templateId: q.templateId,
      zoneType: q.zoneType,
      questType: q.questType,
      xpReward: q.xpReward,
      completedAt: q.completedAt?.toISOString() ?? null,
      expiresAt: q.expiresAt?.toISOString() ?? null,
    }));
  }
}
